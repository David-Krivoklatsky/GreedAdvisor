import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { orderSchema } from '@greed-advisor/validations';
import type { OrderInput } from '@greed-advisor/validations';
import { T212Environment, Trading212Client } from '@greed-advisor/trading212';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/user/orders - Place a market order with optional stop-loss / take-profit
// The user reviews and confirms every field in the UI; this route never runs unattended.
export const POST = withApiMiddleware(
  withValidation(orderSchema)(
    withAuth(async (_req, ctx) => {
      const { tradingKeyId, ticker, quantity, side, stopLoss, takeProfit, extendedHours } =
        ctx.data as OrderInput;

      const key = await prisma.t212ApiKey.findFirst({
        where: {
          id: tradingKeyId,
          userId: ctx.userId,
          deletedAt: null,
          isActive: true,
        },
      });

      if (!key) {
        return NextResponse.json(
          {
            success: false,
            message: 'No active Trading212 key found',
            error: 'No active Trading212 key found',
          },
          { status: 404 }
        );
      }

      const client = new Trading212Client({
        apiKey: key.apiKey,
        apiSecret: key.apiSecret,
        environment: key.environment as T212Environment,
      });

      // T212 convention: sell orders use a negative quantity
      const signedQty = side === 'SELL' ? -Math.abs(quantity) : Math.abs(quantity);

      // 1) Entry order (market)
      const entry = await client.placeOrder({
        ticker,
        quantity: signedQty,
        orderType: 'MARKET',
        extendedHours: extendedHours ?? false,
      });

      // 2) Optional protections (separate stop + limit orders, opposite side of entry)
      const protections = {
        stop:
          stopLoss != null && stopLoss > 0
            ? await client.placeOrder({
                ticker,
                quantity: -signedQty,
                orderType: 'STOP',
                stopPrice: stopLoss,
                timeValidity: 'GOOD_TILL_CANCEL',
              })
            : null,
        takeProfit:
          takeProfit != null && takeProfit > 0
            ? await client.placeOrder({
                ticker,
                quantity: -signedQty,
                orderType: 'LIMIT',
                limitPrice: takeProfit,
                timeValidity: 'GOOD_TILL_CANCEL',
              })
            : null,
      };

      await prisma.t212ApiKey.update({
        where: { id: key.id },
        data: { lastUsed: new Date() },
      });

      return NextResponse.json(
        {
          success: true,
          entry,
          stop: protections.stop,
          takeProfit: protections.takeProfit,
        },
        { status: 201 }
      );
    })
  )
);
