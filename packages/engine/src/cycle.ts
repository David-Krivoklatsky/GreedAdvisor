import { prisma } from '@greed-advisor/db';
import type { AutomationConfig, DailyStat } from '@greed-advisor/db';
import { createAiProvider } from '@greed-advisor/ai';
import type { AiProductType, AiProvider, AiReport, AiRiskProfile } from '@greed-advisor/ai';
import {
  computeIndicators,
  MarketDataService,
  TwelveDataProvider
} from '@greed-advisor/market-data';
import { decryptSecret } from '@greed-advisor/crypto';
import { getActiveTradingClient } from '@greed-advisor/trading';
import type { AccountMeta, PlaceOrderType, TradingClientBinding } from '@greed-advisor/trading';
import { AlpacaClient, AlpacaEnvironment } from '@greed-advisor/alpaca';
import { isEnginePaused, log } from './config';
import { notify } from './notify';
import { checkGuardrails } from './guardrails';
import { preScreenSymbol, rankCandidates } from './pre-screen';
import type { CandidateScore } from './pre-screen';
import { approximateUsMarketWindow, etDateOnly, getAlpacaWindow } from './market-hours';
import { fetchNewsForSymbols } from './news';
import { manageStops, reconcileOrders } from './positions';
import { lockKeyForConfig, releaseAdvisoryLock, tryAcquireAdvisoryLock } from './lock';

export interface CycleResult {
  status: 'success' | 'partial' | 'failed' | 'skipped';
  reason?: string;
}

const MAX_UNIVERSE = 25;
const MAX_PRE_SCREEN = 15;

function normalizeSymbol(symbol: string): string {
  return symbol.split('_')[0].toUpperCase();
}

async function getDailyStat(config: AutomationConfig, accountEquity: number): Promise<DailyStat> {
  const date = etDateOnly();
  const existing = await prisma.dailyStat.findUnique({
    where: {
      userId_automationConfigId_date: {
        userId: config.userId,
        automationConfigId: config.id,
        date
      }
    }
  });
  if (existing) return existing;
  return prisma.dailyStat.create({
    data: {
      userId: config.userId,
      automationConfigId: config.id,
      date,
      startEquity: accountEquity
    }
  });
}

async function refreshDailyPnl(config: AutomationConfig, dailyStat: DailyStat): Promise<DailyStat> {
  const since = etDateOnly();
  const realized = await prisma.tradeRecord.aggregate({
    where: {
      userId: config.userId,
      automationConfigId: config.id,
      createdAt: { gte: since },
      realizedPnl: { not: null }
    },
    _sum: { realizedPnl: true }
  });
  return prisma.dailyStat.update({
    where: { id: dailyStat.id },
    data: { realizedPnl: realized._sum.realizedPnl ?? 0 }
  });
}

async function buildUniverse(
  config: AutomationConfig,
  binding: TradingClientBinding
): Promise<string[]> {
  const watchlist = await prisma.watchlistItem.findMany({
    where: { userId: config.userId, isActive: true },
    select: { ticker: true }
  });
  let symbols = [...new Set(watchlist.map(w => normalizeSymbol(w.ticker)))];

  if (config.universe === 'watchlist+movers' && binding.provider === 'alpaca') {
    try {
      const client = new AlpacaClient({
        apiKey: binding.key.apiKey,
        apiSecret: binding.key.apiSecret,
        environment: binding.key.environment as AlpacaEnvironment
      });
      const [movers, mostActive] = await Promise.all([
        client.getMarketMovers(20),
        client.getMostActive(20)
      ]);
      const extra = [...movers.map(m => m.symbol), ...mostActive.map(m => m.symbol)].slice(0, 40);
      symbols = [...new Set([...symbols, ...extra])];
    } catch (error) {
      log('warn', 'Movers/most-active fetch failed', { error: String(error) });
    }
  }

  return symbols.slice(0, MAX_UNIVERSE);
}

async function resolveBrokerTicker(binding: TradingClientBinding, symbol: string): Promise<string> {
  if (binding.provider === 'alpaca') return symbol;
  try {
    const instruments = await binding.getInstruments();
    const needle = normalizeSymbol(symbol);
    const found = instruments.find(
      i => normalizeSymbol(i.ticker) === needle || normalizeSymbol(i.shortName) === needle
    );
    return found?.ticker ?? symbol;
  } catch {
    return symbol;
  }
}

