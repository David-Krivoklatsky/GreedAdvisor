import { describe, expect, it } from '@jest/globals';
import { checkGuardrails } from '@greed-advisor/engine/src/guardrails';
import type { GuardrailContext } from '@greed-advisor/engine/src/guardrails';
import type { AiReport } from '@greed-advisor/ai';
import type { AccountMeta, Position } from '@greed-advisor/trading';
import type { AutomationConfig, DailyStat } from '@greed-advisor/db';

const baseConfig = {
  id: 1,
  userId: 1,
  title: 'test',
  enabled: true,
  mode: 'paper',
  allowLive: false,
  scanIntervalMinutes: 5,
  universe: 'watchlist',
  maxCandidates: 5,
  maxPositions: 10,
  maxRiskPerTradePct: 0.02,
  dailyLossLimitPct: 0.03,
  maxDailyTrades: 5,
  confidenceThreshold: 70,
  respectPdt: true,
  flattenAtClose: false,
  cooldownMinutes: 30,
  orderType: 'MARKET',
  slippageTolerancePct: 0.005,
  extendedHours: false,
  tradingKeyId: 1,
  aiKeyId: 1,
  marketDataKeyId: 1,
  model: null,
  telegramChatId: null,
  nextRunAt: new Date(),
  lastRunAt: null,
  lastRunStatus: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null
} as unknown as AutomationConfig;

const baseAccount: AccountMeta = {
  equity: 10000,
  buyingPower: 8000,
  patternDayTrader: false,
  currency: 'USD'
};

const baseDailyStat = {
  id: 1,
  userId: 1,
  automationConfigId: 1,
  date: new Date(),
  startEquity: 10000,
  realizedPnl: 0,
  unrealizedPnl: 0,
  tradeCount: 0,
  dayTradeCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
} as unknown as DailyStat;

function makeReport(overrides: Partial<AiReport> = {}): AiReport {
  return {
    action: 'BUY',
    productType: 'INVEST',
    recommendation: 'BUY',
    confidence: 85,
    summary: 'test',
    analysis: { technicals: 'test' },
    entryPrice: 100,
    stopLoss: 95,
    takeProfit: 115,
    positionSize: 10,
    riskAmount: 50,
    riskPerUnit: 5,
    priceTargets: { current: 100, stopLoss: 95, takeProfit: 115 },
    generatedAt: new Date().toISOString(),
    provider: 'opencode',
    ...overrides
  };
}

function makeContext(overrides: Partial<GuardrailContext> = {}): GuardrailContext {
  return {
    config: baseConfig,
    account: baseAccount,
    dailyStat: baseDailyStat,
    positions: [],
    report: makeReport(),
    symbol: 'AAPL',
    hasExistingPosition: false,
    recentTrades: 0,
    ...overrides
  };
}

describe('engine guardrails', () => {
  it('allows a valid BUY within all limits', () => {
    const result = checkGuardrails(makeContext());
    expect(result.allowed).toBe(true);
  });

  it('blocks HOLD actions', () => {
    const result = checkGuardrails(makeContext({ report: makeReport({ action: 'HOLD' }) }));
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.reason).toContain('HOLD');
  });

  it('blocks when confidence is below the threshold', () => {
    const result = checkGuardrails(makeContext({ report: makeReport({ confidence: 60 }) }));
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.reason).toContain('Confidence');
  });

  it('blocks when the symbol is in cooldown', () => {
    const result = checkGuardrails(makeContext({ recentTrades: 2 }));
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.reason).toContain('Cooldown');
  });

  it('blocks when the daily loss limit is breached', () => {
    const result = checkGuardrails(
      makeContext({
        dailyStat: {
          ...baseDailyStat,
          realizedPnl: -200,
          unrealizedPnl: -150
        } as unknown as DailyStat
      })
    );
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.reason).toContain('Daily loss');
  });

  it('blocks when max daily trades is reached', () => {
    const result = checkGuardrails(
      makeContext({ dailyStat: { ...baseDailyStat, tradeCount: 5 } as unknown as DailyStat })
    );
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.reason).toContain('daily trades');
  });

  it('blocks day trades under the PDT rule for sub-$25k margin accounts', () => {
    const result = checkGuardrails(
      makeContext({
        account: { ...baseAccount, equity: 20000, patternDayTrader: false },
        dailyStat: { ...baseDailyStat, dayTradeCount: 3 } as unknown as DailyStat
      })
    );
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.reason).toContain('PDT');
  });

  it('allows day trades for PDT-exempt (flagged) accounts', () => {
    const result = checkGuardrails(
      makeContext({
        account: { ...baseAccount, equity: 20000, patternDayTrader: true },
        dailyStat: { ...baseDailyStat, dayTradeCount: 3 } as unknown as DailyStat
      })
    );
    expect(result.allowed).toBe(true);
  });

  it('blocks new positions when the position cap is reached', () => {
    const positions = [
      { quantity: 1, instrument: { ticker: 'MSFT', isin: 'MSFT', name: 'MSFT', currency: 'USD' } }
    ] as unknown as Position[];
    const result = checkGuardrails(
      makeContext({
        config: { ...baseConfig, maxPositions: 1 } as unknown as AutomationConfig,
        positions
      })
    );
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.reason).toContain('Position limit');
  });

  it('blocks SELL without an existing position', () => {
    const result = checkGuardrails(makeContext({ report: makeReport({ action: 'SELL' }) }));
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.reason).toContain('No AAPL position');
  });

  it('allows SELL when a position is held', () => {
    const positions = [
      { quantity: 10, instrument: { ticker: 'AAPL', isin: 'AAPL', name: 'AAPL', currency: 'USD' } }
    ] as unknown as Position[];
    const result = checkGuardrails(
      makeContext({
        report: makeReport({ action: 'SELL' }),
        positions,
        hasExistingPosition: true
      })
    );
    expect(result.allowed).toBe(true);
  });

  it('blocks an AI risk amount more than 3x the configured cap', () => {
    const result = checkGuardrails(makeContext({ report: makeReport({ riskAmount: 700 }) }));
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.reason).toContain('risk');
  });
});
