import { prisma } from '@/lib/prisma';
import { logKeyAudit } from '@/lib/audit';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { updateAiApiKeySchema } from '@greed-advisor/validations';
import type { UpdateAiApiKeyInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const PUT = withApiMiddleware(
  withValidation(updateAiApiKeySchema)(
    withAuth(async (req, ctx) => {
      const params = (await ctx.params) ?? {};
      const keyId = Number(params.id);

      if (!Number.isInteger(keyId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid API key id', error: 'Invalid id' },
          { status: 400 }
        );
      }

      const existing = await prisma.aiApiKey.findFirst({
        where: { id: keyId, userId: ctx.userId, deletedAt: null }
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'API key not found', error: 'API key not found' },
          { status: 404 }
        );
      }

      const { title, provider, apiKey, isActive } = ctx.data as UpdateAiApiKeyInput;

      const updatedKey = await prisma.aiApiKey.update({
        where: { id: keyId },
        data: {
          title: title ?? existing.title,
          provider: provider ?? existing.provider,
          apiKey: apiKey ?? existing.apiKey,
          isActive: isActive ?? existing.isActive
        },
        select: {
          id: true,
          title: true,
          provider: true,
          isActive: true,
          createdAt: true
        }
      });

      await logKeyAudit(ctx.userId, 'ai', 'updated', req);

      return NextResponse.json({
        success: true,
        message: 'API key updated successfully',
        apiKey: updatedKey
      });
    })
  )
);

export const DELETE = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const params = (await ctx.params) ?? {};
    const keyId = Number(params.id);

    if (!Number.isInteger(keyId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid API key id', error: 'Invalid id' },
        { status: 400 }
      );
    }

    const existing = await prisma.aiApiKey.findFirst({
      where: { id: keyId, userId: ctx.userId, deletedAt: null }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'API key not found', error: 'API key not found' },
        { status: 404 }
      );
    }

    await prisma.aiApiKey.update({
      where: { id: keyId },
      data: { deletedAt: new Date(), isActive: false }
    });

    await logKeyAudit(ctx.userId, 'ai', 'deleted', req);

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });
  })
);
