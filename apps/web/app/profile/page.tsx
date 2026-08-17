'use client';

import ErrorSuccessAlert from '@/components/error-success-alert';
import PageLayout from '@/components/layout/page-layout';
import AiKeysSection from '@/components/profile/sections/ai-keys-section';
import MarketDataKeysSection from '@/components/profile/sections/market-data-keys-section';
import ProfileSection from '@/components/profile/sections/profile-section';
import RiskProfileSection from '@/components/profile/sections/risk-profile-section';
import TradingKeysSection from '@/components/profile/sections/trading-keys-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenManager } from '@/lib/token-manager';
import { AiApiKey, MarketDataKey, TradingApiKey, User } from '@/types/profile';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [aiKeys, setAiKeys] = useState<AiApiKey[]>([]);
  const [tradingKeys, setTradingKeys] = useState<TradingApiKey[]>([]);
  const [marketDataKeys, setMarketDataKeys] = useState<MarketDataKey[]>([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUser();
    fetchAiKeys();
    fetchTradingKeys();
    fetchMarketDataKeys();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile');
      if (!response.ok) throw new Error('Failed to fetch user data');

      const data = await response.json();
      setUser(data.user);
    } catch {
      setError('Failed to load user data');
    }
  };

  const fetchAiKeys = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/ai-keys');
      if (!response.ok) throw new Error('Failed to fetch AI keys');

      const data = await response.json();
      setAiKeys(data.aiKeys);
    } catch {
      // Failed to load AI keys - handle silently
    }
  };

  const fetchTradingKeys = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/trading-keys');
      if (!response.ok) throw new Error('Failed to fetch trading keys');

      const data = await response.json();
      setTradingKeys(data.tradingKeys);
    } catch {
      // Failed to load trading keys - handle silently
    }
  };

  const fetchMarketDataKeys = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/market-data-keys');
      if (!response.ok) throw new Error('Failed to fetch market data keys');

      const data = await response.json();
      setMarketDataKeys(data.marketDataKeys);
    } catch {
      // Failed to load market data keys - handle silently
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile-picture', {
      method: 'POST',
      body: formData,
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
    setError('');
    setSuccess('');

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
          ...(profilePictureUrl && { profilePicture: profilePictureUrl }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Profile updated successfully');
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddAiKey = async (data: { title: string; provider: string; apiKey: string }) => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/ai-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to add AI key');
      }

      setSuccess('AI key added successfully');
      await fetchAiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add AI key');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddTradingKey = async (data: {
    title: string;
    accessType: string;
    environment: string;
    apiKey: string;
    apiSecret: string;
  }) => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/trading-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to add trading key');
      }

      setSuccess('Trading key added successfully');
      await fetchTradingKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add trading key');
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
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle AI key');
      await fetchAiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle AI key');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAiKey = async (id: number) => {
    setUpdating(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest(`/api/user/ai-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete AI key');
      await fetchAiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete AI key');
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
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle trading key');
      await fetchTradingKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle trading key');
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
    setError('');
    setSuccess('');

    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/market-data-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to add market data key');
      }

      setSuccess('Market data key added successfully');
      await fetchMarketDataKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add market data key');
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
          body: JSON.stringify({ isActive }),
        }
      );

      if (!response.ok) throw new Error('Failed to toggle market data key');
      await fetchMarketDataKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle market data key');
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
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to delete market data key');
      await fetchMarketDataKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete market data key');
    } finally {
      setUpdating(false);
    }
  };

  const handleTestMarketDataKey = async (keyData: MarketDataKey) => {
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      const response = await TokenManager.makeAuthenticatedRequest(
        '/api/user/market-data-keys/test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyId: keyData.id }),
        }
      );

      if (!response.ok) throw new Error('Failed to test market data key');
      setSuccess('Market data key test successful');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test market data key');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTradingKey = async (id: number) => {
    setUpdating(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest(`/api/user/trading-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete trading key');
      await fetchTradingKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trading key');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateRiskProfile = async (data: { riskProfile: string }) => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update risk profile');

      setSuccess('Risk profile updated successfully');
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update risk profile');
    } finally {
      setUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    );
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

        <ErrorSuccessAlert error={error} success={success} />

        <Tabs value={activeSection} onValueChange={setActiveSection} className="mt-6">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="risk-profile">Risk Profile</TabsTrigger>
            <TabsTrigger value="ai-keys">AI Keys</TabsTrigger>
            <TabsTrigger value="trading-keys">Trading Keys</TabsTrigger>
            <TabsTrigger value="market-data-keys">Market Data</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSection
              user={user}
              onUpdate={handleUpdateProfile}
              updating={updating}
              error={error}
              success={success}
            />
          </TabsContent>

          <TabsContent value="risk-profile">
            <RiskProfileSection
              user={user}
              onUpdate={handleUpdateRiskProfile}
              updating={updating}
              error={error}
              success={success}
            />
          </TabsContent>

          <TabsContent value="ai-keys">
            <AiKeysSection
              aiKeys={aiKeys}
              onAdd={handleAddAiKey}
              onToggle={handleToggleAiKey}
              onDelete={handleDeleteAiKey}
              updating={updating}
              error={error}
              success={success}
            />
          </TabsContent>

          <TabsContent value="trading-keys">
            <TradingKeysSection
              tradingKeys={tradingKeys}
              onAdd={handleAddTradingKey}
              onToggle={handleToggleTradingKey}
              onDelete={handleDeleteTradingKey}
              updating={updating}
              error={error}
              success={success}
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
              error={error}
              success={success}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
