import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationData, Position } from '@/types/dashboard';

interface PositionsPanelProps {
  positions: Position[];
  onShowNotification: (notification: NotificationData) => void;
}

export default function PositionsPanel({ positions, onShowNotification }: PositionsPanelProps) {
  const handleNewPosition = () => {
    onShowNotification({
      message: 'Position creation feature coming soon!',
      type: 'info',
    });
  };

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Trading Positions
          <Button size="sm" variant="outline" onClick={handleNewPosition}>
            + New Position
          </Button>
        </CardTitle>
        <CardDescription>Open and waiting positions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No positions found</div>
          ) : (
            <div className="space-y-3">
              {positions.map(position => (
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
  );
}
