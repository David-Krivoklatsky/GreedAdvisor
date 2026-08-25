import { AlpacaClient, AlpacaEnvironment } from '@greed-advisor/alpaca';
import type { TradingKeyRecord } from '@greed-advisor/trading';
import { log } from './config';

export interface NewsItem {
  title: string;
  source?: string;
  publishedAt?: string;
  summary?: string;
  url?: string;
}

// Fetch recent news per symbol from the Alpaca News API. Gracefully degrades
// to an empty array when news is unavailable.
export async function fetchNewsForSymbols(
  key: TradingKeyRecord,
  symbols: string[],
  limit = 5
): Promise<Record<string, NewsItem[]>> {
  const result: Record<string, NewsItem[]> = {};
  if (key.provider !== 'alpaca' || symbols.length === 0) {
    return result;
  }

  const client = new AlpacaClient({
    apiKey: key.apiKey,
    apiSecret: key.apiSecret,
    environment: key.environment as AlpacaEnvironment
  });

  for (const symbol of symbols) {
    try {
      const items = await client.getNews([symbol], limit);
      result[symbol] = items.map(item => ({
        title: item.headline,
        source: item.source,
        publishedAt: item.created_at,
        summary: item.summary?.slice(0, 300),
        url: item.url
      }));
    } catch (error) {
      log('warn', `News fetch failed for ${symbol}`, { error: String(error) });
      result[symbol] = [];
    }
  }

  return result;
}
