import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const limit = Math.min(
      Math.max(Number(req.nextUrl.searchParams.get('limit') ?? '50') || 50, 1),
      200
    );
    const status = req.nextUrl.searchParams.get('status') ?? undefined;
    const symbol = req.nextUrl.searchParams.get('symbol') ?? undefined;

    const trades = await prisma.tradeRecord.findMany({
      where: {
        userId: ctx.userId,
        ...(status ? { status } : {}),
        ...(symbol ? { symbol: { contains: symbol, mode: 'insensitive' } } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ success: true, trades });
  })
);
