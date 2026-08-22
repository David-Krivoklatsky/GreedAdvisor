'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { TokenManager } from '@/lib/token-manager';
import { Button } from '@/components/ui/button';
import { cn } from '@greed-advisor/utils';

interface Instrument {
  ticker: string;
  shortName: string;
  name: string;
}

interface SymbolSearchInputProps {
  value: string;
  onSelect: (symbol: string) => void;
  placeholder?: string;
  className?: string;
}

function normalizeTicker(ticker: string): string {
  return ticker.replace(/_US_EQ$/, '').replace(/_.+/, '');
}

/**
 * Symbol input with live instrument suggestions from the user's connected
 * broker. Type a few characters (e.g. "AA") to see matching tickers like
 * AAPL / AA / AAL, or type a full custom symbol and press Enter / Load.
 */
export function SymbolSearchInput({
  value,
  onSelect,
  placeholder = 'Symbol',
  className
}: SymbolSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep the input in sync when the parent changes the symbol.
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced instrument search.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        setInstruments([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await TokenManager.makeAuthenticatedRequest(
          `/api/user/instruments?q=${encodeURIComponent(q)}&limit=8`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          setInstruments([]);
          return;
        }
        const data = await response.json();
        setInstruments(data.instruments || []);
        setOpen(true);
      } catch {
        if (controller.signal.aborted) return;
        setInstruments([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (symbol?: string) => {
    const sym = (symbol ?? query).trim().toUpperCase();
    if (sym) {
      onSelect(sym);
      setQuery(sym);
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
              if (e.key === 'Escape') setOpen(false);
            }}
            className="h-8 w-28 pl-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={placeholder}
          />
          {loading && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => submit()}>
          Load
        </Button>
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 top-full z-30 mt-1 w-72 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {instruments.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {loading ? 'Searching…' : 'No matching instruments'}
            </p>
          ) : (
            instruments.map(instrument => (
              <button
                key={instrument.ticker}
                type="button"
                onClick={() => submit(normalizeTicker(instrument.ticker))}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="font-medium">{normalizeTicker(instrument.ticker)}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {instrument.shortName || instrument.name}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
