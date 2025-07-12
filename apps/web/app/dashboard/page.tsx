'use client';

import Navbar from '@/components/navbar';
import RealtimeApiOptions from '@/components/realtime-api-options';
import TradingViewChart from '@/components/tradingview-chart';
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

interface Position {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  size: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  status: 'OPEN' | 'WAITING' | 'CLOSED';
  openTime: string;
}

interface MarketDataKey {
  id: number;
  title: string;
  provider: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [marketData, setMarketData] = useState({ price: '', symbol: 'EUR/USD' });
  const [tradingKeys, setTradingKeys] = useState<TradingKey[]>([]);
  const [aiKeys, setAiKeys] = useState<AiKey[]>([]);
  const [selectedTradingKey, setSelectedTradingKey] = useState<string>('');
  const [selectedAiKey, setSelectedAiKey] = useState<string>('');
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [showRealtimeOptions, setShowRealtimeOptions] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [marketDataKeys, setMarketDataKeys] = useState<MarketDataKey[]>([]);
  const [selectedMarketDataKey, setSelectedMarketDataKey] = useState<string>('');

  useEffect(() => {
    fetchUser();
    fetchMarketData();
    fetchTradingKeys();
    fetchAiKeys();
    fetchPositions();
    fetchMarketDataKeys();
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
      const response = await fetch('https://api.example.com/market-data?symbol=EUR/USD');
      const data = await response.json();
      setMarketData({ price: data.price, symbol: 'EUR/USD' });
    } catch {
      console.error('Failed to fetch market data');
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
      setPositions([
        {
          id: 1,
          symbol: 'EUR/USD',
          type: 'BUY',
          size: 0.1,
          openPrice: 1.085,
          currentPrice: 1.0875,
          pnl: 25.0,
          status: 'OPEN',
          openTime: '2025-07-12T10:30:00Z',
        },
        {
          id: 2,
          symbol: 'GBP/USD',
          type: 'SELL',
          size: 0.05,
          openPrice: 1.275,
          currentPrice: 1.274,
          pnl: 5.0,
          status: 'OPEN',
          openTime: '2025-07-12T09:15:00Z',
        },
        {
          id: 3,
          symbol: 'USD/JPY',
          type: 'BUY',
          size: 0.2,
          openPrice: 149.5,
          currentPrice: 149.45,
          pnl: -10.0,
          status: 'WAITING',
          openTime: '2025-07-12T11:00:00Z',
        },
      ]);
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
      // Set mock data for development
      setMarketDataKeys([
        {
          id: 1,
          title: 'Alpha Vantage - Free',
          provider: 'alphavantage',
          isActive: true,
        },
        {
          id: 2,
          title: 'Finnhub - Premium',
          provider: 'finnhub',
          isActive: true,
        },
        {
          id: 3,
          title: 'IEX Cloud - Basic',
          provider: 'iexcloud',
          isActive: true,
        },
      ]);
    }
  };

  const symbolOptions = [
    { value: 'EUR/USD', label: 'EUR/USD' },
    { value: 'USD/AUX', label: 'USD/AUX' },
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

  const marketDataKeyOptions = marketDataKeys.map((key) => ({
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

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Market Selection & Chart - Connected Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Market Analysis</CardTitle>
            <CardDescription>Select a currency pair and view real-time market data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Market Selection - Updated Layout */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency Pair
                  </label>
                  <Combobox
                    options={symbolOptions}
                    value={marketData.symbol || symbolOptions[0].value}
                    onValueChange={(value: string) =>
                      setMarketData({ ...marketData, symbol: String(value) })
                    }
                    placeholder="Select currency pair..."
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market Data API
                  </label>
                  <Combobox
                    options={marketDataKeyOptions}
                    value={selectedMarketDataKey}
                    onValueChange={(value: string) => setSelectedMarketDataKey(String(value))}
                    placeholder="Select API provider..."
                    emptyMessage="No active market data keys found."
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-lg font-bold" style={{ color: '#1F09FF' }}>
                  Price: {marketData.price || 'Loading...'}
                </div>
                <Button onClick={() => setShowRealtimeOptions(true)} variant="outline" size="sm">
                  API Options
                </Button>
              </div>
            </div>

            {/* TradingView Chart */}
            <div>
              <div className="mb-3">
                <h3 className="text-lg font-semibold">Live Chart</h3>
                <p className="text-sm text-gray-600">
                  Real-time price chart for {marketData.symbol}
                </p>
              </div>
              <TradingViewChart
                symbol={marketData.symbol}
                height={500}
                theme="light"
                interval="15"
              />
            </div>
          </CardContent>
        </Card>

        {/* Resizable Panel Group - AI Report & Positions */}
        <ResizablePanelGroup direction="horizontal" className="rounded-lg border min-h-[600px]">
          {/* Left Panel - AI Report Generation */}
          <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
            <Card className="h-full border-0 rounded-none">
              <CardHeader>
                <CardTitle>Generate AI Report</CardTitle>
                <CardDescription>Select options and generate a trading report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trading Key
                    </label>
                    <Combobox
                      options={tradingKeyOptions}
                      value={selectedTradingKey}
                      onValueChange={(value: string) => setSelectedTradingKey(String(value))}
                      placeholder="Select trading key..."
                      emptyMessage="No active trading keys found."
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AI Provider
                    </label>
                    <Combobox
                      options={aiKeyOptions}
                      value={selectedAiKey}
                      onValueChange={(value: string) => setSelectedAiKey(String(value))}
                      placeholder="Select AI provider..."
                      emptyMessage="No active AI keys found."
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report Type
                    </label>
                    <Combobox
                      options={[
                        { value: 'daily', label: 'Daily Summary' },
                        { value: 'weekly', label: 'Weekly Analysis' },
                        { value: 'monthly', label: 'Monthly Report' },
                        { value: 'custom', label: 'Custom Range' },
                      ]}
                      value={selectedReportType}
                      onValueChange={(value: string) => setSelectedReportType(String(value))}
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

          <ResizableHandle withHandle />

          {/* Right Panel - Positions */}
          <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
            <Card className="h-full border-0 rounded-none">
              <CardHeader>
                <CardTitle>Trading Positions</CardTitle>
                <CardDescription>Open and waiting positions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {positions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No positions found</div>
                  ) : (
                    <div className="space-y-3">
                      {positions.map((position) => (
                        <div
                          key={position.id}
                          className={`p-4 rounded-lg border ${
                            position.status === 'OPEN'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-lg">{position.symbol}</h4>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    position.type === 'BUY'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {position.type}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    position.status === 'OPEN'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}
                                >
                                  {position.status}
                                </span>
                              </div>
                            </div>
                            <div
                              className={`text-right font-bold ${
                                position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Size:</span>
                              <span className="ml-1 font-medium">{position.size}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Open Price:</span>
                              <span className="ml-1 font-medium">{position.openPrice}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Current Price:</span>
                              <span className="ml-1 font-medium">{position.currentPrice}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Open Time:</span>
                              <span className="ml-1 font-medium">
                                {new Date(position.openTime).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <RealtimeApiOptions
        isVisible={showRealtimeOptions}
        onClose={() => setShowRealtimeOptions(false)}
      />
    </div>
  );
}
