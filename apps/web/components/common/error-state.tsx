import { Button } from '../ui/button';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        {onRetry && (
          <Button onClick={onRetry} className="bg-blue-600 text-white hover:bg-blue-700">
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
