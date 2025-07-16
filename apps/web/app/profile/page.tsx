'use client';

import ErrorSuccessAlert from '@/components/error-success-alert';
import PageLayout from '@/components/layout/page-layout';
import AiKeysSection from '@/components/profile/sections/ai-keys-section';
import ProfileSection from '@/components/profile/sections/profile-section';
import TradingKeysSection from '@/components/profile/sections/trading-keys-section';
import Sidebar from '@/components/sidebar';
import { TokenManager } from '@/lib/token-manager';
import { AiApiKey, TradingApiKey, User } from '@/types/profile';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [aiKeys, setAiKeys] = useState<AiApiKey[]>([]);
  const [tradingKeys, setTradingKeys] = useState<TradingApiKey[]>([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchAiKeys();
    fetchTradingKeys();
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
    } catch (err) {
      console.error('Failed to load AI keys:', err);
    }
  };

  const fetchTradingKeys = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/trading-keys');
      if (!response.ok) throw new Error('Failed to fetch trading keys');

      const data = await response.json();
      setTradingKeys(data.tradingKeys);
    } catch (err) {
      console.error('Failed to load trading keys:', err);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await TokenManager.makeAuthenticatedRequest(
      '/api/user/upload-profile-picture',
      {
        method: 'POST',
        body: formData,
      }
    );

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
    apiKey: string;
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

  const handleLogout = async () => {
    try {
      await TokenManager.makeAuthenticatedRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      TokenManager.removeAccessToken();
      router.push('/');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout logoPosition="sidebar">
      <div className="min-h-screen bg-gray-50 flex">
        <div className="w-96 bg-white shadow-lg">
          <Sidebar
            user={user}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onLogout={handleLogout}
          />
        </div>

        <div className="flex-1 p-8">
          <div className="max-w-4xl">
            <ErrorSuccessAlert error={error} success={success} />

            {activeSection === 'profile' && (
              <ProfileSection
                user={user}
                onUpdate={handleUpdateProfile}
                updating={updating}
                error={error}
                success={success}
              />
            )}

            {activeSection === 'ai-keys' && (
              <AiKeysSection
                aiKeys={aiKeys}
                onAdd={handleAddAiKey}
                onToggle={handleToggleAiKey}
                onDelete={handleDeleteAiKey}
                updating={updating}
                error={error}
                success={success}
              />
            )}

            {activeSection === 'trading-keys' && (
              <TradingKeysSection
                tradingKeys={tradingKeys}
                onAdd={handleAddTradingKey}
                onToggle={handleToggleTradingKey}
                onDelete={handleDeleteTradingKey}
                updating={updating}
                error={error}
                success={success}
              />
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
