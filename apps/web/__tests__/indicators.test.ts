import { describe, expect, it } from '@jest/globals';

import {
  computeATR,
  computeBollingerBands,
  computeEMA,
  computeIndicators,
  computeMACD,
  computeRSI,
  computeSMA,
  computeVWAP
} from '@greed-advisor/market-data';
import type { MarketCandle } from '@greed-advisor/market-data';

function candle(close: number, i: number, spread = 0, volume = 1000): MarketCandle {
  const datetime = `2026-08-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`;
  return {
    datetime,
    open: close,
    high: close + spread,
    low: close - spread,
    close,
    volume
  };
}

describe('computeSMA', () => {
  it('computes a 2-period SMA', () => {
    expect(computeSMA([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
  });

  it('returns nulls when there is not enough data', () => {
    expect(computeSMA([1, 2], 5)).toEqual([null, null]);
  });
});

describe('computeEMA', () => {
  it('returns nulls during the warm-up period', () => {
    expect(computeEMA([1, 2], 5)).toEqual([null, null]);
  });

  it('computes a 2-period EMA', () => {
    const result = computeEMA([1, 2, 3, 4], 2);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeCloseTo(1.5);
    expect(result[2]).toBeCloseTo(2.5);
    expect(result[3]).toBeCloseTo(3.5);
  });
});

describe('computeRSI', () => {
  it('is 100 for a strictly rising series', () => {
    const values = Array.from({ length: 16 }, (_, i) => i + 1);
    const result = computeRSI(values, 14);
    expect(result[result.length - 1]).toBe(100);
  });

  it('is 0 for a strictly falling series', () => {
    const values = Array.from({ length: 16 }, (_, i) => 16 - i);
    const result = computeRSI(values, 14);
    expect(result[result.length - 1]).toBe(0);
  });

  it('returns nulls when there is not enough data', () => {
    expect(computeRSI([1, 2, 3], 14)).toEqual([null, null, null]);
  });
});

describe('computeMACD', () => {
  it('returns arrays aligned with the input', () => {
    const values = Array.from({ length: 40 }, (_, i) => 100 + i * 2);
    const { macd, signal, histogram } = computeMACD(values);
    expect(macd).toHaveLength(40);
    expect(signal).toHaveLength(40);
    expect(histogram).toHaveLength(40);
  });

  it('produces a positive histogram on an accelerating series', () => {
    const values = Array.from({ length: 60 }, (_, i) => 100 * Math.pow(1.02, i));
    const { histogram } = computeMACD(values);
    const last = histogram[histogram.length - 1];
    expect(last).not.toBeNull();
    expect(last as number).toBeGreaterThan(0);
  });
});

describe('computeBollingerBands', () => {
  it('collapses to the mean for a constant series', () => {
    const values = new Array(25).fill(100);
    const { upper, middle, lower } = computeBollingerBands(values, 20, 2);
    const last = values.length - 1;
    expect(middle[last]).toBe(100);
    expect(upper[last]).toBe(100);
    expect(lower[last]).toBe(100);
  });

  it('keeps the bands symmetric around the middle', () => {
    const values = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
    const { upper, middle, lower } = computeBollingerBands(values, 20, 2);
    const last = values.length - 1;
    const width = (upper[last] as number) - (middle[last] as number);
    expect((middle[last] as number) - (lower[last] as number)).toBeCloseTo(width);
    expect(width).toBeGreaterThan(0);
  });
});

describe('computeATR', () => {
  it('equals the constant true range for a flat series', () => {
    const candles = Array.from({ length: 20 }, (_, i) => candle(100, i, 1));
    const result = computeATR(candles, 14);
    expect(result[13]).toBeCloseTo(2);
    expect(result[result.length - 1]).toBeCloseTo(2);
  });

  it('returns nulls when there is not enough data', () => {
    const candles = Array.from({ length: 3 }, (_, i) => candle(100, i, 1));
    expect(computeATR(candles, 14)).toEqual([null, null, null]);
  });
});

describe('computeVWAP', () => {
  it('equals the constant price for a flat series', () => {
    const candles = Array.from({ length: 10 }, (_, i) => candle(100, i, 0, 500 + i));
    const result = computeVWAP(candles);
    for (const value of result) {
      expect(value).toBeCloseTo(100);
    }
  });

  it('weights higher-volume candles more heavily', () => {
    const candles = [candle(100, 0, 0, 100), candle(110, 1, 0, 900)];
    const result = computeVWAP(candles);
    expect(result[1] as number).toBeCloseTo(109);
  });
});

describe('computeIndicators', () => {
  it('computes a snapshot and aligned series', () => {
    const candles = Array.from({ length: 60 }, (_, i) => candle(100 + i, i, 1));
    const { series, snapshot } = computeIndicators(candles);

    expect(series.ema9).toHaveLength(60);
    expect(series.ema21).toHaveLength(60);
    expect(series.sma200).toHaveLength(60);
    expect(series.rsi).toHaveLength(60);
    expect(series.macd).toHaveLength(60);
    expect(series.vwap).toHaveLength(60);
    expect(series.atr).toHaveLength(60);
    expect(series.bollingerUpper).toHaveLength(60);
    expect(series.bollingerMiddle).toHaveLength(60);
    expect(series.bollingerLower).toHaveLength(60);

    expect(snapshot.ema9).not.toBeNull();
    expect(snapshot.ema21).not.toBeNull();
    expect(snapshot.rsi).not.toBeNull();
    expect(snapshot.macd).not.toBeNull();
    expect(snapshot.macdSignal).not.toBeNull();
    expect(snapshot.macdHistogram).not.toBeNull();
    expect(snapshot.vwap).not.toBeNull();
    expect(snapshot.atr).not.toBeNull();
    expect(snapshot.bollingerUpper).not.toBeNull();
    expect(snapshot.bollingerLower).not.toBeNull();
  });

  it('computes SMA 200 only with enough history', () => {
    const shortSeries = computeIndicators(
      Array.from({ length: 60 }, (_, i) => candle(100 + i, i, 1))
    );
    expect(shortSeries.snapshot.sma200).toBeNull();

    const longSeries = computeIndicators(
      Array.from({ length: 220 }, (_, i) => candle(100 + (i % 50), i, 1))
    );
    expect(longSeries.snapshot.sma200).not.toBeNull();
  });
});
