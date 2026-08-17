import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  AccountSummary,
  AiKey,
  MarketDataKey,
  NotificationData,
  Position,
  TradingKey,
} from '@/types/dashboard';
import AiAdvisorPanel from './ai-advisor-panel';
import PositionsPanel from './positions-panel';

interface DashboardPanelsProps {
  tradingKeys: TradingKey[];
  aiKeys: AiKey[];
  marketDataKeys: MarketDataKey[];
  positions: Position[];
  accountSummary: AccountSummary | null;
  positionsLoading: boolean;
  selectedTradingKey: string;
  setSelectedTradingKey: (key: string) => void;
  onShowNotification: (notification: NotificationData) => void;
}

export default function DashboardPanels({
  tradingKeys,
  aiKeys,
  marketDataKeys,
  positions,
  accountSummary,
  positionsLoading,
  selectedTradingKey,
  setSelectedTradingKey,
  onShowNotification,
}: DashboardPanelsProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="rounded-lg border min-h-[600px]">
      {/* Left Panel - AI Advisor */}
      <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
        <AiAdvisorPanel
          tradingKeys={tradingKeys}
          aiKeys={aiKeys}
          marketDataKeys={marketDataKeys}
          selectedTradingKey={selectedTradingKey}
          onNotification={onShowNotification}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Panel - Portfolio */}
      <ResizablePanel defaultSize={60} minSize={40} maxSize={70}>
        <PositionsPanel
          positions={positions}
          accountSummary={accountSummary}
          positionsLoading={positionsLoading}
          tradingKeys={tradingKeys}
          selectedTradingKey={selectedTradingKey}
          setSelectedTradingKey={setSelectedTradingKey}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
