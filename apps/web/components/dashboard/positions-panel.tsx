import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CashAccount, NotificationData, Position } from '@/types/dashboard';

interface PositionsPanelProps {
  positions: Position[];
  cash: CashAccount | null;
  onShowNotification: (notification: NotificationData) => void;
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(value);
}

export default function PositionsPanel({
  positions,
  cash,
  onShowNotification,
}: PositionsPanelProps) {
  const handleNewPosition = () => {
    onShowNotification({
      message: 'Trading orders are placed automatically through the AI advisor.',
      type: 'info',
    });
  };

  const totalPnl = positions.reduce((sum, p) => sum + (p.ppl ?? 0), 0);

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Trading Positions
          <Button size="sm" variant="outline" onClick={handleNewPosition}>
            + New Position
          </Button>
        </CardTitle>
        <CardDescription>Live positions from your Trading212 account</CardDescription>
      </CardHeader>
      <CardContent>
        {cash && (
          <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Account Cash</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(cash.total, cash.currencyCode)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Investable</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(cash.investableCash, cash.currencyCode)}
                </p>
                <p
                  className={`text-sm font-medium ${
                    cash.ppl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  PnL: {formatCurrency(cash.ppl, cash.currencyCode)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {positions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No open positions found.
              <p className="text-sm mt-1">
                Connect a Trading212 key to see your live positions here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-gray-500 font-medium uppercase tracking-wide px-1">
                <span>Symbol</span>
                <span>Qty</span>
                <span>Avg Price</span>
                <span>Current</span>
                <span>PnL</span>
              </div>
              {positions.map(position => (
                <div
                  key={position.ticker}
                  className="p-4 rounded-lg border bg-green-50 border-green-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-lg">{position.ticker}</h4>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          position.quantity >= 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {position.quantity >= 0 ? 'LONG' : 'SHORT'}
                      </span>
                    </div>
                    <div
                      className={`text-right font-bold ${
                        position.ppl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(position.ppl, position.pplCurrency)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="ml-1 font-medium">{position.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Average Price:</span>
                      <span className="ml-1 font-medium">
                        {formatCurrency(position.averagePrice, position.pplCurrency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Price:</span>
                      <span className="ml-1 font-medium">
                        {formatCurrency(position.currentPrice, position.pplCurrency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Value:</span>
                      <span className="ml-1 font-medium">
                        {formatCurrency(position.currentValue, position.pplCurrency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {positions.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200 flex justify-between">
            <span className="text-sm font-medium text-blue-800">Total Position PnL</span>
            <span className={`font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalPnl, positions[0]?.pplCurrency ?? 'USD')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
