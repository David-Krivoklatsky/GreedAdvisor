export enum T212Environment {
  DEMO = 'demo',
  LIVE = 'live'
}

export interface T212Credentials {
  apiKey: string;
  apiSecret: string;
  environment: T212Environment;
}

export interface T212Instrument {
  ticker: string;
  isin: string;
  name: string;
  currency: string;
}

export interface T212Position {
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

export interface T212CashBreakdown {
  availableToTrade: number;
  inPies: number;
  reservedForOrders: number;
}

export interface T212InvestmentsSummary {
  currentValue: number;
  realizedProfitLoss: number;
  totalCost: number;
  unrealizedProfitLoss: number;
}

export interface T212AccountSummary {
  id: number;
  currency: string;
  totalValue: number;
  cash: T212CashBreakdown;
  investments: T212InvestmentsSummary;
}

export interface T212TradableInstrument {
  addedOn: string;
  currencyCode: string;
  extendedHours: boolean;
  isin: string;
  maxOpenQuantity: number;
  name: string;
  shortName: string;
  ticker: string;
  type:
    | 'CRYPTOCURRENCY'
    | 'ETF'
    | 'FOREX'
    | 'FUTURES'
    | 'INDEX'
    | 'STOCK'
    | 'WARRANT'
    | 'CRYPTO'
    | 'CVR'
    | 'CORPACT';
  workingScheduleId: number;
}

export interface T212OrderRequest {
  ticker: string;
  quantity: number;
  orderType: 'MARKET' | 'STOP' | 'LIMIT' | 'STOP_LIMIT';
  timeValidity?: 'DAY' | 'GOOD_TILL_CANCEL';
  limitPrice?: number;
  stopPrice?: number;
  extendedHours?: boolean;
}

export interface T212Order {
  id: number;
  ticker: string;
  quantity: number;
  side: 'BUY' | 'SELL';
  status: string;
  type: 'LIMIT' | 'STOP' | 'MARKET' | 'STOP_LIMIT';
  strategy: 'QUANTITY' | 'VALUE';
  currency: string;
  extendedHours: boolean;
  filledQuantity: number;
  filledValue: number;
  limitPrice: number | null;
  stopPrice: number | null;
  value: number;
  timeInForce: 'DAY' | 'GOOD_TILL_CANCEL';
  instrument: T212Instrument;
  initiatedFrom: string;
  createdAt: string;
}

const BASE_URLS: Record<T212Environment, string> = {
  [T212Environment.DEMO]: 'https://demo.trading212.com/api/v0',
  [T212Environment.LIVE]: 'https://live.trading212.com/api/v0'
};

export class Trading212Client {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;

  constructor(credentials: T212Credentials) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.baseUrl = BASE_URLS[credentials.environment];
  }

  private authHeader(): string {
    return `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
  }

  private async request<T>(
    path: string,
    options: { method?: string; body?: unknown } = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json'
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Trading212 API error ${response.status}: ${text}`);
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  async getAccountSummary(): Promise<T212AccountSummary> {
    return this.request<T212AccountSummary>('/equity/account/summary');
  }

  async getPositions(ticker?: string): Promise<T212Position[]> {
    const query = ticker ? `?ticker=${encodeURIComponent(ticker)}` : '';
    return this.request<T212Position[]>(`/equity/positions${query}`);
  }

  async getPosition(ticker: string): Promise<T212Position> {
    const positions = await this.getPositions(ticker);
    return positions[0];
  }

  async getInstruments(): Promise<T212TradableInstrument[]> {
    return this.request<T212TradableInstrument[]>('/equity/metadata/instruments');
  }

  async getPendingOrders(): Promise<T212Order[]> {
    return this.request<T212Order[]>('/equity/orders');
  }

  async placeOrder(order: T212OrderRequest): Promise<T212Order> {
    const baseBody = {
      ticker: order.ticker,
      quantity: order.quantity
    };

    switch (order.orderType) {
      case 'MARKET':
        return this.request<T212Order>('/equity/orders/market', {
          method: 'POST',
          body: { ...baseBody, extendedHours: order.extendedHours ?? false }
        });
      case 'LIMIT':
        return this.request<T212Order>('/equity/orders/limit', {
          method: 'POST',
          body: {
            ...baseBody,
            limitPrice: order.limitPrice,
            timeValidity: order.timeValidity ?? 'DAY'
          }
        });
      case 'STOP':
        return this.request<T212Order>('/equity/orders/stop', {
          method: 'POST',
          body: {
            ...baseBody,
            stopPrice: order.stopPrice,
            timeValidity: order.timeValidity ?? 'DAY'
          }
        });
      case 'STOP_LIMIT':
        return this.request<T212Order>('/equity/orders/stop_limit', {
          method: 'POST',
          body: {
            ...baseBody,
            stopPrice: order.stopPrice,
            limitPrice: order.limitPrice,
            timeValidity: order.timeValidity ?? 'DAY'
          }
        });
      default:
        throw new Error(`Unsupported order type: ${order.orderType}`);
    }
  }

  async cancelOrder(id: number): Promise<void> {
    await this.request<void>(`/equity/orders/${id}`, { method: 'DELETE' });
  }
}
