interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {/* Terminal title bar */}
          <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-destructive/80" />
            <span className="h-3 w-3 rounded-full bg-warning/80" />
            <span className="h-3 w-3 rounded-full bg-success/80" />
            <span className="ml-2 text-xs text-muted-foreground">greedadvisor — terminal</span>
          </div>

          {/* Terminal body */}
          <div className="px-4 py-6 font-mono text-sm">
            <p className="text-muted-foreground">
              <span className="font-semibold text-primary">greedadvisor</span>
              <span className="text-foreground">@trading:~$</span>{' '}
              <span className="inline-block animate-pulse text-success">▍</span>
            </p>
            <p className="mt-3 text-foreground">{message}</p>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
