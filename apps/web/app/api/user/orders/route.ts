import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/api';
import { getActiveTradingClient } from '@/lib/providers';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { orderSchema } from '@greed-advisor/validations';
import type { OrderInput } from '@greed-advisor/validations';
import { rateLimit } from '@greed-advisor/rate-limit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/user/orders?keyId=<id> - list pending (open) orders
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

    const orders = await provider.getPendingOrders();
    return NextResponse.json({ success: true, orders });
  })
);

// POST /api/user/orders - Place a market order with optional stop-loss / take-profit
// The user reviews and confirms every field in the UI; this route never runs unattended.
export const POST = withApiMiddleware(
  withValidation(orderSchema)(
    withAuth(async (req, ctx) => {
      const { tradingKeyId, ticker, quantity, side, stopLoss, takeProfit, extendedHours } =
        ctx.data as OrderInput;

      const rateLimitResult = rateLimit(getClientIp(req));
      if (!rateLimitResult.success) {
        return NextResponse.json(
          {
            success: false,
            message: 'Too many requests. Please try again later.',
            error: 'Rate limit exceeded'
          },
          { status: 429 }
        );
      }

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
