'use client';

import { Input } from '@/components/ui/input';
import { TokenManager } from '@/lib/token-manager';
import { Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface InstrumentResult {
  ticker: string;
  name: string;
}

interface InstrumentPickerProps {
  onAdd: (symbol: string) => void;
}

// Searchable instrument picker backed by /api/user/instruments (the broker
// universe). Click a result to add it to the bot's symbol list.
export default function InstrumentPicker({ onAdd }: InstrumentPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InstrumentResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await TokenManager.makeAuthenticatedRequest(
          `/api/user/instruments?q=${encodeURIComponent(q)}&limit=12`
        );
        if (!res.ok) return;
        const data = await res.json();
        setResults(
          (data.instruments ?? []).map((i: { ticker: string; name?: string }) => ({
            ticker: i.ticker,
            name: i.name ?? ''
          }))
        );
        setOpen(true);
      } catch {
        // ignore network errors — just show nothing
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const pick = (symbol: string) => {
    onAdd(symbol);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search instruments to add…"
          className="flex-1"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md">
          {results.map(result => (
            <button
              key={result.ticker}
              type="button"
              onClick={() => pick(result.ticker)}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <span>
                <span className="font-medium">{result.ticker}</span>{' '}
                <span className="text-muted-foreground">{result.name}</span>
              </span>
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
