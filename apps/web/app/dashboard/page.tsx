'use client';

import ErrorState from '@/components/common/error-state';
import LoadingState from '@/components/common/loading-state';
import AiAdvisorPanel from '@/components/dashboard/ai-advisor-panel';
import ChartPanel from '@/components/dashboard/chart-panel';
import PortfolioOverview from '@/components/dashboard/portfolio-overview';
import TerminalHeader from '@/components/dashboard/terminal-header';
import PageLayout from '@/components/layout/page-layout';
import RiskProfileSection from '@/components/profile/sections/risk-profile-section';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useEffect, useState } from 'react';

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
    clearNotification,
    user,
    refetch,
  } = useDashboardData();
  const { toast } = useToast();
  const [riskUpdating, setRiskUpdating] = useState(false);

  useEffect(() => {
    if (notification) {
      toast(notification.message, notification.type);
      clearNotification();
    }
  }, [notification, clearNotification, toast]);

  const handleUpdateRiskProfile = async (data: { riskProfile: string }) => {
    setRiskUpdating(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to update risk profile');
      }

      await refetch.fetchUser();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update risk profile');
    } finally {
      setRiskUpdating(false);
    }
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
        />

        {/* Main grid: chart + advisor side by side */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ChartPanel />
          </div>
          <div className="min-h-[520px] space-y-4">
            <AiAdvisorPanel
              tradingKeys={tradingKeys}
              aiKeys={aiKeys}
              marketDataKeys={marketDataKeys}
              selectedTradingKey={selectedTradingKey}
              onNotification={({ message, type }) => toast(message, type)}
            />
            {user && (
              <RiskProfileSection
                user={user}
                onUpdate={handleUpdateRiskProfile}
                updating={riskUpdating}
                stacked
              />
            )}
          </div>
        </div>

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
