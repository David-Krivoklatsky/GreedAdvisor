import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const updateSignalSchema = z.object({
  status: z.enum({ acted: 'acted', ignored: 'ignored', expired: 'expired' })
});

export const GET = withApiMiddleware(
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
      where: { id, userId: ctx.userId },
      include: { tradeRecord: true }
    });

    if (!signal) {
      return NextResponse.json(
        { success: false, message: 'Signal not found', error: 'Signal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, signal });
  })
);

export const PATCH = withApiMiddleware(
  withValidation(updateSignalSchema)(
    withAuth(async (_req, ctx) => {
      const params = (await ctx.params) ?? {};
      const id = Number(params.id);

      if (!Number.isInteger(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid signal id', error: 'Invalid id' },
          { status: 400 }
        );
      }

      const existing = await prisma.tradeSignal.findFirst({
        where: { id, userId: ctx.userId }
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Signal not found', error: 'Signal not found' },
          { status: 404 }
        );
      }

      const { status } = ctx.data as { status: string };

      const signal = await prisma.tradeSignal.update({
        where: { id },
        data: { status, ...(status === 'acted' ? { actedAt: new Date() } : {}) }
      });

      return NextResponse.json({ success: true, signal });
    })
  )
);
