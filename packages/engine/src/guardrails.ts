import type { AiReport } from '@greed-advisor/ai';
import type { AccountMeta, Position } from '@greed-advisor/trading';
import type { AutomationConfig, DailyStat } from '@greed-advisor/db';

export interface GuardrailContext {
  config: AutomationConfig;
  account: AccountMeta;
  dailyStat: DailyStat | null;
  positions: Position[];
  report: AiReport;
  symbol: string;
  hasExistingPosition: boolean;
  recentTrades: number;
}

export type GuardrailResult = { allowed: true } | { allowed: false; reason: string };

const PDT_MIN_EQUITY = 25000;
const PDT_MAX_DAY_TRADES = 3;

// Hard risk checks evaluated before any order is placed. A single failure
// blocks the trade. These never trust the LLM's numbers blindly.
export function checkGuardrails(ctx: GuardrailContext): GuardrailResult {
  const { config, account, dailyStat, positions, report, symbol } = ctx;

  if (report.action === 'HOLD') {
    return { allowed: false, reason: 'Action is HOLD' };
  }

  if (report.action === 'SELL' || report.action === 'TRIM') {
    if (!ctx.hasExistingPosition) {
      return { allowed: false, reason: `No ${symbol} position to ${report.action}` };
    }
  }

  if ((report.confidence ?? 0) < config.confidenceThreshold) {
    return {
      allowed: false,
      reason: `Confidence ${report.confidence} < threshold ${config.confidenceThreshold}`
    };
  }

  if (ctx.recentTrades > 0) {
    return { allowed: false, reason: `Cooldown active for ${symbol}` };
  }

  // Daily-loss breaker
  if (dailyStat && dailyStat.startEquity > 0) {
    const loss = dailyStat.realizedPnl + dailyStat.unrealizedPnl;
    if (loss <= -config.dailyLossLimitPct * dailyStat.startEquity) {
      return {
        allowed: false,
        reason: `Daily loss limit reached (${((loss / dailyStat.startEquity) * 100).toFixed(1)}%)`
      };
    }
  }

  if (dailyStat && dailyStat.tradeCount >= config.maxDailyTrades) {
    return {
      allowed: false,
      reason: `Max daily trades (${config.maxDailyTrades}) reached`
    };
  }

  // US PDT guardrail (margin accounts under $25k)
  if (
    config.respectPdt &&
    !account.patternDayTrader &&
    account.equity < PDT_MIN_EQUITY &&
    (dailyStat?.dayTradeCount ?? 0) >= PDT_MAX_DAY_TRADES
  ) {
    return { allowed: false, reason: `PDT day-trade limit (${PDT_MAX_DAY_TRADES}) reached` };
  }

  // Position-count cap
  const openPositions = positions.filter(p => p.quantity > 0);
  if (openPositions.length >= config.maxPositions && !ctx.hasExistingPosition) {
    return { allowed: false, reason: `Position limit (${config.maxPositions}) reached` };
  }

  // Sanity-check the AI's risk amount (engine recomputes sizing regardless)
  if (report.riskAmount != null && account.equity > 0) {
    const riskPct = report.riskAmount / account.equity;
    if (riskPct > config.maxRiskPerTradePct * 3) {
      return {
        allowed: false,
        reason: `AI risk ${(riskPct * 100).toFixed(1)}% exceeds cap by 3x`
      };
    }
  }

  return { allowed: true };
}
