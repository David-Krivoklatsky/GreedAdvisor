export enum AlpacaEnvironment {
  PAPER = 'paper',
  LIVE = 'live'
}

export interface AlpacaCredentials {
  apiKey: string;
  apiSecret: string;
  environment: AlpacaEnvironment;
}

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  cash: string;
  portfolio_value: string;
  equity: string;
  last_equity: string;
  buying_power: string;
  multiplier: string;
  pattern_day_trader: boolean;
  daytrading_buying_power: string;
  regt_buying_power: string;
  non_marginable_buying_power: string;
  created_at: string;
  shorting_enabled: boolean;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  asset_class: string;
  exchange: string;
  qty: string;
  avg_entry_price: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaAsset {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
  fractional: boolean;
}

export interface AlpacaOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  type?: 'market' | 'limit' | 'stop' | 'stop_limit';
  limitPrice?: number;
  stopPrice?: number;
  timeInForce?: 'day' | 'gtc' | 'ioc';
  takeProfit?: number;
  stopLoss?: number;
  extendedHours?: boolean;
  clientOrderId?: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  symbol: string;
  asset_class: string;
  qty: string;
  filled_qty: string;
  filled_avg_price: string | null;
  order_class: string;
  side: string;
  type: string;
  status: string;
  limit_price: string | null;
  stop_price: string | null;
  time_in_force: string;
  created_at: string;
  updated_at: string;
  legs: AlpacaOrder[] | null;
}

export interface AlpacaClock {
  timestamp: string;
  is_open: boolean;
  next_open: string;
  next_close: string;
}

export interface AlpacaNewsItem {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  author?: string;
  created_at: string;
  symbols: string[];
}

export interface AlpacaMover {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  change_pct: number;
  volume?: number;
}

export interface AlpacaMostActive {
  symbol: string;
  volume: number;
  trade_count: number;
}

const BASE_URLS: Record<AlpacaEnvironment, string> = {
  [AlpacaEnvironment.PAPER]: 'https://paper-api.alpaca.markets',
  [AlpacaEnvironment.LIVE]: 'https://api.alpaca.markets'
};

const DATA_BASE_URL = 'https://data.alpaca.markets';

