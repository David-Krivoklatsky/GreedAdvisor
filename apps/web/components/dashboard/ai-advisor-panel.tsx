'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { TokenManager } from '@/lib/token-manager';
import {
  AiKey,
  AiTradePlan,
  MarketDataKey,
  NotificationData,
  TradingKey,
  WatchlistItem,
  WatchlistScanResult,
} from '@/types/dashboard';
import { useEffect, useState } from 'react';
import { Plus, ScanLine, Trash2, Loader2 } from 'lucide-react';
import TradePlanModal from './trade-plan-modal';
import { InstrumentCombobox } from './instrument-combobox';

interface AiAdvisorPanelProps {
  tradingKeys: TradingKey[];
  aiKeys: AiKey[];
  marketDataKeys: MarketDataKey[];
  selectedTradingKey: string;
  onNotification: (n: NotificationData) => void;
}

const PRODUCT_TYPES = ['INVEST', 'CFD', 'CRYPTO'] as const;
const INSTRUMENT_TYPES = ['STOCK', 'ETF', 'CRYPTO', 'FOREX'] as const;

const FOREX_PATTERN =
  /^(?:XAU|XAG|XPT|XPD|EUR|USD|GBP|JPY|CHF|AUD|CAD|NZD|CNH|HKD|NOK|SEK|SGD|MXN|TRY|ZAR|PLN|CZK|DKK|HUF|RUB|BRL|INR|KRW|TWD|THB|CLP|COP|ILS|SAR|AED|NGN|GHS|KES|PKR|BDT|VND|MYR|IDR|PHP)\s*(?:USD|EUR|GBP|JPY|CHF|AUD|CAD|NZD|CNH|HKD|NOK|SEK|SGD|MXN|TRY|ZAR|PLN|CZK|DKK|HUF|RUB|BRL|INR|KRW|TWD|THB|CLP|COP|ILS|SAR|AED|NGN|GHS|KES|PKR|BDT|VND|MYR|IDR|PHP)$/;
const CRYPTO_TICKERS = new Set([
  'BTC',
  'ETH',
  'USDT',
  'BNB',
  'XRP',
  'SOL',
  'ADA',
  'DOGE',
  'AVAX',
  'LINK',
  'DOT',
  'MATIC',
  'LTC',
  'BCH',
  'UNI',
  'XLM',
  'ATOM',
  'ETC',
  'FIL',
  'APT',
  'NEAR',
  'ARB',
  'OP',
  'SUI',
  'TIA',
  'SEI',
  'INJ',
  'RNDR',
  'HBAR',
  'VET',
  'TRX',
]);

function inferInstrumentType(ticker: string): string {
  const t = ticker.toUpperCase();
  if (FOREX_PATTERN.test(t)) return 'FOREX';
  if (CRYPTO_TICKERS.has(t)) return 'CRYPTO';
  return 'STOCK';
}

function actionBadge(action: string) {
  const colors: Record<string, string> = {
    BUY: 'bg-success/15 text-success',
    ADD: 'bg-success/10 text-success',
    SELL: 'bg-destructive/10 text-destructive',
    TRIM: 'bg-orange-100 text-orange-800',
    HOLD: 'bg-yellow-100 text-yellow-800',
  };
  return colors[action] ?? 'bg-muted text-foreground';
}

