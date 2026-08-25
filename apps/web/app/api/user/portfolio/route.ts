import { prisma } from '@/lib/prisma';
import { getActiveTradingClient } from '@/lib/providers';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/user/portfolio - unified portfolio across every active broker account
// (Trading212 + Alpaca).
export const GET = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const keys = await prisma.t212ApiKey.findMany({
      where: { userId: ctx.userId, deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    const accounts: unknown[] = [];
    let totalValue = 0;
    let totalCash = 0;
    let totalUnrealized = 0;
    let totalRealized = 0;

    for (const key of keys) {
      try {
        const binding = await getActiveTradingClient(ctx.userId, key.id);
        if (!binding) continue;

        const [positions, summary, meta] = await Promise.all([
          binding.getPositions(),
          binding.getAccountSummary(),
          binding.getAccountMeta()
        ]);

        const unrealized = positions.reduce(
          (sum, p) => sum + (p.walletImpact?.unrealizedProfitLoss ?? 0),
          0
        );
        const realized = summary.investments.realizedProfitLoss ?? 0;

        totalValue += summary.totalValue;
        totalCash += summary.cash.availableToTrade;
        totalUnrealized += unrealized;
        totalRealized += realized;

        accounts.push({
          keyId: key.id,
          title: key.title,
          provider: key.provider ?? 'trading212',
          environment: key.environment,
          currency: meta.currency,
          equity: meta.equity,
          buyingPower: meta.buyingPower,
          totalValue: summary.totalValue,
          cash: summary.cash.availableToTrade,
          unrealized,
          realized,
          positions: positions.map(p => ({
            ticker: p.instrument.ticker,
            quantity: p.quantity,
            currentPrice: p.currentPrice,
            averagePricePaid: p.averagePricePaid,
            marketValue: p.walletImpact?.currentValue ?? 0,
            unrealized: p.walletImpact?.unrealizedProfitLoss ?? 0
          }))
        });
      } catch (error) {
        accounts.push({
          keyId: key.id,
          title: key.title,
          provider: key.provider ?? 'trading212',
          environment: key.environment,
          error: String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      accounts,
      totals: { totalValue, totalCash, totalUnrealized, totalRealized }
    });
  })
);
