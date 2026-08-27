import { AlpacaClient, AlpacaEnvironment } from '@greed-advisor/alpaca';
import type { TradingKeyRecord } from '@greed-advisor/trading';

export interface MarketWindow {
  open: boolean;
  nextOpen?: string;
  nextClose?: string;
}

// Real market clock via Alpaca (only meaningful for Alpaca keys).
export async function getAlpacaWindow(key: TradingKeyRecord): Promise<MarketWindow | null> {
  try {
    const client = new AlpacaClient({
      apiKey: key.apiKey,
      apiSecret: key.apiSecret,
      environment: key.environment as AlpacaEnvironment
    });
    const clock = await client.getClock();
    return {
      open: clock.is_open,
      nextOpen: clock.next_open,
      nextClose: clock.next_close
    };
  } catch {
    return null;
  }
}

// Approximate US market hours (Mon–Fri 09:30–16:00 ET) as a fallback for
// brokers without a clock endpoint (Trading212).
export function approximateUsMarketWindow(now = new Date()): MarketWindow {
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getUTCDay();
  const minutes = et.getUTCHours() * 60 + et.getUTCMinutes();
  const open = day >= 1 && day <= 5 && minutes >= 570 && minutes < 960;
  return { open };
}

// Approximate EU (CET) market hours (Mon–Fri 09:00–17:30).
export function approximateEuMarketWindow(now = new Date()): MarketWindow {
  const cet = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const day = cet.getUTCDay();
  const minutes = cet.getUTCHours() * 60 + cet.getUTCMinutes();
  const open = day >= 1 && day <= 5 && minutes >= 540 && minutes < 1050;
  return { open };
}

// Convert a date to an America/New_York calendar day (00:00 UTC-normalized).
export function etDateOnly(date: Date = new Date()): Date {
  const et = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return new Date(Date.UTC(et.getUTCFullYear(), et.getUTCMonth(), et.getUTCDate()));
}
