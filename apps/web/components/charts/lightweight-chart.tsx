'use client';

import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeries,
  LineStyle,
  Time,
  UTCTimestamp
} from 'lightweight-charts';
import type { LineSeriesPartialOptions } from 'lightweight-charts';
import { useCallback, useEffect, useRef } from 'react';

import { SymbolSearchInput } from '@/components/dashboard/symbol-search-input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { SlidersHorizontal } from 'lucide-react';
import type { IndicatorValue, Indicators } from '@greed-advisor/market-data';

export interface CandleData {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type IndicatorCategory = 'Trend' | 'Momentum' | 'Volume' | 'Volatility';

export type IndicatorKey =
  'ema9' | 'ema21' | 'sma200' | 'rsi' | 'macd' | 'vwap' | 'bollinger' | 'atr';

export interface IndicatorMeta {
  label: string;
  category: IndicatorCategory;
  color: string;
  description: string;
}

export const INDICATOR_META: Record<IndicatorKey, IndicatorMeta> = {
  ema9: {
    label: 'EMA 9',
    category: 'Trend',
    color: '#fbbf24',
    description: 'Short-term execution trend'
  },
  ema21: {
    label: 'EMA 21',
    category: 'Trend',
    color: '#f97316',
    description: 'Short-term trend & crossovers'
  },
  sma200: {
    label: 'SMA 200',
    category: 'Trend',
    color: '#60a5fa',
    description: 'Long-term regime filter'
  },
  rsi: {
    label: 'RSI 14',
    category: 'Momentum',
    color: '#22d3ee',
    description: 'Overbought/oversold momentum'
  },
  macd: {
    label: 'MACD 12/26/9',
    category: 'Momentum',
    color: '#34d399',
    description: 'Momentum shifts & crossovers'
  },
  vwap: {
    label: 'VWAP',
    category: 'Volume',
    color: '#ec4899',
    description: 'Volume-weighted average price'
  },
  bollinger: {
    label: 'Bollinger Bands',
    category: 'Volatility',
    color: '#8b5cf6',
    description: 'Volatility bands (20, 2)'
  },
  atr: {
    label: 'ATR 14',
    category: 'Volatility',
    color: '#f87171',
    description: 'Average true range'
  }
};

export const INDICATOR_CATEGORIES: IndicatorCategory[] = [
  'Trend',
  'Momentum',
  'Volume',
  'Volatility'
];

export const DEFAULT_ENABLED_INDICATORS: Record<IndicatorKey, boolean> = {
  ema9: false,
  ema21: true,
  sma200: false,
  rsi: true,
  macd: true,
  vwap: false,
  bollinger: false,
  atr: false
};

const INTERVALS = ['1min', '5min', '15min', '30min', '1hour', '4hour', '1day'] as const;

function toUnix(datetime: string): UTCTimestamp {
  const date = new Date(datetime);
  return (date.getTime() / 1000) as UTCTimestamp;
}

function themeColors(isDark: boolean) {
  return {
    background: isDark ? '#0b0d13' : '#ffffff',
    grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    up: isDark ? '#26a69a' : '#089981',
    down: isDark ? '#ef5350' : '#f23645',
    text: isDark ? '#d1d4dc' : '#1e293b'
  };
}

function buildCandleData(candles: CandleData[]): CandlestickData[] {
  const seen = new Set<number>();
  return candles
    .map(c => ({
      time: toUnix(c.datetime),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }))
    .filter(d => {
      if (seen.has(d.time)) return false;
      seen.add(d.time);
      return true;
    })
    .sort((a, b) => a.time - b.time);
}

function buildLineData(candles: CandleData[], values?: (number | null)[]): LineData[] {
  const seen = new Set<Time>();
  return candles
    .map((c, i) => {
      const value = values?.[i];
      if (value == null) return null;
      return { time: toUnix(c.datetime), value } as LineData;
    })
    .filter((d): d is LineData => {
      if (!d) return false;
      if (seen.has(d.time)) return false;
      seen.add(d.time);
      return true;
    })
    .sort((a, b) => (a.time as number) - (b.time as number));
}

function format(value: number | null | undefined, digits = 2): string {
  return value == null ? '–' : value.toFixed(digits);
}

type OverlaySeriesKey = 'ema9' | 'ema21' | 'sma200' | 'vwap' | 'bbUpper' | 'bbMiddle' | 'bbLower';

const EMPTY_OVERLAYS: Record<OverlaySeriesKey, ISeriesApi<'Line'> | null> = {
  ema9: null,
  ema21: null,
  sma200: null,
  vwap: null,
  bbUpper: null,
  bbMiddle: null,
  bbLower: null
};

export function LightweightChart({
  candles,
  indicators,
  symbol,
  onSymbolChange,
  interval,
  onIntervalChange,
  loading = false,
  height = 480,
  enabled = DEFAULT_ENABLED_INDICATORS,
  onToggleIndicator
}: {
  candles: CandleData[];
  indicators?: Indicators | null;
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  interval: string;
  onIntervalChange: (interval: string) => void;
  loading?: boolean;
  height?: number;
  enabled?: Record<IndicatorKey, boolean>;
  onToggleIndicator?: (key: IndicatorKey) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<Record<OverlaySeriesKey, ISeriesApi<'Line'> | null>>(EMPTY_OVERLAYS);
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  // Latest values so series can be re-applied after the chart is recreated
  // (theme or interval change) without waiting for a refetch.
  const candlesRef = useRef(candles);
  candlesRef.current = candles;
  const indicatorsRef = useRef(indicators);
  indicatorsRef.current = indicators;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const applyAllData = useCallback(() => {
    const chart = chartRef.current;
    const candleData = buildCandleData(candlesRef.current);
    if (candleData.length) {
      candleSeriesRef.current?.setData(candleData);
      chart?.timeScale().fitContent();
    }

    const series = indicatorsRef.current?.series;
    const en = enabledRef.current;
    const overlays = lineSeriesRef.current;
    const plan: [ISeriesApi<'Line'> | null, IndicatorValue[] | undefined, boolean][] = [
      [overlays.ema9, series?.ema9, en.ema9],
      [overlays.ema21, series?.ema21, en.ema21],
      [overlays.sma200, series?.sma200, en.sma200],
      [overlays.vwap, series?.vwap, en.vwap],
      [overlays.bbUpper, series?.bollingerUpper, en.bollinger],
      [overlays.bbMiddle, series?.bollingerMiddle, en.bollinger],
      [overlays.bbLower, series?.bollingerLower, en.bollinger]
    ];

    for (const [line, values, visible] of plan) {
      if (!line) continue;
      line.setData(buildLineData(candlesRef.current, values));
      line.applyOptions({ visible });
    }
  }, []);

  // Create/destroy chart
  useEffect(() => {
    if (!containerRef.current) return;

    const colors = themeColors(isDark);
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
        fontSize: 11
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid }
      },
      crosshair: {
        mode: CrosshairMode.Normal
      },
      rightPriceScale: {
        borderVisible: false
      },
      timeScale: {
        borderVisible: false,
        timeVisible: interval !== '1day',
        secondsVisible: false
      },
      autoSize: true
    });