export class AlpacaClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;

  constructor(credentials: AlpacaCredentials) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.baseUrl = BASE_URLS[credentials.environment];
  }

  private authHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret
    };
  }

  private async request<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
    useDataApi = false
  ): Promise<T> {
    const baseUrl = useDataApi ? DATA_BASE_URL : this.baseUrl;
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/json'
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Alpaca API error ${response.status}: ${text}`);
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  async getAccount(): Promise<AlpacaAccount> {
    return this.request<AlpacaAccount>('/v2/account');
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    return this.request<AlpacaPosition[]>('/v2/positions');
  }

  async getPosition(symbol: string): Promise<AlpacaPosition | null> {
    try {
      return await this.request<AlpacaPosition>(`/v2/positions/${encodeURIComponent(symbol)}`);
    } catch {
      return null;
    }
  }

  async getAssets(options: { status?: 'active' | 'inactive'; tradable?: boolean } = {}) {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.tradable !== undefined) params.set('tradable', String(options.tradable));
    const query = params.toString();
    return this.request<AlpacaAsset[]>(`/v2/assets${query ? `?${query}` : ''}`);
  }

  async getPendingOrders(): Promise<AlpacaOrder[]> {
    return this.request<AlpacaOrder[]>('/v2/orders?status=open&limit=100');
  }

  async placeOrder(order: AlpacaOrderRequest): Promise<AlpacaOrder> {
    const hasProtectiveLegs = order.stopLoss !== undefined || order.takeProfit !== undefined;

    const body: Record<string, unknown> = {
      symbol: order.symbol,
      side: order.side,
      qty: String(order.qty),
      type: order.type ?? 'market',
      time_in_force: order.timeInForce ?? 'day'
    };

    if (order.type === 'limit' || order.type === 'stop_limit') {
      if (order.limitPrice === undefined) {
        throw new Error('limitPrice is required for limit/stop_limit orders');
      }
      body.limit_price = String(order.limitPrice);
    }
    if (order.type === 'stop' || order.type === 'stop_limit') {
      if (order.stopPrice === undefined) {
        throw new Error('stopPrice is required for stop/stop_limit orders');
      }
      body.stop_price = String(order.stopPrice);
    }

    if (order.clientOrderId !== undefined) {
      body.client_order_id = order.clientOrderId;
    }

    if (hasProtectiveLegs) {
      body.order_class = 'bracket';
      if (order.takeProfit !== undefined) {
        body.take_profit = { limit_price: String(order.takeProfit) };
      }
      if (order.stopLoss !== undefined) {
        body.stop_loss = { stop_price: String(order.stopLoss) };
      }
    }

    if (order.extendedHours !== undefined) {
      body.extended_hours = order.extendedHours;
    }

    return this.request<AlpacaOrder>('/v2/orders', { method: 'POST', body });
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request<void>(`/v2/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE'
    });
  }

  // Replace an open order (e.g. move a stop-loss leg). Only fields provided
  // are updated.
  async replaceOrder(
    orderId: string,
    fields: { limitPrice?: number; stopPrice?: number }
  ): Promise<AlpacaOrder> {
    const body: Record<string, unknown> = {};
    if (fields.limitPrice !== undefined) {
      body.limit_price = String(fields.limitPrice);
    }
    if (fields.stopPrice !== undefined) {
      body.stop_price = String(fields.stopPrice);
    }
    if (Object.keys(body).length === 0) {
      throw new Error('No fields provided to replace order');
    }
    return this.request<AlpacaOrder>(`/v2/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      body
    });
  }

  async getOrder(orderId: string): Promise<AlpacaOrder | null> {
    try {
      return await this.request<AlpacaOrder>(`/v2/orders/${encodeURIComponent(orderId)}`);
    } catch {
      return null;
    }
  }

  async getClock(): Promise<AlpacaClock> {
    return this.request<AlpacaClock>('/v2/clock');
  }

  // Alpaca News API (data host). Returns up to `limit` recent articles for the
  // given symbols, newest first.
  async getNews(symbols: string[], limit = 10): Promise<AlpacaNewsItem[]> {
    const params = new URLSearchParams();
    params.set('symbols', symbols.join(','));
    params.set('limit', String(Math.max(1, Math.min(limit, 50))));
    const data = await this.request<{ news: AlpacaNewsItem[] }>(
      `/v1beta1/news?${params.toString()}`,
      {},
      true
    );
    return data.news ?? [];
  }

  // Top gainers/losers for the trading session (data host). `marketType` is a
  // path segment, not a query parameter. The API returns { gainers, losers }.
  async getMarketMovers(
    top = 10,
    marketType: 'stocks' | 'crypto' = 'stocks'
  ): Promise<AlpacaMover[]> {
    const data = await this.request<{
      gainers?: Array<{ symbol: string; price: number; change: number; percent_change: number }>;
      losers?: Array<{ symbol: string; price: number; change: number; percent_change: number }>;
    }>(`/v1beta1/screener/${marketType}/movers?top=${Math.max(1, Math.min(top, 50))}`, {}, true);
    return [...(data.gainers ?? []), ...(data.losers ?? [])].map(mover => ({
      symbol: mover.symbol,
      price: Number(mover.price) || 0,
      change: Number(mover.change) || 0,
      change_pct: Number(mover.percent_change) || 0
    }));
  }

  // Most actively traded stocks by volume or trade count (data host). The API
  // returns { most_actives }, so normalize it to the shared mover shape.
  async getMostActive(top = 10, by: 'volume' | 'trades' = 'volume'): Promise<AlpacaMover[]> {
    const data = await this.request<{ most_actives?: AlpacaMostActive[] }>(
      `/v1beta1/screener/stocks/most-actives?top=${Math.max(1, Math.min(top, 100))}&by=${by}`,
      {},
      true
    );
    return (data.most_actives ?? []).map(asset => ({
      symbol: asset.symbol,
      price: 0,
      change: 0,
      change_pct: 0,
      volume: Number(asset.volume) || 0
    }));
  }
}
