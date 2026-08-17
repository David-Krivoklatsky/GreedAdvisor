'use client';

import { LightweightChart } from '@/components/charts/lightweight-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketCandles } from '@/hooks/useMarketCandles';
import { useEffect, useState } from 'react';
import { CandlestickChart } from 'lucide-react';

export default function ChartPanel() {
  const { candles, loading, error, symbol, setSymbol, interval, setInterval } = useMarketCandles();
  const [displaySymbol, setDisplaySymbol] = useState(symbol);

  useEffect(() => {
    setDisplaySymbol(symbol);
  }, [symbol]);

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
            symbol={displaySymbol}
            onSymbolChange={sym => {
              setSymbol(sym);
            }}
            interval={interval}
            onIntervalChange={iv => {
              setInterval(iv);
            }}
            loading={loading}
            height={440}
          />
        </div>
      </CardContent>
    </Card>
  );
}
