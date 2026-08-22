'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trading212Logo } from '@/components/brands/trading212-logo';
import { AlpacaLogo } from '@/components/brands/alpaca-logo';
import { AccountSummary, TradingKey } from '@/types/dashboard';
import { ChevronsUpDown, RefreshCw, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatPercent } from '@/lib/format';

interface TerminalHeaderProps {
  tradingKeys: TradingKey[];
  selectedTradingKey: string;
  setSelectedTradingKey: (key: string) => void;
  accountSummary: AccountSummary | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function TerminalHeader({
  tradingKeys,
  selectedTradingKey,
  setSelectedTradingKey,
  accountSummary,
  onRefresh,
  refreshing = false
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
              <span className="flex items-center gap-2">
                {key.provider === 'trading212' && <Trading212Logo size={14} />}
                {key.provider === 'alpaca' && <AlpacaLogo size={14} />}
                <Badge variant={key.environment === 'live' ? 'destructive' : 'secondary'}>
                  {key.environment}
                </Badge>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Refresh account data */}
      {onRefresh && (
        <>
          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onRefresh}
            disabled={refreshing || !selectedTradingKey}
            aria-label="Refresh account data"
            title="Refresh account data"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </>
      )}

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