    const lineOptions = (
      color: string,
      extra?: LineSeriesPartialOptions
    ): LineSeriesPartialOptions => ({
      color,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      ...extra
    });

    const bbUpper = chart.addSeries(
      LineSeries,
      lineOptions(INDICATOR_META.bollinger.color, {
        lineStyle: LineStyle.Dashed,
        lastValueVisible: false
      })
    );
    const bbMiddle = chart.addSeries(
      LineSeries,
      lineOptions(INDICATOR_META.bollinger.color, {
        lineWidth: 1,
        lineStyle: LineStyle.SparseDotted,
        lastValueVisible: false
      })
    );
    const bbLower = chart.addSeries(
      LineSeries,
      lineOptions(INDICATOR_META.bollinger.color, {
        lineStyle: LineStyle.Dashed,
        lastValueVisible: false
      })
    );

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.up,
      downColor: colors.down,
      borderVisible: false,
      wickUpColor: colors.up,
      wickDownColor: colors.down
    });

    const ema9Series = chart.addSeries(LineSeries, lineOptions(INDICATOR_META.ema9.color));
    const ema21Series = chart.addSeries(LineSeries, lineOptions(INDICATOR_META.ema21.color));
    const sma200Series = chart.addSeries(LineSeries, lineOptions(INDICATOR_META.sma200.color));
    const vwapSeries = chart.addSeries(LineSeries, lineOptions(INDICATOR_META.vwap.color));

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    lineSeriesRef.current = {
      ema9: ema9Series,
      ema21: ema21Series,
      sma200: sma200Series,
      vwap: vwapSeries,
      bbUpper,
      bbMiddle,
      bbLower
    };

    applyAllData();

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = EMPTY_OVERLAYS;
    };
  }, [isDark, interval, applyAllData]);

  // Keep series in sync as data/visibility changes
  useEffect(() => {
    applyAllData();
  }, [candles, indicators, enabled, applyAllData]);

  const handleSymbolChange = (sym: string) => {
    if (sym && sym !== symbol) {
      onSymbolChange(sym);
    }
  };

  const snapshot = indicators?.snapshot;
  const rsi = snapshot?.rsi;
  const histogram = snapshot?.macdHistogram;
  const atr = snapshot?.atr;

  const enabledCount = (Object.keys(enabled) as IndicatorKey[]).filter(k => enabled[k]).length;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <SymbolSearchInput value={symbol} onSelect={handleSymbolChange} />

        <div className="mx-1 h-5 w-px bg-border" />

        <div className="flex items-center gap-1">
          {INTERVALS.map(iv => (
            <button
              key={iv}
              type="button"
              onClick={() => onIntervalChange(iv)}
              className={`h-8 rounded-md px-2.5 text-xs font-medium transition-colors ${
                interval === iv
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {iv.replace('min', 'm').replace('hour', 'h')}
            </button>
          ))}
        </div>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Indicator dropdown */}
        {onToggleIndicator && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                  enabledCount > 0
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50'
                }`}
                title="Toggle technical indicators"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Indicators
                {enabledCount > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                    {enabledCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {INDICATOR_CATEGORIES.map((category, idx) => (
                <div key={category}>
                  {idx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {category}
                  </DropdownMenuLabel>
                  {(Object.keys(INDICATOR_META) as IndicatorKey[])
                    .filter(key => INDICATOR_META[key].category === category)
                    .map(key => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={enabled[key]}
                        onSelect={e => {
                          e.preventDefault();
                          onToggleIndicator(key);
                        }}
                      >
                        <span
                          className="mr-1 inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: INDICATOR_META[key].color }}
                        />
                        {INDICATOR_META[key].label}
                        <span className="ml-auto pl-2 text-[10px] text-muted-foreground">
                          {INDICATOR_META[key].description}
                        </span>
                      </DropdownMenuCheckboxItem>
                    ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="ml-auto flex items-center gap-2 text-xs">
          {enabled.rsi && (
            <span className="rounded-md bg-muted px-2 py-1 font-mono" title="RSI (14)">
              RSI <span className="font-semibold">{format(rsi, 1)}</span>
            </span>
          )}
          {enabled.macd && (
            <span className="rounded-md bg-muted px-2 py-1 font-mono" title="MACD histogram">
              MACD{' '}
              <span
                className={`font-semibold ${(histogram ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
              >
                {format(histogram)}
              </span>
            </span>
          )}
          {enabled.atr && (
            <span
              className="rounded-md bg-muted px-2 py-1 font-mono"
              title="Average True Range (14)"
            >
              ATR <span className="font-semibold">{format(atr)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative flex-1 min-h-[300px]" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}

export type { Time };
