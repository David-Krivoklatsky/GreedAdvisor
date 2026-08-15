import { ComboboxOption } from '@/types/dashboard';

export const REPORT_TYPE_OPTIONS: ComboboxOption[] = [
  { value: 'daily', label: 'Daily Summary' },
  { value: 'weekly', label: 'Weekly Analysis' },
  { value: 'monthly', label: 'Monthly Report' },
  { value: 'custom', label: 'Custom Range' },
];
