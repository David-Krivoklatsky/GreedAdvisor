import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { notificationReadSchema } from '@greed-advisor/validations';
import type { NotificationReadInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const limit = Math.min(
      Math.max(Number(req.nextUrl.searchParams.get('limit') ?? '50') || 50, 1),
      200
    );
    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: ctx.userId, ...(unreadOnly ? { isRead: false } : {}) },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.notification.count({ where: { userId: ctx.userId, isRead: false } })
    ]);

    return NextResponse.json({ success: true, notifications, unreadCount });
  })
);

export const PATCH = withApiMiddleware(
  withValidation(notificationReadSchema)(
    withAuth(async (_req, ctx) => {
      const { ids, all } = ctx.data as NotificationReadInput;

      if (all) {
        await prisma.notification.updateMany({
          where: { userId: ctx.userId, isRead: false },
          data: { isRead: true }
        });
        return NextResponse.json({ success: true, message: 'All notifications marked as read' });
      }

      if (!ids || ids.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No notification ids provided', error: 'No ids' },
          { status: 400 }
        );
      }

      const result = await prisma.notification.updateMany({
        where: { userId: ctx.userId, id: { in: ids } },
        data: { isRead: true }
      });

      return NextResponse.json({
        success: true,
        updated: result.count
      });
    })
  )
);
