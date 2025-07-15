import { ComboboxOption } from '@/types/dashboard';

export const SYMBOL_OPTIONS: ComboboxOption[] = [
  { value: 'EUR/USD', label: 'EUR/USD - Euro / US Dollar' },
  { value: 'GBP/USD', label: 'GBP/USD - British Pound / US Dollar' },
  { value: 'USD/JPY', label: 'USD/JPY - US Dollar / Japanese Yen' },
  { value: 'AUD/USD', label: 'AUD/USD - Australian Dollar / US Dollar' },
  { value: 'USD/CAD', label: 'USD/CAD - US Dollar / Canadian Dollar' },
  { value: 'NZD/USD', label: 'NZD/USD - New Zealand Dollar / US Dollar' },
  { value: 'USD/CHF', label: 'USD/CHF - US Dollar / Swiss Franc' },
];

export const REPORT_TYPE_OPTIONS: ComboboxOption[] = [
  { value: 'daily', label: 'Daily Summary' },
  { value: 'weekly', label: 'Weekly Analysis' },
  { value: 'monthly', label: 'Monthly Report' },
  { value: 'custom', label: 'Custom Range' },
];

export const MOCK_POSITIONS = [
  {
    id: 1,
    symbol: 'EUR/USD',
    type: 'BUY' as const,
    size: 0.1,
    openPrice: 1.085,
    currentPrice: 1.0875,
    pnl: 25.0,
    status: 'OPEN' as const,
    openTime: '2025-07-12T10:30:00Z',
  },
  {
    id: 2,
    symbol: 'GBP/USD',
    type: 'SELL' as const,
    size: 0.05,
    openPrice: 1.275,
    currentPrice: 1.274,
    pnl: 5.0,
    status: 'OPEN' as const,
    openTime: '2025-07-12T09:15:00Z',
  },
  {
    id: 3,
    symbol: 'USD/JPY',
    type: 'BUY' as const,
    size: 0.2,
    openPrice: 149.5,
    currentPrice: 149.45,
    pnl: -10.0,
    status: 'WAITING' as const,
    openTime: '2025-07-12T11:00:00Z',
  },
];
