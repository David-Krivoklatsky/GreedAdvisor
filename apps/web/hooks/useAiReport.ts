import { TokenManager } from '@/lib/token-manager';
import { NotificationData } from '@/types/dashboard';
import { useState } from 'react';

export const useAiReport = (showNotification: (notification: NotificationData) => void) => {
  const [generatingReport, setGeneratingReport] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [showAiReport, setShowAiReport] = useState(false);

  const generateReport = async (
    selectedTradingKey: string,
    selectedAiKey: string,
    selectedReportType: string,
    symbol: string
  ) => {
    if (!selectedTradingKey || !selectedAiKey || !selectedReportType) {
      showNotification({
        message: 'Please select all required options before generating a report.',
        type: 'warning',
      });
      return;
    }

    setGeneratingReport(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/ai/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tradingKeyId: selectedTradingKey,
          aiKeyId: selectedAiKey,
          reportType: selectedReportType,
          symbol: symbol,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setAiReport(data.report);
      setShowAiReport(true);
      showNotification({
        message: 'AI report generated successfully!',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to generate report:', err);
      showNotification({
        message: 'Failed to generate report. Please try again.',
        type: 'error',
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const closeAiReport = () => {
    setShowAiReport(false);
  };

  return {
    generatingReport,
    aiReport,
    showAiReport,
    generateReport,
    closeAiReport,
  };
};
