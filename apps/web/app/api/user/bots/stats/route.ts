import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TERMINAL = ['filled', 'cancelled', 'canceled', 'rejected', 'expired'];

// GET /api/user/bots/stats - per-bot performance/status aggregates for the
// Trading Bots status page (realized PnL, win rate, profit factor, $/trade,
// trades per day, longs vs shorts, return %).
export const GET = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const configs = await prisma.automationConfig.findMany({
      where: { userId: ctx.userId, deletedAt: null },
      orderBy: { createdAt: 'asc' }
    });

    const bots = await Promise.all(
      configs.map(async config => {
        const trades = await prisma.tradeRecord.findMany({
          where: { automationConfigId: config.id },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            symbol: true,
            side: true,
            status: true,
            quantity: true,
            entryPrice: true,
            exitPrice: true,
            realizedPnl: true,
            createdAt: true
          }
        });

        const closed = trades.filter(t => t.realizedPnl != null);
        const realizedPnl = trades.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0);
        const wins = closed.filter(t => (t.realizedPnl ?? 0) > 0);
        const losses = closed.filter(t => (t.realizedPnl ?? 0) < 0);
        const grossWin = wins.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0);
        const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0));

        const buys = trades.filter(t => t.side === 'BUY').length;
        const sells = trades.filter(t => t.side === 'SELL').length;
        const openTrades = trades.filter(t => !TERMINAL.includes(t.status)).length;

        const firstAt = trades[0]?.createdAt;
        const days = firstAt ? Math.max(1, (Date.now() - firstAt.getTime()) / 86400000) : 0;
        const tradesPerDay = days > 0 ? trades.length / days : 0;
        const avgPerTrade = closed.length > 0 ? realizedPnl / closed.length : 0;
        const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
        const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;

        const invested = trades
          .filter(t => t.side === 'BUY')
          .reduce((sum, t) => sum + (t.entryPrice ?? 0) * t.quantity, 0);
        const returnPct = invested > 0 ? (realizedPnl / invested) * 100 : 0;

        const pnlValues = trades.map(t => t.realizedPnl ?? 0);
        const bestTrade = pnlValues.length ? Math.max(...pnlValues) : 0;
        const worstTrade = pnlValues.length ? Math.min(...pnlValues) : 0;

        return {
          configId: config.id,
          title: config.title,
          market: config.market,
          strategy: config.strategy,
          mode: config.mode,
          execution: config.execution,
          enabled: config.enabled,
          lastRunStatus: config.lastRunStatus,
          model: config.model,
          realizedPnl,
          winRate,
          profitFactor,
          totalTrades: trades.length,
          closedTrades: closed.length,
          openTrades,
          tradesPerDay,
          avgPerTrade,
          buys,
          sells,
          returnPct,
          bestTrade,
          worstTrade,
          invested
        };
      })
    );

    const totals = bots.reduce(
      (acc, b) => ({
        realizedPnl: acc.realizedPnl + b.realizedPnl,
        totalTrades: acc.totalTrades + b.totalTrades,
        openTrades: acc.openTrades + b.openTrades,
        wins: acc.wins + (b.winRate > 0 ? Math.round((b.winRate / 100) * b.closedTrades) : 0),
        closedTrades: acc.closedTrades + b.closedTrades
      }),
      { realizedPnl: 0, totalTrades: 0, openTrades: 0, wins: 0, closedTrades: 0 }
    );

    return NextResponse.json({ success: true, bots, totals });
  })
);
