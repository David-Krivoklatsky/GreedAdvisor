import { TokenManager } from '@/lib/token-manager';
import {
  AiKey,
  CashAccount,
  MarketDataKey,
  NotificationData,
  Position,
  TradingKey,
  User,
} from '@/types/dashboard';
import { useEffect, useState } from 'react';

export const useDashboardData = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tradingKeys, setTradingKeys] = useState<TradingKey[]>([]);
  const [aiKeys, setAiKeys] = useState<AiKey[]>([]);
  const [marketDataKeys, setMarketDataKeys] = useState<MarketDataKey[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [cash, setCash] = useState<CashAccount | null>(null);
  const [notification, setNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    fetchUser();
    fetchTradingKeys();
    fetchAiKeys();
    fetchMarketDataKeys();
    fetchPositions();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching user:', err);
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
    } catch (err) {
      console.error('Failed to load trading keys:', err);
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
    } catch (err) {
      console.error('Failed to load AI keys:', err);
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
    } catch (err) {
      console.error('Failed to load market data keys:', err);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/positions');

      // No active Trading212 key configured - not an error, just empty state
      if (response.status === 404) {
        setPositions([]);
        setCash(null);
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.error || body?.details || 'Failed to fetch positions';
        throw new Error(message);
      }

      const data = await response.json();
      setPositions(data.positions || []);
      if (data.cash) {
        setCash(data.cash);
      }
    } catch (err) {
      console.error('Failed to load positions:', err);
      setPositions([]);
      setCash(null);
      showNotification({
        message: err instanceof Error ? err.message : 'Failed to load positions',
        type: 'warning',
      });
    }
  };

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
    positions,
    cash,
    notification,
    showNotification,
    clearNotification,
    refetch: {
      fetchUser,
      fetchTradingKeys,
      fetchAiKeys,
      fetchMarketDataKeys,
      fetchPositions,
    },
  };
};
