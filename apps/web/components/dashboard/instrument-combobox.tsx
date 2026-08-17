'use client';

import { Combobox } from '@/components/ui/combobox';
import { TokenManager } from '@/lib/token-manager';
import { useEffect, useState } from 'react';

interface Instrument {
  ticker: string;
  shortName: string;
  name: string;
  type: string;
  currencyCode: string;
}

interface InstrumentComboboxProps {
  value?: string;
  onSelect: (instrument: { ticker: string; name: string; type: string }) => void;
  className?: string;
}

function normalizeTicker(ticker: string): string {
  return ticker.replace(/_US_EQ$/, '').replace(/_.+/, '');
}

function instrumentType(instrument: Instrument): string {
  const raw = (instrument.type ?? '').toUpperCase();
  if (raw === 'CRYPTOCURRENCY' || raw === 'CRYPTO') return 'CRYPTO';
  if (raw === 'ETF') return 'ETF';
  if (raw === 'FOREX') return 'FOREX';
  return 'STOCK';
}

export function InstrumentCombobox({ value, onSelect, className }: InstrumentComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await TokenManager.makeAuthenticatedRequest(
          `/api/user/instruments?q=${encodeURIComponent(query)}&limit=25`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          setInstruments([]);
          return;
        }
        const data = await response.json();
        setInstruments(data.instruments || []);
      } catch {
        if (controller.signal.aborted) return;
        setInstruments([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  return (
    <Combobox
      open={open}
      onOpenChange={setOpen}
      value={value}
      displayValue={value || undefined}
      options={instruments.map(i => ({
        value: i.ticker,
        label: `${normalizeTicker(i.ticker)} — ${i.shortName || i.name || i.ticker}`,
      }))}
      onValueChange={selected => {
        const instrument = instruments.find(i => i.ticker === selected);
        if (instrument) {
          onSelect({
            ticker: normalizeTicker(instrument.ticker),
            name: instrument.name || instrument.shortName,
            type: instrumentType(instrument),
          });
        }
      }}
      onSearchChange={setQuery}
      placeholder="Search instruments…"
      searchPlaceholder="Search by ticker or name…"
      emptyMessage="No instruments found"
      loading={loading}
      className={className}
    />
  );
}
