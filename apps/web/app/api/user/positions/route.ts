import { prisma } from '@/lib/prisma';
import { getActiveTradingClient } from '@/lib/providers';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function normalizeSymbol(symbol: string): string {
  return symbol.split('_')[0].toUpperCase();
}

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

    // Attach managed SL/TP (from engine-placed bracket orders) to each position
    // so the UI can review and adjust risk.
    const openRecords = await prisma.tradeRecord.findMany({
      where: {
        userId: ctx.userId,
        tradingKeyId: key.id,
        side: 'BUY',
        status: { in: ['accepted', 'new', 'held', 'partial', 'filled'] }
      },
      orderBy: { createdAt: 'desc' }
    });
    const riskBySymbol = new Map<string, { stopLoss: number | null; takeProfit: number | null }>();
    for (const record of openRecords) {
      const sym = normalizeSymbol(record.symbol);
      if (!riskBySymbol.has(sym) && (record.stopOrderId || record.takeProfitOrderId)) {
        riskBySymbol.set(sym, { stopLoss: record.stopLoss, takeProfit: record.takeProfit });
      }
    }
    const positionsWithRisk = positions.map(p => ({
      ...p,
      risk: riskBySymbol.get(normalizeSymbol(p.instrument.ticker)) ?? null
    }));

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
      positions: positionsWithRisk,
      accountSummary,
      environment: key.environment,
      provider: provider.provider
    });
  })
);
