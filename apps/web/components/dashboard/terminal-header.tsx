'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AccountSummary, TradingKey } from '@/types/dashboard';
import { ChevronsUpDown, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TerminalHeaderProps {
  tradingKeys: TradingKey[];
  selectedTradingKey: string;
  setSelectedTradingKey: (key: string) => void;
  accountSummary: AccountSummary | null;
}

function formatCurrency(value: number | undefined, currency: string): string {
  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return fmt.format(value ?? 0);
}

function formatPercent(value: number | undefined): string {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
}

export default function TerminalHeader({
  tradingKeys,
  selectedTradingKey,
  setSelectedTradingKey,
  accountSummary,
}: TerminalHeaderProps) {
  const currency = accountSummary?.currency ?? 'USD';
  const unrealized = accountSummary?.investments.unrealizedProfitLoss;
  const realized = accountSummary?.investments.realizedProfitLoss;
  const totalPnl = (unrealized ?? 0) + (realized ?? 0);
  const invested = accountSummary?.investments.totalCost ?? 0;
  const pnlPct = invested !== 0 ? totalPnl / invested : undefined;

  const pnlClass = totalPnl >= 0 ? 'text-success' : 'text-destructive';
  const pnlBg =
    totalPnl >= 0 ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20';

  const selectedKey = tradingKeys.find(k => k.id.toString() === selectedTradingKey);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border bg-card px-4 py-3">
      {/* Account selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 gap-2">
            <Wallet className="h-4 w-4" />
            {selectedKey?.title || 'Select account'}
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Trading accounts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {tradingKeys.length === 0 && (
            <DropdownMenuItem disabled>No active accounts — add one in Profile</DropdownMenuItem>
          )}
          {tradingKeys.map(key => (
            <DropdownMenuItem
              key={key.id}
              onClick={() => setSelectedTradingKey(key.id.toString())}
              className="flex items-center justify-between"
            >
              <span>{key.title || key.accessType}</span>
              <Badge variant={key.environment === 'live' ? 'destructive' : 'secondary'}>
                {key.environment}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-8 hidden sm:block" />

      {/* Total value */}
      <div className="min-w-[110px]">
        <p className="text-xs text-muted-foreground">Total value</p>
        <p className="text-lg font-bold tabular-nums">
          {formatCurrency(accountSummary?.totalValue, currency)}
        </p>
      </div>

      {/* Cash */}
      <div className="min-w-[100px]">
        <p className="text-xs text-muted-foreground">Cash available</p>
        <p className="text-lg font-semibold tabular-nums">
          {formatCurrency(accountSummary?.cash.availableToTrade, currency)}
        </p>
      </div>

      {/* PnL badge */}
      <div className={`flex items-center gap-3 rounded-lg border px-3 py-1.5 ${pnlBg}`}>
        <div>
          <p className="text-xs text-muted-foreground">Total PnL</p>
          <p className={`text-base font-bold tabular-nums ${pnlClass}`}>
            {formatCurrency(totalPnl, currency)}{' '}
            <span className="text-xs font-medium">({formatPercent(pnlPct)})</span>
          </p>
        </div>
      </div>

      <div className="ml-auto hidden md:flex items-center gap-4 text-right">
        <div>
          <p className="text-xs text-muted-foreground">Realized</p>
          <p
            className={`text-sm font-semibold tabular-nums ${(realized ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}
          >
            {formatCurrency(realized, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Unrealized</p>
          <p
            className={`text-sm font-semibold tabular-nums ${(unrealized ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}
          >
            {formatCurrency(unrealized, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
