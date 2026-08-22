'use client';

import {
  DEFAULT_ENABLED_INDICATORS,
  LightweightChart,
  type IndicatorKey
} from '@/components/charts/lightweight-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketCandles } from '@/hooks/useMarketCandles';
import { useEffect, useState } from 'react';
import { CandlestickChart } from 'lucide-react';

export default function ChartPanel() {
  const { candles, indicators, loading, error, symbol, setSymbol, interval, setInterval } =
    useMarketCandles();
  const [displaySymbol, setDisplaySymbol] = useState(symbol);
  const [enabledIndicators, setEnabledIndicators] = useState<Record<IndicatorKey, boolean>>(
    DEFAULT_ENABLED_INDICATORS
  );

  useEffect(() => {
    setDisplaySymbol(symbol);
  }, [symbol]);

  const toggleIndicator = (key: IndicatorKey) => {
    setEnabledIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card className="flex flex-col overflow-hidden border-border">
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
        <div className="h-[440px]">
          <LightweightChart
            candles={candles}
            indicators={indicators}
            symbol={displaySymbol}
            onSymbolChange={sym => {
              setSymbol(sym);
            }}
            interval={interval}
            onIntervalChange={iv => {
              setInterval(iv);
            }}
            enabled={enabledIndicators}
            onToggleIndicator={toggleIndicator}
            loading={loading}
            height={440}
          />
        </div>
      </CardContent>
    </Card>
  );
}
