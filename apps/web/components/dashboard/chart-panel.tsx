'use client';

import {
  DEFAULT_ENABLED_INDICATORS,
  LightweightChart,
  type ChartMarkers,
  type IndicatorKey
} from '@/components/charts/lightweight-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketCandles } from '@/hooks/useMarketCandles';
import { useEffect, useState } from 'react';
import { CandlestickChart } from 'lucide-react';

interface ChartPanelProps {
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
  markers?: ChartMarkers | null;
}

export default function ChartPanel({
  symbol: externalSymbol,
  onSymbolChange: externalOnSymbolChange,
  markers
}: ChartPanelProps) {
  const { candles, indicators, loading, error, symbol, setSymbol, interval, setInterval } =
    useMarketCandles();
  const [displaySymbol, setDisplaySymbol] = useState(symbol);
  const [enabledIndicators, setEnabledIndicators] = useState<Record<IndicatorKey, boolean>>(
    DEFAULT_ENABLED_INDICATORS
  );

  // Follow an externally selected symbol (e.g. from a trading bot card)
  useEffect(() => {
    if (!externalSymbol) return;
    setSymbol(prev => (prev === externalSymbol ? prev : externalSymbol));
  }, [externalSymbol, setSymbol]);

  useEffect(() => {
    setDisplaySymbol(symbol);
  }, [symbol]);

  const toggleIndicator = (key: IndicatorKey) => {
    setEnabledIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSymbolChange = (sym: string) => {
    setSymbol(sym);
    externalOnSymbolChange?.(sym);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border">
      <CardHeader className="border-b border-border py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CandlestickChart className="h-4 w-4 text-primary" />
          Market Chart
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
            {displaySymbol}
          </span>
          {error && <span className="text-xs font-normal text-destructive">· {error}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-[520px]">
          <LightweightChart
            candles={candles}
            indicators={indicators}
            symbol={displaySymbol}
            onSymbolChange={handleSymbolChange}
            interval={interval}
            onIntervalChange={iv => {
              setInterval(iv);
            }}
            markers={markers}
            enabled={enabledIndicators}
            onToggleIndicator={toggleIndicator}
            loading={loading}
            height={520}
          />
        </div>
      </CardContent>
    </Card>
  );
}
