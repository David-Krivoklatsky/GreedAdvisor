import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/user/signals/[id]/approve - approve a pending_approval signal and
// place its order (bot runs in approval mode).
export const POST = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const params = (await ctx.params) ?? {};
    const id = Number(params.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid signal id', error: 'Invalid id' },
        { status: 400 }
      );
    }

    const signal = await prisma.tradeSignal.findFirst({
      where: { id, userId: ctx.userId }
    });
    if (!signal) {
      return NextResponse.json(
        { success: false, message: 'Signal not found', error: 'Signal not found' },
        { status: 404 }
      );
    }
    if (signal.status !== 'pending_approval') {
      return NextResponse.json(
        {
          success: false,
          message: `Signal is not awaiting approval (${signal.status})`,
          error: 'Not awaiting approval'
        },
        { status: 400 }
      );
    }

    const { approveSignal } = await import('@greed-advisor/engine');
    const result = await approveSignal(id);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.error, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Order placed for ${signal.symbol}`
    });
  })
);
