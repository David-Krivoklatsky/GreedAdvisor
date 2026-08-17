import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { MarketDataService, TwelveDataProvider } from '@greed-advisor/market-data';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/market-data/candles?symbol=AAPL&interval=1day
export const GET = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const symbol = req.nextUrl.searchParams.get('symbol');
    const interval = req.nextUrl.searchParams.get('interval') ?? '1day';

    if (!symbol) {
      return NextResponse.json(
        { success: false, message: 'Symbol is required', error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const marketDataKey = await prisma.marketDataKey.findFirst({
      where: { userId: ctx.userId, deletedAt: null, isActive: true },
      orderBy: { lastUsed: 'asc' },
    });

    if (!marketDataKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active market data key found. Add one in your profile.',
          error: 'No active market data key found',
        },
        { status: 404 }
      );
    }

    const marketData = new MarketDataService(new TwelveDataProvider(marketDataKey.apiKey));
    const candles = await marketData.getCandles(symbol, interval, 200);

    await prisma.marketDataKey.update({
      where: { id: marketDataKey.id },
      data: { lastUsed: new Date() },
    });

    return NextResponse.json({ success: true, candles });
  })
);
