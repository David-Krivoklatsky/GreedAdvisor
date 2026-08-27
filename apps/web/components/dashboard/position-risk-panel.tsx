'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import type { Position } from '@/types/dashboard';
import { Crosshair, Lock } from 'lucide-react';
import { useState } from 'react';

interface PositionRiskPanelProps {
  positions: Position[];
  tradingKeyId: string;
}

function shortTicker(ticker: string): string {
  return ticker.replace(/_US_EQ$/, '').replace(/_.+/, '');
}

export default function PositionRiskPanel({ positions, tradingKeyId }: PositionRiskPanelProps) {
  const { toast } = useToast();
  const [edits, setEdits] = useState<Record<string, { stopLoss: string; takeProfit: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const managed = positions.filter(
    p => p.risk && (p.risk.stopLoss != null || p.risk.takeProfit != null)
  );

  if (managed.length === 0) {
    return null;
  }

  const apply = async (position: Position) => {
    const ticker = shortTicker(position.instrument.ticker);
    const edit = edits[ticker];
    if (!edit) return;
    setSaving(ticker);
    try {
      const body: { stopLoss?: number; takeProfit?: number } = {};
      const stop = edit.stopLoss.trim();
      const tp = edit.takeProfit.trim();
      if (stop) body.stopLoss = Number(stop);
      if (tp) body.takeProfit = Number(tp);
      if (Object.keys(body).length === 0) {
        toast('Enter a stop-loss and/or take-profit', 'warning');
        return;
      }
      const url = `/api/user/positions/${encodeURIComponent(ticker)}${
        tradingKeyId ? `?keyId=${tradingKeyId}` : ''
      }`;
      const response = await TokenManager.makeAuthenticatedRequest(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || data?.message || 'Failed to update position risk');
      }
      toast('Position risk updated', 'success');
      setEdits(prev => ({ ...prev, [ticker]: { stopLoss: '', takeProfit: '' } }));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update position risk', 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Position review</h3>
          <p className="text-xs text-muted-foreground">
            Adjust stop-loss / take-profit on bot-opened positions
          </p>
        </div>
        <div className="space-y-2">
          {managed.map(position => {
            const ticker = shortTicker(position.instrument.ticker);
            const edit = edits[ticker] ?? { stopLoss: '', takeProfit: '' };
            const inProfit =
              position.currentPrice > 0 &&
              position.averagePricePaid > 0 &&
              position.currentPrice > position.averagePricePaid;
            const tpNotHit =
              position.risk?.takeProfit != null &&
              position.currentPrice > 0 &&
              position.currentPrice < position.risk.takeProfit;

            return (
              <div key={ticker} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                <div className="w-36">
                  <p className="font-semibold">{ticker}</p>
                  <p className="text-xs text-muted-foreground">
                    {position.currentPrice.toFixed(2)} / avg {position.averagePricePaid.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {inProfit && tpNotHit ? (
                    <Badge className="bg-green-500/10 text-green-600">
                      in profit · TP not hit yet
                    </Badge>
                  ) : inProfit ? (
                    <Badge className="bg-green-500/10 text-green-600">in profit</Badge>
                  ) : (
                    <Badge variant="outline">not in profit</Badge>
                  )}
                  {position.risk?.stopLoss != null ? (
                    <span className="text-xs text-muted-foreground">
                      SL {position.risk.stopLoss}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" /> no stop leg
                    </span>
                  )}
                  {position.risk?.takeProfit != null && (
                    <span className="text-xs text-muted-foreground">
                      TP {position.risk.takeProfit}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder="new SL"
                    value={edit.stopLoss}
                    onChange={e =>
                      setEdits(prev => ({
                        ...prev,
                        [ticker]: {
                          ...(prev[ticker] ?? { stopLoss: '', takeProfit: '' }),
                          stopLoss: e.target.value
                        }
                      }))
                    }
                    className="w-24"
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder="new TP"
                    value={edit.takeProfit}
                    onChange={e =>
                      setEdits(prev => ({
                        ...prev,
                        [ticker]: {
                          ...(prev[ticker] ?? { stopLoss: '', takeProfit: '' }),
                          takeProfit: e.target.value
                        }
                      }))
                    }
                    className="w-24"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={saving === ticker}
                    onClick={() => apply(position)}
                  >
                    {saving === ticker ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
