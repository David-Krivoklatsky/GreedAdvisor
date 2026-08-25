import { prisma } from '@/lib/prisma';
import { logKeyAudit } from '@/lib/audit';
import { getClientIp } from '@/lib/api';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { aiApiKeySchema } from '@greed-advisor/validations';
import type { AiApiKeyInput } from '@greed-advisor/validations';
import { encryptSecret } from '@greed-advisor/crypto';
import { rateLimit } from '@greed-advisor/rate-limit';
import { NextResponse } from 'next/server';

export const GET = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const apiKeys = await prisma.aiApiKey.findMany({
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

    return NextResponse.json({ success: true, aiKeys: apiKeys });
  })
);

export const POST = withApiMiddleware(
  withValidation(aiApiKeySchema)(
    withAuth(async (req, ctx) => {
      const { title, provider, apiKey } = ctx.data as AiApiKeyInput;

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

      const count = await prisma.aiApiKey.count({
        where: { userId: ctx.userId, deletedAt: null }
      });
      const maxAiKeys = Number(process.env.MAX_AI_KEYS ?? 3);

      if (count >= maxAiKeys) {
        return NextResponse.json(
          {
            success: false,
            message: `Maximum of ${maxAiKeys} AI API keys allowed`,
            error: 'API key limit reached'
          },
          { status: 400 }
        );
      }

      const newKey = await prisma.aiApiKey.create({
        data: {
          userId: ctx.userId,
          title,
          provider,
          apiKey: encryptSecret(apiKey),
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

      await logKeyAudit(ctx.userId, 'ai', 'created', req);

      return NextResponse.json(
        {
          success: true,
          message: 'API key created successfully',
          apiKey: newKey
        },
        { status: 201 }
      );
    })
  )
);
