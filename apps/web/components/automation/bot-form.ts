// Pure bot-form helpers (no React) so the create/edit dialog maps bot ↔ form
// deterministically and can be unit-tested.

export interface BotKeyOption {
  id: number;
  title: string;
  provider?: string;
  environment?: string;
}

export type BotMode = 'advisory' | 'paper' | 'live';
export type BotExecution = 'auto' | 'approval';
export type BotMarket = 'us' | 'eu' | 'crypto';
export type BotUniverse = 'watchlist' | 'movers' | 'watchlist+movers';
export type BotOrderType = 'MARKET' | 'LIMIT';

export interface EditableBot {
  id: number;
  title: string;
  mode: BotMode;
  execution: BotExecution;
  market: BotMarket;
  strategy: string;
  universe: BotUniverse;
  symbols: string[];
  scanIntervalMinutes: number;
  maxCandidates: number;
  maxPositions: number;
  maxRiskPerTradePct: number;
  maxDailySpendPct: number;
  dailyLossLimitPct: number;
  stopOnLoss: boolean;
  maxDailyTrades: number;
  confidenceThreshold: number;
  cooldownMinutes: number;
  orderType: BotOrderType;
  manageStops: boolean;
  flattenAtClose: boolean;
  tradingKeyId: number | null;
  aiKeyId: number | null;
  marketDataKeyId: number | null;
  model: string | null;
  telegramChatId: string | null;
}

export interface BotFormState {
  title: string;
  mode: BotMode;
  execution: BotExecution;
  market: BotMarket;
  strategy: string;
  symbolsText: string;
  scanIntervalMinutes: number;
  universe: BotUniverse;
  maxCandidates: number;
  maxPositions: number;
  maxRiskPerTradePct: number;
  maxDailySpendPct: number;
  dailyLossLimitPct: number;
  stopOnLoss: boolean;
  maxDailyTrades: number;
  confidenceThreshold: number;
  cooldownMinutes: number;
  orderType: BotOrderType;
  manageStops: boolean;
  flattenAtClose: boolean;
  tradingKeyId: string;
  aiKeyId: string;
  marketDataKeyId: string;
  model: string;
  telegramChatId: string;
}

export const EMPTY_FORM: BotFormState = {
  title: '',
  mode: 'advisory',
  execution: 'approval',
  market: 'us',
  strategy: 'momentum',
  symbolsText: '',
  scanIntervalMinutes: 5,
  universe: 'watchlist',
  maxCandidates: 5,
  maxPositions: 5,
  maxRiskPerTradePct: 2,
  maxDailySpendPct: 20,
  dailyLossLimitPct: 3,
  stopOnLoss: true,
  maxDailyTrades: 5,
  confidenceThreshold: 70,
  cooldownMinutes: 30,
  orderType: 'MARKET',
  manageStops: true,
  flattenAtClose: false,
  tradingKeyId: '',
  aiKeyId: '',
  marketDataKeyId: '',
  model: '',
  telegramChatId: ''
};

export function splitSymbols(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\s,;]+/)
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
    )
  ];
}

// Map an existing bot (edit mode) into form state. Returns EMPTY_FORM for
// create mode (editing === null).
export function toFormState(editing?: EditableBot | null): BotFormState {
  if (!editing) return EMPTY_FORM;

  return {
    title: editing.title,
    mode: editing.mode,
    execution: editing.execution ?? 'approval',
    market: editing.market ?? 'us',
    strategy: editing.strategy ?? 'momentum',
    symbolsText: (editing.symbols ?? []).join(', '),
    scanIntervalMinutes: editing.scanIntervalMinutes,
    universe: editing.universe,
    maxCandidates: editing.maxCandidates,
    maxPositions: editing.maxPositions,
    maxRiskPerTradePct: Math.round(editing.maxRiskPerTradePct * 1000) / 10,
    maxDailySpendPct: Math.round(editing.maxDailySpendPct * 1000) / 10,
    dailyLossLimitPct: Math.round(editing.dailyLossLimitPct * 1000) / 10,
    stopOnLoss: editing.stopOnLoss,
    maxDailyTrades: editing.maxDailyTrades,
    confidenceThreshold: editing.confidenceThreshold,
    cooldownMinutes: editing.cooldownMinutes,
    orderType: editing.orderType,
    manageStops: editing.manageStops,
    flattenAtClose: editing.flattenAtClose,
    tradingKeyId: editing.tradingKeyId ? String(editing.tradingKeyId) : '',
    aiKeyId: editing.aiKeyId ? String(editing.aiKeyId) : '',
    marketDataKeyId: editing.marketDataKeyId ? String(editing.marketDataKeyId) : '',
    model: editing.model ?? '',
    telegramChatId: editing.telegramChatId ?? ''
  };
}
