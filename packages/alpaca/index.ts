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

const BASE_URLS: Record<AlpacaEnvironment, string> = {
  [AlpacaEnvironment.PAPER]: 'https://paper-api.alpaca.markets',
  [AlpacaEnvironment.LIVE]: 'https://api.alpaca.markets'
};

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
    options: { method?: string; body?: unknown } = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
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

  async getClock(): Promise<AlpacaClock> {
    return this.request<AlpacaClock>('/v2/clock');
  }
}
