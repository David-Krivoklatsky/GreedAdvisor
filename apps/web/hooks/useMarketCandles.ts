import { TokenManager } from '@/lib/token-manager';
import type { Indicators } from '@greed-advisor/market-data';
import { useCallback, useEffect, useState } from 'react';

interface CandleData {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const INTERVAL_MAP: Record<string, string> = {
  '1min': '1min',
  '5min': '5min',
  '15min': '15min',
  '30min': '30min',
  '1hour': '1h',
  '4hour': '4h',
  '1day': '1day'
};

export const useMarketCandles = () => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [indicators, setIndicators] = useState<Indicators | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('1day');

  const fetchCandles = useCallback(
    async (sym?: string, iv?: string) => {
      setLoading(true);
      setError('');
      try {
        const targetSymbol = sym ?? symbol;
        const targetInterval = iv ?? interval;
        const mapped = INTERVAL_MAP[targetInterval] ?? '1day';
        const response = await TokenManager.makeAuthenticatedRequest(
          `/api/market-data/candles?symbol=${encodeURIComponent(targetSymbol)}&interval=${mapped}`
        );

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || body?.details || 'Failed to load chart data');
        }

        const data = await response.json();
        setCandles(data.candles || []);
        setIndicators(data.indicators ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
      } finally {
        setLoading(false);
      }
    },
    [symbol, interval]
  );

  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  return {
    candles,
    indicators,
    loading,
    error,
    symbol,
    setSymbol,
    interval,
    setInterval,
    refetch: fetchCandles
  };
};
