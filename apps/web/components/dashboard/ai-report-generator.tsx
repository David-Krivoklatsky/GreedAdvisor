import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { REPORT_TYPE_OPTIONS } from '@/constants/dashboard';
import { AiKey, ComboboxOption, MarketDataKey, TradingKey } from '@/types/dashboard';
import { useState } from 'react';

interface AiReportGeneratorProps {
  tradingKeys: TradingKey[];
  aiKeys: AiKey[];
  marketDataKeys: MarketDataKey[];
  selectedTradingKey: string;
  setSelectedTradingKey: (key: string) => void;
  selectedAiKey: string;
  setSelectedAiKey: (key: string) => void;
  selectedMarketDataKey: string;
  setSelectedMarketDataKey: (key: string) => void;
  selectedReportType: string;
  setSelectedReportType: (type: string) => void;
  generatingReport: boolean;
  onGenerateReport: (symbol: string) => void;
}

export default function AiReportGenerator({
  tradingKeys,
  aiKeys,
  marketDataKeys,
  selectedTradingKey,
  setSelectedTradingKey,
  selectedAiKey,
  setSelectedAiKey,
  selectedMarketDataKey,
  setSelectedMarketDataKey,
  selectedReportType,
  setSelectedReportType,
  generatingReport,
  onGenerateReport,
}: AiReportGeneratorProps) {
  const [symbol, setSymbol] = useState('');

  const tradingKeyOptions: ComboboxOption[] = tradingKeys.map(key => ({
    value: key.id.toString(),
    label: `${key.title} (${key.accessType}, ${key.environment})`,
  }));

  const aiKeyOptions: ComboboxOption[] = aiKeys.map(key => ({
    value: key.id.toString(),
    label: `${key.title} (${key.provider})`,
  }));

  const marketDataKeyOptions: ComboboxOption[] = marketDataKeys.map(key => ({
    value: key.id.toString(),
    label: `${key.title} (${key.provider})`,
  }));

  const isGenerateDisabled =
    generatingReport ||
    !selectedTradingKey ||
    !selectedAiKey ||
    !selectedMarketDataKey ||
    !selectedReportType;

  const missingKeys =
    tradingKeys.length === 0 || aiKeys.length === 0 || marketDataKeys.length === 0;

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader>
        <CardTitle>Generate AI Report</CardTitle>
        <CardDescription>Select options and generate a trading report</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trading Key{' '}
              {tradingKeys.length === 0 && <span className="text-red-500">(None available)</span>}
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
              AI Provider{' '}
              {aiKeys.length === 0 && <span className="text-red-500">(None available)</span>}
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
              Market Data Key{' '}
              {marketDataKeys.length === 0 && (
                <span className="text-red-500">(None available)</span>
              )}
            </label>
            <Combobox
              options={marketDataKeyOptions}
              value={selectedMarketDataKey}
              onValueChange={(value: string) => setSelectedMarketDataKey(String(value))}
              placeholder="Select market data key..."
              emptyMessage="No active market data keys found."
              className="w-full mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol <span className="text-gray-400">(e.g. AAPL, TSLA, EUR/USD)</span>
            </label>
            <Input
              type="text"
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              placeholder="Enter stock symbol (leave empty to auto-detect from positions)"
              className="w-full mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <Combobox
              options={REPORT_TYPE_OPTIONS}
              value={selectedReportType}
              onValueChange={(value: string) => setSelectedReportType(String(value))}
              placeholder="Select report type..."
              className="w-full mt-1"
            />
          </div>

          <Button
            className="w-full mt-4"
            style={{ backgroundColor: '#1F09FF', color: 'white' }}
            onClick={() => onGenerateReport(symbol.trim().toUpperCase())}
            disabled={isGenerateDisabled}
          >
            {generatingReport ? 'Generating Report...' : 'Generate Report'}
          </Button>

          {missingKeys && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Missing API Keys:</strong> You need to configure trading, AI, and market
                data API keys in your{' '}
                <a href="/profile" className="underline hover:text-yellow-900">
                  profile settings
                </a>{' '}
                to generate reports.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
