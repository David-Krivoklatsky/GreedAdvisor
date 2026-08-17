'use client';

import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

export interface CandleData {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartToolbarProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  interval: string;
  onIntervalChange: (interval: string) => void;
  loading?: boolean;
}

const INTERVALS = ['5min', '15min', '1hour', '4hour', '1day'] as const;

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
    text: isDark ? '#d1d4dc' : '#1e293b',
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
      close: c.close,
    }))
    .filter(d => {
      if (seen.has(d.time)) return false;
      seen.add(d.time);
      return true;
    })
    .sort((a, b) => a.time - b.time);
}

export function LightweightChart({
  candles,
  symbol,
  onSymbolChange,
  interval,
  onIntervalChange,
  loading = false,
  height = 480,
}: {
  candles: CandleData[];
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  interval: string;
  onIntervalChange: (interval: string) => void;
  loading?: boolean;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { resolvedTheme } = useTheme();
  const [symbolInput, setSymbolInput] = useState(symbol);

  const isDark = resolvedTheme === 'dark';

  // Latest candles so the chart can re-apply data after it is recreated
  // (theme or interval change) without waiting for a data refetch.
  const candlesRef = useRef(candles);
  candlesRef.current = candles;

  // Create/destroy chart
  useEffect(() => {
    if (!containerRef.current) return;

    const colors = themeColors(isDark);
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: interval !== '1day',
        secondsVisible: false,
      },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.up,
      downColor: colors.down,
      borderVisible: false,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Re-apply the current candles so the recreated chart isn't blank.
    const data = buildCandleData(candlesRef.current);
    if (data.length) {
      candleSeries.setData(data);
      chart.timeScale().fitContent();
    }

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [isDark, interval]);

  // Set data
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || !candles.length) return;

    const data = buildCandleData(candles);
    if (!data.length) return;

    series.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  const handleSymbolSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = symbolInput.trim().toUpperCase();
    if (trimmed && trimmed !== symbol) {
      onSymbolChange(trimmed);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <form onSubmit={handleSymbolSubmit} className="flex items-center gap-2">
          <input
            value={symbolInput}
            onChange={e => setSymbolInput(e.target.value)}
            className="h-8 w-28 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Symbol"
          />
          <Button type="submit" variant="outline" size="sm" className="h-8">
            Load
          </Button>
        </form>

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
