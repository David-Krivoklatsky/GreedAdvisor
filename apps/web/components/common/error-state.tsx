import { Button } from '../ui/button';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-destructive text-lg mb-4">{error}</div>
        {onRetry && (
          <Button onClick={onRetry} className="bg-primary text-white hover:bg-primary/90">
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
