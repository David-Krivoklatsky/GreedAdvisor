import PortfolioOverview from '@/components/dashboard/portfolio-overview';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountSummary, Position, TradingKey } from '@/types/dashboard';

interface PositionsPanelProps {
  positions: Position[];
  accountSummary: AccountSummary | null;
  positionsLoading: boolean;
  tradingKeys: TradingKey[];
  selectedTradingKey: string;
  setSelectedTradingKey: (key: string) => void;
}

function formatTradingKeyLabel(key: TradingKey): string {
  const env = key.environment?.toLowerCase() === 'live' ? 'Live' : 'Demo';
  return `${key.title || key.accessType || 'Account'} (${env})`;
}

export default function PositionsPanel({
  positions,
  accountSummary,
  positionsLoading,
  tradingKeys,
  selectedTradingKey,
  setSelectedTradingKey,
}: PositionsPanelProps) {
  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">My Portfolio</CardTitle>
            <CardDescription>Live account value and holdings from Trading212</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Trading account</span>
            {tradingKeys.length > 0 ? (
              <Combobox
                options={tradingKeys.map(key => ({
                  value: key.id.toString(),
                  label: formatTradingKeyLabel(key),
                }))}
                value={selectedTradingKey}
                onValueChange={setSelectedTradingKey}
                placeholder="Select account"
                searchPlaceholder="Search accounts..."
                emptyMessage="No accounts found."
                className="w-[220px]"
              />
            ) : (
              <p className="text-sm text-gray-400">No active account</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <PortfolioOverview
          positions={positions}
          accountSummary={accountSummary}
          loading={positionsLoading}
        />
      </CardContent>
    </Card>
  );
}
