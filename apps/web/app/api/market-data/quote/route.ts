import { prisma } from '@/lib/prisma';
import { getMarketDataService } from '@/lib/providers';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/market-data/quote?symbol=AAPL - fast quote lookup (day-trading)
export const GET = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const symbol = req.nextUrl.searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { success: false, message: 'Symbol is required', error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const provider = await getMarketDataService(ctx.userId);
    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active market data key found. Add one in your profile.',
          error: 'No active market data key found'
        },
        { status: 404 }
      );
    }

    const quote = await provider.service.getQuote(symbol);

    await prisma.marketDataKey.update({
      where: { id: provider.key.id },
      data: { lastUsed: new Date() }
    });

    return NextResponse.json({ success: true, quote });
  })
);
