'use client';

import InstrumentPicker from '@/components/automation/instrument-picker';
import {
  EMPTY_FORM,
  splitSymbols,
  toFormState,
  type BotFormState,
  type BotKeyOption,
  type EditableBot
} from '@/components/automation/bot-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import { AI_MODEL_OPTIONS } from '@greed-advisor/ai';
import { cn } from '@greed-advisor/utils';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type { BotKeyOption }; // re-export for consumers (dashboard panel)

interface BotDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  tradingKeys: BotKeyOption[];
  aiKeys: BotKeyOption[];
  marketDataKeys: BotKeyOption[];
  editing?: EditableBot | null;
}

const MODE_OPTIONS = [
  { value: 'advisory', label: 'Advisory (signals only)' },
  { value: 'paper', label: 'Paper (auto-trade paper/demo)' },
  { value: 'live', label: 'Live (requires allowLive flag)' }
];

const EXECUTION_OPTIONS = [
  { value: 'auto', label: 'Fully autonomous (no approval)' },
  { value: 'approval', label: 'Require my approval before each trade' }
];

const MARKET_OPTIONS = [
  { value: 'us', label: 'US equities (Alpaca/T212)' },
  { value: 'eu', label: 'EU equities (CET hours)' },
  { value: 'crypto', label: 'Crypto (24/7)' }
];

const STRATEGY_OPTIONS = [
  { value: 'momentum', label: 'Momentum' },
  { value: 'trend', label: 'Trend following' },
  { value: 'mean_reversion', label: 'Mean reversion' },
  { value: 'breakout', label: 'Breakout' },
  { value: 'scalp', label: 'Scalp (fast intraday)' },
  { value: 'swing', label: 'Swing (multi-day)' }
];

const UNIVERSE_OPTIONS = [
  { value: 'watchlist', label: 'My symbols / watchlist' },
  { value: 'movers', label: 'Auto — hunt whatever looks greedy (movers)' },
  { value: 'watchlist+movers', label: 'My symbols + movers' }
];

const ORDER_TYPE_OPTIONS = [
  { value: 'MARKET', label: 'Market orders' },
  { value: 'LIMIT', label: 'Limit orders (at AI entry price)' }
];

interface BotTemplate {
  title: string;
  description: string;
  market: 'us' | 'eu' | 'crypto';
  strategy: string;
  universe: 'watchlist' | 'movers' | 'watchlist+movers';
  scanIntervalMinutes: number;
  confidenceThreshold: number;
  maxPositions: number;
  maxRiskPerTradePct: number;
  maxDailySpendPct: number;
  dailyLossLimitPct: number;
}

const BOT_TEMPLATES: BotTemplate[] = [
  {
    title: 'US Momentum',
    description: 'Hunts US movers, momentum entries.',
    market: 'us',
    strategy: 'momentum',
    universe: 'movers',
    scanIntervalMinutes: 5,
    confidenceThreshold: 70,
    maxPositions: 5,
    maxRiskPerTradePct: 0.02,
    maxDailySpendPct: 0.2,
    dailyLossLimitPct: 0.03
  },
  {
    title: 'US Swing',
    description: 'Multi-day trend positions on movers.',
    market: 'us',
    strategy: 'swing',
    universe: 'movers',
    scanIntervalMinutes: 60,
    confidenceThreshold: 65,
    maxPositions: 8,
    maxRiskPerTradePct: 0.02,
    maxDailySpendPct: 0.25,
    dailyLossLimitPct: 0.04
  },
  {
    title: 'Crypto 24/7',
    description: 'Crypto momentum around the clock.',
    market: 'crypto',
    strategy: 'momentum',
    universe: 'movers',
    scanIntervalMinutes: 5,
    confidenceThreshold: 70,
    maxPositions: 5,
    maxRiskPerTradePct: 0.02,
    maxDailySpendPct: 0.2,
    dailyLossLimitPct: 0.03
  },
  {
    title: 'EU Breakout',
    description: 'Breakout entries during EU hours.',
    market: 'eu',
    strategy: 'breakout',
    universe: 'movers',
    scanIntervalMinutes: 15,
    confidenceThreshold: 70,
    maxPositions: 6,
    maxRiskPerTradePct: 0.02,
    maxDailySpendPct: 0.2,
    dailyLossLimitPct: 0.03
  },
  {
    title: 'US Scalp',
    description: 'Fast intraday momentum on 5-min bars.',
    market: 'us',
    strategy: 'scalp',
    universe: 'movers',
    scanIntervalMinutes: 5,
    confidenceThreshold: 75,
    maxPositions: 4,
    maxRiskPerTradePct: 0.015,
    maxDailySpendPct: 0.15,
    dailyLossLimitPct: 0.02
  },
  {
    title: 'Mean Reversion',
    description: 'Buys oversold bounces on 15-min bars.',
    market: 'us',
    strategy: 'mean_reversion',
    universe: 'watchlist+movers',
    scanIntervalMinutes: 15,
    confidenceThreshold: 65,
    maxPositions: 6,
    maxRiskPerTradePct: 0.02,
    maxDailySpendPct: 0.2,
    dailyLossLimitPct: 0.03
  }
];

