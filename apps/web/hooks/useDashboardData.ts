import { MOCK_POSITIONS } from '@/constants/dashboard';
import { TokenManager } from '@/lib/token-manager';
import { AiKey, NotificationData, Position, TradingKey, User } from '@/types/dashboard';
import { useEffect, useState } from 'react';

export const useDashboardData = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tradingKeys, setTradingKeys] = useState<TradingKey[]>([]);
  const [aiKeys, setAiKeys] = useState<AiKey[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [notification, setNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    fetchUser();
    fetchTradingKeys();
    fetchAiKeys();
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

  const fetchPositions = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/positions');

      if (!response.ok) {
        throw new Error('Failed to fetch positions');
      }

      const data = await response.json();
      setPositions(data.positions || []);
    } catch (err) {
      console.error('Failed to load positions:', err);
      // Set mock data for development
      setPositions(MOCK_POSITIONS);
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
    positions,
    notification,
    showNotification,
    clearNotification,
    refetch: {
      fetchUser,
      fetchTradingKeys,
      fetchAiKeys,
      fetchPositions,
    },
  };
};
