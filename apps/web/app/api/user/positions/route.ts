import { prisma } from '@/lib/prisma';
import { getActiveT212Client } from '@/lib/providers';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const keyId = Number(req.nextUrl.searchParams.get('keyId') ?? '') || undefined;
    const provider = await getActiveT212Client(ctx.userId, keyId);

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active Trading212 key found',
          error: 'No active Trading212 key found',
        },
        { status: 404 }
      );
    }

    const { key, client } = provider;

    const [positions, accountSummary] = await Promise.all([
      client.getPositions(),
      client.getAccountSummary(),
    ]);

    await prisma.t212ApiKey.update({
      where: { id: key.id },
      data: { lastUsed: new Date() },
    });

    return NextResponse.json({
      success: true,
      positions,
      accountSummary,
      environment: key.environment,
    });
  })
);
