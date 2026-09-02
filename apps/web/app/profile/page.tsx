'use client';

import LoadingState from '@/components/common/loading-state';
import PageLayout from '@/components/layout/page-layout';
import AiKeysSection from '@/components/profile/sections/ai-keys-section';
import MarketDataKeysSection from '@/components/profile/sections/market-data-keys-section';
import ProfileSection from '@/components/profile/sections/profile-section';
import TradingKeysSection from '@/components/profile/sections/trading-keys-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import { AiApiKey, MarketDataKey, TradingApiKey, User } from '@/types/profile';
import { useCallback, useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [aiKeys, setAiKeys] = useState<AiApiKey[]>([]);
  const [tradingKeys, setTradingKeys] = useState<TradingApiKey[]>([]);
  const [marketDataKeys, setMarketDataKeys] = useState<MarketDataKey[]>([]);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchUser = useCallback(async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile');
      if (!response.ok) throw new Error('Failed to fetch user data');

      const data = await response.json();
      setUser(data.user);
    } catch {
      toast('Failed to load user data', 'error');
    }
  }, [toast]);

  const fetchAiKeys = useCallback(async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/ai-keys');
      if (!response.ok) throw new Error('Failed to fetch AI keys');

      const data = await response.json();
      setAiKeys(data.aiKeys);
    } catch {
      // Failed to load AI keys - handle silently
    }
  }, []);

  const fetchTradingKeys = useCallback(async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/trading-keys');
      if (!response.ok) throw new Error('Failed to fetch trading keys');

      const data = await response.json();
      setTradingKeys(data.tradingKeys);
    } catch {
      // Failed to load trading keys - handle silently
    }
  }, []);

  const fetchMarketDataKeys = useCallback(async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/market-data-keys');
      if (!response.ok) throw new Error('Failed to fetch market data keys');

      const data = await response.json();
      setMarketDataKeys(data.marketDataKeys);
    } catch {
      // Failed to load market data keys - handle silently
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchAiKeys();
    fetchTradingKeys();
    fetchMarketDataKeys();
  }, [fetchUser, fetchAiKeys, fetchTradingKeys, fetchMarketDataKeys]);

  const uploadProfilePicture = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile-picture', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload profile picture');
    }

    const data = await response.json();
    return data.profilePictureUrl;
  };

  const handleUpdateProfile = async (data: {
    email: string;
    password?: string;
    profilePictureFile?: File;
  }) => {
    setUpdating(true);

    try {
      let profilePictureUrl = user?.profilePicture;

      if (data.profilePictureFile) {
        profilePictureUrl = await uploadProfilePicture(data.profilePictureFile);
      }

      const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          ...(data.password && { password: data.password }),
          ...(profilePictureUrl && { profilePicture: profilePictureUrl })
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast('Profile updated successfully', 'success');
      await fetchUser();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddAiKey = async (data: {
    title: string;
    provider: string;
    apiKey: string;
    modelTier?: string;
  }) => {
    setUpdating(true);

    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/ai-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to add AI key');
      }

      toast('AI key added successfully', 'success');
      await fetchAiKeys();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add AI key', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddTradingKey = async (data: {
    title: string;
    provider: string;
    accessType: string;
    environment: string;
    apiKey: string;
    apiSecret: string;
  }) => {
    setUpdating(true);

    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/trading-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to add trading key');
      }

      toast('Trading key added successfully', 'success');
      await fetchTradingKeys();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add trading key', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAiKey = async (id: number, isActive: boolean) => {
    setUpdating(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest(`/api/user/ai-keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) throw new Error('Failed to toggle AI key');
      toast(isActive ? 'AI key activated' : 'AI key deactivated', 'success');
      await fetchAiKeys();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to toggle AI key', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAiKey = async (id: number) => {
    setUpdating(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest(`/api/user/ai-keys/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete AI key');
      toast('AI key deleted', 'success');
      await fetchAiKeys();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete AI key', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleTradingKey = async (id: number, isActive: boolean) => {
    setUpdating(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest(`/api/user/trading-keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) throw new Error('Failed to toggle trading key');
      toast(isActive ? 'Trading key activated' : 'Trading key deactivated', 'success');
      await fetchTradingKeys();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to toggle trading key', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddMarketDataKey = async (data: {
    title: string;
    provider: string;
    apiKey: string;
  }) => {
    setUpdating(true);

    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/market-data-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to add market data key');
      }

      toast('Market data key added successfully', 'success');
      await fetchMarketDataKeys();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add market data key', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleMarketDataKey = async (id: number, isActive: boolean) => {
    setUpdating(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest(
        `/api/user/market-data-keys/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive })
        }
      );

      if (!response.ok) throw new Error('Failed to toggle market data key');
      toast(isActive ? 'Market data key activated' : 'Market data key deactivated', 'success');
      await fetchMarketDataKeys();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to toggle market data key', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteMarketDataKey = async (id: number) => {
    setUpdating(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest(
        `/api/user/market-data-keys/${id}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) throw new Error('Failed to delete market data key');
      toast('Market data key deleted', 'success');
      await fetchMarketDataKeys();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete market data key', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleTestMarketDataKey = async (keyData: MarketDataKey) => {
    setUpdating(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest(
        '/api/user/market-data-keys/test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyId: keyData.id })
        }
      );

      if (!response.ok) throw new Error('Failed to test market data key');
      toast('Market data key test successful', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to test market data key', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTradingKey = async (id: number) => {
    setUpdating(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest(`/api/user/trading-keys/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete trading key');
      toast('Trading key deleted', 'success');
      await fetchTradingKeys();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete trading key', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (!user) {
    return <LoadingState message="Loading profile..." />;
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account, keys, and risk preferences
          </p>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection} className="mt-6">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="ai-keys">AI Keys</TabsTrigger>
            <TabsTrigger value="trading-keys">Trading Keys</TabsTrigger>
            <TabsTrigger value="market-data-keys">Market Data</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSection user={user} onUpdate={handleUpdateProfile} updating={updating} />
          </TabsContent>

          <TabsContent value="ai-keys">
            <AiKeysSection
              aiKeys={aiKeys}
              onAdd={handleAddAiKey}
              onToggle={handleToggleAiKey}
              onDelete={handleDeleteAiKey}
              updating={updating}
            />
          </TabsContent>

          <TabsContent value="trading-keys">
            <TradingKeysSection
              tradingKeys={tradingKeys}
              onAdd={handleAddTradingKey}
              onToggle={handleToggleTradingKey}
              onDelete={handleDeleteTradingKey}
              updating={updating}
            />
          </TabsContent>

          <TabsContent value="market-data-keys">
            <MarketDataKeysSection
              marketDataKeys={marketDataKeys}
              onAdd={handleAddMarketDataKey}
              onToggle={handleToggleMarketDataKey}
              onDelete={handleDeleteMarketDataKey}
              onTest={handleTestMarketDataKey}
              updating={updating}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
