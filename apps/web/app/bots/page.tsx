'use client';

import PageLayout from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import { BarChart3, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface BotStat {
  configId: number;
  title: string;
  market: string;
  strategy: string;
  mode: string;
  execution: string;
  enabled: boolean;
  lastRunStatus: string | null;
  model: string | null;
  realizedPnl: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  tradesPerDay: number;
  avgPerTrade: number;
  buys: number;
  sells: number;
  returnPct: number;
  bestTrade: number;
  worstTrade: number;
  invested: number;
}

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const pnlColor = (value: number) => (value >= 0 ? 'text-green-600' : 'text-red-600');

export default function BotsStatusPage() {
  const { toast } = useToast();
  const [bots, setBots] = useState<BotStat[]>([]);
  const [totals, setTotals] = useState<{
    realizedPnl: number;
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/bots/stats');
      if (!response.ok) throw new Error('Failed to load bot stats');
      const data = await response.json();
      setBots(data.bots ?? []);
      setTotals(data.totals ?? null);
    } catch {
      toast('Failed to load bot stats', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const ranked = [...bots].sort((a, b) => b.realizedPnl - a.realizedPnl);
  const best = ranked[0];
  const totalReturnPct =
    bots.length > 0
      ? (bots.reduce((s, b) => s + b.realizedPnl, 0) /
          Math.max(
            1,
            bots.reduce((s, b) => s + Math.max(1, b.invested), 0)
          )) *
        100
      : 0;

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trading Bots — Status</h1>
              <p className="text-sm text-muted-foreground">
                Performance and activity of every bot, side by side.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {totals && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: 'Total realized',
                value: money(totals.realizedPnl),
                cls: pnlColor(totals.realizedPnl)
              },
              { label: 'Total trades', value: String(totals.totalTrades), cls: '' },
              { label: 'Open positions', value: String(totals.openTrades), cls: '' },
              {
                label: 'Return on deployed capital',
                value: `${totalReturnPct.toFixed(1)}%`,
                cls: pnlColor(totalReturnPct)
              }
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`mt-1 text-xl font-semibold ${stat.cls}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {best && (
          <Card className="border-primary/40">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold">Best performer: {best.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {best.market} · {best.strategy} · {best.totalTrades} trades ·{' '}
                    {best.winRate.toFixed(0)}% win rate
                  </p>
                </div>
              </div>
              <span className={`text-xl font-bold ${pnlColor(best.realizedPnl)}`}>
                {money(best.realizedPnl)}
              </span>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="py-16 text-center text-muted-foreground">Loading bot stats...</p>
        ) : bots.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No bots yet. Add one from the dashboard to start tracking performance.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bots.map(bot => (
              <Card key={bot.configId}>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{bot.title}</span>
                      <Badge variant="outline">{bot.market}</Badge>
                      <Badge variant="outline">{bot.strategy}</Badge>
                      <Badge
                        variant="secondary"
                        className={bot.enabled ? 'bg-green-500/10 text-green-600' : ''}
                      >
                        {bot.enabled ? 'active' : 'paused'}
                      </Badge>
                      {bot.execution === 'approval' && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                          approval
                        </Badge>
                      )}
                      {bot.lastRunStatus && <Badge variant="outline">{bot.lastRunStatus}</Badge>}
                    </div>
                    <span className={`text-lg font-bold ${pnlColor(bot.realizedPnl)}`}>
                      {money(bot.realizedPnl)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4 lg:grid-cols-8">
                    <Stat label="Trades" value={String(bot.totalTrades)} />
                    <Stat label="Open" value={String(bot.openTrades)} />
                    <Stat label="Win rate" value={`${bot.winRate.toFixed(0)}%`} />
                    <Stat
                      label="Profit factor"
                      value={bot.profitFactor >= 999 ? '∞' : bot.profitFactor.toFixed(2)}
                    />
                    <Stat
                      label="$ / trade"
                      value={money(bot.avgPerTrade)}
                      cls={pnlColor(bot.avgPerTrade)}
                    />
                    <Stat label="Trades / day" value={bot.tradesPerDay.toFixed(1)} />
                    <Stat
                      label="Long / Short"
                      value={`${bot.buys} / ${bot.sells}`}
                      cls={bot.buys >= bot.sells ? 'text-green-600' : 'text-red-600'}
                    />
                    <Stat
                      label="Return"
                      value={`${bot.returnPct.toFixed(1)}%`}
                      cls={pnlColor(bot.returnPct)}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>
                      Best trade <span className="text-green-600">{money(bot.bestTrade)}</span>
                    </span>
                    <span>
                      Worst trade <span className="text-red-600">{money(bot.worstTrade)}</span>
                    </span>
                    {bot.invested > 0 && <span>Deployed {money(bot.invested)}</span>}
                    <span className="flex items-center gap-1">
                      {bot.buys >= bot.sells ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      {bot.buys >= bot.sells ? 'more longs' : 'more shorts'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

function Stat({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-semibold tabular-nums ${cls ?? ''}`}>{value}</p>
    </div>
  );
}
