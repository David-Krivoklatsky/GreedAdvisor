import { prisma } from '@/lib/prisma';
import { logKeyAudit } from '@/lib/audit';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { updateT212ApiKeySchema } from '@greed-advisor/validations';
import type { UpdateT212ApiKeyInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const PUT = withApiMiddleware(
  withValidation(updateT212ApiKeySchema)(
    withAuth(async (req, ctx) => {
      const params = (await ctx.params) ?? {};
      const keyId = Number(params.id);

      if (!Number.isInteger(keyId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid API key id', error: 'Invalid id' },
          { status: 400 }
        );
      }

      const existing = await prisma.t212ApiKey.findFirst({
        where: { id: keyId, userId: ctx.userId, deletedAt: null },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'API key not found', error: 'API key not found' },
          { status: 404 }
        );
      }

      const { title, accessType, environment, apiKey, apiSecret, isActive } =
        ctx.data as UpdateT212ApiKeyInput;

      const updatedKey = await prisma.t212ApiKey.update({
        where: { id: keyId },
        data: {
          title: title ?? existing.title,
          accessType: accessType ?? existing.accessType,
          environment: environment ?? existing.environment,
          apiKey: apiKey ?? existing.apiKey,
          apiSecret: apiSecret ?? existing.apiSecret,
          isActive: isActive ?? existing.isActive,
        },
        select: {
          id: true,
          title: true,
          accessType: true,
          environment: true,
          isActive: true,
          createdAt: true,
        },
      });

      await logKeyAudit(ctx.userId, 'trading', 'updated', req);

      return NextResponse.json({
        success: true,
        message: 'Trading API key updated successfully',
        apiKey: updatedKey,
      });
    })
  )
);
