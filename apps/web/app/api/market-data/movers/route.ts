import { prisma } from '@/lib/prisma';
import { AlpacaClient, AlpacaEnvironment } from '@greed-advisor/alpaca';
import { decryptSecret } from '@greed-advisor/crypto';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/market-data/movers?top=10 - market movers + most-active (opportunity hunting).
// Requires an active Alpaca trading key.
export const GET = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const top = Math.min(
      Math.max(Number(req.nextUrl.searchParams.get('top') ?? '10') || 10, 1),
      50
    );

    const key = await prisma.t212ApiKey.findFirst({
      where: { userId: ctx.userId, deletedAt: null, isActive: true, provider: 'alpaca' },
      orderBy: { lastUsed: 'asc' }
    });

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          message: 'An active Alpaca trading key is required for the screener',
          error: 'No active Alpaca key'
        },
        { status: 400 }
      );
    }

    const client = new AlpacaClient({
      apiKey: decryptSecret(key.apiKey),
      apiSecret: decryptSecret(key.apiSecret),
      environment: key.environment as AlpacaEnvironment
    });

    const [movers, mostActive] = await Promise.all([
      client.getMarketMovers(top),
      client.getMostActive(top)
    ]);

    await prisma.t212ApiKey.update({
      where: { id: key.id },
      data: { lastUsed: new Date() }
    });

    const gainers = movers.filter(m => m.change_pct > 0);
    const losers = movers.filter(m => m.change_pct < 0);

    return NextResponse.json({ success: true, gainers, losers, mostActive });
  })
);
