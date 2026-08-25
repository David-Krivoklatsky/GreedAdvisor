import { getActiveTradingClient } from '@/lib/providers';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// DELETE /api/user/orders/[id]?keyId=<tradingKeyId> - cancel a pending order
export const DELETE = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const params = (await ctx.params) ?? {};
    const orderId = params.id;

    const keyId = Number(req.nextUrl.searchParams.get('keyId') ?? '') || undefined;
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Invalid order id', error: 'Invalid id' },
        { status: 400 }
      );
    }

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

    await provider.cancelOrder(orderId);

    return NextResponse.json({ success: true, message: 'Order cancelled' });
  })
);
