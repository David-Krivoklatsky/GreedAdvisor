'use client';

import PageLayout from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import { RefreshCw, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Position {
  ticker: string;
  quantity: number;
  currentPrice: number;
  averagePricePaid: number;
  marketValue: number;
  unrealized: number;
}

interface Account {
  keyId: number;
  title: string;
  provider: string;
  environment: string;
  currency: string;
  equity: number;
  buyingPower: number;
  totalValue: number;
  cash: number;
  unrealized: number;
  realized: number;
  error?: string;
  positions: Position[];
}

interface Totals {
  totalValue: number;
  totalCash: number;
  totalUnrealized: number;
  totalRealized: number;
}

export default function PortfolioPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/portfolio');
      if (!response.ok) throw new Error('Failed to load portfolio');
      const data = await response.json();
      setAccounts(data.accounts ?? []);
      setTotals(data.totals ?? null);
    } catch {
      toast('Failed to load portfolio', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const money = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const pnlColor = (value: number) => (value >= 0 ? 'text-green-600' : 'text-red-600');

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Portfolio</h1>
              <p className="text-sm text-muted-foreground">
                Unified view across all broker accounts.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPortfolio}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {totals && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total value', value: money(totals.totalValue), cls: '' },
              { label: 'Cash', value: money(totals.totalCash), cls: '' },
              {
                label: 'Unrealized P&L',
                value: money(totals.totalUnrealized),
                cls: pnlColor(totals.totalUnrealized)
              },
              {
                label: 'Realized P&L',
                value: money(totals.totalRealized),
                cls: pnlColor(totals.totalRealized)
              }
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`mt-1 text-xl font-semibold ${stat.cls}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-muted-foreground">Loading portfolio...</p>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No active trading accounts. Add one in Profile.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map(account => (
              <Card key={account.keyId}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      {account.title}
                      <Badge variant="outline">{account.provider}</Badge>
                      <Badge variant="secondary">{account.environment}</Badge>
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      equity {money(account.equity)} · cash {money(account.cash)} ·{' '}
                      <span className={pnlColor(account.unrealized)}>
                        unrealized {money(account.unrealized)}
                      </span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {account.error ? (
                    <p className="text-sm text-red-600">{account.error}</p>
                  ) : account.positions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No open positions</p>
                  ) : (
                    <div className="space-y-1">
                      {account.positions.map(position => (
                        <div
                          key={position.ticker}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{position.ticker}</span>
                            <span className="text-muted-foreground">
                              {position.quantity} @ {money(position.averagePricePaid)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span>{money(position.marketValue)}</span>
                            <span className={`w-24 text-right ${pnlColor(position.unrealized)}`}>
                              {money(position.unrealized)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
