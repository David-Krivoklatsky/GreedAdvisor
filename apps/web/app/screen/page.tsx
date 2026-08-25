'use client';

import PageLayout from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenManager } from '@/lib/token-manager';
import { Compass, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Mover {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  change_pct: number;
  volume?: number;
}

export default function ScreenPage() {
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [mostActive, setMostActive] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMovers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await TokenManager.makeAuthenticatedRequest(
        '/api/market-data/movers?top=10'
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || body?.message || 'Failed to load movers');
      }
      const data = await response.json();
      setGainers(data.gainers ?? []);
      setLosers(data.losers ?? []);
      setMostActive(data.mostActive ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovers();
  }, [fetchMovers]);

  const row = (m: Mover) => (
    <div key={m.symbol} className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold">{m.symbol}</span>
        {m.name && <span className="text-xs text-muted-foreground">{m.name}</span>}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span>{m.price.toFixed(2)}</span>
        <span className={m.change_pct >= 0 ? 'text-green-600' : 'text-red-600'}>
          {m.change_pct >= 0 ? '+' : ''}
          {m.change_pct.toFixed(2)}%
        </span>
      </div>
    </div>
  );

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Opportunity Screener</h1>
              <p className="text-sm text-muted-foreground">
                Today&apos;s movers from Alpaca — add interesting symbols to your watchlist, then
                scan.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMovers}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {loading ? (
          <p className="py-16 text-center text-muted-foreground">Loading market movers...</p>
        ) : error ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add an active Alpaca trading key in Profile to enable the screener.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-green-500/10 text-green-600">Top gainers</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {gainers.length > 0 ? (
                  gainers.map(row)
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-red-500/10 text-red-600">Top losers</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {losers.length > 0 ? (
                  losers.map(row)
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">Most active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mostActive.length > 0 ? (
                  mostActive.map(row)
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
