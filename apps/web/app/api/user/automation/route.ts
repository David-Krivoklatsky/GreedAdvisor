import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/api';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { automationSchema } from '@greed-advisor/validations';
import type { AutomationInput } from '@greed-advisor/validations';
import { rateLimit } from '@greed-advisor/rate-limit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const configs = await prisma.automationConfig.findMany({
      where: { userId: ctx.userId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    const withRuns = await Promise.all(
      configs.map(async config => {
        const latestRun = await prisma.automationRunLog.findFirst({
          where: { automationConfigId: config.id },
          orderBy: { startedAt: 'desc' },
          include: { steps: { orderBy: { startedAt: 'asc' } } }
        });
        return { ...config, latestRun };
      })
    );

    return NextResponse.json({ success: true, automationConfigs: withRuns });
  })
);

export const POST = withApiMiddleware(
  withValidation(automationSchema)(
    withAuth(async (req, ctx) => {
      const data = ctx.data as AutomationInput;

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

      // Verify referenced keys belong to the user when provided
      const [tradingKey, aiKey, marketDataKey] = await Promise.all([
        data.tradingKeyId
          ? prisma.t212ApiKey.findFirst({
              where: { id: data.tradingKeyId, userId: ctx.userId, deletedAt: null, isActive: true }
            })
          : Promise.resolve(null),
        data.aiKeyId
          ? prisma.aiApiKey.findFirst({
              where: { id: data.aiKeyId, userId: ctx.userId, deletedAt: null, isActive: true }
            })
          : Promise.resolve(null),
        data.marketDataKeyId
          ? prisma.marketDataKey.findFirst({
              where: {
                id: data.marketDataKeyId,
                userId: ctx.userId,
                deletedAt: null,
                isActive: true
              }
            })
          : Promise.resolve(null)
      ]);

      if (data.tradingKeyId && !tradingKey) {
        return NextResponse.json(
          { success: false, message: 'Trading key not found', error: 'Trading key not found' },
          { status: 404 }
        );
      }
      if (data.aiKeyId && !aiKey) {
        return NextResponse.json(
          { success: false, message: 'AI key not found', error: 'AI key not found' },
          { status: 404 }
        );
      }
      if (data.marketDataKeyId && !marketDataKey) {
        return NextResponse.json(
          {
            success: false,
            message: 'Market data key not found',
            error: 'Market data key not found'
          },
          { status: 404 }
        );
      }

      // Live mode is never allowed without the explicit allowLive flag
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

      const config = await prisma.automationConfig.create({
        data: {
          userId: ctx.userId,
          title: data.title,
          enabled: data.enabled ?? false,
          mode: data.mode ?? 'advisory',
          allowLive: data.allowLive ?? false,
          scanIntervalMinutes: data.scanIntervalMinutes,
          universe: data.universe,
          maxCandidates: data.maxCandidates,
          maxPositions: data.maxPositions,
          maxRiskPerTradePct: data.maxRiskPerTradePct,
          dailyLossLimitPct: data.dailyLossLimitPct,
          maxDailyTrades: data.maxDailyTrades,
          confidenceThreshold: data.confidenceThreshold,
          respectPdt: data.respectPdt,
          flattenAtClose: data.flattenAtClose,
          manageStops: data.manageStops ?? false,
          cooldownMinutes: data.cooldownMinutes,
          orderType: data.orderType,
          slippageTolerancePct: data.slippageTolerancePct,
          extendedHours: data.extendedHours,
          tradingKeyId: data.tradingKeyId ?? null,
          aiKeyId: data.aiKeyId ?? null,
          marketDataKeyId: data.marketDataKeyId ?? null,
          model: data.model ?? null,
          telegramChatId: data.telegramChatId ?? null
        }
      });

      return NextResponse.json(
        { success: true, message: 'Automation configuration created', automationConfig: config },
        { status: 201 }
      );
    })
  )
);
