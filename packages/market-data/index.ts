export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  timestamp: string;
}

export interface MarketCandle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<MarketQuote>;
  getCandles(symbol: string, interval: string, count: number): Promise<MarketCandle[]>;
}

const BASE_URL = 'https://api.twelvedata.com';

export class TwelveDataProvider implements MarketDataProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${this.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TwelveData quote error ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      throw new Error(`TwelveData error: ${data.message}`);
    }

    return {
      symbol: data.symbol,
      name: data.name,
      price: parseFloat(data.close),
      previousClose: parseFloat(data.previous_close),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      currency: data.currency,
      timestamp: data.timestamp,
    };
  }

  async getCandles(symbol: string, interval = '1day', count = 30): Promise<MarketCandle[]> {
    const url = `${BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${count}&apikey=${this.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TwelveData time_series error ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      throw new Error(`TwelveData error: ${data.message}`);
    }

    return (data.values ?? []).map((candle: Record<string, string>) => ({
      datetime: candle.datetime,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseInt(candle.volume, 10),
    }));
  }
}

export class MarketDataService {
  private readonly provider: MarketDataProvider;

  constructor(provider: MarketDataProvider) {
    this.provider = provider;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    return this.provider.getQuote(symbol);
  }

  async getCandles(symbol: string, interval = '1day', count = 30): Promise<MarketCandle[]> {
    return this.provider.getCandles(symbol, interval, count);
  }
}
