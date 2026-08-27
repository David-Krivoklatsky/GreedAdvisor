'use client';

import PageLayout from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import { History, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface TradingKey {
  id: number;
  title: string;
  provider?: string;
  environment?: string;
}

interface TradeRecord {
  id: number;
  symbol: string;
  side: string;
  quantity: number;
  orderType: string;
  orderId: string;
  status: string;
  entryPrice: number | null;
  exitPrice?: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  filledQuantity: number;
  realizedPnl: number | null;
  reason: string | null;
  createdAt: string;
}

interface PendingOrder {
  id: string;
  ticker: string;
  side: string;
  type: string;
  status: string;
  quantity: number;
  filledQuantity: number;
  limitPrice: number | null;
  stopPrice: number | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  filled: 'bg-green-500/10 text-green-600',
  submitted: 'bg-blue-500/10 text-blue-600',
  accepted: 'bg-blue-500/10 text-blue-600',
  new: 'bg-blue-500/10 text-blue-600',
  partial: 'bg-amber-500/10 text-amber-600',
  cancelled: 'bg-muted text-muted-foreground',
  canceled: 'bg-muted text-muted-foreground',
  rejected: 'bg-red-500/10 text-red-600',
  expired: 'bg-muted text-muted-foreground'
};

const STORAGE_KEY = 'ga.tradesKey';

export default function TradesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [tradingKeys, setTradingKeys] = useState<TradingKey[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTradingKeys = useCallback(async () => {
    const response = await TokenManager.makeAuthenticatedRequest('/api/user/trading-keys');
    if (!response.ok) return;
    const data = await response.json();
    setTradingKeys(data.tradingKeys ?? []);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const preferred =
      stored && data.tradingKeys.some((k: TradingKey) => k.id.toString() === stored)
        ? stored
        : (data.tradingKeys[0]?.id?.toString() ?? '');
    setSelectedKey(preferred);
  }, []);

  const fetchTrades = useCallback(async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/trades');
      if (!response.ok) throw new Error('Failed to load trades');
      const data = await response.json();
      setTrades(data.trades ?? []);
    } catch {
      toast('Failed to load trade history', 'error');
    }
  }, [toast]);

  const fetchPendingOrders = useCallback(async (keyId: string) => {
    if (!keyId) return;
    try {
      const response = await TokenManager.makeAuthenticatedRequest(
        `/api/user/orders?keyId=${keyId}`
      );
      if (!response.ok) {
        setPendingOrders([]);
        return;
      }
      const data = await response.json();
      setPendingOrders(data.orders ?? []);
    } catch {
      setPendingOrders([]);
    }
  }, []);

  useEffect(() => {
    fetchTradingKeys();
  }, [fetchTradingKeys]);

  useEffect(() => {
    Promise.all([fetchTrades(), fetchPendingOrders(selectedKey)]).finally(() => setLoading(false));
  }, [selectedKey, fetchTrades, fetchPendingOrders]);

  const cancelOrder = async (order: PendingOrder) => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest(
        `/api/user/orders/${order.id}?keyId=${selectedKey}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to cancel order');
      }
      toast('Order cancelled', 'success');
      fetchPendingOrders(selectedKey);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to cancel order', 'error');
    }
  };

  const realizedTotal = trades.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0);

  const showOnGraph = (trade: TradeRecord) => {
    const params = new URLSearchParams();
    params.set('symbol', trade.symbol);
    if (trade.entryPrice != null) params.set('entry', String(trade.entryPrice));
    if (trade.exitPrice != null) params.set('close', String(trade.exitPrice));
    if (trade.stopLoss != null) params.set('sl', String(trade.stopLoss));
    if (trade.takeProfit != null) params.set('tp', String(trade.takeProfit));
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trade History</h1>
              <p className="text-sm text-muted-foreground">Every order placed through the app.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {tradingKeys.length > 0 && (
              <Combobox
                options={tradingKeys.map(k => ({
                  value: String(k.id),
                  label: `${k.title} (${k.provider ?? ''} · ${k.environment ?? ''})`
                }))}
                value={selectedKey}
                onValueChange={value => {
                  setSelectedKey(value);
                  window.localStorage.setItem(STORAGE_KEY, value);
                }}
                placeholder="Select account..."
                className="w-56"
              />
            )}
            <Badge
              variant="secondary"
              className={
                realizedTotal >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
              }
            >
              realized P&L: ${realizedTotal.toFixed(2)}
            </Badge>
          </div>
        </div>

        {pendingOrders.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 font-semibold">Pending orders ({pendingOrders.length})</p>
              <div className="space-y-2">
                {pendingOrders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          order.side === 'BUY'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-red-500/10 text-red-600'
                        }
                      >
                        {order.side}
                      </Badge>
                      <span className="font-semibold">{order.ticker}</span>
                      <Badge variant="outline">{order.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        qty {order.quantity}
                        {order.filledQuantity > 0 ? ` (filled ${order.filledQuantity})` : ''}
                      </span>
                      {order.limitPrice != null && (
                        <span className="text-xs text-muted-foreground">@ {order.limitPrice}</span>
                      )}
                      {order.stopPrice != null && (
                        <span className="text-xs text-muted-foreground">
                          stop {order.stopPrice}
                        </span>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => cancelOrder(order)}>
                      <X className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="py-16 text-center text-muted-foreground">Loading trades...</p>
        ) : trades.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">No trades yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trades.map(trade => (
              <Card key={trade.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          trade.side === 'BUY'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-red-500/10 text-red-600'
                        }
                      >
                        {trade.side}
                      </Badge>
                      <span className="font-semibold">{trade.symbol}</span>
                      <Badge variant="outline">{trade.orderType}</Badge>
                      <Badge
                        variant="outline"
                        className={STATUS_STYLES[trade.status] ?? 'bg-muted'}
                      >
                        {trade.status}
                      </Badge>
                      {trade.reason === 'flatten' && <Badge variant="outline">day-close</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(trade.createdAt).toLocaleString()}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => showOnGraph(trade)}>
                      Show on graph
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Qty: {trade.quantity}</span>
                    <span>Entry: {trade.entryPrice ?? '—'}</span>
                    <span>Stop: {trade.stopLoss ?? '—'}</span>
                    <span>Target: {trade.takeProfit ?? '—'}</span>
                    {trade.realizedPnl != null && (
                      <span className={trade.realizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        P&L: ${trade.realizedPnl.toFixed(2)}
                      </span>
                    )}
                    <span className="max-w-[220px] truncate">Order: {trade.orderId}</span>
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
