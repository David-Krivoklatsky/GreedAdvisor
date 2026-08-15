export enum T212Environment {
  DEMO = 'demo',
  LIVE = 'live',
}

export interface T212Credentials {
  apiKey: string;
  apiSecret: string;
  environment: T212Environment;
}

export interface T212Position {
  ticker: string;
  quantity: number;
  currentPrice: number;
  averagePrice: number;
  ppl: number;
  pplCurrency: string;
  initialValue: number;
  currentValue: number;
  fxPpl: number;
}

export interface T212CashAccount {
  currencyCode: string;
  balance: number;
  cash: number;
  blocked: number;
  investableCash: number;
  ppl: number;
  reserved: number;
  result: number;
  total: number;
}

export interface T212AccountInfo {
  accountId: string;
  accountType: string;
  createdAt: string;
  currencyCode: string;
  paging: {
    totalItems: number;
    nextPageToken: string;
  };
}

export interface T212OrderRequest {
  ticker: string;
  quantity: number;
  orderType: 'MARKET' | 'STOP' | 'LIMIT' | 'STOP_LIMIT';
  timeValidity?: 'GTC' | 'DAY';
  limitPrice?: number;
  stopPrice?: number;
}

export interface T212Order {
  id: number;
  ticker: string;
  quantity: number;
  orderType: string;
  timeValidity: string;
  filledQuantity: number;
  limitPrice: number | null;
  stopPrice: number | null;
  status: string;
  filledPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

const BASE_URLS: Record<T212Environment, string> = {
  [T212Environment.DEMO]: 'https://demo.trading212.com/api/v0',
  [T212Environment.LIVE]: 'https://live.trading212.com/api/v0',
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
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Trading212 API error ${response.status}: ${text}`);
    }

    return (await response.json()) as T;
  }

  async getPositions(): Promise<T212Position[]> {
    return this.request<T212Position[]>('/portfolio');
  }

  async getPosition(ticker: string): Promise<T212Position> {
    return this.request<T212Position>(`/portfolio/${ticker}`);
  }

  async getCashAccount(): Promise<T212CashAccount> {
    return this.request<T212CashAccount>('/account-cash');
  }

  async getAccountInfo(): Promise<T212AccountInfo> {
    return this.request<T212AccountInfo>('/equity/account-info');
  }

  async placeOrder(order: T212OrderRequest): Promise<T212Order> {
    return this.request<T212Order>('/equity/orders', {
      method: 'POST',
      body: order,
    });
  }

  async getOrders(): Promise<T212Order[]> {
    return this.request<T212Order[]>('/equity/orders');
  }
}