const INSTRUMENT_BUNDLES: { label: string; symbols: string[] }[] = [
  { label: 'Mega-cap tech', symbols: ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA'] },
  { label: 'S&P liquid (ETFs)', symbols: ['SPY', 'QQQ', 'IWM', 'DIA'] },
  { label: 'Crypto', symbols: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE'] },
  { label: 'Semiconductors', symbols: ['NVDA', 'AMD', 'INTC', 'TSM', 'AVGO', 'MU', 'QCOM'] },
  { label: 'Fintech', symbols: ['PYPL', 'SQ', 'COIN', 'SOFI', 'AFRM'] }
];

export default function BotDialog({
  open,
  onClose,
  onSaved,
  tradingKeys,
  aiKeys,
  marketDataKeys,
  editing
}: BotDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<BotFormState>(EMPTY_FORM);

  // Sync the form whenever the dialog opens or switches to a different bot —
  // otherwise the form keeps the previously edited bot's data.
  useEffect(() => {
    if (!open) return;
    setForm(toFormState(editing));
    setShowAdvanced(false);
  }, [open, editing]);

  if (!open) return null;

  const selectedAiProvider =
    aiKeys.find(k => k.id === Number(form.aiKeyId))?.provider ?? 'opencode';
  const modelOptions =
    (
      AI_MODEL_OPTIONS[selectedAiProvider as keyof typeof AI_MODEL_OPTIONS] ??
      AI_MODEL_OPTIONS.opencode
    )?.map(m => ({ value: m.value, label: m.label })) ?? [];

  const addSymbol = (symbol: string) => {
    const sym = symbol.toUpperCase();
    setForm(f => ({
      ...f,
      symbolsText: [...new Set(splitSymbols(f.symbolsText).concat(sym))].join(', ')
    }));
  };

  const removeSymbol = (symbol: string) => {
    setForm(f => ({
      ...f,
      symbolsText: splitSymbols(f.symbolsText)
        .filter(s => s !== symbol.toUpperCase())
        .join(', ')
    }));
  };

  const fillTemplate = (template: BotTemplate) => {
    setForm(f => ({
      ...f,
      title: template.title,
      market: template.market,
      strategy: template.strategy,
      universe: template.universe,
      scanIntervalMinutes: template.scanIntervalMinutes,
      confidenceThreshold: template.confidenceThreshold,
      maxPositions: template.maxPositions,
      maxRiskPerTradePct: template.maxRiskPerTradePct * 100,
      maxDailySpendPct: template.maxDailySpendPct * 100,
      dailyLossLimitPct: template.dailyLossLimitPct * 100,
      execution: 'approval',
      manageStops: true,
      stopOnLoss: true
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        mode: form.mode,
        execution: form.execution,
        market: form.market,
        strategy: form.strategy,
        symbols: splitSymbols(form.symbolsText),
        scanIntervalMinutes: Number(form.scanIntervalMinutes),
        universe: form.universe,
        maxCandidates: Number(form.maxCandidates),
        maxPositions: Number(form.maxPositions),
        maxRiskPerTradePct: Number(form.maxRiskPerTradePct) / 100,
        maxDailySpendPct: Number(form.maxDailySpendPct) / 100,
        dailyLossLimitPct: Number(form.dailyLossLimitPct) / 100,
        stopOnLoss: form.stopOnLoss,
        maxDailyTrades: Number(form.maxDailyTrades),
        confidenceThreshold: Number(form.confidenceThreshold),
        cooldownMinutes: Number(form.cooldownMinutes),
        orderType: form.orderType,
        manageStops: form.manageStops,
        flattenAtClose: form.flattenAtClose,
        tradingKeyId: form.tradingKeyId ? Number(form.tradingKeyId) : null,
        aiKeyId: form.aiKeyId ? Number(form.aiKeyId) : null,
        marketDataKeyId: form.marketDataKeyId ? Number(form.marketDataKeyId) : null,
        model: form.model || null,
        telegramChatId: form.telegramChatId || null
      };

      const response = await TokenManager.makeAuthenticatedRequest(
        editing ? `/api/user/automation/${editing.id}` : '/api/user/automation',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || body?.message || 'Failed to save bot');
      }
      toast(editing ? 'Bot updated' : 'Bot created', 'success');
      onSaved();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save bot', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-3xl rounded-xl border bg-background p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{editing ? 'Edit bot' : 'Add trading bot'}</h2>
            <p className="text-xs text-muted-foreground">
              {editing
                ? 'Update its instruments, model or risk rules.'
                : 'Create a new autonomous trading bot.'}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          {/* Templates */}
          {!editing && (
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Prebuilt bots — click to fill the form
              </p>
              <div className="flex flex-wrap gap-1.5">
                {BOT_TEMPLATES.map(template => (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => fillTemplate(template)}
                    title={template.description}
                    className={cn(
                      'rounded-md border border-border px-2 py-1 text-xs transition-colors hover:border-primary hover:text-primary',
                      form.title === template.title
                        ? 'border-primary text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    {template.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., S&P momentum bot"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Instruments</Label>
              {splitSymbols(form.symbolsText).length > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {splitSymbols(form.symbolsText).map(sym => (
                    <span
                      key={sym}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs"
                    >
                      <span className="font-medium">{sym}</span>
                      <button
                        type="button"
                        onClick={() => removeSymbol(sym)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${sym}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <InstrumentPicker onAdd={addSymbol} />
                <div className="flex flex-wrap items-center gap-1.5">
                  {INSTRUMENT_BUNDLES.map(bundle => (
                    <button
                      key={bundle.label}
                      type="button"
                      onClick={() => bundle.symbols.forEach(addSymbol)}
                      className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      title={bundle.symbols.join(', ')}
                    >
                      + {bundle.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, universe: 'movers', symbolsText: '' }))}
                    className={cn(
                      'rounded-md border px-2 py-1 text-xs transition-colors',
                      form.universe === 'movers' && !form.symbolsText
                        ? 'border-primary text-primary'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                    )}
                  >
                    Use anything (hunt movers)
                  </button>
                </div>
                <Input
                  value={form.symbolsText}
                  onChange={e => setForm({ ...form, symbolsText: e.target.value })}
                  placeholder="…or type manually, e.g. AAPL, GOOG, SPY"
                />
              </div>
            </div>

            <div>
              <Label>Market</Label>
              <Combobox
                options={MARKET_OPTIONS}
                value={form.market}
                onValueChange={value =>
                  setForm({ ...form, market: value as BotFormState['market'] })
                }
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>Strategy</Label>
              <Combobox
                options={STRATEGY_OPTIONS}
                value={form.strategy}
                onValueChange={value => setForm({ ...form, strategy: value })}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>Account mode</Label>
              <Combobox
                options={MODE_OPTIONS}
                value={form.mode}
                onValueChange={value => setForm({ ...form, mode: value as BotFormState['mode'] })}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>Execution</Label>
              <Combobox
                options={EXECUTION_OPTIONS}
                value={form.execution}
                onValueChange={value =>
                  setForm({ ...form, execution: value as BotFormState['execution'] })
                }
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>Trading account</Label>
              <Combobox
                options={tradingKeys.map(k => ({
                  value: String(k.id),
                  label: `${k.title} (${k.provider ?? ''} · ${k.environment ?? ''})`
                }))}
                value={form.tradingKeyId}
                onValueChange={value => setForm({ ...form, tradingKeyId: value })}
                placeholder="Select account..."
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>AI key</Label>
              <Combobox
                options={aiKeys.map(k => ({
                  value: String(k.id),
                  label: `${k.title} (${k.provider ?? ''})`
                }))}
                value={form.aiKeyId}
                onValueChange={value => setForm({ ...form, aiKeyId: value, model: '' })}
                placeholder="Select AI key..."
                className="mt-1 w-full"
              />
            </div>
            {form.aiKeyId && (
              <div>
                <Label>AI model ({selectedAiProvider})</Label>
                <Combobox
                  options={modelOptions}
                  value={form.model}
                  onValueChange={value => setForm({ ...form, model: value })}
                  placeholder="Select model..."
                  className="mt-1 w-full"
                />
              </div>
            )}
            <div>
              <Label>Market data key</Label>
              <Combobox
                options={marketDataKeys.map(k => ({
                  value: String(k.id),
                  label: `${k.title} (${k.provider ?? ''})`
                }))}
                value={form.marketDataKeyId}
                onValueChange={value => setForm({ ...form, marketDataKeyId: value })}
                placeholder="Select market data key..."
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>Universe</Label>
              <Combobox
                options={UNIVERSE_OPTIONS}
                value={form.universe}
                onValueChange={value =>
                  setForm({ ...form, universe: value as BotFormState['universe'] })
                }
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>Scan interval (minutes)</Label>
              <Input
                type="number"
                min={1}
                max={1440}
                value={form.scanIntervalMinutes}
                onChange={e => setForm({ ...form, scanIntervalMinutes: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Order type</Label>
              <Combobox
                options={ORDER_TYPE_OPTIONS}
                value={form.orderType}
                onValueChange={value =>
                  setForm({ ...form, orderType: value as BotFormState['orderType'] })
                }
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>Telegram chat ID (optional)</Label>
              <Input
                value={form.telegramChatId}
                onChange={e => setForm({ ...form, telegramChatId: e.target.value })}
                placeholder="e.g., 123456789"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? 'Hide' : 'Show'} risk settings
            </Button>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
              paper + approval = safest to test
            </Badge>
          </div>

          {showAdvanced && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(
                  [
                    ['maxCandidates', 'Max candidates', 1, 50],
                    ['maxPositions', 'Max positions open', 1, 200],
                    ['maxDailyTrades', 'Max daily trades', 1, 100],
                    ['confidenceThreshold', 'Min confidence %', 0, 100],
                    ['cooldownMinutes', 'Cooldown (min)', 0, 1440],
                    ['maxRiskPerTradePct', 'Max risk / trade %', 0.1, 10],
                    ['maxDailySpendPct', 'Max cash / day % of equity', 1, 100],
                    ['dailyLossLimitPct', 'Daily loss stop %', 0.1, 50]
                  ] as const
                ).map(([key, label, min, max]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      min={min}
                      max={max}
                      value={form[key]}
                      onChange={e => setForm({ ...form, [key]: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    ['manageStops', 'Trail stops (breakeven + ATR, Alpaca)'],
                    ['flattenAtClose', 'Flatten all positions before close (day trading)'],
                    ['stopOnLoss', 'Turn the bot off when the daily loss limit is hit']
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.title}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create bot'}
          </Button>
        </div>
      </div>
    </div>
  );
}
