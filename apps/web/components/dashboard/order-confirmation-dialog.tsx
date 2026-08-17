'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TokenManager } from '@/lib/token-manager';
import { AiTradePlan, NotificationData, TradingKey } from '@/types/dashboard';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface OrderConfirmationDialogProps {
  isVisible: boolean;
  plan: AiTradePlan;
  symbol: string;
  companyName?: string;
  tradingKeys: TradingKey[];
  defaultTradingKeyId?: string;
  onClose: () => void;
  onNotification: (n: NotificationData) => void;
}

function formatNumber(value: number | undefined): string {
  if (value == null || isNaN(value)) return '';
  return String(value);
}

export default function OrderConfirmationDialog({
  isVisible,
  plan,
  symbol,
  companyName,
  tradingKeys,
  defaultTradingKeyId,
  onClose,
  onNotification,
}: OrderConfirmationDialogProps) {
  const [tradingKeyId, setTradingKeyId] = useState<string>(defaultTradingKeyId ?? '');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<string>(formatNumber(plan.positionSize));
  const [stopLoss, setStopLoss] = useState<string>(formatNumber(plan.stopLoss));
  const [takeProfit, setTakeProfit] = useState<string>(formatNumber(plan.takeProfit));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setTradingKeyId(defaultTradingKeyId ?? '');
      setSide(plan.action === 'SELL' || plan.action === 'TRIM' ? 'SELL' : 'BUY');
      setQuantity(formatNumber(plan.positionSize));
      setStopLoss(formatNumber(plan.stopLoss));
      setTakeProfit(formatNumber(plan.takeProfit));
    }
  }, [isVisible, plan, defaultTradingKeyId]);

  if (!isVisible) return null;

  const handleSubmit = async () => {
    if (!tradingKeyId) {
      onNotification({ message: 'Select a trading account first', type: 'warning' });
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      onNotification({ message: 'Enter a valid quantity', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/orders', {
        method: 'POST',
        body: JSON.stringify({
          tradingKeyId: Number(tradingKeyId),
          ticker: symbol,
          quantity: qty,
          side,
          stopLoss: stopLoss ? Number(stopLoss) : undefined,
          takeProfit: takeProfit ? Number(takeProfit) : undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || body?.details || 'Order failed');
      }

      onNotification({
        message: `Order placed on ${side === 'BUY' ? 'buy' : 'sell'} ${symbol} — review it in Trading212.`,
        type: 'success',
      });
      onClose();
    } catch (err) {
      onNotification({
        message: err instanceof Error ? err.message : 'Failed to place order',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copySummary = () => {
    const lines = [
      `GreedAdvisor order — ${symbol}${companyName ? ` (${companyName})` : ''}`,
      `Side: ${side}`,
      `Quantity: ${quantity}`,
      stopLoss ? `Stop loss: ${stopLoss}` : '',
      takeProfit ? `Take profit: ${takeProfit}` : '',
      `Generated: ${new Date().toLocaleString()}`,
    ].filter(Boolean);
    navigator.clipboard?.writeText(lines.join('\n'));
    onNotification({ message: 'Order details copied to clipboard', type: 'success' });
  };

  const selectedEnv =
    tradingKeys.find(k => k.id.toString() === tradingKeyId)?.environment ?? 'demo';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-card rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Confirm Order</h2>
              <p className="text-sm text-muted-foreground">
                {symbol}
                {companyName ? ` · ${companyName}` : ''} — you review and confirm, the AI never
                trades by itself
              </p>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Account selector */}
            <div>
              <Label>Trading account</Label>
              <select
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={tradingKeyId}
                onChange={e => setTradingKeyId(e.target.value)}
              >
                {tradingKeys.length === 0 && <option value="">No accounts available</option>}
                {tradingKeys.map(key => (
                  <option key={key.id} value={key.id}>
                    {key.title || key.accessType} ({key.environment})
                  </option>
                ))}
              </select>
              {selectedEnv && (
                <p
                  className={`text-xs mt-1 ${selectedEnv === 'demo' ? 'text-warning' : 'text-destructive'}`}
                >
                  {selectedEnv === 'demo'
                    ? 'Demo account — no real money'
                    : 'LIVE account — real orders'}
                </p>
              )}
            </div>

            {/* Side toggle */}
            <div>
              <Label>Side</Label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2 rounded-md text-sm font-semibold border ${
                    side === 'BUY'
                      ? 'bg-success text-white border-success'
                      : 'border-border text-muted-foreground hover:bg-success/10'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2 rounded-md text-sm font-semibold border ${
                    side === 'SELL'
                      ? 'bg-destructive text-white border-destructive'
                      : 'border-border text-muted-foreground hover:bg-destructive/10'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Reference price</Label>
                <Input value={formatNumber(plan.entryPrice)} disabled className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stop loss</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={stopLoss}
                  onChange={e => setStopLoss(e.target.value)}
                  className="mt-1"
                  placeholder="optional"
                />
              </div>
              <div>
                <Label>Take profit</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={takeProfit}
                  onChange={e => setTakeProfit(e.target.value)}
                  className="mt-1"
                  placeholder="optional"
                />
              </div>
            </div>

            {plan.riskAmount != null && (
              <p className="text-xs text-muted-foreground">
                Suggested risk: up to {formatNumber(plan.riskAmount)} per this trade (AI sizing —
                adjust freely)
              </p>
            )}

            {plan.productType === 'CFD' && (
              <p className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
                ⚠️ CFD order — leverage amplifies both gains and losses.
              </p>
            )}
            {plan.productType === 'CRYPTO' && (
              <p className="text-xs font-medium text-warning bg-warning/10 border border-warning/20 rounded-md p-2">
                ⚠️ Cryptocurrency — highly volatile, 24/7 market.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? 'Placing…' : `Place ${side} Order`}
            </Button>
            <Button variant="outline" onClick={copySummary} className="flex-1">
              Copy to clipboard
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            By confirming you take full responsibility. Do your own research first.
          </p>
        </div>
      </div>
    </div>
  );
}
