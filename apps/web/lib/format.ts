export function formatCurrency(value: number | undefined, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value ?? 0);
}

export function formatPercent(value: number | undefined): string {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
}

export function formatQuantity(value: number | undefined): string {
  if (value == null || isNaN(value)) return '—';
  const rounded = Number(value.toFixed(4));
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  });
}
