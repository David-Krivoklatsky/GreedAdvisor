import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  AiKey,
  CashAccount,
  MarketDataKey,
  NotificationData,
  Position,
  TradingKey,
} from '@/types/dashboard';
import AiReportGenerator from './ai-report-generator';
import PositionsPanel from './positions-panel';

interface DashboardPanelsProps {
  tradingKeys: TradingKey[];
  aiKeys: AiKey[];
  marketDataKeys: MarketDataKey[];
  positions: Position[];
  cash: CashAccount | null;
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
  onShowNotification: (notification: NotificationData) => void;
}

export default function DashboardPanels({
  tradingKeys,
  aiKeys,
  marketDataKeys,
  positions,
  cash,
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
  onShowNotification,
}: DashboardPanelsProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="rounded-lg border min-h-[600px]">
      {/* Left Panel - AI Report Generation */}
      <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
        <AiReportGenerator
          tradingKeys={tradingKeys}
          aiKeys={aiKeys}
          marketDataKeys={marketDataKeys}
          selectedTradingKey={selectedTradingKey}
          setSelectedTradingKey={setSelectedTradingKey}
          selectedAiKey={selectedAiKey}
          setSelectedAiKey={setSelectedAiKey}
          selectedMarketDataKey={selectedMarketDataKey}
          setSelectedMarketDataKey={setSelectedMarketDataKey}
          selectedReportType={selectedReportType}
          setSelectedReportType={setSelectedReportType}
          generatingReport={generatingReport}
          onGenerateReport={onGenerateReport}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Panel - Positions */}
      <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
        <PositionsPanel positions={positions} cash={cash} onShowNotification={onShowNotification} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
