import ApiKeyDisplay from '@/components/forms/api-key-display';
import { Trading212Logo } from '@/components/brands/trading212-logo';
import { AlpacaLogo } from '@/components/brands/alpaca-logo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
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
  provider?: string;
}

interface MarketDataKey extends BaseKey {
  provider: string;
  apiKey: string;
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
  updating
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
    <div className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{keyData.title}</h3>
          <p className="text-sm text-muted-foreground capitalize">
            {subtitle} • {keyTypeLabel} Key
          </p>
          <div className="text-xs text-muted-foreground mt-1">
            <p>Added: {formatDate(keyData.createdAt)}</p>
            {keyData.lastUsed && <p>Last used: {formatDate(keyData.lastUsed)}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {keyType === 'trading' &&
            ((keyData as TradingKey).provider === 'alpaca' ? (
              <AlpacaLogo size={20} />
            ) : (keyData as TradingKey).provider === 'trading212' ? (
              <Trading212Logo size={20} />
            ) : null)}
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              keyData.isActive
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}
          >
            {keyData.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* API Key Display Section */}
      {keyData.apiKey && (
        <div className="mb-4 p-3 bg-muted rounded-md border border-border">
          <label className="text-sm font-medium text-foreground block mb-2">API Key</label>
          <ApiKeyDisplay
            apiKey={keyData.apiKey}
            placeholder="••••••••••••••••••••••••••••••••"
            className="font-mono text-sm"
          />
        </div>
      )}

      <div className="flex space-x-2 pt-2 border-t border-border">
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
            className="flex-1 border-primary/40 text-primary hover:bg-primary/10"
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
