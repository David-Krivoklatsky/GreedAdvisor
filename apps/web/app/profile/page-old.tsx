'use client';

import ErrorSuccessAlert from '@/components/error-success-alert';
import KeyCard from '@/components/key-card';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/sidebar';
import ApiKeyInput from '@/components/forms/api-key-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TokenManager } from '@/lib/token-manager';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  createdAt: string;
}

interface AiApiKey {
  id: number;
  title: string;
  provider: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  apiKey: string;
}

interface TradingApiKey {
  id: number;
  title: string;
  accessType: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  apiKey: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [aiKeys, setAiKeys] = useState<AiApiKey[]>([]);
  const [tradingKeys, setTradingKeys] = useState<TradingApiKey[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddAiKey, setShowAddAiKey] = useState(false);
  const [showAddTradingKey, setShowAddTradingKey] = useState(false);
  const router = useRouter();

  // New AI Key form state
  const [newAiKey, setNewAiKey] = useState({
    title: '',
    provider: 'openai',
    apiKey: '',
  });

  // New Trading Key form state
  const [newTradingKey, setNewTradingKey] = useState({
    title: '',
    accessType: 'read-only',
    apiKey: '',
  });

  useEffect(() => {
    fetchUser();
    fetchAiKeys();
    fetchTradingKeys();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUser(data.user);
      setEmail(data.user.email);
      setProfilePicture(data.user.profilePicture || '');
    } catch {
      setError('Failed to load user data');
    }
  };

  const fetchAiKeys = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/ai-keys');

      if (!response.ok) {
        throw new Error('Failed to fetch AI keys');
      }

