import { prisma } from '@/lib/prisma';
import { MarketDataService, TwelveDataProvider } from '@greed-advisor/market-data';
import { AlpacaClient, AlpacaEnvironment } from '@greed-advisor/alpaca';
import type { AlpacaAccount, AlpacaAsset, AlpacaPosition } from '@greed-advisor/alpaca';
import { T212Environment, Trading212Client } from '@greed-advisor/trading212';
import type { AccountSummary, Position } from '@/types/dashboard';

export type TradingProvider = 'trading212' | 'alpaca';

export interface TradingKeyRecord {
  id: number;
  apiKey: string;
  apiSecret: string;
  environment: string;
  provider: string;
}

export interface UnifiedInstrument {
  ticker: string;
  shortName: string;
  name: string;
  currency?: string;
  type?: string;
}

export interface OrderLegResult {
  id: string;
  status: string;
}

export interface OrderResult {
  id: string;
  status: string;
  stop?: OrderLegResult | null;
  takeProfit?: OrderLegResult | null;
}

export interface TradingClientBinding {
  key: TradingKeyRecord;
  provider: TradingProvider;
  environment: string;
  getAccountSummary(): Promise<AccountSummary>;
  getPositions(): Promise<Position[]>;
  getPosition(ticker: string): Promise<Position | null>;
  getInstruments(): Promise<UnifiedInstrument[]>;
  getAccountTotalValue(): Promise<number>;
  getFirstPositionSymbol(): Promise<string | null>;
  placeOrder(input: {
    ticker: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    stopLoss?: number;
    takeProfit?: number;
    extendedHours?: boolean;
  }): Promise<OrderResult>;
}

function t212Binding(key: TradingKeyRecord): TradingClientBinding {
  const client = new Trading212Client({
    apiKey: key.apiKey,
    apiSecret: key.apiSecret,
    environment: key.environment as T212Environment
  });

  return {
    key,
    provider: 'trading212',
    environment: key.environment,
    getAccountSummary: () => client.getAccountSummary(),
    getPositions: () => client.getPositions(),
    getPosition: ticker => client.getPosition(ticker),
    getInstruments: () => client.getInstruments(),
    getAccountTotalValue: async () => (await client.getAccountSummary()).totalValue,
    getFirstPositionSymbol: async () => {
      const positions = await client.getPositions();
      const first = positions[0];
      if (!first) return null;
      // T212 tickers look like "AAPL_US_EQ"; strip the exchange suffix for market data
      return first.instrument.ticker.replace(/_US_EQ$/, '').replace(/_.+/, '');
    },
    placeOrder: async input => {
      // T212 convention: sell orders use a negative quantity
      const signedQty =
        input.side === 'SELL' ? -Math.abs(input.quantity) : Math.abs(input.quantity);

      const entry = await client.placeOrder({
        ticker: input.ticker,
        quantity: signedQty,
        orderType: 'MARKET',
        extendedHours: input.extendedHours ?? false
      });

      // Optional protections (separate stop + limit orders, opposite side of entry)
      const stop =
        input.stopLoss != null && input.stopLoss > 0
          ? await client.placeOrder({
              ticker: input.ticker,
              quantity: -signedQty,
              orderType: 'STOP',
              stopPrice: input.stopLoss,
              timeValidity: 'GOOD_TILL_CANCEL'
            })
          : null;

      const takeProfit =
        input.takeProfit != null && input.takeProfit > 0
          ? await client.placeOrder({
              ticker: input.ticker,
              quantity: -signedQty,
              orderType: 'LIMIT',
              limitPrice: input.takeProfit,
              timeValidity: 'GOOD_TILL_CANCEL'
            })
          : null;

      return {
        id: String(entry.id),
        status: entry.status,
        stop: stop ? { id: String(stop.id), status: stop.status } : null,
        takeProfit: takeProfit ? { id: String(takeProfit.id), status: takeProfit.status } : null
      };
    }
  };
}

function alpacaAccountToSummary(account: AlpacaAccount): AccountSummary {
  return {
    id: account.account_number,
    currency: account.currency,
    totalValue: Number(account.portfolio_value) || 0,
    cash: {
      availableToTrade: Number(account.cash) || 0,
      inPies: 0,
      reservedForOrders: 0
    },
    investments: {
      currentValue: Number(account.portfolio_value) || 0,
      realizedProfitLoss: 0,
      totalCost: Number(account.portfolio_value) || 0,
      unrealizedProfitLoss: 0
    }
  };
}

