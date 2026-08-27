import { TokenManager } from '@/lib/token-manager';
import {
  AccountSummary,
  AiKey,
  AutomationConfig,
  MarketDataKey,
  NotificationData,
  Position,
  TradingKey,
  User
} from '@/types/dashboard';
import { useCallback, useEffect, useState } from 'react';

export const useDashboardData = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tradingKeys, setTradingKeys] = useState<TradingKey[]>([]);
  const [aiKeys, setAiKeys] = useState<AiKey[]>([]);
  const [marketDataKeys, setMarketDataKeys] = useState<MarketDataKey[]>([]);
  const [automationConfigs, setAutomationConfigs] = useState<AutomationConfig[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [selectedTradingKey, setSelectedTradingKey] = useState<string>('');
  const [notification, setNotification] = useState<NotificationData | null>(null);

  const STORAGE_KEY = 'ga.selectedTradingKey';

  const fetchUser = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUser(data.user);
    } catch {
      setError('Failed to load user data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTradingKeys = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/trading-keys');

      if (!response.ok) {
        throw new Error('Failed to fetch trading keys');
      }

      const data = await response.json();
      setTradingKeys(data.tradingKeys.filter((key: TradingKey) => key.isActive));
    } catch {
      setError('Failed to load trading keys');
    }
  };

  const fetchAiKeys = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/ai-keys');

      if (!response.ok) {
        throw new Error('Failed to fetch AI keys');
      }

      const data = await response.json();
      setAiKeys(data.aiKeys.filter((key: AiKey) => key.isActive));
    } catch {
      setError('Failed to load AI keys');
    }
  };

  const fetchMarketDataKeys = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/market-data-keys');

      if (!response.ok) {
        throw new Error('Failed to fetch market data keys');
      }

      const data = await response.json();
      setMarketDataKeys(data.marketDataKeys.filter((key: MarketDataKey) => key.isActive));
    } catch {
      setError('Failed to load market data keys');
    }
  };

  const fetchAutomations = useCallback(async () => {
    setAutomationsLoading(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/automation');
      if (!response.ok) throw new Error('Failed to fetch automations');
      const data = await response.json();
      setAutomationConfigs(data.automationConfigs ?? []);
    } catch {
      setAutomationConfigs([]);
    } finally {
      setAutomationsLoading(false);
    }
  }, []);

  const fetchPositions = useCallback(async (keyId?: string) => {
    setPositionsLoading(true);
    try {
      const url = keyId ? `/api/user/positions?keyId=${keyId}` : '/api/user/positions';
      const response = await TokenManager.makeAuthenticatedRequest(url);

      // No active Trading212 key configured - not an error, just empty state
      if (response.status === 404) {
        setPositions([]);
        setAccountSummary(null);
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.error || body?.details || 'Failed to fetch positions';
        throw new Error(message);
      }

      const data = await response.json();
      setPositions(data.positions || []);
      setAccountSummary(data.accountSummary || null);
    } catch {
      // Keep the previously loaded account data — a failed refresh must not
      // wipe the user's balances.
      showNotification({
        message: "Couldn't load info from trading API",
        type: 'warning'
      });
    } finally {
      setPositionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchTradingKeys();
    fetchAiKeys();
    fetchMarketDataKeys();
    fetchAutomations();
  }, [fetchAutomations]);

  // When trading keys load, auto-select the previously used active one (persisted),
  // falling back to the first active key.
  useEffect(() => {
    if (tradingKeys.length > 0) {
      setSelectedTradingKey(prev => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const preferred =
          stored && tradingKeys.some(k => k.id.toString() === stored) ? stored : prev;
        const next =
          preferred && tradingKeys.some(k => k.id.toString() === preferred)
            ? preferred
            : tradingKeys[0].id.toString();
        window.localStorage.setItem(STORAGE_KEY, next);
        return next;
      });
    } else {
      setPositions([]);
      setAccountSummary(null);
    }
  }, [tradingKeys]);

  // Persist the selection so the dashboard restores it on the next visit.
  useEffect(() => {
    if (selectedTradingKey) {
      window.localStorage.setItem(STORAGE_KEY, selectedTradingKey);
    }
  }, [selectedTradingKey]);

  // When selected trading key changes, load the portfolio
  useEffect(() => {
    if (selectedTradingKey) {
      fetchPositions(selectedTradingKey);
    }
  }, [selectedTradingKey, fetchPositions]);

  const showNotification = (notification: NotificationData) => {
    setNotification(notification);
  };

  const clearNotification = () => {
    setNotification(null);
  };

  return {
    user,
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
    showNotification,
    clearNotification,
    refetch: {
      fetchUser,
      fetchTradingKeys,
      fetchAiKeys,
      fetchMarketDataKeys,
      fetchAutomations,
      fetchPositions
    }
  };
};
