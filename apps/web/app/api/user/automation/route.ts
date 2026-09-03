import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/api';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { automationSchema } from '@greed-advisor/validations';
import type { AutomationInput } from '@greed-advisor/validations';
import { rateLimit } from '@greed-advisor/rate-limit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Market-hours check per bot market: crypto is 24/7, EU ≈ CET hours, US ≈ ET.
function isMarketOpen(config: { extendedHours: boolean; market?: string | null }): boolean {
  const market = config.market ?? 'us';

  if (market === 'crypto') return true;

  const timeZone = market === 'eu' ? 'Europe/Paris' : 'America/New_York';
  const openMinutes = market === 'eu' ? 540 : 570; // 09:00 / 09:30
  const closeMinutes = market === 'eu' ? 1050 : 960; // 17:30 / 16:00

  if (config.extendedHours) return true;
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone }));
  const day = local.getUTCDay();
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  return day >= 1 && day <= 5 && minutes >= openMinutes && minutes < closeMinutes;
}

export const GET = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const configs = await prisma.automationConfig.findMany({
      where: { userId: ctx.userId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    if (configs.length === 0) {
      return NextResponse.json({ success: true, automationConfigs: [] });
    }

    const configIds = configs.map(c => c.id);

    // Batch fetch all related data in 3 queries instead of N*3
    const [runLogs, lastTrades, signalRows] = await Promise.all([
      prisma.automationRunLog.findMany({
        where: { automationConfigId: { in: configIds } },
        orderBy: { startedAt: 'desc' },
        include: { steps: { orderBy: { startedAt: 'asc' } } }
      }),
      prisma.tradeRecord.findMany({
        where: { automationConfigId: { in: configIds } },
        orderBy: { createdAt: 'desc' },
        select: { automationConfigId: true, createdAt: true }
      }),
      prisma.tradeSignal.findMany({
        where: { automationConfigId: { in: configIds } },
        orderBy: { generatedAt: 'desc' },
        take: 100,
        select: {
          automationConfigId: true,
          symbol: true,
          action: true,
          entryPrice: true,
          stopLoss: true,
          takeProfit: true,
          confidence: true,
          status: true,
          generatedAt: true
        }
      })
    ]);

    // Group by configId for O(1) lookup
    const runLogsByConfig = new Map<number, (typeof runLogs)[0]>();
    for (const run of runLogs) {
      if (!runLogsByConfig.has(run.automationConfigId)) {
        runLogsByConfig.set(run.automationConfigId, run);
      }
    }

    const lastTradesByConfig = new Map<number, Date>();
    for (const trade of lastTrades) {
      if (!lastTradesByConfig.has(trade.automationConfigId)) {
        lastTradesByConfig.set(trade.automationConfigId, trade.createdAt);
      }
    }

    const signalsByConfig = new Map<number, typeof signalRows>();
    for (const signal of signalRows) {
      const existing = signalsByConfig.get(signal.automationConfigId) ?? [];
      existing.push(signal);
      signalsByConfig.set(signal.automationConfigId, existing);
    }

    const withRuns = configs.map(config => {
      const latestRun = runLogsByConfig.get(config.id) ?? null;
      const lastTradeAt = lastTradesByConfig.get(config.id) ?? null;
      const signals = signalsByConfig.get(config.id) ?? [];

      const latestSignals: Record<
        string,
        {
          action: string;
          entryPrice: number | null;
          stopLoss: number | null;
          takeProfit: number | null;
          confidence: number;
          status: string;
          generatedAt: string;
        }
      > = {};
      for (const s of signals) {
        if (!latestSignals[s.symbol]) {
          latestSignals[s.symbol] = {
            action: s.action,
            entryPrice: s.entryPrice,
            stopLoss: s.stopLoss,
            takeProfit: s.takeProfit,
            confidence: s.confidence,
            status: s.status,
            generatedAt: s.generatedAt.toISOString()
          };
        }
      }

      let cooldownUntil: string | null = null;
      if (lastTradeAt) {
        const until = lastTradeAt.getTime() + config.cooldownMinutes * 60000;
        if (until > Date.now()) cooldownUntil = new Date(until).toISOString();
      }

      return {
        ...config,
        marketOpen: isMarketOpen(config),
        lastTradeAt: lastTradeAt ? lastTradeAt.toISOString() : null,
        cooldownUntil,
        latestSignals,
        latestRun
      };
    });

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
          execution: data.execution ?? 'auto',
          market: data.market ?? 'us',
          strategy: data.strategy ?? 'momentum',
          allowLive: data.allowLive ?? false,
          scanIntervalMinutes: data.scanIntervalMinutes,
          universe: data.universe,
          symbols: data.symbols ?? [],
          maxCandidates: data.maxCandidates,
          maxPositions: data.maxPositions,
          maxRiskPerTradePct: data.maxRiskPerTradePct,
          maxDailySpendPct: data.maxDailySpendPct ?? 0.2,
          dailyLossLimitPct: data.dailyLossLimitPct,
          stopOnLoss: data.stopOnLoss ?? true,
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
