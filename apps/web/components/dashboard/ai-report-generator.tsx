import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { REPORT_TYPE_OPTIONS } from '@/constants/dashboard';
import { AiKey, ComboboxOption, TradingKey } from '@/types/dashboard';

interface AiReportGeneratorProps {
  tradingKeys: TradingKey[];
  aiKeys: AiKey[];
  selectedTradingKey: string;
  setSelectedTradingKey: (key: string) => void;
  selectedAiKey: string;
  setSelectedAiKey: (key: string) => void;
  selectedReportType: string;
  setSelectedReportType: (type: string) => void;
  generatingReport: boolean;
  onGenerateReport: () => void;
}

export default function AiReportGenerator({
  tradingKeys,
  aiKeys,
  selectedTradingKey,
  setSelectedTradingKey,
  selectedAiKey,
  setSelectedAiKey,
  selectedReportType,
  setSelectedReportType,
  generatingReport,
  onGenerateReport,
}: AiReportGeneratorProps) {
  const tradingKeyOptions: ComboboxOption[] = tradingKeys.map(key => ({
    value: key.id.toString(),
    label: `${key.title} (${key.accessType})`,
  }));

  const aiKeyOptions: ComboboxOption[] = aiKeys.map(key => ({
    value: key.id.toString(),
    label: `${key.title} (${key.provider})`,
  }));

  const isGenerateDisabled =
    generatingReport || !selectedTradingKey || !selectedAiKey || !selectedReportType;

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
            onClick={onGenerateReport}
            disabled={isGenerateDisabled}
          >
            {generatingReport ? 'Generating Report...' : 'Generate Report'}
          </Button>

          {(tradingKeys.length === 0 || aiKeys.length === 0) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Missing API Keys:</strong> You need to configure both trading and AI API
                keys in your{' '}
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
