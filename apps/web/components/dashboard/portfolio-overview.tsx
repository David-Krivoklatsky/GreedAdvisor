import { AccountSummary, Position } from '@/types/dashboard';
import { formatCurrency, formatPercent } from '@/lib/format';
import { useMemo } from 'react';

interface PortfolioOverviewProps {
  positions: Position[];
  accountSummary: AccountSummary | null;
  loading: boolean;
  currency?: string;
}

interface SummaryCardProps {
  label: string;
  value: string;
  sublabel?: string;
  tone?: 'default' | 'positive' | 'negative';
}

function SummaryCard({ label, value, sublabel, tone = 'default' }: SummaryCardProps) {
  const valueColor =
    tone === 'positive'
      ? 'text-success'
      : tone === 'negative'
        ? 'text-destructive'
        : 'text-foreground';

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
    </div>
  );
}

export default function PortfolioOverview({
  positions,
  accountSummary,
  loading,
  currency,
}: PortfolioOverviewProps) {
  const accCurrency = accountSummary?.currency ?? currency ?? 'USD';

  const totals = useMemo(() => {
    const invested = positions.reduce((sum, p) => sum + (p.walletImpact?.totalCost ?? 0), 0);
    const currentValue = positions.reduce((sum, p) => sum + (p.walletImpact?.currentValue ?? 0), 0);
    const unrealized = positions.reduce(
      (sum, p) => sum + (p.walletImpact?.unrealizedProfitLoss ?? 0),
      0
    );
    const fx = positions.reduce((sum, p) => sum + (p.walletImpact?.fxImpact ?? 0), 0);
    return { invested, currentValue, unrealized, fx };
  }, [positions]);

  const unrealizedPct = totals.invested !== 0 ? totals.unrealized / totals.invested : 0;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Account Value"
          value={formatCurrency(accountSummary?.totalValue ?? totals.currentValue, accCurrency)}
          sublabel={accountSummary ? `Account #${accountSummary.id}` : undefined}
        />
        <SummaryCard
          label="Cash Available"
          value={formatCurrency(accountSummary?.cash.availableToTrade ?? 0, accCurrency)}
          sublabel={
            accountSummary?.cash.reservedForOrders
              ? `${formatCurrency(accountSummary.cash.reservedForOrders, accCurrency)} reserved for orders`
              : 'Ready to invest'
          }
        />
        <SummaryCard
          label="Investments"
          value={formatCurrency(
            accountSummary?.investments.currentValue ?? totals.currentValue,
            accCurrency
          )}
          sublabel={`Cost basis ${formatCurrency(accountSummary?.investments.totalCost ?? totals.invested, accCurrency)}`}
        />
        <SummaryCard
          label="Unrealized PnL"
          value={formatCurrency(
            accountSummary?.investments.unrealizedProfitLoss ?? totals.unrealized,
            accCurrency
          )}
          sublabel={`${formatPercent(unrealizedPct)} on invested capital`}
          tone={
            (accountSummary?.investments.unrealizedProfitLoss ?? totals.unrealized) >= 0
              ? 'positive'
              : 'negative'
          }
        />
      </div>

      {/* Portfolio Breakdown */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Portfolio Breakdown</h3>
            <p className="text-sm text-muted-foreground">
              {positions.length} open position{positions.length === 1 ? '' : 's'} across your
              account
            </p>
          </div>
          {accountSummary?.investments.realizedProfitLoss != null && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Realized PnL (all-time)</p>
              <p
                className={`font-semibold ${
                  accountSummary.investments.realizedProfitLoss >= 0
                    ? 'text-success'
                    : 'text-destructive'
                }`}
              >
                {formatCurrency(accountSummary.investments.realizedProfitLoss, accCurrency)}
              </p>
            </div>
          )}
        </div>

        {positions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-muted-foreground">No open positions found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Connect a Trading212 key with a portfolio to see your holdings here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                  <th className="text-left px-6 py-3 font-medium">Symbol</th>
                  <th className="text-left px-6 py-3 font-medium">Company</th>
                  <th className="text-right px-6 py-3 font-medium">Qty</th>
                  <th className="text-right px-6 py-3 font-medium">Avg Price</th>
                  <th className="text-right px-6 py-3 font-medium">Current</th>
                  <th className="text-right px-6 py-3 font-medium">Value</th>
                  <th className="text-right px-6 py-3 font-medium">PnL</th>
                  <th className="text-right px-6 py-3 font-medium">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(position => {
                  const pnl = position.walletImpact?.unrealizedProfitLoss ?? 0;
                  const value = position.walletImpact?.currentValue ?? 0;
                  const cost = position.walletImpact?.totalCost ?? 0;
                  const pnlPct = cost !== 0 ? pnl / cost : 0;
                  const allocation = totals.currentValue !== 0 ? value / totals.currentValue : 0;
                  const posCurrency = position.walletImpact?.currency ?? accCurrency;
                  const tickerShort = position.instrument?.ticker
                    ?.replace(/_US_EQ$/, '')
                    ?.replace(/_.+/, '');

                  return (
                    <tr
                      key={position.instrument?.ticker}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {tickerShort?.slice(0, 3) ?? '??'}
                          </div>
                          <span className="font-semibold text-foreground">{tickerShort}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {position.instrument?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-foreground">{position.quantity}</td>
                      <td className="px-6 py-4 text-right text-foreground">
                        {formatCurrency(
                          position.averagePricePaid,
                          position.instrument?.currency ?? posCurrency
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-foreground">
                        {formatCurrency(
                          position.currentPrice,
                          position.instrument?.currency ?? posCurrency
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        {formatCurrency(value, posCurrency)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={pnl >= 0 ? 'text-success' : 'text-destructive'}>
                          <div className="font-medium">{formatCurrency(pnl, posCurrency)}</div>
                          <div className="text-xs">{formatPercent(pnlPct)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-muted-foreground">
                            {(allocation * 100).toFixed(1)}%
                          </span>
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.min(100, allocation * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
