'use client';

import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { TokenManager } from '@/lib/token-manager';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

interface TradingKey {
  id: number;
  title: string;
  accessType: string;
  isActive: boolean;
}

interface AiKey {
  id: number;
  title: string;
  provider: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [marketData, setMarketData] = useState({ price: '', symbol: 'USD/AUX' });
  const [tradingKeys, setTradingKeys] = useState<TradingKey[]>([]);
  const [aiKeys, setAiKeys] = useState<AiKey[]>([]);
  const [selectedTradingKey, setSelectedTradingKey] = useState<string>('');
  const [selectedAiKey, setSelectedAiKey] = useState<string>('');

  useEffect(() => {
    fetchUser();
    fetchMarketData();
    fetchTradingKeys();
    fetchAiKeys();
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
      setError('Failed to load user data');
      // TokenManager.makeAuthenticatedRequest already handles redirects
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

  const fetchMarketData = async () => {
    try {
      const response = await fetch('https://api.example.com/market-data?symbol=USD/AUX');
      const data = await response.json();
      setMarketData({ price: data.price, symbol: 'USD/AUX' });
    } catch {
      console.error('Failed to fetch market data');
    }
  };

  const symbolOptions = [
    { value: 'USD/AUX', label: 'USD/AUX' },
    { value: 'EUR/USD', label: 'EUR/USD' },
    { value: 'GBP/USD', label: 'GBP/USD' },
    { value: 'USD/JPY', label: 'USD/JPY' },
  ];

  const tradingKeyOptions = tradingKeys.map((key) => ({
    value: key.id.toString(),
    label: `${key.title} (${key.accessType})`,
  }));

  const aiKeyOptions = aiKeys.map((key) => ({
    value: key.id.toString(),
    label: `${key.title} (${key.provider})`,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar hasNewNotifications={true} />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
          <ResizablePanel defaultSize={80} minSize={25} maxSize={80}>
            <Card className="h-full border-0 rounded-none">
              <CardHeader>
                <CardTitle>Market Graph</CardTitle>
                <CardDescription>Select a symbol to view market data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Symbol</label>
                  <Combobox
                    options={symbolOptions}
                    value={marketData.symbol}
                    onValueChange={(value) => setMarketData({ ...marketData, symbol: value })}
                    placeholder="Select symbol..."
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Trading Key</label>
                  <Combobox
                    options={tradingKeyOptions}
                    value={selectedTradingKey}
                    onValueChange={setSelectedTradingKey}
                    placeholder="Select trading key..."
                    emptyMessage="No active trading keys found."
                    className="w-full mt-1"
                  />
                </div>

                <div className="mt-4 text-lg font-bold" style={{ color: '#1F09FF' }}>
                  Price: {marketData.price || 'Loading...'}
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={67}>
            <Card className="h-full border-0 rounded-none">
              <CardHeader>
                <CardTitle>Generate Report</CardTitle>
                <CardDescription>Select options and generate a report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">AI Key</label>
                    <Combobox
                      options={aiKeyOptions}
                      value={selectedAiKey}
                      onValueChange={setSelectedAiKey}
                      placeholder="Select AI key..."
                      emptyMessage="No active AI keys found."
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Report Type</label>
                    <Combobox
                      options={[
                        { value: 'daily', label: 'Daily Summary' },
                        { value: 'weekly', label: 'Weekly Analysis' },
                        { value: 'monthly', label: 'Monthly Report' },
                        { value: 'custom', label: 'Custom Range' },
                      ]}
                      placeholder="Select report type..."
                      className="w-full mt-1"
                    />
                  </div>

                  <Button
                    className="w-full mt-4"
                    style={{ backgroundColor: '#1F09FF', color: 'white' }}
                  >
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
