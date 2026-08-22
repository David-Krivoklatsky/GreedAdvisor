import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const DELETE = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const params = (await ctx.params) ?? {};
    const itemId = Number(params.id);

    if (!Number.isInteger(itemId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid watchlist item id', error: 'Invalid id' },
        { status: 400 }
      );
    }

    const item = await prisma.watchlistItem.findFirst({
      where: { id: itemId, userId: ctx.userId }
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Watchlist item not found', error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    // Soft delete so re-adding preserves the original creation date
    await prisma.watchlistItem.update({
      where: { id: itemId },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: 'Item removed from watchlist' });
  })
);