function alpacaPositionToPosition(position: AlpacaPosition, currency: string): Position {
  const qty = Number(position.qty) || 0;
  return {
    instrument: {
      ticker: position.symbol,
      isin: position.symbol,
      name: position.symbol,
      currency
    },
    averagePricePaid: Number(position.avg_entry_price) || 0,
    createdAt: '',
    currentPrice: Number(position.current_price) || 0,
    quantity: qty,
    quantityAvailableForTrading: qty,
    quantityInPies: 0,
    walletImpact: {
      currency,
      currentValue: Number(position.market_value) || 0,
      fxImpact: 0,
      totalCost: Number(position.cost_basis) || 0,
      unrealizedProfitLoss: Number(position.unrealized_pl) || 0
    }
  };
}

function alpacaAssetToInstrument(asset: AlpacaAsset): UnifiedInstrument {
  return {
    ticker: asset.symbol,
    shortName: asset.symbol,
    name: asset.name,
    type: asset.class,
    currency: 'USD'
  };
}

function alpacaBinding(key: TradingKeyRecord): TradingClientBinding {
  const client = new AlpacaClient({
    apiKey: key.apiKey,
    apiSecret: key.apiSecret,
    environment: key.environment as AlpacaEnvironment
  });

  return {
    key,
    provider: 'alpaca',
    environment: key.environment,
    getAccountSummary: async () => alpacaAccountToSummary(await client.getAccount()),
    getPositions: async () => {
      const account = await client.getAccount();
      const currency = account.currency || 'USD';
      const positions = await client.getPositions();
      return positions.map(p => alpacaPositionToPosition(p, currency));
    },
    getPosition: async ticker => {
      const account = await client.getAccount();
      const currency = account.currency || 'USD';
      const position = await client.getPosition(ticker);
      return position ? alpacaPositionToPosition(position, currency) : null;
    },
    getInstruments: async () => {
      const assets = await client.getAssets({ status: 'active', tradable: true });
      return assets.map(alpacaAssetToInstrument);
    },
    getAccountTotalValue: async () => {
      const account = await client.getAccount();
      return Number(account.portfolio_value) || 0;
    },
    getFirstPositionSymbol: async () => {
      const positions = await client.getPositions();
      return positions[0]?.symbol ?? null;
    },
    placeOrder: async input => {
      const order = await client.placeOrder({
        symbol: input.ticker,
        side: input.side === 'SELL' ? 'sell' : 'buy',
        qty: Math.abs(input.quantity),
        type: 'market',
        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit,
        extendedHours: input.extendedHours
      });

      // Alpaca places stop-loss / take-profit as bracket legs on the same order
      const legs = order.legs ?? [];
      const stop = legs.find(l => l.order_class === 'stop') ?? null;
      const takeProfit = legs.find(l => l.order_class === 'limit') ?? null;

      return {
        id: order.id,
        status: order.status,
        stop: stop ? { id: stop.id, status: stop.status } : null,
        takeProfit: takeProfit ? { id: takeProfit.id, status: takeProfit.status } : null
      };
    }
  };
}

export async function getActiveTradingClient(userId: number, keyId?: number) {
  const key = await prisma.t212ApiKey.findFirst({
    where: {
      userId,
      deletedAt: null,
      isActive: true,
      ...(keyId ? { id: keyId } : {})
    }
  });

  if (!key) {
    return null;
  }

  const record: TradingKeyRecord = {
    id: key.id,
    apiKey: key.apiKey,
    apiSecret: key.apiSecret,
    environment: key.environment,
    provider: key.provider ?? 'trading212'
  };

  return record.provider === 'alpaca' ? alpacaBinding(record) : t212Binding(record);
}

export async function getMarketDataService(userId: number, keyId?: number) {
  const key = await prisma.marketDataKey.findFirst({
    where: {
      userId,
      deletedAt: null,
      isActive: true,
      ...(keyId ? { id: keyId } : {})
    },
    orderBy: { lastUsed: 'asc' }
  });

  if (!key) {
    return null;
  }

  return {
    key,
    service: new MarketDataService(new TwelveDataProvider(key.apiKey))
  };
}