export default function AiAdvisorPanel({
  tradingKeys,
  aiKeys,
  marketDataKeys,
  selectedTradingKey,
  onNotification,
}: AiAdvisorPanelProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [newTicker, setNewTicker] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('STOCK');
  const [selectedAiKey, setSelectedAiKey] = useState<string>('');
  const [selectedMarketDataKey, setSelectedMarketDataKey] = useState<string>('');
  const [productType, setProductType] = useState<string>('INVEST');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<WatchlistScanResult | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{
    plan: AiTradePlan;
    symbol: string;
    companyName?: string;
  } | null>(null);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const loadWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.items || []);
      }
    } catch {
      // Failed to load watchlist - handle silently
    } finally {
      setWatchlistLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const addToWatchlist = async () => {
    const ticker = newTicker.trim().toUpperCase();
    if (!ticker) {
      onNotification({ message: 'Enter a ticker symbol', type: 'warning' });
      return;
    }
    const instrumentType = newType || inferInstrumentType(ticker);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          ticker,
          instrumentType,
          ...(newName.trim() ? { name: newName.trim() } : {}),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to add');
      }
      const data = await response.json();
      setWatchlist(prev => (prev.some(i => i.ticker === ticker) ? prev : [...prev, data.item]));
      setNewTicker('');
      setNewName('');
      onNotification({ message: `Added ${ticker} to watchlist`, type: 'success' });
    } catch (err) {
      onNotification({
        message: err instanceof Error ? err.message : 'Failed to add',
        type: 'error',
      });
    }
  };

  const removeFromWatchlist = async (id: number) => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest(`/api/user/watchlist/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove');
      setWatchlist(prev => prev.filter(i => i.id !== id));
      onNotification({ message: 'Removed from watchlist', type: 'success' });
    } catch {
      onNotification({ message: 'Failed to remove item', type: 'error' });
    }
  };

  const scanWatchlist = async () => {
    if (!selectedAiKey || !selectedMarketDataKey) {
      onNotification({ message: 'Select an AI key and a market data key first', type: 'warning' });
      return;
    }
    if (watchlist.length === 0) {
      onNotification({ message: 'Add instruments to your watchlist first', type: 'warning' });
      return;
    }

    setScanning(true);
    setResult(null);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/ai/watchlist-scan', {
        method: 'POST',
        body: JSON.stringify({
          aiKeyId: Number(selectedAiKey),
          marketDataKeyId: Number(selectedMarketDataKey),
          productType,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || body?.details || 'Scan failed');
      }

      const data = await response.json();
      setResult(data);
      onNotification({
        message: `Scan complete — ${data.opportunities?.length ?? 0} opportunities found`,
        type: 'success',
      });
    } catch (err) {
      onNotification({
        message: err instanceof Error ? err.message : 'Scan failed',
        type: 'error',
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="h-full border-0 rounded-none overflow-y-auto">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">AI Advisor</CardTitle>
            <CardDescription>AI proposes trade plans — you make the final call</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Keys */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">AI key</Label>
            <Combobox
              options={aiKeys.map(k => ({ value: k.id.toString(), label: k.title }))}
              value={selectedAiKey}
              onValueChange={setSelectedAiKey}
              placeholder="Select AI"
              className="w-full"
            />
          </div>
          <div>
            <Label className="text-xs">Market data</Label>
            <Combobox
              options={marketDataKeys.map(k => ({ value: k.id.toString(), label: k.title }))}
              value={selectedMarketDataKey}
              onValueChange={setSelectedMarketDataKey}
              placeholder="Select market"
              className="w-full"
            />
          </div>
        </div>

        {/* Product type */}
        <div>
          <Label className="text-xs">What do you want to trade?</Label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {PRODUCT_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setProductType(type)}
                className={`py-2 rounded-md text-xs font-semibold border transition-colors ${
                  productType === type
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-border text-muted-foreground hover:bg-indigo-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Watchlist add */}
        <div className="rounded-lg border border-border p-3">
          <Label className="text-xs">Watchlist</Label>
          <div className="mt-1 flex gap-2">
            <InstrumentCombobox
              value={newTicker}
              onSelect={({ ticker, name, type }) => {
                setNewTicker(ticker);
                setNewName(name ?? '');
                setNewType(type);
              }}
              className="flex-1 justify-between"
            />
            <Button size="sm" variant="outline" onClick={addToWatchlist}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-2">
            <Combobox
              options={INSTRUMENT_TYPES.map(t => ({ value: t, label: t }))}
              value={newType}
              onValueChange={setNewType}
              placeholder="Type"
              className="w-full"
            />
          </div>

          {/* Watchlist chips */}
          {watchlist.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {watchlist.map(item => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs font-medium"
                >
                  {item.ticker}
                  <span className="px-1.5 py-0.5 rounded-full bg-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    {item.instrumentType || inferInstrumentType(item.ticker)}
                  </span>
                  <button
                    onClick={() => removeFromWatchlist(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {watchlist.length === 0 && !watchlistLoading && (
            <p className="text-xs text-muted-foreground mt-2">
              No instruments yet — add some to scan.
            </p>
          )}
          {watchlistLoading && <p className="text-xs text-muted-foreground mt-2">Loading…</p>}
        </div>

        {/* Scan button */}
        <Button onClick={scanWatchlist} disabled={scanning} className="w-full">
          {scanning ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ScanLine className="w-4 h-4 mr-2" />
          )}
          {scanning ? 'Analyzing watchlist…' : 'Scan watchlist'}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {result.opportunities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Opportunities ({result.opportunities.length})
                </h4>
                <div className="space-y-2">
                  {result.opportunities.map(({ item, report }) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setSelectedPlan({
                          plan: report,
                          symbol: item.ticker,
                          companyName: item.name ?? undefined,
                        })
                      }
                      className="w-full text-left rounded-lg border border-border p-3 hover:border-ring hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.ticker}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${actionBadge(report.action)}`}
                          >
                            {report.action}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                            {report.productType}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {report.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {report.summary}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {result.holds.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Holds / watch</h4>
                <div className="space-y-2">
                  {result.holds.map(({ item, report }) => (
                    <div key={item.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.ticker}</span>
                        <span className="text-xs text-muted-foreground">{report.confidence}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {report.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.failed.length > 0 && (
              <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
                <p className="text-xs font-semibold text-warning">
                  Could not analyze {result.failed.length} item(s)
                </p>
                {result.failed.map(({ item, error }) => (
                  <p key={item.id} className="text-xs text-warning mt-1">
                    {item.ticker}: {error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <TradePlanModal
        isVisible={!!selectedPlan}
        plan={selectedPlan?.plan ?? null!}
        symbol={selectedPlan?.symbol ?? ''}
        companyName={selectedPlan?.companyName}
        tradingKeys={tradingKeys}
        defaultTradingKeyId={selectedTradingKey}
        onClose={() => setSelectedPlan(null)}
        onNotification={onNotification}
      />
    </Card>
  );
}
