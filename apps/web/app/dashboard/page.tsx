'use client';

import AiReportModal from '@/components/ai-report-modal';
import ErrorState from '@/components/common/error-state';
import LoadingState from '@/components/common/loading-state';
import DashboardPanels from '@/components/dashboard/dashboard-panels';
import TradingChart from '@/components/dashboard/trading-chart';
import PageLayout from '@/components/layout/page-layout';
import Notification from '@/components/notification';
import { useAiReport } from '@/hooks/useAiReport';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useState } from 'react';

export default function DashboardPage() {
  // UI state
  const [selectedTradingKey, setSelectedTradingKey] = useState<string>('');
  const [selectedAiKey, setSelectedAiKey] = useState<string>('');
  const [selectedMarketDataKey, setSelectedMarketDataKey] = useState<string>('');
  const [selectedReportType, setSelectedReportType] = useState<string>('');

  // Custom hooks for data and AI reports
  const {
    loading,
    error,
    tradingKeys,
    aiKeys,
    marketDataKeys,
    positions,
    cash,
    notification,
    showNotification,
    clearNotification,
  } = useDashboardData();

  const { generatingReport, aiReport, showAiReport, generateReport, closeAiReport } =
    useAiReport(showNotification);

  // Handle AI report generation
  const handleGenerateReport = (symbol: string) => {
    generateReport(
      selectedTradingKey,
      selectedAiKey,
      selectedMarketDataKey,
      selectedReportType,
      symbol
    );
  };

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

        {/* Dashboard Panels - AI Report & Positions */}
        <DashboardPanels
          tradingKeys={tradingKeys}
          aiKeys={aiKeys}
          marketDataKeys={marketDataKeys}
          positions={positions}
          cash={cash}
          selectedTradingKey={selectedTradingKey}
          setSelectedTradingKey={setSelectedTradingKey}
          selectedAiKey={selectedAiKey}
          setSelectedAiKey={setSelectedAiKey}
          selectedMarketDataKey={selectedMarketDataKey}
          setSelectedMarketDataKey={setSelectedMarketDataKey}
          selectedReportType={selectedReportType}
          setSelectedReportType={setSelectedReportType}
          generatingReport={generatingReport}
          onGenerateReport={handleGenerateReport}
          onShowNotification={showNotification}
        />
      </div>

      {/* Modals and Notifications */}
      <AiReportModal isVisible={showAiReport} onClose={closeAiReport} report={aiReport} />

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
