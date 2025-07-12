'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

interface ApiOption {
  name: string;
  description: string;
  features: string[];
  pricing: string;
  realTimeSupport: boolean;
  documentation: string;
}

const apiOptions: ApiOption[] = [
  {
    name: 'Alpha Vantage',
    description: 'Comprehensive financial data API with real-time and historical data',
    features: ['Real-time quotes', 'Historical data', 'Technical indicators', 'Fundamental data'],
    pricing: 'Free tier: 5 requests/min, 500 requests/day',
    realTimeSupport: true,
    documentation: 'https://www.alphavantage.co/documentation/',
  },
  {
    name: 'Finnhub',
    description: 'Real-time financial data API for stocks, forex, and crypto',
    features: ['Real-time data', 'WebSocket streaming', 'Market news', 'Company profiles'],
    pricing: 'Free tier: 60 requests/min, WebSocket included',
    realTimeSupport: true,
    documentation: 'https://finnhub.io/docs/api',
  },
  {
    name: 'IEX Cloud',
    description: 'Financial data infrastructure for developers',
    features: ['Real-time data', 'Historical data', 'Market statistics', 'News'],
    pricing: 'Free tier: 50,000 core credits/month',
    realTimeSupport: true,
    documentation: 'https://iexcloud.io/docs/api/',
  },
  {
    name: 'TradingView WebSocket',
    description: 'Direct integration with TradingView for real-time charts',
    features: [
      'Real-time charting',
      'Multiple timeframes',
      'Technical analysis',
      'Custom indicators',
    ],
    pricing: 'Depends on TradingView plan',
    realTimeSupport: true,
    documentation: 'https://www.tradingview.com/widget/',
  },
  {
    name: 'Polygon.io',
    description: 'Real-time and historical market data for stocks, options, forex, and crypto',
    features: ['Real-time WebSocket', 'Historical aggregates', 'Options data', 'News'],
    pricing: 'Free tier: 5 requests/min',
    realTimeSupport: true,
    documentation: 'https://polygon.io/docs/',
  },
];

interface RealtimeApiOptionsProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function RealtimeApiOptions({ isVisible, onClose }: RealtimeApiOptionsProps) {
  const [selectedApi, setSelectedApi] = useState<string>('');

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Real-time Data API Options</h2>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>

          <div className="grid gap-4">
            {apiOptions.map((api, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-colors ${
                  selectedApi === api.name ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{api.name}</CardTitle>
                      <CardDescription>{api.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {api.realTimeSupport && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Real-time
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant={selectedApi === api.name ? 'default' : 'outline'}
                        onClick={() => setSelectedApi(selectedApi === api.name ? '' : api.name)}
                      >
                        {selectedApi === api.name ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {api.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Pricing:</h4>
                      <p className="text-sm text-gray-600">{api.pricing}</p>
                    </div>
                    <div>
                      <a
                        href={api.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        View Documentation →
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Implementation Notes:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Most APIs require registration and API keys</li>
              <li>• WebSocket connections provide the fastest real-time updates</li>
              <li>• Consider rate limits when choosing between REST and WebSocket</li>
              <li>• TradingView integration offers the most comprehensive charting features</li>
              <li>• Free tiers are available for testing and small-scale usage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
