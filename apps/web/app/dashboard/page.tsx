'use client';

import ErrorState from '@/components/common/error-state';
import LoadingState from '@/components/common/loading-state';
import AutomationOverview from '@/components/dashboard/automation-overview';
import ChartPanel from '@/components/dashboard/chart-panel';
import PortfolioOverview from '@/components/dashboard/portfolio-overview';
import PositionRiskPanel from '@/components/dashboard/position-risk-panel';
import TerminalHeader from '@/components/dashboard/terminal-header';
import PageLayout from '@/components/layout/page-layout';
import { useToast } from '@/components/ui/toast';
import type { ChartMarkers } from '@/components/charts/lightweight-chart';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const {
    loading,
    error,
    tradingKeys,
    aiKeys,
    marketDataKeys,
    automationConfigs,
    automationsLoading,
    positions,
    accountSummary,
    positionsLoading,
    selectedTradingKey,
    setSelectedTradingKey,
    notification,
    clearNotification,
    refetch
  } = useDashboardData();
  const { toast } = useToast();
  const [chartSymbol, setChartSymbol] = useState('');
  const [chartMarkers, setChartMarkers] = useState<ChartMarkers | null>(null);

  useEffect(() => {
    if (notification) {
      toast(notification.message, notification.type);
      clearNotification();
    }
  }, [notification, clearNotification, toast]);

  // Support deep-linking from signals/trades: /dashboard?symbol=AAPL&entry=..&close=..&sl=..&tp=..
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sym = params.get('symbol');
    if (!sym) return;
    const num = (k: string) => {
      const v = params.get(k);
      return v ? Number(v) : undefined;
    };
    const entry = num('entry');
    const close = num('close');
    const sl = num('sl');
    const tp = num('tp');
    const markers: ChartMarkers = {};
    if (entry != null && !Number.isNaN(entry)) markers.entry = entry;
    if (close != null && !Number.isNaN(close)) markers.close = close;
    if (sl != null && !Number.isNaN(sl)) markers.stopLoss = sl;
    if (tp != null && !Number.isNaN(tp)) markers.takeProfit = tp;
    setChartSymbol(sym.toUpperCase());
    setChartMarkers(Object.keys(markers).length > 0 ? markers : null);
  }, []);

  const showOnGraph = (symbol: string, markers?: ChartMarkers | null) => {
    setChartSymbol(symbol);
    setChartMarkers(markers ?? null);
  };

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        {/* Account / PnL strip */}
        <TerminalHeader
          tradingKeys={tradingKeys}
          selectedTradingKey={selectedTradingKey}
          setSelectedTradingKey={setSelectedTradingKey}
          accountSummary={accountSummary}
          onRefresh={() => refetch.fetchPositions(selectedTradingKey)}
          refreshing={positionsLoading}
        />

        {/* Split: Trading bots (left) + Market chart (right) */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AutomationOverview
            automationConfigs={automationConfigs}
            loading={automationsLoading}
            onRefresh={refetch.fetchAutomations}
            onShowOnGraph={showOnGraph}
            tradingKeys={tradingKeys}
            aiKeys={aiKeys}
            marketDataKeys={marketDataKeys}
          />
          <ChartPanel
            symbol={chartSymbol}
            onSymbolChange={sym => {
              setChartSymbol(sym);
              setChartMarkers(null);
            }}
            markers={chartMarkers}
          />
        </div>

        {/* Position review (adjust SL/TP on bot-opened positions) */}
        <PositionRiskPanel positions={positions} tradingKeyId={selectedTradingKey} />

        {/* Portfolio below */}
        <PortfolioOverview
          positions={positions}
          accountSummary={accountSummary}
          loading={positionsLoading}
        />
      </div>
    </PageLayout>
  );
}
