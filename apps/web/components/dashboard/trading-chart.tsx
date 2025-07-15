import TradingViewWidget from '@/components/charts/tradingview-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TradingChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Trading Chart</CardTitle>
        <CardDescription>Interactive TradingView chart with real-time market data</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: '600px' }}>
          <TradingViewWidget />
        </div>
      </CardContent>
    </Card>
  );
}
