import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { MarketDataService, TwelveDataProvider } from '@greed-advisor/market-data';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/market-data/candles?symbol=AAPL&interval=1day
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') ?? '1day';

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const marketDataKey = await prisma.marketDataKey.findFirst({
      where: { userId: decoded.userId, deletedAt: null, isActive: true },
      orderBy: { lastUsed: 'asc' },
    });

    if (!marketDataKey) {
      return NextResponse.json(
        { error: 'No active market data key found. Add one in your profile.' },
        { status: 404 }
      );
    }

    try {
      const marketData = new MarketDataService(new TwelveDataProvider(marketDataKey.apiKey));
      const candles = await marketData.getCandles(symbol, interval, 200);

      await prisma.marketDataKey.update({
        where: { id: marketDataKey.id },
        data: { lastUsed: new Date() },
      });

      return NextResponse.json({ candles }, { status: 200 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Market data request failed';
      console.error('Market data candles error:', err);
      return NextResponse.json(
        { error: 'Market data request failed', details: message },
        { status: 502 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Candles endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to load candles', details: message },
      { status: 500 }
    );
  }
}
