import { prisma } from '@/lib/prisma';
import { logKeyAudit } from '@/lib/audit';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { marketDataKeySchema } from '@greed-advisor/validations';
import type { MarketDataKeyInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const GET = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const apiKeys = await prisma.marketDataKey.findMany({
      where: { userId: ctx.userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        provider: true,
        isActive: true,
        createdAt: true,
        lastUsed: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, marketDataKeys: apiKeys });
  })
);

export const POST = withApiMiddleware(
  withValidation(marketDataKeySchema)(
    withAuth(async (req, ctx) => {
      const { title, provider, apiKey } = ctx.data as MarketDataKeyInput;

      const count = await prisma.marketDataKey.count({
        where: { userId: ctx.userId, deletedAt: null }
      });
      const maxKeys = Number(process.env.MAX_MARKET_DATA_KEYS ?? 3);

      if (count >= maxKeys) {
        return NextResponse.json(
          {
            success: false,
            message: `Maximum of ${maxKeys} Market Data API keys allowed`,
            error: 'API key limit reached'
          },
          { status: 400 }
        );
      }

      const newKey = await prisma.marketDataKey.create({
        data: {
          userId: ctx.userId,
          title,
          provider,
          apiKey,
          isActive: true
        },
        select: {
          id: true,
          title: true,
          provider: true,
          isActive: true,
          createdAt: true
        }
      });

      await logKeyAudit(ctx.userId, 'market-data', 'created', req);

      return NextResponse.json(
        {
          success: true,
          message: 'Market data API key created successfully',
          apiKey: newKey
        },
        { status: 201 }
      );
    })
  )
);
