import { prisma } from '@/lib/prisma';
import { getActiveTradingClient } from '@/lib/providers';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { positionAdjustSchema } from '@greed-advisor/validations';
import type { PositionAdjustInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function normalizeSymbol(symbol: string): string {
  return symbol.split('_')[0].toUpperCase();
}

// PATCH /api/user/positions/[ticker]?keyId=<id> - adjust the stop-loss /
// take-profit of a managed position (engine-placed bracket order).
export const PATCH = withApiMiddleware(
  withValidation(positionAdjustSchema)(
    withAuth(async (req, ctx) => {
      const params = (await ctx.params) ?? {};
      const ticker = params.ticker;
      if (!ticker) {
        return NextResponse.json(
          { success: false, message: 'Invalid ticker', error: 'Invalid ticker' },
          { status: 400 }
        );
      }

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

      const { stopLoss, takeProfit } = ctx.data as PositionAdjustInput;
      if (stopLoss === undefined && takeProfit === undefined) {
        return NextResponse.json(
          {
            success: false,
            message: 'Provide stopLoss and/or takeProfit',
            error: 'Nothing to update'
          },
          { status: 400 }
        );
      }

      const symbol = normalizeSymbol(ticker);
      const record = await prisma.tradeRecord.findFirst({
        where: {
          userId: ctx.userId,
          tradingKeyId: provider.key.id,
          symbol,
          side: 'BUY',
          status: { in: ['accepted', 'new', 'held', 'partial', 'filled'] }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!record || (!record.stopOrderId && !record.takeProfitOrderId)) {
        return NextResponse.json(
          {
            success: false,
            message: 'No managed (engine-placed) order found for this position',
            error: 'No managed order'
          },
          { status: 400 }
        );
      }

      if (stopLoss != null && record.stopOrderId) {
        await provider.replaceOrder(record.stopOrderId, { stopPrice: stopLoss });
      }
      if (takeProfit != null && record.takeProfitOrderId) {
        await provider.replaceOrder(record.takeProfitOrderId, { limitPrice: takeProfit });
      }

      const updated = await prisma.tradeRecord.update({
        where: { id: record.id },
        data: {
          stopLoss: stopLoss != null ? stopLoss : (record.stopLoss ?? undefined),
          takeProfit: takeProfit != null ? takeProfit : (record.takeProfit ?? undefined)
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Position risk updated',
        stopLoss: updated.stopLoss,
        takeProfit: updated.takeProfit
      });
    })
  )
);
