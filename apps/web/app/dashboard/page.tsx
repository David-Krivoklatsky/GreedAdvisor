'use client';

import ErrorState from '@/components/common/error-state';
import LoadingState from '@/components/common/loading-state';
import AiAdvisorPanel from '@/components/dashboard/ai-advisor-panel';
import ChartPanel from '@/components/dashboard/chart-panel';
import PortfolioOverview from '@/components/dashboard/portfolio-overview';
import TerminalHeader from '@/components/dashboard/terminal-header';
import PageLayout from '@/components/layout/page-layout';
import Notification from '@/components/notification';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function DashboardPage() {
  const {
    loading,
    error,
    tradingKeys,
    aiKeys,
    marketDataKeys,
    positions,
    accountSummary,
    positionsLoading,
    selectedTradingKey,
    setSelectedTradingKey,
    notification,
    showNotification,
    clearNotification,
  } = useDashboardData();

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <PageLayout hasNewNotifications={true}>
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        {/* Account / PnL strip */}
        <TerminalHeader
          tradingKeys={tradingKeys}
          selectedTradingKey={selectedTradingKey}
          setSelectedTradingKey={setSelectedTradingKey}
          accountSummary={accountSummary}
        />

        {/* Main grid: chart + advisor side by side */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ChartPanel />
          </div>
          <div className="min-h-[520px]">
            <AiAdvisorPanel
              tradingKeys={tradingKeys}
              aiKeys={aiKeys}
              marketDataKeys={marketDataKeys}
              selectedTradingKey={selectedTradingKey}
              onNotification={showNotification}
            />
          </div>
        </div>

        {/* Portfolio below */}
        <PortfolioOverview
          positions={positions}
          accountSummary={accountSummary}
          loading={positionsLoading}
        />
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}
    </PageLayout>
  );
}
