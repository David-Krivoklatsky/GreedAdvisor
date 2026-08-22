import { prisma } from '@/lib/prisma';
import { getActiveTradingClient } from '@/lib/providers';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const keyId = Number(req.nextUrl.searchParams.get('keyId') ?? '') || undefined;
    const provider = await getActiveTradingClient(ctx.userId, keyId);

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active trading key found',
          error: 'No active trading key found'
        },
        { status: 404 }
      );
    }

    const { key } = provider;

    const [positions, accountSummary] = await Promise.all([
      provider.getPositions(),
      provider.getAccountSummary()
    ]);

    // Alpaca's account endpoint does not expose unrealized PnL; derive it from positions
    if (provider.provider === 'alpaca' && positions.length > 0) {
      const unrealized = positions.reduce(
        (sum, p) => sum + (p.walletImpact?.unrealizedProfitLoss ?? 0),
        0
      );
      accountSummary.investments.unrealizedProfitLoss = unrealized;
    }

    await prisma.t212ApiKey.update({
      where: { id: key.id },
      data: { lastUsed: new Date() }
    });

    return NextResponse.json({
      success: true,
      positions,
      accountSummary,
      environment: key.environment,
      provider: provider.provider
    });
  })
);
