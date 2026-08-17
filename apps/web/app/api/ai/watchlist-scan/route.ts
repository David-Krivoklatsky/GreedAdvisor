import { prisma } from '@/lib/prisma';
import { getActiveT212Client } from '@/lib/providers';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { watchlistScanSchema } from '@greed-advisor/validations';
import type { WatchlistScanInput } from '@greed-advisor/validations';
import { createAiProvider } from '@greed-advisor/ai';
import type { AiProvider, AiReport, AiProductType } from '@greed-advisor/ai';
import { MarketDataService, TwelveDataProvider } from '@greed-advisor/market-data';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_SCAN = 10;
const DEFAULT_ACCOUNT_VALUE = 10000;

export const POST = withApiMiddleware(
  withValidation(watchlistScanSchema)(
    withAuth(async (_req, ctx) => {
      const { aiKeyId, marketDataKeyId, productType } = ctx.data as WatchlistScanInput;

      const [aiKey, marketDataKey, user] = await Promise.all([
        prisma.aiApiKey.findFirst({
          where: { id: aiKeyId, userId: ctx.userId, deletedAt: null, isActive: true },
        }),
        prisma.marketDataKey.findFirst({
          where: { id: marketDataKeyId, userId: ctx.userId, deletedAt: null, isActive: true },
        }),
        prisma.user.findUnique({ where: { id: ctx.userId } }),
      ]);

      if (!aiKey) {
        return NextResponse.json(
          { success: false, message: 'AI key not found', error: 'AI key not found' },
          { status: 404 }
        );
      }
      if (!marketDataKey) {
        return NextResponse.json(
          {
            success: false,
            message: 'Market data key not found',
            error: 'Market data key not found',
          },
          { status: 404 }
        );
      }

      const watchlist = await prisma.watchlistItem.findMany({
        where: { userId: ctx.userId, isActive: true },
        orderBy: { createdAt: 'asc' },
        take: MAX_SCAN,
      });

      if (watchlist.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Your watchlist is empty. Add instruments to scan.',
            error: 'Empty watchlist',
          },
          { status: 400 }
        );
      }

      // Derive the account value from the user's active Trading212 account when possible
      let accountValue = DEFAULT_ACCOUNT_VALUE;
      const t212 = await getActiveT212Client(ctx.userId);
      if (t212) {
        try {
          const summary = await t212.client.getAccountSummary();
          if (summary.totalValue > 0) {
            accountValue = summary.totalValue;
          }
        } catch {
          // fall back to the default
        }
      }

      const marketData = new MarketDataService(new TwelveDataProvider(marketDataKey.apiKey));
      const aiProvider = createAiProvider(aiKey.provider as AiProvider, aiKey.apiKey);
      const type = productType as AiProductType;
      const riskProfile = (user?.riskProfile ?? 'balanced') as
        'conservative' | 'balanced' | 'aggressive';

      // Scan each watchlist item sequentially to avoid hammering the AI/market API
      const results: Array<{
        item: (typeof watchlist)[number];
        report: AiReport | null;
        error?: string;
      }> = [];

      for (const item of watchlist) {
        try {
          const quote = await marketData.getQuote(item.ticker);
          const candles = await marketData.getCandles(item.ticker, '1day', 30);
          const report = await aiProvider.generateReport({
            symbol: item.ticker,
            companyName: item.name ?? undefined,
            quote,
            candles,
            reportType: 'opportunity',
            productType: type,
            riskProfile,
            accountValue,
          });
          results.push({ item, report });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Scan failed';
          results.push({ item, report: null, error: message });
        }
      }

      // Mark keys as used
      await Promise.all([
        prisma.aiApiKey.update({ where: { id: aiKey.id }, data: { lastUsed: new Date() } }),
        prisma.marketDataKey.update({
          where: { id: marketDataKey.id },
          data: { lastUsed: new Date() },
        }),
      ]);

      // Rank: actionable (BUY/SELL/ADD/TRIM) first by confidence desc
      const opportunities = results
        .filter(r => r.report && r.report.action !== 'HOLD')
        .sort((a, b) => (b.report?.confidence ?? 0) - (a.report?.confidence ?? 0));

      const holds = results.filter(r => r.report && r.report.action === 'HOLD');
      const failed = results.filter(r => !r.report);

      return NextResponse.json({
        success: true,
        opportunities,
        holds,
        failed,
        scanned: results.length,
        riskProfile,
        accountValue,
      });
    })
  )
);
