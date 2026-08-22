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
      timestamp: data.timestamp
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
      volume: parseInt(candle.volume, 10)
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

export type IndicatorValue = number | null;

export interface IndicatorSeries {
  ema9: IndicatorValue[];
  ema21: IndicatorValue[];
  sma200: IndicatorValue[];
  rsi: IndicatorValue[];
  macd: IndicatorValue[];
  macdSignal: IndicatorValue[];
  macdHistogram: IndicatorValue[];
  vwap: IndicatorValue[];
  atr: IndicatorValue[];
  bollingerUpper: IndicatorValue[];
  bollingerMiddle: IndicatorValue[];
  bollingerLower: IndicatorValue[];
}

export interface IndicatorSnapshot {
  ema9: number | null;
  ema21: number | null;
  sma200: number | null;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  vwap: number | null;
  atr: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
}

export interface Indicators {
  series: IndicatorSeries;
  snapshot: IndicatorSnapshot;
}

// Simple moving average. Returns an array aligned with the input,
// null during the warm-up period (period - 1 leading values).
export function computeSMA(values: number[], period: number): IndicatorValue[] {
  const out: IndicatorValue[] = new Array(values.length).fill(null);
  if (values.length < period) {
    return out;
  }

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      out[i] = sum / period;
    }
  }
  return out;
}

// Exponential moving average. Returns an array aligned with the input,
// null during the warm-up period (period - 1 leading values).
export function computeEMA(values: number[], period: number): IndicatorValue[] {
  const out: IndicatorValue[] = new Array(values.length).fill(null);
  if (values.length < period) {
    return out;
  }

  let ema = values.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  out[period - 1] = ema;
  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

// Relative Strength Index using Wilder's smoothing.
export function computeRSI(values: number[], period = 14): IndicatorValue[] {
  const out: IndicatorValue[] = new Array(values.length).fill(null);
  if (values.length < period + 1) {
    return out;
  }

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) {
      gain += diff;
    } else {
      loss -= diff;
    }
  }

  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return out;
}

export interface MacdResult {
  macd: IndicatorValue[];
  signal: IndicatorValue[];
  histogram: IndicatorValue[];
}

// Moving Average Convergence Divergence (12/26/9 by default).
export function computeMACD(values: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  const emaFast = computeEMA(values, fast);
  const emaSlow = computeEMA(values, slow);
  const macd: IndicatorValue[] = values.map((_, i) => {
    if (emaFast[i] == null || emaSlow[i] == null) {
      return null;
    }
    return (emaFast[i] as number) - (emaSlow[i] as number);
  });

  const valid = macd.filter((v): v is number => v != null);
  const rawSignal = computeEMA(valid, signalPeriod);
  let index = -1;
  const signal: IndicatorValue[] = macd.map(v => {
    if (v == null) {
      return null;
    }
    index++;
    return rawSignal[index] ?? null;
  });

  const histogram: IndicatorValue[] = macd.map((v, i) => {
    if (v == null || signal[i] == null) {
      return null;
    }
    return v - (signal[i] as number);
  });

  return { macd, signal, histogram };
}

function lastNonNull(values: IndicatorValue[]): number | null {
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] != null) {
      return values[i] as number;
    }
  }
  return null;
}

export interface BollingerBandsResult {
  upper: IndicatorValue[];
  middle: IndicatorValue[];
  lower: IndicatorValue[];
}

// Bollinger Bands: SMA(period) middle line with bands at
// +/- multiplier * population standard deviation of the window.
export function computeBollingerBands(
  values: number[],
  period = 20,
  multiplier = 2
): BollingerBandsResult {
  const middle = computeSMA(values, period);
  const upper: IndicatorValue[] = new Array(values.length).fill(null);
  const lower: IndicatorValue[] = new Array(values.length).fill(null);

  for (let i = period - 1; i < values.length; i++) {
    const mean = middle[i] as number;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      variance += (values[j] - mean) ** 2;
    }
    const sd = Math.sqrt(variance / period);
    upper[i] = mean + multiplier * sd;
    lower[i] = mean - multiplier * sd;
  }

  return { upper, middle, lower };
}

// Average True Range using Wilder's smoothing.
export function computeATR(candles: MarketCandle[], period = 14): IndicatorValue[] {
  const out: IndicatorValue[] = new Array(candles.length).fill(null);
  if (candles.length < period) {
    return out;
  }

  const tr: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prevClose = candles[i - 1].close;
    tr.push(Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose)));
  }

  let atr = tr.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  out[period - 1] = atr;
  for (let i = period; i < candles.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    out[i] = atr;
  }
  return out;
}

// Volume Weighted Average Price, anchored to the start of the window
// (cumulative typical-price * volume / volume).
export function computeVWAP(candles: MarketCandle[]): IndicatorValue[] {
  const out: IndicatorValue[] = new Array(candles.length).fill(null);
  let cumPriceVolume = 0;
  let cumVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumPriceVolume += typicalPrice * c.volume;
    cumVolume += c.volume;
    out[i] = cumVolume > 0 ? cumPriceVolume / cumVolume : null;
  }
  return out;
}

// Compute all supported indicators over a candle series.
// `series` arrays are aligned with `candles` (null during warm-up),
// `snapshot` holds the latest computed value of each indicator.
export function computeIndicators(candles: MarketCandle[]): Indicators {
  const closes = candles.map(c => c.close);

  const ema9 = computeEMA(closes, 9);
  const ema21 = computeEMA(closes, 21);
  const sma200 = computeSMA(closes, 200);
  const rsi = computeRSI(closes, 14);
  const { macd, signal: macdSignal, histogram: macdHistogram } = computeMACD(closes);
  const vwap = computeVWAP(candles);
  const atr = computeATR(candles, 14);
  const { upper, middle, lower } = computeBollingerBands(closes, 20, 2);

  return {
    series: {
      ema9,
      ema21,
      sma200,
      rsi,
      macd,
      macdSignal,
      macdHistogram,
      vwap,
      atr,
      bollingerUpper: upper,
      bollingerMiddle: middle,
      bollingerLower: lower
    },
    snapshot: {
      ema9: lastNonNull(ema9),
      ema21: lastNonNull(ema21),
      sma200: lastNonNull(sma200),
      rsi: lastNonNull(rsi),
      macd: lastNonNull(macd),
      macdSignal: lastNonNull(macdSignal),
      macdHistogram: lastNonNull(macdHistogram),
      vwap: lastNonNull(vwap),
      atr: lastNonNull(atr),
      bollingerUpper: lastNonNull(upper),
      bollingerMiddle: lastNonNull(middle),
      bollingerLower: lastNonNull(lower)
    }
  };
}
