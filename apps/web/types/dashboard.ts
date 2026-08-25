export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  riskProfile?: 'conservative' | 'balanced' | 'aggressive';
  createdAt: string;
}

export interface TradingKey {
  id: number;
  title: string;
  accessType: string;
  environment: string;
  isActive: boolean;
  provider?: string;
}

export interface AiKey {
  id: number;
  title: string;
  provider: string;
  isActive: boolean;
}

export interface MarketDataKey {
  id: number;
  title: string;
  provider: string;
  isActive: boolean;
}

export type AiAction = 'BUY' | 'SELL' | 'HOLD' | 'ADD' | 'TRIM';
export type AiProductType = 'INVEST' | 'CFD' | 'CRYPTO';
export type AiRiskProfile = 'conservative' | 'balanced' | 'aggressive';

export interface AiTradePlan {
  action: AiAction;
  productType: AiProductType;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  summary: string;
  analysis: {
    fundamentals?: string;
    technicals: string;
    sentiment?: string;
    risks?: string;
  };
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  riskAmount?: number;
  riskPerUnit?: number;
  priceTargets: {
    current: number;
    stopLoss?: number;
    takeProfit?: number;
  };
  generatedAt: string;
  provider: string;
}

export interface WatchlistItem {
  id: number;
  ticker: string;
  name?: string;
  instrumentType: string;
  createdAt: string;
}

export interface WatchlistOpportunity {
  item: WatchlistItem;
  report: AiTradePlan;
  error?: string;
}

export interface WatchlistScanResult {
  opportunities: WatchlistOpportunity[];
  holds: Array<{ item: WatchlistItem; report: AiTradePlan; error?: string }>;
  failed: Array<{ item: WatchlistItem; report: null; error?: string }>;
  scanned: number;
  riskProfile: string;
  accountValue: number;
}

export interface OrderPreview {
  tradingKeyId: number;
  ticker: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
}

// Trading212 official API response shapes
export interface T212Instrument {
  ticker: string;
  isin: string;
  name: string;
  currency: string;
}

export interface Position {
  averagePricePaid: number;
  createdAt: string;
  currentPrice: number;
  instrument: T212Instrument;
  quantity: number;
  quantityAvailableForTrading: number;
  quantityInPies: number;
  walletImpact: {
    currency: string;
    currentValue: number;
    fxImpact: number;
    totalCost: number;
    unrealizedProfitLoss: number;
  };
}

export interface AccountSummary {
  id: number | string;
  currency: string;
  totalValue: number;
  cash: {
    availableToTrade: number;
    inPies: number;
    reservedForOrders: number;
  };
  investments: {
    currentValue: number;
    realizedProfitLoss: number;
    totalCost: number;
    unrealizedProfitLoss: number;
  };
}

export interface PortfolioData {
  positions: Position[];
  accountSummary: AccountSummary | null;
  environment: string;
  loading: boolean;
  error: string;
}

export interface NotificationData {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface AutomationRunStep {
  id: number;
  step: string;
  label: string;
  status: 'running' | 'ok' | 'warn' | 'skipped' | 'failed';
  detail?: Record<string, unknown> | null;
  startedAt: string;
  finishedAt?: string | null;
}

export interface AutomationRunLog {
  id: number;
  status: string;
  startedAt: string;
  finishedAt?: string | null;
  error?: string | null;
  details?: Record<string, unknown> | null;
  steps: AutomationRunStep[];
}

export interface AutomationConfig {
  id: number;
  title: string;
  enabled: boolean;
  mode: 'advisory' | 'paper' | 'live';
  allowLive: boolean;
  universe: string;
  scanIntervalMinutes: number;
  maxCandidates: number;
  maxPositions: number;
  maxRiskPerTradePct: number;
  dailyLossLimitPct: number;
  confidenceThreshold: number;
  manageStops: boolean;
  flattenAtClose: boolean;
  cooldownMinutes: number;
  tradingKeyId: number | null;
  aiKeyId: number | null;
  marketDataKeyId: number | null;
  nextRunAt: string;
  lastRunAt?: string | null;
  lastRunStatus?: string | null;
  latestRun?: AutomationRunLog | null;
}

export interface ComboboxOption {
  value: string;
  label: string;
}
