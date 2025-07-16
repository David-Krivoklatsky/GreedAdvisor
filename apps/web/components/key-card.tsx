import ApiKeyDisplay from '@/components/forms/api-key-display';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface BaseKey {
  id: number;
  title: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  apiKey?: string; // Adding apiKey field for display
}

interface AiKey extends BaseKey {
  provider: string;
}

interface TradingKey extends BaseKey {
  accessType: string;
}

interface MarketDataKey extends BaseKey {
  provider: string;
}

interface KeyCardProps {
  keyData: AiKey | TradingKey | MarketDataKey;
  keyType: 'ai' | 'trading' | 'marketdata';
  onToggle: (keyId: number, isActive: boolean) => void;
  onDelete: (keyId: number) => void;
  onTest?: (keyData: MarketDataKey) => void; // Optional test function for market data keys
  updating: boolean;
}

export default function KeyCard({
  keyData,
  keyType,
  onToggle,
  onDelete,
  onTest,
  updating,
}: KeyCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const subtitle =
    keyType === 'ai'
      ? (keyData as AiKey).provider
      : keyType === 'trading'
        ? (keyData as TradingKey).accessType
        : (keyData as MarketDataKey).provider;

  const keyTypeLabel = keyType === 'ai' ? 'AI' : keyType === 'trading' ? 'Trading' : 'Market Data';

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{keyData.title}</h3>
          <p className="text-sm text-gray-600 capitalize">
            {subtitle} • {keyTypeLabel} Key
          </p>
          <div className="text-xs text-gray-500 mt-1">
            <p>Added: {formatDate(keyData.createdAt)}</p>
            {keyData.lastUsed && <p>Last used: {formatDate(keyData.lastUsed)}</p>}
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            keyData.isActive
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {keyData.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* API Key Display Section */}
      {keyData.apiKey && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border">
          <label className="text-sm font-medium text-gray-700 block mb-2">API Key</label>
          <ApiKeyDisplay
            apiKey={keyData.apiKey}
            placeholder="••••••••••••••••••••••••••••••••"
            className="font-mono text-sm"
          />
        </div>
      )}

      <div className="flex space-x-2 pt-2 border-t">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onToggle(keyData.id, keyData.isActive)}
          disabled={updating}
          className="flex-1"
        >
          {keyData.isActive ? 'Deactivate' : 'Activate'}
        </Button>

        {/* Test button for market data keys */}
        {keyType === 'marketdata' && onTest && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onTest(keyData as MarketDataKey)}
            disabled={updating}
            className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            Test API
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" className="flex-1">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {keyTypeLabel} Key</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{keyData.title}&quot;? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(keyData.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
