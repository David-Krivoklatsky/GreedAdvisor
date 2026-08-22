import { prisma } from '@/lib/prisma';
import { getActiveTradingClient } from '@/lib/providers';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { orderSchema } from '@greed-advisor/validations';
import type { OrderInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/user/orders - Place a market order with optional stop-loss / take-profit
// The user reviews and confirms every field in the UI; this route never runs unattended.
export const POST = withApiMiddleware(
  withValidation(orderSchema)(
    withAuth(async (_req, ctx) => {
      const { tradingKeyId, ticker, quantity, side, stopLoss, takeProfit, extendedHours } =
        ctx.data as OrderInput;

      const provider = await getActiveTradingClient(ctx.userId, tradingKeyId);

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

      // 1) Entry order (market) + 2) optional protective stop/limit legs
      // (provider-specific: T212 uses separate orders, Alpaca uses bracket legs)
      const result = await provider.placeOrder({
        ticker,
        side,
        quantity,
        stopLoss,
        takeProfit,
        extendedHours: extendedHours ?? false
      });

      await prisma.t212ApiKey.update({
        where: { id: provider.key.id },
        data: { lastUsed: new Date() }
      });

      return NextResponse.json(
        {
          success: true,
          entry: { id: result.id, status: result.status },
          stop: result.stop ?? null,
          takeProfit: result.takeProfit ?? null
        },
        { status: 201 }
      );
    })
  )
);