interface DerivedRisk {
  stopLoss: number;
  takeProfit?: number;
  positionSize: number;
  riskAmount: number;
}

function deriveRiskParams(
  report: AiReport,
  accountEquity: number,
  candles: {
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[],
  config: AutomationConfig
): DerivedRisk {
  const entry = report.entryPrice > 0 ? report.entryPrice : report.priceTargets.current;
  let stopLoss = report.stopLoss;

  if (!stopLoss || stopLoss <= 0) {
    const atr = computeIndicators(candles).snapshot.atr;
    if (atr && atr > 0) {
      stopLoss = report.action === 'SELL' ? entry + 2 * atr : entry - 2 * atr;
    } else {
      stopLoss = entry * (report.action === 'SELL' ? 1.03 : 0.97);
    }
  }

  const riskPerUnit = Math.abs(entry - stopLoss) || entry * 0.01;
  const riskAmount = config.maxRiskPerTradePct * accountEquity;
  let positionSize = Math.max(1, Math.floor(riskAmount / riskPerUnit));

  const buyingPowerCap = Math.floor((accountEquity * 0.95) / entry);
  if (buyingPowerCap > 0) {
    positionSize = Math.min(positionSize, buyingPowerCap);
  }

  return {
    stopLoss,
    takeProfit: report.takeProfit,
    positionSize,
    riskAmount
  };
}

async function handleSignal(params: {
  config: AutomationConfig;
  binding: TradingClientBinding;
  account: AccountMeta;
  dailyStat: DailyStat;
  canTrade: boolean;
  symbol: string;
  report: AiReport;
  candles: {
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  news: unknown[];
}): Promise<void> {
  const { config, binding, account, dailyStat, canTrade, symbol, report, candles, news } = params;

  const positions = await binding.getPositions();
  const existingPosition = positions.find(p => normalizeSymbol(p.instrument.ticker) === symbol);
  const hasExistingPosition = !!existingPosition && existingPosition.quantity > 0;

  const signal = await prisma.tradeSignal.create({
    data: {
      userId: config.userId,
      automationConfigId: config.id,
      symbol,
      action: report.action,
      recommendation: report.recommendation,
      confidence: report.confidence,
      summary: report.summary,
      analysis: (report.analysis as unknown as object) ?? undefined,
      entryPrice: report.entryPrice,
      stopLoss: report.stopLoss,
      takeProfit: report.takeProfit,
      positionSize: report.positionSize,
      riskAmount: report.riskAmount,
      riskPerUnit: report.riskPerUnit,
      report: report as unknown as object,
      marketSnapshot: {
        quotePrice: report.priceTargets.current,
        atr: candles.length > 0 ? computeIndicators(candles).snapshot.atr : null
      },
      news: news as unknown as object,
      source: 'scheduled',
      provider: report.provider,
      status: 'open'
    }
  });

  const since = new Date(Date.now() - config.cooldownMinutes * 60000);
  const recentTrades = await prisma.tradeRecord.count({
    where: { userId: config.userId, symbol, createdAt: { gte: since } }
  });

  const guard = checkGuardrails({
    config,
    account,
    dailyStat,
    positions,
    report,
    symbol,
    hasExistingPosition,
    recentTrades
  });

  if (!guard.allowed) {
    await prisma.tradeSignal.update({
      where: { id: signal.id },
      data: { status: 'ignored' }
    });
    log('info', `Signal ignored ${symbol} ${report.action}`, { reason: guard.reason });
    return;
  }

  await notify(
    config.userId,
    config.telegramChatId,
    'signal',
    `Signal: ${symbol} ${report.action} (${report.confidence}%)`,
    report.summary,
    { signalId: signal.id }
  );

  if (!canTrade) {
    log('info', `Signal stored (advisory mode) ${symbol} ${report.action}`);
    return;
  }

  // Recompute sizing — never trust the LLM's numbers blindly.
  const risk = deriveRiskParams(report, account.equity, candles, config);
  const brokerTicker = await resolveBrokerTicker(binding, symbol);

  let side: 'BUY' | 'SELL';
  let quantity: number;
  if (report.action === 'SELL' || report.action === 'TRIM') {
    side = 'SELL';
    const held = existingPosition?.quantity ?? 0;
    quantity =
      report.action === 'TRIM'
        ? Math.max(1, Math.min(Math.floor(held * 0.5), Math.floor(risk.positionSize)))
        : held;
    if (quantity <= 0 || held <= 0) {
      log('info', `Skipping ${report.action} for ${symbol}: nothing held`);
      return;
    }
  } else {
    side = 'BUY';
    quantity = risk.positionSize;
  }

  const orderType = (config.orderType ?? 'MARKET') as PlaceOrderType;
  const clientOrderId = `ga-${config.userId}-${signal.id}`;
  const result = await binding.placeOrder({
    ticker: brokerTicker,
    side,
    quantity,
    orderType,
    limitPrice: orderType === 'LIMIT' ? report.entryPrice : undefined,
    stopLoss: risk.stopLoss,
    takeProfit: risk.takeProfit,
    extendedHours: false,
    clientOrderId
  });

  // Estimate realized PnL for closing orders so the daily-loss breaker works
  // even before the fill reconciles.
  let realizedPnl: number | undefined;
  if (side === 'SELL' && existingPosition && existingPosition.averagePricePaid > 0) {
    const fillEstimate = report.priceTargets.current || existingPosition.currentPrice;
    realizedPnl = (fillEstimate - existingPosition.averagePricePaid) * quantity;
  }

  await prisma.tradeRecord.create({
    data: {
      userId: config.userId,
      automationConfigId: config.id,
      signalId: signal.id,
      tradingKeyId: binding.key.id,
      symbol,
      side,
      quantity,
      orderType,
      orderId: result.id,
      clientOrderId,
      entryPrice: report.entryPrice,
      stopLoss: risk.stopLoss,
      takeProfit: risk.takeProfit,
      stopOrderId: result.stop?.id ?? null,
      takeProfitOrderId: result.takeProfit?.id ?? null,
      status: result.status,
      filledQuantity: 0,
      realizedPnl: realizedPnl ?? null
    }
  });

  await prisma.tradeSignal.update({
    where: { id: signal.id },
    data: { status: 'acted', actedAt: new Date() }
  });

  await prisma.dailyStat.update({
    where: { id: dailyStat.id },
    data: {
      tradeCount: { increment: 1 },
      dayTradeCount: side === 'SELL' ? { increment: 1 } : undefined
    }
  });

  await notify(
    config.userId,
    config.telegramChatId,
    'order',
    `Order placed: ${side} ${quantity} ${symbol}`,
    `Order ${result.id} (${result.status}) · SL ${risk.stopLoss} · TP ${risk.takeProfit ?? '—'}`,
    { orderId: result.id, signalId: signal.id }
  );

  log('info', `Order placed ${side} ${quantity} ${symbol}`, {
    orderId: result.id,
    status: result.status
  });
}

async function flattenAtClose(
  config: AutomationConfig,
  binding: TradingClientBinding
): Promise<void> {
  const positions = await binding.getPositions();
  const open = positions.filter(p => p.quantity > 0);
  if (open.length === 0) return;

  const today = etDateOnly();
  const alreadyFlattened = await prisma.tradeRecord.findFirst({
    where: {
      userId: config.userId,
      automationConfigId: config.id,
      reason: 'flatten',
      createdAt: { gte: today }
    }
  });
  if (alreadyFlattened) return;

  for (const position of open) {
    const symbol = normalizeSymbol(position.instrument.ticker);
    try {
      const brokerTicker = await resolveBrokerTicker(binding, symbol);
      const result = await binding.placeOrder({
        ticker: brokerTicker,
        side: 'SELL',
        quantity: position.quantity,
        orderType: 'MARKET',
        extendedHours: false,
        clientOrderId: `ga-flatten-${config.userId}-${Date.now()}`
      });
      await prisma.tradeRecord.create({
        data: {
          userId: config.userId,
          automationConfigId: config.id,
          tradingKeyId: binding.key.id,
          symbol,
          side: 'SELL',
          quantity: position.quantity,
          orderType: 'MARKET',
          orderId: result.id,
          status: result.status,
          reason: 'flatten',
          filledQuantity: 0
        }
      });
      log('info', `Flattening ${symbol} (${position.quantity})`, { orderId: result.id });
    } catch (error) {
      log('error', `Flatten failed for ${symbol}`, { error: String(error) });
    }
  }

  await notify(
    config.userId,
    config.telegramChatId,
    'order',
    `Day-trade flatten: closed ${open.length} position(s)`,
    undefined,
    { reason: 'flatten' }
  );
}

async function runCycleLocked(config: AutomationConfig): Promise<CycleResult> {
  const [tradingKey, aiKey, marketDataKey, user] = await Promise.all([
    config.tradingKeyId
      ? prisma.t212ApiKey.findFirst({
          where: { id: config.tradingKeyId, userId: config.userId, deletedAt: null, isActive: true }
        })
      : Promise.resolve(null),
    config.aiKeyId
      ? prisma.aiApiKey.findFirst({
          where: { id: config.aiKeyId, userId: config.userId, deletedAt: null, isActive: true }
        })
      : Promise.resolve(null),
    config.marketDataKeyId
      ? prisma.marketDataKey.findFirst({
          where: {
            id: config.marketDataKeyId,
            userId: config.userId,
            deletedAt: null,
            isActive: true
          }
        })
      : Promise.resolve(null),
    prisma.user.findUnique({ where: { id: config.userId } })
  ]);

  if (!tradingKey || !aiKey || !marketDataKey) {
    const missing = [
      !tradingKey ? 'trading key' : null,
      !aiKey ? 'AI key' : null,
      !marketDataKey ? 'market data key' : null
    ]
      .filter(Boolean)
      .join(', ');
    await notify(
      config.userId,
      config.telegramChatId,
      'error',
      'Automation missing keys',
      `Disabling automation "${config.title}" — missing ${missing}`
    );
    await prisma.automationConfig.update({
      where: { id: config.id },
      data: { enabled: false, lastRunStatus: 'failed' }
    });
    return { status: 'failed', reason: `Missing ${missing}` };
  }

  const binding = await getActiveTradingClient(config.userId, config.tradingKeyId ?? undefined);
  if (!binding) {
    return { status: 'failed', reason: 'No active trading client' };
  }

  // Mode gating — advisory never trades; live requires the explicit flag.
  const environment = binding.environment;
  const mode = config.mode ?? 'advisory';
  let canTrade = false;
  if (mode === 'paper') {
    canTrade = binding.provider === 'alpaca' ? environment === 'paper' : environment === 'demo';
  } else if (mode === 'live') {
    canTrade =
      config.allowLive === true &&
      environment === 'live' &&
      (binding.provider === 'trading212' ? binding.key.accessType !== 'read-only' : true);
  }

  const account = await binding.getAccountMeta();
  let dailyStat = await getDailyStat(config, account.equity);
  dailyStat = await refreshDailyPnl(config, dailyStat);

  // Update unrealized PnL for the daily-loss breaker
  const positions = await binding.getPositions();
  const unrealized = positions.reduce(
    (sum, p) => sum + (p.walletImpact?.unrealizedProfitLoss ?? 0),
    0
  );
  dailyStat = await prisma.dailyStat.update({
    where: { id: dailyStat.id },
    data: { unrealizedPnl: unrealized }
  });

  const marketData = new MarketDataService(
    new TwelveDataProvider(decryptSecret(marketDataKey.apiKey))
  );

  // Market-hours gate
  let marketOpen = true;
  let closingSoon = false;
  if (binding.provider === 'alpaca') {
    const window = await getAlpacaWindow(binding.key);
    if (window) {
      marketOpen = window.open || config.extendedHours;
      if (window.nextClose) {
        const closeTime = new Date(window.nextClose).getTime();
        closingSoon = Date.now() >= closeTime - 15 * 60000;
      }
    }
  } else {
    marketOpen = approximateUsMarketWindow().open || config.extendedHours;
  }

  if (!marketOpen) {
    return { status: 'skipped', reason: 'market closed' };
  }

  if (config.flattenAtClose && closingSoon) {
    await flattenAtClose(config, binding);
  }

  // Position management: reconcile fills and trail stops (Alpaca).
  if (canTrade) {
    try {
      await reconcileOrders(config, binding);
    } catch (error) {
      log('warn', 'Order reconciliation failed', { error: String(error) });
    }
    try {
      await manageStops(config, binding, marketData);
    } catch (error) {
      log('warn', 'Stop management failed', { error: String(error) });
    }
    dailyStat = await refreshDailyPnl(config, dailyStat);
  }

  // Universe → pre-screen → top-K analysis
  const universe = await buildUniverse(config, binding);
  if (universe.length === 0) {
    return { status: 'skipped', reason: 'empty universe' };
  }

  const aiProvider = createAiProvider(
    aiKey.provider as AiProvider,
    decryptSecret(aiKey.apiKey),
    config.model ?? undefined
  );
  const productType = 'INVEST' as AiProductType;
  const riskProfile = (user?.riskProfile ?? 'balanced') as AiRiskProfile;

  const preScreenPool = universe.slice(0, MAX_PRE_SCREEN);
  const scored: CandidateScore[] = [];
  for (const symbol of preScreenPool) {
    const score = await preScreenSymbol(marketData, symbol);
    if (score) scored.push(score);
  }
  const candidates = rankCandidates(scored, universe, config.maxCandidates);

  const newsMap = await fetchNewsForSymbols(binding.key, candidates, 5);

  let analyzed = 0;
  let acted = 0;
  for (const symbol of candidates) {
    try {
      const quote = await marketData.getQuote(symbol);
      const candles = await marketData.getCandles(symbol, '1day', 90);
      const indicators = computeIndicators(candles);
      const report = await aiProvider.generateReport({
        symbol,
        companyName: quote.name,
        quote,
        candles: candles.slice(-60),
        indicators: indicators.snapshot,
        reportType: 'autonomous',
        productType,
        riskProfile,
        accountValue: account.equity,
        news: newsMap[symbol]
      });
      analyzed++;

      const beforeCount = await prisma.tradeRecord.count({
        where: { userId: config.userId, automationConfigId: config.id }
      });
      await handleSignal({
        config,
        binding,
        account,
        dailyStat,
        canTrade,
        symbol,
        report,
        candles,
        news: newsMap[symbol] ?? []
      });
      const afterCount = await prisma.tradeRecord.count({
        where: { userId: config.userId, automationConfigId: config.id }
      });
      if (afterCount > beforeCount) acted++;
    } catch (error) {
      log('warn', `Analysis failed for ${symbol}`, { error: String(error) });
    }
  }

  return {
    status: analyzed === 0 ? 'failed' : acted > 0 ? 'success' : 'partial',
    reason: `analyzed ${analyzed}/${candidates.length}, acted ${acted}`
  };
}

export async function runCycle(configId: number): Promise<CycleResult> {
  if (isEnginePaused()) {
    return { status: 'skipped', reason: 'engine paused' };
  }

  const config = await prisma.automationConfig.findFirst({
    where: { id: configId, deletedAt: null }
  });
  if (!config) return { status: 'skipped', reason: 'not found' };
  if (!config.enabled) return { status: 'skipped', reason: 'disabled' };

  const lockKey = lockKeyForConfig(configId);
  const locked = await tryAcquireAdvisoryLock(lockKey);
  if (!locked) return { status: 'skipped', reason: 'already running' };

  const runLog = await prisma.automationRunLog.create({
    data: { userId: config.userId, automationConfigId: config.id, status: 'running' }
  });

  try {
    const result = await runCycleLocked(config);
    await prisma.automationRunLog.update({
      where: { id: runLog.id },
      data: {
        status: result.status === 'success' ? 'success' : result.status,
        finishedAt: new Date(),
        error: result.reason,
        details: { reason: result.reason }
      }
    });
    await prisma.automationConfig.update({
      where: { id: config.id },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: result.status,
        nextRunAt: new Date(Date.now() + config.scanIntervalMinutes * 60000)
      }
    });
    return result;
  } catch (error) {
    await prisma.automationRunLog.update({
      where: { id: runLog.id },
      data: { status: 'failed', finishedAt: new Date(), error: String(error) }
    });
    await notify(
      config.userId,
      config.telegramChatId,
      'error',
      'Automation run failed',
      String(error).slice(0, 500)
    );
    log('error', `Cycle failed for config ${config.id}`, { error: String(error) });
    return { status: 'failed', reason: String(error) };
  } finally {
    await releaseAdvisoryLock(lockKey);
  }
}
