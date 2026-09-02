import { prisma } from '@greed-advisor/db';
import type { AutomationConfig, DailyStat } from '@greed-advisor/db';
import { createAiProvider } from '@greed-advisor/ai';
import type { AiProductType, AiProvider, AiReport, AiRiskProfile } from '@greed-advisor/ai';
import {
  AlpacaMarketDataProvider,
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
import {
  approximateEuMarketWindow,
  approximateUsMarketWindow,
  etDateOnly,
  getAlpacaWindow
} from './market-hours';
import { fetchNewsForSymbols } from './news';
import { manageStops, reconcileOrders } from './positions';
import { beginStep, endStep, recordStep } from './steps';
import { lockKeyForConfig, releaseAdvisoryLock, tryAcquireAdvisoryLock } from './lock';

export interface CycleResult {
  status: 'success' | 'partial' | 'failed' | 'skipped';
  reason?: string;
}

const MAX_UNIVERSE = 25;
const MAX_PRE_SCREEN = 15;

function normalizeSymbol(symbol: string, crypto = false): string {
  let s = symbol.replace('/', '').split('_')[0].toUpperCase();
  if (crypto) s = s.replace(/USD$/, '');
  return s;
}

function marketDataSymbol(symbol: string, crypto: boolean): string {
  return crypto ? `${normalizeSymbol(symbol, true)}/USD` : symbol;
}

function createEngineMarketData(
  config: AutomationConfig,
  binding: TradingClientBinding,
  twelveDataKey: string
): MarketDataService {
  if (binding.provider === 'alpaca' && (config.market === 'us' || config.market === 'crypto')) {
    return new MarketDataService(
      new AlpacaMarketDataProvider({
        apiKey: binding.key.apiKey,
        apiSecret: binding.key.apiSecret,
        market: config.market
      })
    );
  }
  return new MarketDataService(new TwelveDataProvider(twelveDataKey));
}

interface StrategyProfile {
  interval: string;
  bars: number;
  reportType: string;
}

// Strategy → analysis timeframe + AI report type.
function strategyProfile(strategy?: string | null): StrategyProfile {
  switch (strategy) {
    case 'scalp':
      return { interval: '5min', bars: 120, reportType: 'scalp' };
    case 'mean_reversion':
      return { interval: '15min', bars: 120, reportType: 'mean reversion' };
    case 'breakout':
      return { interval: '15min', bars: 120, reportType: 'breakout' };
    case 'trend':
      return { interval: '1day', bars: 120, reportType: 'trend following' };
    case 'swing':
      return { interval: '1day', bars: 180, reportType: 'swing' };
    default:
      return { interval: '1h', bars: 120, reportType: 'momentum' };
  }
}

// Broker symbol for an order. Alpaca crypto uses e.g. BTCUSD.
function brokerSymbolForMarket(
  symbol: string,
  config: AutomationConfig,
  binding: TradingClientBinding
): string {
  if (config.market === 'crypto' && binding.provider === 'alpaca') {
    return `${symbol.replace('/', '')}USD`;
  }
  return symbol;
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
  const universe = config.universe ?? 'watchlist';
  const isCrypto = config.market === 'crypto';

  // Universe source: the bot's own symbols, else the user's watchlist, else
  // nothing (pure movers/auto hunting).
  let base: string[];
  if (universe === 'movers') {
    base = [];
  } else if (config.symbols.length > 0) {
    base = config.symbols.map(s => normalizeSymbol(s, isCrypto));
  } else {
    base = (
      await prisma.watchlistItem.findMany({
        where: { userId: config.userId, isActive: true },
        select: { ticker: true }
      })
    ).map(w => normalizeSymbol(w.ticker, isCrypto));
  }

  let symbols = [...new Set(base)];

  // Opportunity hunting: add movers / most-active (crypto for crypto bots).
  if ((universe === 'movers' || universe === 'watchlist+movers') && binding.provider === 'alpaca') {
    try {
      const client = new AlpacaClient({
        apiKey: binding.key.apiKey,
        apiSecret: binding.key.apiSecret,
        environment: binding.key.environment as AlpacaEnvironment
      });
      const movers = await client.getMarketMovers(20, isCrypto ? 'crypto' : 'stocks');
      const mostActive = isCrypto ? [] : await client.getMostActive(20);
      const extra = [...movers.map(m => m.symbol), ...mostActive.map(m => m.symbol)]
        .map(s => normalizeSymbol(s, isCrypto))
        .slice(0, 40);
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
  crypto?: boolean;
}): Promise<'acted' | 'signal' | 'ignored' | 'skipped' | 'pending_approval'> {
  const { config, binding, account, dailyStat, canTrade, symbol, report, candles, news, crypto } =
    params;

  const positions = await binding.getPositions();
  const existingPosition = positions.find(
    p => normalizeSymbol(p.instrument.ticker, crypto) === normalizeSymbol(symbol, crypto)
  );
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
    return 'ignored';
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
    return 'signal';
  }

  // Approval mode: persist the plan for the user to approve — do not place yet.
  if (config.execution === 'approval') {
    await prisma.tradeSignal.update({
      where: { id: signal.id },
      data: { status: 'pending_approval' }
    });
    await notify(
      config.userId,
      config.telegramChatId,
      'signal',
      `Approval needed: ${symbol} ${report.action} (${report.confidence}%)`,
      report.summary,
      { signalId: signal.id }
    );
    log('info', `Signal awaiting approval ${symbol} ${report.action}`);
    return 'pending_approval';
  }

  await placeOrderForSignal({
    config,
    binding,
    account,
    dailyStat,
    signal,
    report,
    candles,
    crypto
  });

  return 'acted';
}

// Shared order placement for both auto mode and manual approval of a signal.
async function placeOrderForSignal(params: {
  config: AutomationConfig;
  binding: TradingClientBinding;
  account: AccountMeta;
  dailyStat: DailyStat;
  signal: { id: number; symbol: string };
  report: AiReport;
  candles: {
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  crypto?: boolean;
}): Promise<void> {
  const { config, binding, account, dailyStat, signal, report, candles, crypto } = params;
  const symbol = normalizeSymbol(signal.symbol, crypto);

  const positions = await binding.getPositions();
  const existingPosition = positions.find(
    p => normalizeSymbol(p.instrument.ticker, crypto) === symbol
  );

  // Recompute sizing — never trust the LLM's numbers blindly.
  const risk = deriveRiskParams(report, account.equity, candles, config);
  const brokerTicker = brokerSymbolForMarket(
    await resolveBrokerTicker(binding, symbol),
    config,
    binding
  );

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
      throw new Error(`No ${symbol} position to ${report.action}`);
    }
  } else {
    side = 'BUY';
    quantity = risk.positionSize;
  }

  // Max cash per day guardrail
  let cost = 0;
  if (side === 'BUY') {
    cost = report.entryPrice > 0 ? report.entryPrice * quantity : risk.positionSize * quantity;
    const cap = config.maxDailySpendPct * account.equity;
    if (dailyStat.spentToday + cost > cap) {
      throw new Error(
        `Daily spend cap would be exceeded (${(dailyStat.spentToday + cost).toFixed(0)} > ${cap.toFixed(0)})`
      );
    }
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
      dayTradeCount: side === 'SELL' ? { increment: 1 } : undefined,
      spentToday: side === 'BUY' ? { increment: cost } : undefined
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

async function runCycleLocked(config: AutomationConfig, runLogId: number): Promise<CycleResult> {
  const keysStep = await beginStep(runLogId, 'keys', 'Load broker, AI and market-data keys');
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

  const needsTwelveDataKey =
    !tradingKey ||
    tradingKey.provider !== 'alpaca' ||
    (config.market !== 'us' && config.market !== 'crypto');
  if (!tradingKey || !aiKey || (needsTwelveDataKey && !marketDataKey)) {
    const missing = [
      !tradingKey ? 'trading key' : null,
      !aiKey ? 'AI key' : null,
      needsTwelveDataKey && !marketDataKey ? 'market data key' : null
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
    await endStep(keysStep, 'failed', { missing });
    return { status: 'failed', reason: `Missing ${missing}` };
  }

  await endStep(keysStep, 'ok', {
    tradingKey: tradingKey.provider,
    aiKey: aiKey.provider,
    marketDataKey: marketDataKey?.provider ?? 'alpaca-data'
  });

  const binding = await getActiveTradingClient(config.userId, config.tradingKeyId ?? undefined);
  if (!binding) {
    await recordStep(runLogId, 'binding', 'Bind trading client', 'failed', {
      reason: 'No active trading client'
    });
    return { status: 'failed', reason: 'No active trading client' };
  }

  // Mode gating — advisory never trades; live requires the explicit flag.
  const modeStep = await beginStep(runLogId, 'mode', 'Trading mode gate');
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
  await endStep(modeStep, 'ok', {
    mode,
    provider: binding.provider,
    environment,
    canTrade,
    allowLive: config.allowLive
  });

  const accountStep = await beginStep(runLogId, 'account', 'Load account and daily stats');
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
  await endStep(accountStep, 'ok', {
    equity: account.equity,
    buyingPower: account.buyingPower,
    patternDayTrader: account.patternDayTrader,
    unrealized,
    tradeCount: dailyStat.tradeCount,
    dayTradeCount: dailyStat.dayTradeCount,
    spentToday: dailyStat.spentToday
  });

  // Kill-switch: if the automation is losing money beyond the daily loss
  // limit, disable it entirely (not just block the next trade).
  const dayLoss = dailyStat.realizedPnl + dailyStat.unrealizedPnl;
  if (
    config.stopOnLoss &&
    dailyStat.startEquity > 0 &&
    dayLoss <= -config.dailyLossLimitPct * dailyStat.startEquity
  ) {
    await prisma.automationConfig.update({
      where: { id: config.id },
      data: { enabled: false, lastRunStatus: 'stopped' }
    });
    await notify(
      config.userId,
      config.telegramChatId,
      'daily_loss',
      `Automation "${config.title}" stopped — daily loss limit reached`,
      `Loss ${((dayLoss / dailyStat.startEquity) * 100).toFixed(1)}% vs limit ${(config.dailyLossLimitPct * 100).toFixed(1)}%`
    );
    log('info', `Automation ${config.id} stopped on daily loss`, { dayLoss });
    return { status: 'skipped', reason: 'daily loss limit reached — stopped' };
  }

  const marketData = createEngineMarketData(
    config,
    binding,
    marketDataKey ? decryptSecret(marketDataKey.apiKey) : ''
  );

  // Market-hours gate — the bot only runs while ITS market is open. Crypto is
  // 24/7; EU uses approximate CET hours; US uses the Alpaca clock when available.
  const hoursStep = await beginStep(
    runLogId,
    'market_hours',
    `Check market hours (${config.market ?? 'us'})`
  );
  let marketOpen = true;
  let closingSoon = false;
  let nextClose: string | undefined;

  if (config.market === 'crypto') {
    marketOpen = true;
  } else if (config.market === 'eu') {
    marketOpen = approximateEuMarketWindow().open || config.extendedHours;
  } else if (binding.provider === 'alpaca') {
    const window = await getAlpacaWindow(binding.key);
    if (window) {
      marketOpen = window.open || config.extendedHours;
      nextClose = window.nextClose;
      if (window.nextClose) {
        const closeTime = new Date(window.nextClose).getTime();
        closingSoon = Date.now() >= closeTime - 15 * 60000;
      }
    }
  } else {
    marketOpen = approximateUsMarketWindow().open || config.extendedHours;
  }

  if (!marketOpen) {
    await endStep(hoursStep, 'skipped', { open: false, nextClose, market: config.market ?? 'us' });
    return { status: 'skipped', reason: `${config.market ?? 'us'} market closed` };
  }
  await endStep(hoursStep, 'ok', {
    open: true,
    closingSoon,
    nextClose,
    market: config.market ?? 'us'
  });

  if (config.flattenAtClose && closingSoon) {
    const flattenStep = await beginStep(runLogId, 'flatten', 'Flatten positions before close');
    await flattenAtClose(config, binding);
    await endStep(flattenStep, 'ok');
  }

  // Position management: reconcile fills and trail stops (Alpaca).
  if (canTrade) {
    const reconcileStep = await beginStep(runLogId, 'reconcile', 'Reconcile orders with broker');
    try {
      await reconcileOrders(config, binding);
      await endStep(reconcileStep, 'ok');
    } catch (error) {
      await endStep(reconcileStep, 'warn', { error: String(error) });
    }
    const manageStopsStep = await beginStep(
      runLogId,
      'manage_stops',
      'Trail stops (breakeven / 1x ATR)'
    );
    try {
      await manageStops(config, binding, marketData);
      await endStep(manageStopsStep, 'ok');
    } catch (error) {
      await endStep(manageStopsStep, 'warn', { error: String(error) });
    }
    dailyStat = await refreshDailyPnl(config, dailyStat);
  }

  // Universe → pre-screen → top-K analysis
  const universeStep = await beginStep(runLogId, 'universe', `Build universe (${config.universe})`);
  const universe = await buildUniverse(config, binding);
  if (universe.length === 0) {
    await endStep(universeStep, 'warn', { count: 0 });
    return { status: 'skipped', reason: 'empty universe' };
  }
  await endStep(universeStep, 'ok', { count: universe.length });

  const aiProvider = createAiProvider(
    aiKey.provider as AiProvider,
    decryptSecret(aiKey.apiKey),
    config.model ?? undefined
  );
  const productType = 'INVEST' as AiProductType;
  const riskProfile = (user?.riskProfile ?? 'balanced') as AiRiskProfile;
  const cryptoMarket = config.market === 'crypto';

  const preScreenStep = await beginStep(
    runLogId,
    'pre_screen',
    `Pre-screen ${Math.min(universe.length, MAX_PRE_SCREEN)} symbols`
  );
  const preScreenPool = universe.slice(0, MAX_PRE_SCREEN);
  const scored: CandidateScore[] = [];
  for (const symbol of preScreenPool) {
    const score = await preScreenSymbol(marketData, symbol, marketDataSymbol(symbol, cryptoMarket));
    if (score) scored.push(score);
  }
  const candidates = rankCandidates(scored, universe, config.maxCandidates);
  await endStep(preScreenStep, 'ok', {
    candidates,
    scored: scored.map(s => ({ symbol: s.symbol, score: s.score }))
  });

  const newsStep = await beginStep(runLogId, 'news', `Fetch news for ${candidates.length} symbols`);
  const newsMap = await fetchNewsForSymbols(binding.key, candidates, 5);
  await endStep(newsStep, 'ok', { symbols: candidates.length });

  let analyzed = 0;
  let acted = 0;
  const profile = strategyProfile(config.strategy);
  for (const symbol of candidates) {
    const symbolStep = await beginStep(runLogId, `analyze:${symbol}`, `AI analysis ${symbol}`);
    try {
      const dataSymbol = marketDataSymbol(symbol, cryptoMarket);
      const quote = await marketData.getQuote(dataSymbol);
      const candles = await marketData.getCandles(dataSymbol, profile.interval, profile.bars);
      const indicators = computeIndicators(candles);
      const earnings = await marketData.getEarnings(dataSymbol);
      const report = await aiProvider.generateReport({
        symbol,
        companyName: quote.name,
        quote,
        candles: candles.slice(-60),
        indicators: indicators.snapshot,
        reportType: profile.reportType,
        productType,
        riskProfile,
        accountValue: account.equity,
        news: newsMap[symbol],
        earnings: earnings ?? undefined
      });
      analyzed++;

      const beforeCount = await prisma.tradeRecord.count({
        where: { userId: config.userId, automationConfigId: config.id }
      });
      const outcome = await handleSignal({
        config,
        binding,
        account,
        dailyStat,
        canTrade,
        symbol,
        report,
        candles,
        news: newsMap[symbol] ?? [],
        crypto: cryptoMarket
      });
      const afterCount = await prisma.tradeRecord.count({
        where: { userId: config.userId, automationConfigId: config.id }
      });
      if (afterCount > beforeCount) acted++;

      await endStep(
        symbolStep,
        outcome === 'acted'
          ? 'ok'
          : outcome === 'signal' || outcome === 'pending_approval'
            ? 'warn'
            : 'skipped',
        {
          action: report.action,
          confidence: report.confidence,
          outcome,
          price: quote.price,
          entry: report.entryPrice,
          stopLoss: report.stopLoss,
          takeProfit: report.takeProfit,
          earningsDate: earnings?.date,
          newsCount: newsMap[symbol]?.length ?? 0
        }
      );
    } catch (error) {
      await endStep(symbolStep, 'failed', { error: String(error) });
      log('warn', `Analysis failed for ${symbol}`, { error: String(error) });
    }
  }

  return {
    status: analyzed === 0 ? 'failed' : acted > 0 ? 'success' : 'partial',
    reason: `analyzed ${analyzed}/${candidates.length}, acted ${acted}`
  };
}

export async function approveSignal(
  signalId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const signal = await prisma.tradeSignal.findUnique({ where: { id: signalId } });
  if (!signal) return { ok: false, error: 'Signal not found' };
  if (signal.status !== 'pending_approval') {
    return { ok: false, error: `Signal is not awaiting approval (${signal.status})` };
  }
  if (!signal.automationConfigId) {
    return { ok: false, error: 'Signal has no automation config' };
  }

  const config = await prisma.automationConfig.findFirst({
    where: { id: signal.automationConfigId, deletedAt: null }
  });
  if (!config || !config.enabled) {
    return { ok: false, error: 'Automation is disabled — start it before approving' };
  }

  const tradingKey = config.tradingKeyId
    ? await prisma.t212ApiKey.findFirst({
        where: {
          id: config.tradingKeyId,
          userId: signal.userId,
          deletedAt: null,
          isActive: true
        }
      })
    : null;
  if (!tradingKey) return { ok: false, error: 'Trading key missing' };

  const marketDataKey = config.marketDataKeyId
    ? await prisma.marketDataKey.findFirst({
        where: {
          id: config.marketDataKeyId,
          userId: signal.userId,
          deletedAt: null,
          isActive: true
        }
      })
    : null;

  const binding = await getActiveTradingClient(signal.userId, config.tradingKeyId ?? undefined);
  if (!binding) return { ok: false, error: 'No active trading client' };

  // Mode gate
  const environment = binding.environment;
  const mode = config.mode ?? 'advisory';
  let canTrade = false;
  if (mode === 'paper') {
    canTrade = binding.provider === 'alpaca' ? environment === 'paper' : environment === 'demo';
  } else if (mode === 'live') {
    canTrade = config.allowLive === true && environment === 'live';
  }
  if (!canTrade) {
    return { ok: false, error: `Mode ${mode} (${environment}) does not allow trading` };
  }

  const account = await binding.getAccountMeta();
  const dailyStat = await getDailyStat(config, account.equity);

  let candles: {
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[] = [];
  if (marketDataKey || binding.provider === 'alpaca') {
    try {
      const md = createEngineMarketData(
        config,
        binding,
        marketDataKey ? decryptSecret(marketDataKey.apiKey) : ''
      );
      candles = await md.getCandles(signal.symbol, '1day', 90);
    } catch {
      // fall back to empty candles (ATR unavailable)
    }
  }

  const report = signal.report as unknown as AiReport;
  try {
    await placeOrderForSignal({
      config,
      binding,
      account,
      dailyStat,
      signal,
      report,
      candles,
      crypto: config.market === 'crypto'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.tradeSignal.update({
      where: { id: signal.id },
      data: { status: 'ignored' }
    });
    await notify(
      signal.userId,
      config.telegramChatId,
      'error',
      `Order placement failed for ${signal.symbol}`,
      message
    );
    return { ok: false, error: message };
  }

  return { ok: true };
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
    const result = await runCycleLocked(config, runLog.id);
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
