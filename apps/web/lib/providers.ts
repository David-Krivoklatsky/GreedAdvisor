import { prisma } from '@/lib/prisma';
import { MarketDataService, TwelveDataProvider } from '@greed-advisor/market-data';
import { T212Environment, Trading212Client } from '@greed-advisor/trading212';

export async function getActiveT212Client(userId: number, keyId?: number) {
  const key = await prisma.t212ApiKey.findFirst({
    where: {
      userId,
      deletedAt: null,
      isActive: true,
      ...(keyId ? { id: keyId } : {}),
    },
  });

  if (!key) {
    return null;
  }

  return {
    key,
    client: new Trading212Client({
      apiKey: key.apiKey,
      apiSecret: key.apiSecret,
      environment: key.environment as T212Environment,
    }),
  };
}

export async function getMarketDataService(userId: number, keyId?: number) {
  const key = await prisma.marketDataKey.findFirst({
    where: {
      userId,
      deletedAt: null,
      isActive: true,
      ...(keyId ? { id: keyId } : {}),
    },
    orderBy: { lastUsed: 'asc' },
  });

  if (!key) {
    return null;
  }

  return {
    key,
    service: new MarketDataService(new TwelveDataProvider(key.apiKey)),
  };
}