      const data = await response.json();
      setAiKeys(data.aiKeys);
    } catch (err) {
      console.error('Failed to load AI keys:', err);
    }
  };

  const fetchTradingKeys = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/trading-keys');

      if (!response.ok) {
        throw new Error('Failed to fetch trading keys');
      }

      const data = await response.json();
      setTradingKeys(data.tradingKeys);
    } catch (err) {
      console.error('Failed to load trading keys:', err);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = event => {
        setProfilePicture(event.target?.result as string);
      };
      reader.readAsDataURL(file);
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
      const data = await response.json();
      throw new Error(data.error || 'Failed to upload profile picture');
    }

    const data = await response.json();
    return data.profilePictureUrl;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      setUpdating(false);
      return;
    }

    try {
      let uploadedProfilePictureUrl = profilePicture;

      // Upload profile picture if a new file was selected
      if (profilePictureFile) {
        uploadedProfilePictureUrl = await uploadProfilePicture(profilePictureFile);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password: password || undefined,
          profilePicture: uploadedProfilePictureUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setProfilePictureFile(null);
      // Refresh user data to get updated profile picture
      fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddAiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/ai-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAiKey),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add AI key');
      }

      setSuccess('AI key added successfully!');
      setNewAiKey({ title: '', provider: 'openai', apiKey: '' });
      setShowAddAiKey(false);
      fetchAiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add AI key');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddTradingKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/trading-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTradingKey),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add trading key');
      }

      setSuccess('Trading key added successfully!');
      setNewTradingKey({ title: '', accessType: 'read-only', apiKey: '' });
      setShowAddTradingKey(false);
      fetchTradingKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add trading key');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAiKey = async (keyId: number) => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await TokenManager.makeAuthenticatedRequest(`/api/user/ai-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete AI key');
      }

      setSuccess('AI key deleted successfully!');
      fetchAiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete AI key');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTradingKey = async (keyId: number) => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await TokenManager.makeAuthenticatedRequest(
        `/api/user/trading-keys/${keyId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete trading key');
      }

      setSuccess('Trading key deleted successfully!');
      fetchTradingKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trading key');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAiKey = async (keyId: number, isActive: boolean) => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await TokenManager.makeAuthenticatedRequest(`/api/user/ai-keys/${keyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle AI key');
      }

      setSuccess(`AI key ${!isActive ? 'activated' : 'deactivated'} successfully!`);
      fetchAiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle AI key');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleTradingKey = async (keyId: number, isActive: boolean) => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await TokenManager.makeAuthenticatedRequest(
        `/api/user/trading-keys/${keyId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive: !isActive }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle trading key');
      }

      setSuccess(`Trading key ${!isActive ? 'activated' : 'deactivated'} successfully!`);
      fetchTradingKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle trading key');
    } finally {
      setUpdating(false);
    }
  };

  // Market Data Fetching Function based on Provider
  const fetchMarketDataByProvider = async (
    provider: string,
    apiKey: string,
    fromCurrency: string = 'USD',
    toCurrency: string = 'EUR'
  ) => {
    try {
      let url = '';
      const options: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      switch (provider.toLowerCase()) {
        case 'alphavantage':
          // Alpha Vantage API - Currency Exchange Rate
          url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`;
          break;

        case 'finnhub':
          // Finnhub API - Forex Candles
          const symbol = `OANDA:${fromCurrency}_${toCurrency}`;
          const to = Math.floor(Date.now() / 1000);
          const from = to - 86400; // 24 hours ago
          url = `https://finnhub.io/api/v1/forex/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;
          break;

        case 'iexcloud':
          // IEX Cloud API - Currency Rates
          url = `https://cloud.iexapis.com/stable/fx/latest?symbols=${fromCurrency}${toCurrency}&token=${apiKey}`;
          break;

        case 'polygon':
          // Polygon.io API - Real-time Currency Conversion
          url = `https://api.polygon.io/v1/conversion/${fromCurrency}/${toCurrency}?amount=1&precision=2&apikey=${apiKey}`;
          break;

        case 'tradingview':
          // TradingView API (Note: This is a placeholder as TradingView's API access is limited)
          throw new Error(
            'TradingView API requires special access. Please use their widget integration instead.'
          );

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Normalize the response based on provider
      return normalizeMarketDataResponse(provider, data, fromCurrency, toCurrency);
    } catch (error) {
      console.error(`Error fetching data from ${provider}:`, error);
      throw error;
    }
  };

  // Normalize API responses to a common format
  const normalizeMarketDataResponse = (
    provider: string,
    data: any,
    fromCurrency: string,
    toCurrency: string
  ) => {
    switch (provider.toLowerCase()) {
      case 'alphavantage':
        const exchangeRate = data['Realtime Currency Exchange Rate'];
        return {
          provider: 'Alpha Vantage',
          fromCurrency,
          toCurrency,
          rate: parseFloat(exchangeRate['5. Exchange Rate']),
          lastRefreshed: exchangeRate['6. Last Refreshed'],
          timeZone: exchangeRate['7. Time Zone'],
          bidPrice: parseFloat(exchangeRate['8. Bid Price']),
          askPrice: parseFloat(exchangeRate['9. Ask Price']),
        };

      case 'finnhub':
        return {
          provider: 'Finnhub',
          fromCurrency,
          toCurrency,
          rate: data.c && data.c.length > 0 ? data.c[data.c.length - 1] : null,
          open: data.o && data.o.length > 0 ? data.o[data.o.length - 1] : null,
          high: data.h && data.h.length > 0 ? data.h[data.h.length - 1] : null,
          low: data.l && data.l.length > 0 ? data.l[data.l.length - 1] : null,
          volume: data.v && data.v.length > 0 ? data.v[data.v.length - 1] : null,
          timestamp:
            data.t && data.t.length > 0
              ? new Date(data.t[data.t.length - 1] * 1000).toISOString()
              : null,
        };

      case 'iexcloud':
        const rate = data[0];
        return {
          provider: 'IEX Cloud',
          fromCurrency,
          toCurrency,
          rate: rate?.rate,
          timestamp: rate?.timestamp ? new Date(rate.timestamp).toISOString() : null,
        };

      case 'polygon':
        return {
          provider: 'Polygon.io',
          fromCurrency,
          toCurrency,
          rate: data.converted,
          from: data.from,
          to: data.to,
          amount: data.amount,
        };

      default:
        return {
          provider: provider,
          fromCurrency,
          toCurrency,
          rawData: data,
        };
    }
  };

  // Test Market Data API Key
  const testMarketDataKey = async (keyData: MarketDataApiKey) => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const result = await fetchMarketDataByProvider(
        keyData.provider,
        keyData.apiKey,
        'USD',
        'EUR'
      );

      setSuccess(
        `✅ ${keyData.provider} API key tested successfully! Current USD/EUR rate: ${result.rate}`
      );

      // Update the last used timestamp
      await TokenManager.makeAuthenticatedRequest('/api/user/market-data-keys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: keyData.id, lastUsed: new Date().toISOString() }),
      });

      fetchMarketDataKeys();
    } catch (error) {
      setError(
        `❌ Failed to test ${keyData.provider} API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await TokenManager.logout();
    router.push('/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <ErrorSuccessAlert error={error} success={success} />

                {/* Profile Picture Section */}
                <div className="space-y-4">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Image
                        src={profilePicture || '/profile-picture.svg'}
                        alt="Profile Picture"
                        width={80}
                        height={80}
                        className="rounded-full border-2 border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500">
                        Upload a JPG, PNG, or GIF image. Max size 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="mt-1"
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="mt-1"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full"
                  style={{ backgroundColor: '#1F09FF', color: 'white' }}
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        );
      case 'ai-keys':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI API Keys</CardTitle>
                <CardDescription>Manage your AI API keys for different providers</CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorSuccessAlert error={error} success={success} />

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Your AI Keys</h3>
                  <Button
                    onClick={() => setShowAddAiKey(!showAddAiKey)}
                    style={{ backgroundColor: '#1F09FF', color: 'white' }}
                  >
                    {showAddAiKey ? 'Cancel' : 'Add AI Key'}
                  </Button>
                </div>

                {showAddAiKey && (
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle>Add New AI Key</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddAiKey} className="space-y-4">
                        <div>
                          <Label htmlFor="aiTitle">Title</Label>
                          <Input
                            id="aiTitle"
                            type="text"
                            value={newAiKey.title}
                            onChange={e => setNewAiKey({ ...newAiKey, title: e.target.value })}
                            className="mt-1"
                            placeholder="e.g., My OpenAI Key"
                            required
                          />
                        </div>

                        <div>
                          <Combobox
                            options={[
                              { value: 'openai', label: 'OpenAI' },
                              { value: 'anthropic', label: 'Anthropic' },
                              { value: 'google', label: 'Google' },
                              { value: 'claude', label: 'Claude' },
                            ]}
                            value={newAiKey.provider}
                            onValueChange={(value: string) =>
                              setNewAiKey({ ...newAiKey, provider: String(value) })
                            }
                            placeholder="Select option..."
                            className="w-full mt-1"
                          />
                        </div>

                        <ApiKeyInput
                          id="aiApiKey"
                          label="API Key"
                          value={newAiKey.apiKey}
                          onChange={value => setNewAiKey({ ...newAiKey, apiKey: value })}
                          placeholder="Enter your API key"
                          required
                        />

                        <Button
                          type="submit"
                          disabled={updating}
                          className="w-full"
                          style={{ backgroundColor: '#1F09FF', color: 'white' }}
                        >
                          {updating ? 'Adding...' : 'Add AI Key'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {aiKeys.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No AI keys found. Add your first AI key above.
                    </p>
                  ) : (
                    aiKeys.map(key => (
                      <KeyCard
                        key={key.id}
                        keyData={key}
                        keyType="ai"
                        onToggle={handleToggleAiKey}
                        onDelete={handleDeleteAiKey}
                        updating={updating}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'trading-keys':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trading API Keys</CardTitle>
                <CardDescription>Manage your Trading212 API keys</CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorSuccessAlert error={error} success={success} />

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Your Trading Keys</h3>
                  <Button
                    onClick={() => setShowAddTradingKey(!showAddTradingKey)}
                    style={{ backgroundColor: '#1F09FF', color: 'white' }}
                  >
                    {showAddTradingKey ? 'Cancel' : 'Add Trading Key'}
                  </Button>
                </div>

                {showAddTradingKey && (
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle>Add New Trading Key</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddTradingKey} className="space-y-4">
                        <div>
                          <Label htmlFor="tradingTitle">Title</Label>
                          <Input
                            id="tradingTitle"
                            type="text"
                            value={newTradingKey.title}
                            onChange={e =>
                              setNewTradingKey({ ...newTradingKey, title: e.target.value })
                            }
                            className="mt-1"
                            placeholder="e.g., My Trading212 Key"
                            required
                          />
                        </div>

                        <div>
                          <Combobox
                            options={[
                              { value: 'read-only', label: 'Read Only' },
                              { value: 'full-access', label: 'Full Access' },
                            ]}
                            value={newTradingKey.accessType}
                            onValueChange={(value: string) =>
                              setNewTradingKey({ ...newTradingKey, accessType: String(value) })
                            }
                            placeholder="Select option..."
                            className="w-full mt-1"
                          />
                        </div>

                        <ApiKeyInput
                          id="tradingApiKey"
                          label="API Key"
                          value={newTradingKey.apiKey}
                          onChange={value => setNewTradingKey({ ...newTradingKey, apiKey: value })}
                          placeholder="Enter your Trading212 API key"
                          required
                        />

                        <Button
                          type="submit"
                          disabled={updating}
                          className="w-full"
                          style={{ backgroundColor: '#1F09FF', color: 'white' }}
                        >
                          {updating ? 'Adding...' : 'Add Trading Key'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {tradingKeys.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No trading keys found. Add your first trading key above.
                    </p>
                  ) : (
                    tradingKeys.map(key => (
                      <KeyCard
                        key={key.id}
                        keyData={key}
                        keyType="trading"
                        onToggle={handleToggleTradingKey}
                        onDelete={handleDeleteTradingKey}
                        updating={updating}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'market-data-keys':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Data API Keys</CardTitle>
                <CardDescription>
                  Manage your market data API keys for different providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorSuccessAlert error={error} success={success} />

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Your Market Data Keys</h3>
                  <Button
                    onClick={() => setShowAddMarketDataKey(!showAddMarketDataKey)}
                    style={{ backgroundColor: '#1F09FF', color: 'white' }}
                  >
                    {showAddMarketDataKey ? 'Cancel' : 'Add Market Data Key'}
                  </Button>
                </div>

                {showAddMarketDataKey && (
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle>Add New Market Data Key</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddMarketDataKey} className="space-y-4">
                        <div>
                          <Label htmlFor="marketDataTitle">Title</Label>
                          <Input
                            id="marketDataTitle"
                            type="text"
                            placeholder="e.g., Alpha Vantage - Premium"
                            value={newMarketDataKey.title}
                            onChange={e =>
                              setNewMarketDataKey({ ...newMarketDataKey, title: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="marketDataProvider">Provider</Label>
                          <Combobox
                            options={[
                              { value: 'alphavantage', label: 'Alpha Vantage' },
                              { value: 'finnhub', label: 'Finnhub' },
                              { value: 'iexcloud', label: 'IEX Cloud' },
                              { value: 'polygon', label: 'Polygon.io' },
                              { value: 'tradingview', label: 'TradingView' },
                              { value: 'other', label: 'Other' },
                            ]}
                            value={newMarketDataKey.provider}
                            onValueChange={(value: string) =>
                              setNewMarketDataKey({ ...newMarketDataKey, provider: value })
                            }
                            placeholder="Select provider..."
                            className="w-full mt-1"
                          />
                        </div>
                        <div>
                          <ApiKeyInput
                            id="marketDataApiKey"
                            label="API Key"
                            placeholder="Enter your API key"
                            value={newMarketDataKey.apiKey}
                            onChange={(value: string) =>
                              setNewMarketDataKey({ ...newMarketDataKey, apiKey: value })
                            }
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={updating}
                          style={{ backgroundColor: '#1F09FF', color: 'white' }}
                        >
                          {updating ? 'Adding...' : 'Add Market Data Key'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {marketDataKeys.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No market data keys found. Add one to get started.
                    </p>
                  ) : (
                    marketDataKeys.map(key => (
                      <KeyCard
                        key={key.id}
                        keyData={key}
                        keyType="marketdata"
                        onToggle={handleToggleMarketDataKey}
                        onDelete={handleDeleteMarketDataKey}
                        onTest={keyData => testMarketDataKey(keyData as MarketDataApiKey)}
                        updating={updating}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        logoPosition="over-sidebar"
        profileRedirectTo="/dashboard"
        hasNewNotifications={false}
      />

      <div className="flex">
        <Sidebar
          user={user}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />

        {/* Right Content */}
        <div className="flex-1 p-8">{renderContent()}</div>
      </div>
    </div>
  );
}
