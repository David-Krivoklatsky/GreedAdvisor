import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { createAiProvider, AiReport, AiProvider } from '@greed-advisor/ai';
import { MarketDataService, TwelveDataProvider } from '@greed-advisor/market-data';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SCAN = 10;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { aiKeyId, marketDataKeyId, productType } = body;

    if (!aiKeyId || !marketDataKeyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [aiKey, marketDataKey, user] = await Promise.all([
      prisma.aiApiKey.findFirst({
        where: { id: Number(aiKeyId), userId: decoded.userId, deletedAt: null, isActive: true },
      }),
      prisma.marketDataKey.findFirst({
        where: {
          id: Number(marketDataKeyId),
          userId: decoded.userId,
          deletedAt: null,
          isActive: true,
        },
      }),
      prisma.user.findUnique({ where: { id: decoded.userId } }),
    ]);

    if (!aiKey) return NextResponse.json({ error: 'AI key not found' }, { status: 404 });
    if (!marketDataKey)
      return NextResponse.json({ error: 'Market data key not found' }, { status: 404 });

    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId: decoded.userId, isActive: true },
      orderBy: { createdAt: 'asc' },
      take: MAX_SCAN,
    });

    if (watchlist.length === 0) {
      return NextResponse.json(
        { error: 'Your watchlist is empty. Add instruments to scan.' },
        { status: 400 }
      );
    }

    const marketData = new MarketDataService(new TwelveDataProvider(marketDataKey.apiKey));
    const aiProvider = createAiProvider(aiKey.provider as AiProvider, aiKey.apiKey);

    const accountValue = 10000; // TODO: derive from active T212 account total value
    const riskProfile =
      (user?.riskProfile as 'conservative' | 'balanced' | 'aggressive') ?? 'balanced';
    const type = (productType ?? 'INVEST').toUpperCase() as 'INVEST' | 'CFD' | 'CRYPTO';

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

    return NextResponse.json(
      {
        opportunities,
        holds,
        failed,
        scanned: results.length,
        riskProfile,
        accountValue,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Watchlist scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan watchlist', details: message },
      { status: 500 }
    );
  }
}
