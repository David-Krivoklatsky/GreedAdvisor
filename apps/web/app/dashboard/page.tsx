'use client';

import ErrorState from '@/components/common/error-state';
import LoadingState from '@/components/common/loading-state';
import DashboardPanels from '@/components/dashboard/dashboard-panels';
import TradingChart from '@/components/dashboard/trading-chart';
import PageLayout from '@/components/layout/page-layout';
import Notification from '@/components/notification';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function DashboardPage() {
  // Custom hooks for data
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

  // Loading state
  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <PageLayout hasNewNotifications={true}>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Trading Chart Section */}
        <TradingChart />

        {/* Dashboard Panels - AI Advisor & Portfolio */}
        <DashboardPanels
          tradingKeys={tradingKeys}
          aiKeys={aiKeys}
          marketDataKeys={marketDataKeys}
          positions={positions}
          accountSummary={accountSummary}
          positionsLoading={positionsLoading}
          selectedTradingKey={selectedTradingKey}
          setSelectedTradingKey={setSelectedTradingKey}
          onShowNotification={showNotification}
        />
      </div>

      {/* Notifications */}
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
