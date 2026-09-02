'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import BotDialog, { type BotKeyOption } from '@/components/automation/bot-dialog';
import type { AutomationConfig, AutomationRunStep } from '@/types/dashboard';
import type { ChartMarkers } from '@/components/charts/lightweight-chart';
import { cn } from '@greed-advisor/utils';
import {
  Activity,
  BarChart3,
  Bitcoin,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Eye,
  Flame,
  FlaskConical,
  Gauge,
  Globe,
  Hand,
  Landmark,
  Loader2,
  MoonStar,
  OctagonX,
  Pause,
  Pencil,
  Play,
  Plus,
  Power,
  Repeat,
  Route,
  ShieldAlert,
  Sunset,
  Timer,
  TrendingUp,
  Zap,
  type LucideIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AutomationOverviewProps {
  automationConfigs: AutomationConfig[];
  loading: boolean;
  onRefresh: () => void;
  onShowOnGraph?: (symbol: string, markers?: ChartMarkers | null) => void;
  tradingKeys: BotKeyOption[];
  aiKeys: BotKeyOption[];
  marketDataKeys: BotKeyOption[];
}

const RUN_STATUS_STYLES: Record<string, string> = {
  success: 'bg-green-500/10 text-green-600',
  partial: 'bg-amber-500/10 text-amber-600',
  failed: 'bg-red-500/10 text-red-600',
  skipped: 'bg-muted text-muted-foreground',
  running: 'bg-blue-500/10 text-blue-600'
};

const STEP_STATUS: Record<string, { dot: string; label: string }> = {
  ok: { dot: 'bg-green-500', label: 'ok' },
  warn: { dot: 'bg-amber-500', label: 'warn' },
  skipped: { dot: 'bg-muted-foreground/50', label: 'skipped' },
  failed: { dot: 'bg-red-500', label: 'failed' },
  running: { dot: 'bg-blue-500 animate-pulse', label: 'running' }
};

const MODE_ICON: Record<string, LucideIcon> = {
  advisory: Eye,
  paper: FlaskConical,
  live: Zap
};

const MARKET_ICON: Record<string, LucideIcon> = {
  us: Landmark,
  eu: Globe,
  crypto: Bitcoin
};

const STRATEGY_ICON: Record<string, LucideIcon> = {
  momentum: Gauge,
  trend: TrendingUp,
  mean_reversion: Repeat,
  breakout: Flame,
  scalp: Zap,
  swing: MoonStar
};

function BotBadge({
  icon: Icon,
  label,
  className,
  title
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium leading-none',
        className ?? 'bg-muted text-muted-foreground'
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function stepDuration(step: AutomationRunStep): string {
  if (!step.finishedAt) return '…';
  const ms = new Date(step.finishedAt).getTime() - new Date(step.startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// Human-readable summary of a step's detail payload.
function formatStepDetail(step: AutomationRunStep): string {
  const d = step.detail ?? {};
  const symbol = step.step.replace('analyze:', '');

  switch (true) {
    case step.step.startsWith('analyze:'):
      return [
        symbol,
        d.action ? `${d.action} ${d.confidence ?? ''}%` : '',
        d.price ? `@ ${d.price}` : '',
        d.entry ? `entry ${d.entry}` : '',
        d.stopLoss ? `SL ${d.stopLoss}` : '',
        d.takeProfit ? `TP ${d.takeProfit}` : '',
        d.outcome ? `→ ${d.outcome}` : ''
      ]
        .filter(Boolean)
        .join(' · ');
    case step.step === 'pre_screen':
      return `candidates: ${(d.candidates as string[])?.join(', ') ?? '—'}`;
    case step.step === 'account':
      return [
        d.equity ? `equity ${money(Number(d.equity))}` : '',
        d.buyingPower ? `buying power ${money(Number(d.buyingPower))}` : '',
        `PDT ${d.patternDayTrader ? 'yes' : 'no'}`,
        d.tradeCount != null ? `trades today ${d.tradeCount}` : ''
      ]
        .filter(Boolean)
        .join(' · ');
    case step.step === 'mode':
      return `${d.mode} · ${d.provider} · ${d.environment} · auto-trade ${d.canTrade ? 'ON' : 'OFF'}`;
    case step.step === 'market_hours':
      return d.open ? `open · closing soon: ${d.closingSoon ? 'yes' : 'no'}` : 'market closed';
    case step.step === 'keys':
      return `broker ${d.tradingKey} · AI ${d.aiKey} · data ${d.marketDataKey}`;
    case step.step === 'universe':
      return `${d.count ?? 0} symbols`;
    case step.step === 'news':
      return `news for ${d.symbols ?? 0} symbols`;
    case step.step === 'reconcile':
      return 'synced fills with broker';
    case step.step === 'manage_stops':
      return 'checked trailing stops';
    case step.step === 'flatten':
      return 'closed positions before close';
    default:
      return d.error ? `error: ${String(d.error).slice(0, 120)}` : '';
  }
}

function StepRow({ step }: { step: AutomationRunStep }) {
  const meta = STEP_STATUS[step.status] ?? STEP_STATUS.skipped;
  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-accent/40">
      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', meta.dot)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium">{step.label}</span>
          <span className="text-[11px] text-muted-foreground">{step.step}</span>
        </div>
        {formatStepDetail(step) && (
          <p className="truncate text-xs text-muted-foreground">{formatStepDetail(step)}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {stepDuration(step)}
        </span>
        <span className="text-[11px] uppercase">{meta.label}</span>
      </div>
    </div>
  );
}

interface InstrumentEntry {
  symbol: string;
  markers: ChartMarkers | null;
}

function botInstruments(config: AutomationConfig): InstrumentEntry[] {
  const signals = config.latestSignals ?? {};
  const stepSymbols =
    config.latestRun?.steps
      .filter(s => s.step.startsWith('analyze:'))
      .map(s => s.step.slice('analyze:'.length)) ?? [];
  const base = config.symbols && config.symbols.length > 0 ? config.symbols : Object.keys(signals);
  const merged = [...new Set([...base, ...stepSymbols])];
  return merged.map(symbol => {
    const s = signals[symbol];
    const markers: ChartMarkers | null =
      s && (s.entryPrice != null || s.stopLoss != null || s.takeProfit != null)
        ? {
            entry: s.entryPrice ?? undefined,
            stopLoss: s.stopLoss ?? undefined,
            takeProfit: s.takeProfit ?? undefined
          }
        : null;
    return { symbol, markers };
  });
}

type BotStatus =
  | { kind: 'paused' }
  | { kind: 'running' }
  | { kind: 'stopped' }
  | { kind: 'market_closed'; market: string }
  | { kind: 'cooldown'; progress: number; remainingMs: number }
  | { kind: 'idle'; progress: number; countdownMs: number };

function botStatus(config: AutomationConfig, now: number): BotStatus {
  if (!config.enabled) return { kind: 'paused' };
  if (config.latestRun?.status === 'running') return { kind: 'running' };
  if (config.lastRunStatus === 'stopped') return { kind: 'stopped' };
  if (config.marketOpen === false) return { kind: 'market_closed', market: config.market ?? 'us' };

  if (config.cooldownUntil) {
    const until = new Date(config.cooldownUntil).getTime();
    const from = config.lastTradeAt
      ? new Date(config.lastTradeAt).getTime()
      : until - config.cooldownMinutes * 60000;
    const total = until - from;
    const remaining = until - now;
    if (remaining > 0) {
      return {
        kind: 'cooldown',
        progress: total > 0 ? Math.min(1, Math.max(0, 1 - remaining / total)) : 0,
        remainingMs: remaining
      };
    }
  }

  const next = new Date(config.nextRunAt).getTime();
  const last = config.lastRunAt
    ? new Date(config.lastRunAt).getTime()
    : next - config.scanIntervalMinutes * 60000;
  const total = next - last;
  const countdownMs = Math.max(0, next - now);
  return {
    kind: 'idle',
    progress: total > 0 ? Math.min(1, Math.max(0, 1 - countdownMs / total)) : 0,
    countdownMs
  };
}

function StatusIndicator({ status }: { status: BotStatus }) {
  switch (status.kind) {
    case 'paused':
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Pause className="h-3.5 w-3.5" /> Paused
        </span>
      );
    case 'running':
      return (
        <span className="flex items-center gap-1.5 text-xs text-blue-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…
        </span>
      );
    case 'stopped':
      return (
        <span className="flex items-center gap-1.5 text-xs text-red-600">
          <OctagonX className="h-3.5 w-3.5" /> Stopped — daily loss
        </span>
      );
    case 'market_closed':
      return (
        <span className="flex items-center gap-1.5 text-xs text-amber-600">
          <Clock className="h-3.5 w-3.5" />
          Market closed
          <span className="text-muted-foreground">
            · opens {status.market === 'eu' ? '9:00 CET' : '9:30 ET'}
          </span>
        </span>
      );
    case 'cooldown':
      return (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs text-amber-600">
            <Timer className="h-3.5 w-3.5" /> Cooldown {formatCountdown(status.remainingMs)}
          </span>
          <div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${Math.round(status.progress * 100)}%` }}
            />
          </div>
        </div>
      );
    case 'idle':
      return (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <Activity className="h-3.5 w-3.5" /> Next run {formatCountdown(status.countdownMs)}
          </span>
          <div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.round(status.progress * 100)}%` }}
            />
          </div>
        </div>
      );
  }
}

export default function AutomationOverview({
  automationConfigs,
  loading,
  onRefresh,
  onShowOnGraph,
  tradingKeys,
  aiKeys,
  marketDataKeys
}: AutomationOverviewProps) {
  const { toast } = useToast();
  const router = useRouter();
  const now = useNow(1000);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<AutomationConfig | null>(null);
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    setShowTip(!window.localStorage.getItem('ga.botsTipDismissed'));
  }, []);

  const active = automationConfigs.filter(c => c.enabled);

  const toggleExpanded = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const openCreate = () => {
    setEditingBot(null);
    setDialogOpen(true);
  };

  const openEdit = (config: AutomationConfig) => {
    setEditingBot(config);
    setDialogOpen(true);
  };

  const toggle = async (config: AutomationConfig) => {
    try {
      if (config.enabled && config.mode === 'live' && !config.allowLive) {
        toast('Live mode requires the allowLive flag', 'error');
        return;
      }
      const response = await TokenManager.makeAuthenticatedRequest(
        `/api/user/automation/${config.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !config.enabled })
        }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || body?.message || 'Failed to update automation');
      }
      toast(`Bot ${config.enabled ? 'paused' : 'started'}`, 'success');
      onRefresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update bot', 'error');
    }
  };

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardContent className="flex-1 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Cpu className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Trading Bots</h2>
                <p className="text-xs text-muted-foreground">
                  {active.length > 0
                    ? `${active.length} active — click an instrument to show it on the chart`
                    : 'No active bots'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => router.push('/bots')}>
                <BarChart3 className="mr-1.5 h-4 w-4" /> Status
              </Button>
              <Button
                size="lg"
                className="h-10 w-10 rounded-full p-0"
                onClick={openCreate}
                title="Add trading bot"
                aria-label="Add trading bot"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {showTip && automationConfigs.length > 0 && (
            <div className="mb-3 flex items-start justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">How it works:</span> a bot scans its
                instruments, the AI builds a trade plan, you approve it (or it runs on auto), and
                the bot manages stops &amp; the daily loss. Click an instrument —{' '}
                <span className="font-semibold text-foreground">Show on graph</span> — to see its
                entry / SL / TP on the chart.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.setItem('ga.botsTipDismissed', '1');
                  setShowTip(false);
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss tip"
              >
                ×
              </button>
            </div>
          )}

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading bots...</p>
          ) : automationConfigs.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No trading bots yet. Add one to let the AI trade autonomously.
              </p>
              <Button size="sm" className="mt-3" onClick={openCreate}>
                Add trading bot
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {automationConfigs.map(config => {
                const run = config.latestRun;
                const isExpanded = expanded[config.id];
                const status = botStatus(config, now);
                const instruments = botInstruments(config);
                return (
                  <div key={config.id} className="rounded-lg border">
                    <div className="flex flex-wrap items-start justify-between gap-2 p-2.5">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                        <span className="mr-1.5 font-semibold">{config.title}</span>
                        <BotBadge
                          icon={Power}
                          label={config.enabled ? 'Active' : 'Paused'}
                          className={config.enabled ? 'bg-green-500/10 text-green-600' : ''}
                        />
                        <BotBadge
                          icon={MODE_ICON[config.mode] ?? Eye}
                          label={config.mode}
                          title="Account mode"
                        />
                        <BotBadge
                          icon={MARKET_ICON[config.market ?? 'us'] ?? Landmark}
                          label={config.market ?? 'us'}
                          title="Market"
                        />
                        <BotBadge
                          icon={STRATEGY_ICON[config.strategy] ?? Gauge}
                          label={config.strategy}
                          title="Strategy"
                        />
                        {config.execution === 'approval' && (
                          <BotBadge
                            icon={Hand}
                            label="approval"
                            title="Requires your approval per trade"
                            className="bg-blue-500/10 text-blue-600"
                          />
                        )}
                        <BotBadge
                          icon={Timer}
                          label={`every ${config.scanIntervalMinutes}m`}
                          title="Scan interval"
                        />
                        {config.manageStops && (
                          <BotBadge icon={Route} label="trail" title="Trailing stops" />
                        )}
                        {config.stopOnLoss && (
                          <BotBadge
                            icon={ShieldAlert}
                            label="loss stop"
                            title="Stops on daily loss"
                          />
                        )}
                        {config.flattenAtClose && (
                          <BotBadge icon={Sunset} label="flatten" title="Flatten before close" />
                        )}
                        {run && (
                          <BotBadge
                            icon={Activity}
                            label={run.status}
                            className={
                              RUN_STATUS_STYLES[run.status] ?? 'bg-muted text-muted-foreground'
                            }
                          />
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(config)}
                          title="Edit bot"
                          aria-label="Edit bot"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggle(config)}
                          title={config.enabled ? 'Pause bot' : 'Start bot'}
                        >
                          {config.enabled ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleExpanded(config.id)}
                          title={isExpanded ? 'Collapse trace' : 'Show run trace'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 pb-1.5">
                      <StatusIndicator status={status} />
                      <span className="text-[11px] text-muted-foreground">
                        {config.universe === 'movers'
                          ? 'auto-hunting movers'
                          : config.universe === 'watchlist+movers'
                            ? 'watchlist + movers'
                            : 'watchlist'}
                      </span>
                    </div>

                    {instruments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 px-2.5 pb-1.5">
                        {instruments.map(({ symbol, markers }) => (
                          <button
                            key={symbol}
                            type="button"
                            onClick={() => onShowOnGraph?.(symbol, markers)}
                            className="group inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] transition-colors hover:border-primary hover:text-primary"
                            title={`Show ${symbol} on chart`}
                          >
                            <span className="font-semibold">{symbol}</span>
                            {markers && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            <span className="text-[10px] text-muted-foreground group-hover:text-primary">
                              Show on graph
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {isExpanded && (
                      <div className="border-t p-2">
                        {!run ? (
                          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No run recorded yet — it runs automatically on its schedule.
                          </p>
                        ) : run.steps.length === 0 ? (
                          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                            Run completed without detailed steps.
                          </p>
                        ) : (
                          <div className="space-y-0.5">
                            {run.steps.map(step => (
                              <StepRow key={step.id} step={step} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <BotDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={onRefresh}
        tradingKeys={tradingKeys}
        aiKeys={aiKeys}
        marketDataKeys={marketDataKeys}
        editing={editingBot}
      />
    </>
  );
}
