'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import type { AutomationConfig, AutomationRunStep } from '@/types/dashboard';
import { cn } from '@greed-advisor/utils';
import { ChevronDown, ChevronRight, Clock, Cpu, Pause, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AutomationOverviewProps {
  automationConfigs: AutomationConfig[];
  loading: boolean;
  onRefresh: () => void;
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

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
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

export default function AutomationOverview({
  automationConfigs,
  loading,
  onRefresh
}: AutomationOverviewProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const active = automationConfigs.filter(c => c.enabled);

  const toggleExpanded = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

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
      toast(`Automation ${config.enabled ? 'paused' : 'started'}`, 'success');
      onRefresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update automation', 'error');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Autonomous Trading</h2>
              <p className="text-xs text-muted-foreground">
                {active.length > 0
                  ? `${active.length} active automation${active.length === 1 ? '' : 's'} — live step-by-step trace`
                  : 'No active automations'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/automation')}>
            Manage
          </Button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading automations...</p>
        ) : automationConfigs.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No automations yet. Create one to let the AI trade autonomously.
            </p>
            <Button size="sm" className="mt-3" onClick={() => router.push('/automation')}>
              Create automation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {automationConfigs.map(config => {
              const run = config.latestRun;
              const isExpanded = expanded[config.id];
              return (
                <div key={config.id} className="rounded-lg border">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={config.enabled ? 'bg-green-500/10 text-green-600' : ''}
                      >
                        {config.enabled ? 'Active' : 'Paused'}
                      </Badge>
                      <span className="font-medium">{config.title}</span>
                      <Badge variant="outline">{config.mode}</Badge>
                      <Badge variant="outline">every {config.scanIntervalMinutes}m</Badge>
                      {config.universe === 'watchlist+movers' && (
                        <Badge variant="outline">+movers</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {run && (
                        <Badge className={RUN_STATUS_STYLES[run.status] ?? 'bg-muted'}>
                          {run.status}
                        </Badge>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => toggle(config)}>
                        {config.enabled ? (
                          <>
                            <Pause className="mr-1 h-3.5 w-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-1 h-3.5 w-3.5" /> Start
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpanded(config.id)}
                        aria-label={isExpanded ? 'Collapse trace' : 'Show run trace'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="px-3 pb-1 text-xs text-muted-foreground">
                    {config.nextRunAt ? (
                      <>next run {new Date(config.nextRunAt).toLocaleString()}</>
                    ) : (
                      'next run pending'
                    )}
                    {run && run.startedAt && (
                      <>
                        {' · '}last run {new Date(run.startedAt).toLocaleString()}
                      </>
                    )}
                  </div>

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
  );
}
