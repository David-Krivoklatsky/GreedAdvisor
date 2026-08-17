import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { watchlistItemSchema } from '@greed-advisor/validations';
import type { WatchlistItemInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const GET = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId: ctx.userId, isActive: true },
      select: {
        id: true,
        ticker: true,
        name: true,
        instrumentType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, items: watchlist });
  })
);

export const POST = withApiMiddleware(
  withValidation(watchlistItemSchema)(
    withAuth(async (_req, ctx) => {
      const { ticker, name, instrumentType } = ctx.data as WatchlistItemInput;

      const existing = await prisma.watchlistItem.findFirst({
        where: { userId: ctx.userId, ticker },
      });

      if (existing?.isActive) {
        return NextResponse.json(
          {
            success: false,
            message: `${ticker} is already in your watchlist`,
            error: 'Duplicate watchlist item',
          },
          { status: 409 }
        );
      }

      const item = existing
        ? await prisma.watchlistItem.update({
            where: { id: existing.id },
            data: {
              isActive: true,
              ...(name !== undefined && name !== null ? { name } : {}),
              ...(instrumentType ? { instrumentType } : {}),
            },
            select: { id: true, ticker: true, name: true, instrumentType: true, createdAt: true },
          })
        : await prisma.watchlistItem.create({
            data: {
              userId: ctx.userId,
              ticker,
              name: name ?? null,
              instrumentType,
            },
            select: { id: true, ticker: true, name: true, instrumentType: true, createdAt: true },
          });

      return NextResponse.json(
        { success: true, message: `${ticker} added to watchlist`, item },
        { status: 201 }
      );
    })
  )
);
