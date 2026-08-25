'use client';

import PageLayout from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import { Cpu, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AutomationConfig {
  id: number;
  title: string;
  enabled: boolean;
  mode: 'advisory' | 'paper' | 'live';
  allowLive: boolean;
  scanIntervalMinutes: number;
  universe: 'watchlist' | 'watchlist+movers';
  maxCandidates: number;
  maxPositions: number;
  maxRiskPerTradePct: number;
  dailyLossLimitPct: number;
  maxDailyTrades: number;
  confidenceThreshold: number;
  respectPdt: boolean;
  flattenAtClose: boolean;
  cooldownMinutes: number;
  orderType: 'MARKET' | 'LIMIT';
  slippageTolerancePct: number;
  extendedHours: boolean;
  tradingKeyId: number | null;
  aiKeyId: number | null;
  marketDataKeyId: number | null;
  model: string | null;
  telegramChatId: string | null;
  nextRunAt: string;
  lastRunAt: string | null;
  lastRunStatus: string | null;
}

interface KeyOption {
  id: number;
  title: string;
  provider?: string;
  environment?: string;
}

const MODE_OPTIONS = [
  { value: 'advisory', label: 'Advisory (signals only)' },
  { value: 'paper', label: 'Paper (auto-trade paper/demo)' },
  { value: 'live', label: 'Live (requires allowLive flag)' }
];

const UNIVERSE_OPTIONS = [
  { value: 'watchlist', label: 'Watchlist only' },
  { value: 'watchlist+movers', label: 'Watchlist + movers (opportunity hunting)' }
];

const ORDER_TYPE_OPTIONS = [
  { value: 'MARKET', label: 'Market orders' },
  { value: 'LIMIT', label: 'Limit orders (at AI entry price)' }
];

const EMPTY_FORM = {
  title: '',
  mode: 'advisory',
  scanIntervalMinutes: 5,
  universe: 'watchlist',
  maxCandidates: 5,
  maxPositions: 10,
  maxRiskPerTradePct: 2,
  dailyLossLimitPct: 3,
  maxDailyTrades: 5,
  confidenceThreshold: 70,
  cooldownMinutes: 30,
  orderType: 'MARKET',
  tradingKeyId: '',
  aiKeyId: '',
  marketDataKeyId: '',
  telegramChatId: ''
};

type FormState = typeof EMPTY_FORM;

export default function AutomationPage() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<AutomationConfig[]>([]);
  const [tradingKeys, setTradingKeys] = useState<KeyOption[]>([]);
  const [aiKeys, setAiKeys] = useState<KeyOption[]>([]);
  const [marketDataKeys, setMarketDataKeys] = useState<KeyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, tkRes, aiRes, mdRes] = await Promise.all([
        TokenManager.makeAuthenticatedRequest('/api/user/automation'),
        TokenManager.makeAuthenticatedRequest('/api/user/trading-keys'),
        TokenManager.makeAuthenticatedRequest('/api/user/ai-keys'),
        TokenManager.makeAuthenticatedRequest('/api/user/market-data-keys')
      ]);
      if (cfgRes.ok) {
        const data = await cfgRes.json();
        setConfigs(data.automationConfigs ?? []);
      }
      if (tkRes.ok) {
        const data = await tkRes.json();
        setTradingKeys(data.tradingKeys ?? []);
      }
      if (aiRes.ok) {
        const data = await aiRes.json();
        setAiKeys(data.aiKeys ?? []);
      }
      if (mdRes.ok) {
        const data = await mdRes.json();
        setMarketDataKeys(data.marketDataKeys ?? []);
      }
    } catch {
      toast('Failed to load automation settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const keyLabel = (keyId: number | null, keys: KeyOption[]) => {
    const key = keys.find(k => k.id === keyId);
    if (!key) return '—';
    return `${key.title}${key.provider ? ` (${key.provider})` : ''}`;
  };

  const createConfig = async () => {
    setSaving(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          mode: form.mode,
          scanIntervalMinutes: Number(form.scanIntervalMinutes),
          universe: form.universe,
          maxCandidates: Number(form.maxCandidates),
          maxPositions: Number(form.maxPositions),
          maxRiskPerTradePct: Number(form.maxRiskPerTradePct) / 100,
          dailyLossLimitPct: Number(form.dailyLossLimitPct) / 100,
          maxDailyTrades: Number(form.maxDailyTrades),
          confidenceThreshold: Number(form.confidenceThreshold),
          cooldownMinutes: Number(form.cooldownMinutes),
          orderType: form.orderType,
          tradingKeyId: form.tradingKeyId ? Number(form.tradingKeyId) : null,
          aiKeyId: form.aiKeyId ? Number(form.aiKeyId) : null,
          marketDataKeyId: form.marketDataKeyId ? Number(form.marketDataKeyId) : null,
          telegramChatId: form.telegramChatId || null
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || body?.message || 'Failed to create automation');
      }
      toast('Automation configuration created', 'success');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create automation', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = async (id: number, data: Partial<AutomationConfig>) => {
    const response = await TokenManager.makeAuthenticatedRequest(`/api/user/automation/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || body?.message || 'Failed to update automation');
    }
    fetchAll();
  };

  const toggle = async (config: AutomationConfig) => {
    try {
      if (config.enabled && config.mode === 'live' && !config.allowLive) {
        toast('Live mode requires the allowLive flag', 'error');
        return;
      }
      await updateConfig(config.id, { enabled: !config.enabled });
      toast(`Automation ${config.enabled ? 'disabled' : 'enabled'}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to toggle automation', 'error');
    }
  };

  const remove = async (config: AutomationConfig) => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest(
        `/api/user/automation/${config.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to delete automation');
      }
      toast('Automation deleted', 'success');
      fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete automation', 'error');
    }
  };

  const statusColor = (status: string | null) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-600';
      case 'partial':
        return 'bg-amber-500/10 text-amber-600';
      case 'failed':
        return 'bg-red-500/10 text-red-600';
      case 'skipped':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Autonomous Trading</h1>
              <p className="text-sm text-muted-foreground">
                Let the AI scan, decide, and trade — inside hard guardrails.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" /> {showForm ? 'Cancel' : 'New Automation'}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>New automation configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Daily S&P momentum bot"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Mode</Label>
                  <Combobox
                    options={MODE_OPTIONS}
                    value={form.mode}
                    onValueChange={value => setForm({ ...form, mode: value })}
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
                    onChange={e =>
                      setForm({ ...form, scanIntervalMinutes: Number(e.target.value) })
                    }
                    className="mt-1"
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
                    onValueChange={value => setForm({ ...form, aiKeyId: value })}
                    placeholder="Select AI key..."
                    className="mt-1 w-full"
                  />
                </div>
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
                    onValueChange={value => setForm({ ...form, universe: value })}
                    className="mt-1 w-full"
                  />
                </div>
                <div>
                  <Label>Order type</Label>
                  <Combobox
                    options={ORDER_TYPE_OPTIONS}
                    value={form.orderType}
                    onValueChange={value => setForm({ ...form, orderType: value })}
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

              <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? 'Hide' : 'Show'} advanced risk settings
              </Button>

              {showAdvanced && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {(
                    [
                      ['maxCandidates', 'Max candidates', 1, 50],
                      ['maxPositions', 'Max positions', 1, 200],
                      ['maxDailyTrades', 'Max daily trades', 1, 100],
                      ['confidenceThreshold', 'Min confidence %', 0, 100],
                      ['cooldownMinutes', 'Cooldown (min)', 0, 1440],
                      ['maxRiskPerTradePct', 'Max risk/trade %', 0.1, 10],
                      ['dailyLossLimitPct', 'Daily loss limit %', 0.1, 50]
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
              )}

              <Button onClick={createConfig} disabled={saving || !form.title}>
                {saving ? 'Creating...' : 'Create automation'}
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="py-16 text-center text-muted-foreground">Loading automation configs...</p>
        ) : configs.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No automations yet. Create one to start autonomous trading.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map(config => (
              <Card key={config.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold">{config.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {keyLabel(config.tradingKeyId, tradingKeys)} ·{' '}
                          {keyLabel(config.aiKeyId, aiKeys)} ·{' '}
                          {keyLabel(config.marketDataKeyId, marketDataKeys)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={config.enabled ? 'bg-green-500/10 text-green-600' : ''}
                      >
                        {config.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge variant="outline">{config.mode}</Badge>
                      <Badge variant="outline">every {config.scanIntervalMinutes}m</Badge>
                      {config.universe === 'watchlist+movers' && (
                        <Badge variant="outline">+movers</Badge>
                      )}
                      <Badge className={statusColor(config.lastRunStatus)}>
                        last: {config.lastRunStatus ?? 'never'}
                      </Badge>
                      <Button size="sm" variant="secondary" onClick={() => toggle(config)}>
                        {config.enabled ? 'Pause' : 'Start'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(config)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                    <span>
                      Universe:{' '}
                      {config.universe === 'watchlist+movers' ? 'watchlist + movers' : 'watchlist'}
                    </span>
                    <span>
                      Risk/trade: {(config.maxRiskPerTradePct * 100).toFixed(1)}% · daily loss cap:{' '}
                      {(config.dailyLossLimitPct * 100).toFixed(1)}%
                    </span>
                    <span>
                      Confidence ≥ {config.confidenceThreshold} · max {config.maxPositions}{' '}
                      positions
                    </span>
                    <span>
                      Next run:{' '}
                      {config.nextRunAt ? new Date(config.nextRunAt).toLocaleString() : '—'}
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
