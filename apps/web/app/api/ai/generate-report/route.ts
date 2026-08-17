import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { createAiProvider } from '@greed-advisor/ai';
import { MarketDataService, TwelveDataProvider } from '@greed-advisor/market-data';
import { Trading212Client, T212Environment } from '@greed-advisor/trading212';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic since it uses request headers
export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

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
    const {
      tradingKeyId,
      aiKeyId,
      marketDataKeyId,
      reportType,
      symbol,
      productType,
      riskProfile,
      accountValue,
    } = body;

    if (!tradingKeyId || !aiKeyId || !marketDataKeyId || !reportType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load keys and verify ownership
    const [tradingKey, aiKey, marketDataKey] = await Promise.all([
      prisma.t212ApiKey.findFirst({
        where: {
          id: Number(tradingKeyId),
          userId: decoded.userId,
          deletedAt: null,
          isActive: true,
        },
      }),
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
    ]);

    if (!tradingKey) {
      return NextResponse.json({ error: 'Trading key not found' }, { status: 404 });
    }
    if (!aiKey) {
      return NextResponse.json({ error: 'AI key not found' }, { status: 404 });
    }
    if (!marketDataKey) {
      return NextResponse.json({ error: 'Market data key not found' }, { status: 404 });
    }

    // Resolve symbol: from request, or infer from first open position
    let targetSymbol = symbol;

    if (!targetSymbol) {
      const t212 = new Trading212Client({
        apiKey: tradingKey.apiKey,
        apiSecret: tradingKey.apiSecret,
        environment: tradingKey.environment as T212Environment,
      });
      const positions = await t212.getPositions();
      const first = positions[0];
      if (!first) {
        return NextResponse.json({ error: 'No positions found to analyze' }, { status: 400 });
      }
      // T212 tickers look like "AAPL_US_EQ"; strip the exchange suffix for market data
      targetSymbol = first.instrument.ticker.replace(/_US_EQ$/, '').replace(/_.+/, '');
    }

    // Fetch real market data
    const marketData = new MarketDataService(new TwelveDataProvider(marketDataKey.apiKey));
    const quote = await marketData.getQuote(targetSymbol);
    const candles = await marketData.getCandles(targetSymbol, '1day', 30);

    // Generate AI report
    const aiProvider = createAiProvider(
      aiKey.provider as 'openai' | 'anthropic' | 'google' | 'claude',
      aiKey.apiKey
    );
    const report = await aiProvider.generateReport({
      symbol: targetSymbol,
      companyName: quote.name,
      quote,
      candles,
      reportType,
      productType: (productType ?? 'INVEST') as 'INVEST' | 'CFD' | 'CRYPTO',
      riskProfile: (riskProfile ?? 'balanced') as 'conservative' | 'balanced' | 'aggressive',
      accountValue: accountValue ? Number(accountValue) : undefined,
    });

    // Mark keys as used
    await Promise.all([
      prisma.t212ApiKey.update({ where: { id: tradingKey.id }, data: { lastUsed: new Date() } }),
      prisma.aiApiKey.update({ where: { id: aiKey.id }, data: { lastUsed: new Date() } }),
      prisma.marketDataKey.update({
        where: { id: marketDataKey.id },
        data: { lastUsed: new Date() },
      }),
    ]);

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: message },
      { status: 500 }
    );
  }
}
