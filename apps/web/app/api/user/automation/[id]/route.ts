import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { updateAutomationSchema } from '@greed-advisor/validations';
import type { UpdateAutomationInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const params = (await ctx.params) ?? {};
    const id = Number(params.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid automation id', error: 'Invalid id' },
        { status: 400 }
      );
    }

    const config = await prisma.automationConfig.findFirst({
      where: { id, userId: ctx.userId, deletedAt: null }
    });

    if (!config) {
      return NextResponse.json(
        { success: false, message: 'Automation not found', error: 'Automation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, automationConfig: config });
  })
);

export const PUT = withApiMiddleware(
  withValidation(updateAutomationSchema)(
    withAuth(async (_req, ctx) => {
      const params = (await ctx.params) ?? {};
      const id = Number(params.id);

      if (!Number.isInteger(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid automation id', error: 'Invalid id' },
          { status: 400 }
        );
      }

      const existing = await prisma.automationConfig.findFirst({
        where: { id, userId: ctx.userId, deletedAt: null }
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Automation not found', error: 'Automation not found' },
          { status: 404 }
        );
      }

      const data = ctx.data as UpdateAutomationInput;

      if (data.mode === 'live' && data.allowLive !== true) {
        return NextResponse.json(
          {
            success: false,
            message: 'Live trading requires the allowLive flag to be enabled',
            error: 'allowLive required for live mode'
          },
          { status: 400 }
        );
      }

      // Verify referenced keys belong to the user when changing them
      if (data.tradingKeyId) {
        const key = await prisma.t212ApiKey.findFirst({
          where: { id: data.tradingKeyId, userId: ctx.userId, deletedAt: null, isActive: true }
        });
        if (!key) {
          return NextResponse.json(
            { success: false, message: 'Trading key not found', error: 'Trading key not found' },
            { status: 404 }
          );
        }
      }
      if (data.aiKeyId) {
        const key = await prisma.aiApiKey.findFirst({
          where: { id: data.aiKeyId, userId: ctx.userId, deletedAt: null, isActive: true }
        });
        if (!key) {
          return NextResponse.json(
            { success: false, message: 'AI key not found', error: 'AI key not found' },
            { status: 404 }
          );
        }
      }
      if (data.marketDataKeyId) {
        const key = await prisma.marketDataKey.findFirst({
          where: { id: data.marketDataKeyId, userId: ctx.userId, deletedAt: null, isActive: true }
        });
        if (!key) {
          return NextResponse.json(
            {
              success: false,
              message: 'Market data key not found',
              error: 'Market data key not found'
            },
            { status: 404 }
          );
        }
      }

      const updated = await prisma.automationConfig.update({
        where: { id },
        data: {
          title: data.title ?? existing.title,
          enabled: data.enabled ?? existing.enabled,
          mode: data.mode ?? existing.mode,
          allowLive: data.allowLive ?? existing.allowLive,
          scanIntervalMinutes: data.scanIntervalMinutes ?? existing.scanIntervalMinutes,
          universe: data.universe ?? existing.universe,
          maxCandidates: data.maxCandidates ?? existing.maxCandidates,
          maxPositions: data.maxPositions ?? existing.maxPositions,
          maxRiskPerTradePct: data.maxRiskPerTradePct ?? existing.maxRiskPerTradePct,
          dailyLossLimitPct: data.dailyLossLimitPct ?? existing.dailyLossLimitPct,
          maxDailyTrades: data.maxDailyTrades ?? existing.maxDailyTrades,
          confidenceThreshold: data.confidenceThreshold ?? existing.confidenceThreshold,
          respectPdt: data.respectPdt ?? existing.respectPdt,
          flattenAtClose: data.flattenAtClose ?? existing.flattenAtClose,
          cooldownMinutes: data.cooldownMinutes ?? existing.cooldownMinutes,
          orderType: data.orderType ?? existing.orderType,
          slippageTolerancePct: data.slippageTolerancePct ?? existing.slippageTolerancePct,
          extendedHours: data.extendedHours ?? existing.extendedHours,
          tradingKeyId: data.tradingKeyId !== undefined ? data.tradingKeyId : existing.tradingKeyId,
          aiKeyId: data.aiKeyId !== undefined ? data.aiKeyId : existing.aiKeyId,
          marketDataKeyId:
            data.marketDataKeyId !== undefined ? data.marketDataKeyId : existing.marketDataKeyId,
          model: data.model !== undefined ? data.model : existing.model,
          telegramChatId:
            data.telegramChatId !== undefined ? data.telegramChatId : existing.telegramChatId,
          // When (re)enabled, run on the next heartbeat
          nextRunAt: data.enabled === true && !existing.enabled ? new Date() : existing.nextRunAt
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Automation configuration updated',
        automationConfig: updated
      });
    })
  )
);

export const DELETE = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const params = (await ctx.params) ?? {};
    const id = Number(params.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid automation id', error: 'Invalid id' },
        { status: 400 }
      );
    }

    const existing = await prisma.automationConfig.findFirst({
      where: { id, userId: ctx.userId, deletedAt: null }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Automation not found', error: 'Automation not found' },
        { status: 404 }
      );
    }

    await prisma.automationConfig.update({
      where: { id },
      data: { deletedAt: new Date(), enabled: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Automation configuration deleted'
    });
  })
);
