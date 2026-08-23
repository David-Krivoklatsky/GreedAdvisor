import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { reportSchema } from '@greed-advisor/validations';
import type { ReportInput } from '@greed-advisor/validations';
import { createAiProvider } from '@greed-advisor/ai';
import type { AiProvider, AiProductType, AiRiskProfile } from '@greed-advisor/ai';
import {
  MarketDataService,
  TwelveDataProvider,
  computeIndicators
} from '@greed-advisor/market-data';
import { getActiveTradingClient } from '@/lib/providers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const POST = withApiMiddleware(
  withValidation(reportSchema)(
    withAuth(async (_req, ctx) => {
      const {
        tradingKeyId,
        aiKeyId,
        marketDataKeyId,
        reportType,
        symbol,
        productType,
        riskProfile,
        accountValue,
        model
      } = ctx.data as ReportInput;

      // Load keys and verify ownership
      const [tradingKey, aiKey, marketDataKey] = await Promise.all([
        prisma.t212ApiKey.findFirst({
          where: { id: tradingKeyId, userId: ctx.userId, deletedAt: null, isActive: true }
        }),
        prisma.aiApiKey.findFirst({
          where: { id: aiKeyId, userId: ctx.userId, deletedAt: null, isActive: true }
        }),
        prisma.marketDataKey.findFirst({
          where: { id: marketDataKeyId, userId: ctx.userId, deletedAt: null, isActive: true }
        })
      ]);

      if (!tradingKey) {
        return NextResponse.json(
          { success: false, message: 'Trading key not found', error: 'Trading key not found' },
          { status: 404 }
        );
      }
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
            error: 'Market data key not found'
          },
          { status: 404 }
        );
      }

      // Resolve symbol: from request, or infer from first open position
      let targetSymbol = symbol;

      if (!targetSymbol) {
        const trading = await getActiveTradingClient(ctx.userId, tradingKeyId);
        if (!trading) {
          return NextResponse.json(
            { success: false, message: 'Trading key not found', error: 'Trading key not found' },
            { status: 404 }
          );
        }
        const firstSymbol = await trading.getFirstPositionSymbol();
        if (!firstSymbol) {
          return NextResponse.json(
            {
              success: false,
              message: 'No positions found to analyze',
              error: 'No positions found'
            },
            { status: 400 }
          );
        }
        targetSymbol = firstSymbol;
      }

      // Fetch real market data
      const marketData = new MarketDataService(new TwelveDataProvider(marketDataKey.apiKey));
      const quote = await marketData.getQuote(targetSymbol);
      const candles = await marketData.getCandles(targetSymbol, '1day', 300);

      const indicators = computeIndicators(candles);

      // Generate AI report
      const aiProvider = createAiProvider(aiKey.provider as AiProvider, aiKey.apiKey, model);
      const report = await aiProvider.generateReport({
        symbol: targetSymbol,
        companyName: quote.name,
        quote,
        candles: candles.slice(-90),
        indicators: indicators.snapshot,
        reportType,
        productType: productType as AiProductType,
        riskProfile: riskProfile as AiRiskProfile,
        accountValue: accountValue ?? undefined
      });

      // Mark keys as used
      await Promise.all([
        prisma.t212ApiKey.update({
          where: { id: tradingKey.id },
          data: { lastUsed: new Date() }
        }),
        prisma.aiApiKey.update({ where: { id: aiKey.id }, data: { lastUsed: new Date() } }),
        prisma.marketDataKey.update({
          where: { id: marketDataKey.id },
          data: { lastUsed: new Date() }
        })
      ]);

      return NextResponse.json({ success: true, report });
    })
  )
);
