import { prisma } from '@/lib/prisma';
import { logKeyAudit } from '@/lib/audit';
import { getClientIp } from '@/lib/api';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { t212ApiKeySchema } from '@greed-advisor/validations';
import type { T212ApiKeyInput } from '@greed-advisor/validations';
import { encryptSecret } from '@greed-advisor/crypto';
import { rateLimit } from '@greed-advisor/rate-limit';
import { NextResponse } from 'next/server';

export const GET = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const apiKeys = await prisma.t212ApiKey.findMany({
      where: { userId: ctx.userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        accessType: true,
        environment: true,
        provider: true,
        isActive: true,
        createdAt: true,
        lastUsed: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      tradingKeys: apiKeys.map(key => ({ ...key, provider: key.provider ?? 'trading212' }))
    });
  })
);

export const POST = withApiMiddleware(
  withValidation(t212ApiKeySchema)(
    withAuth(async (req, ctx) => {
      const { title, accessType, environment, provider, apiKey, apiSecret } =
        ctx.data as T212ApiKeyInput;

      const rateLimitResult = rateLimit(getClientIp(req));
      if (!rateLimitResult.success) {
        return NextResponse.json(
          {
            success: false,
            message: 'Too many requests. Please try again later.',
            error: 'Rate limit exceeded'
          },
          { status: 429 }
        );
      }

      const count = await prisma.t212ApiKey.count({
        where: { userId: ctx.userId, deletedAt: null }
      });
      const maxKeys = Number(process.env.MAX_T212_KEYS ?? 3);

      if (count >= maxKeys) {
        return NextResponse.json(
          {
            success: false,
            message: `Maximum of ${maxKeys} trading API keys allowed`,
            error: 'API key limit reached'
          },
          { status: 400 }
        );
      }

      const newKey = await prisma.t212ApiKey.create({
        data: {
          userId: ctx.userId,
          title,
          accessType,
          environment,
          provider,
          apiKey: encryptSecret(apiKey),
          apiSecret: encryptSecret(apiSecret),
          isActive: true
        },
        select: {
          id: true,
          title: true,
          accessType: true,
          environment: true,
          provider: true,
          isActive: true,
          createdAt: true
        }
      });

      await logKeyAudit(ctx.userId, 'trading', 'created', req);

      return NextResponse.json(
        {
          success: true,
          message: 'Trading API key created successfully',
          apiKey: newKey
        },
        { status: 201 }
      );
    })
  )
);
