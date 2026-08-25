import { prisma } from '@greed-advisor/db';
import { decryptSecret } from '@greed-advisor/crypto';
import { MarketDataService, TwelveDataProvider } from '@greed-advisor/market-data';
import { AlpacaClient, AlpacaEnvironment } from '@greed-advisor/alpaca';
import type {
  AlpacaAccount,
  AlpacaAsset,
  AlpacaOrder,
  AlpacaPosition
} from '@greed-advisor/alpaca';
import { T212Environment, Trading212Client } from '@greed-advisor/trading212';
import type {
  T212AccountSummary as AccountSummary,
  T212Order as T212OrderType,
  T212Position as Position
} from '@greed-advisor/trading212';

export type { AccountSummary, Position };

export type TradingProvider = 'trading212' | 'alpaca';

export interface TradingKeyRecord {
  id: number;
  apiKey: string;
  apiSecret: string;
  environment: string;
  provider: string;
  accessType?: string;
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

export interface PendingOrder {
  id: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  type: string;
  status: string;
  quantity: number;
  filledQuantity: number;
  limitPrice: number | null;
  stopPrice: number | null;
  createdAt: string;
}

export interface OrderStatus {
  id: string;
  status: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  filledQuantity: number;
  filledAvgPrice: number | null;
  limitPrice: number | null;
  stopPrice: number | null;
  createdAt: string;
}

export type PlaceOrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';

export interface PlaceOrderInput {
  ticker: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  orderType?: PlaceOrderType;
  limitPrice?: number;
  stopPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  extendedHours?: boolean;
  clientOrderId?: string;
}

export interface AccountMeta {
  equity: number;
  buyingPower: number;
  patternDayTrader: boolean;
  currency: string;
}

export interface TradingClientBinding {
  key: TradingKeyRecord;
  provider: TradingProvider;
  environment: string;
  getAccountSummary(): Promise<AccountSummary>;
  getAccountMeta(): Promise<AccountMeta>;
  getPositions(): Promise<Position[]>;
  getPosition(ticker: string): Promise<Position | null>;
  getInstruments(): Promise<UnifiedInstrument[]>;
  getAccountTotalValue(): Promise<number>;
  getFirstPositionSymbol(): Promise<string | null>;
  getPendingOrders(): Promise<PendingOrder[]>;
  getOrder(orderId: string): Promise<OrderStatus | null>;
  cancelOrder(orderId: string): Promise<void>;
  replaceOrder(orderId: string, fields: { limitPrice?: number; stopPrice?: number }): Promise<void>;
  placeOrder(input: PlaceOrderInput): Promise<OrderResult>;
}

function mapT212Order(order: T212OrderType): PendingOrder {
  return {
    id: String(order.id),
    ticker: order.ticker,
    side: order.side,
    type: order.type,
    status: order.status,
    quantity: order.quantity,
    filledQuantity: order.filledQuantity,
    limitPrice: order.limitPrice ?? null,
    stopPrice: order.stopPrice ?? null,
    createdAt: order.createdAt
  };
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
    getAccountMeta: async () => {
      const summary = await client.getAccountSummary();
      return {
        equity: summary.totalValue,
        buyingPower: summary.cash.availableToTrade,
        patternDayTrader: false,
        currency: summary.currency
      };
    },
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
    getPendingOrders: async () => {
      const orders = await client.getPendingOrders();
      return orders.map(mapT212Order);
    },
    getOrder: async orderId => {
      const orders = await client.getPendingOrders();
      const order = orders.find(o => String(o.id) === orderId);
      if (!order) return null;
      return {
        id: String(order.id),
        status: order.status,
        ticker: order.ticker,
        side: order.side,
        quantity: order.quantity,
        filledQuantity: order.filledQuantity,
        filledAvgPrice: null,
        limitPrice: order.limitPrice ?? null,
        stopPrice: order.stopPrice ?? null,
        createdAt: order.createdAt
      };
    },
    cancelOrder: async orderId => {
      await client.cancelOrder(Number(orderId));
    },
    replaceOrder: async () => {
      throw new Error('Trading212 does not support order replacement');
    },
    placeOrder: async input => {
      if (key.accessType === 'read-only') {
        throw new Error('This Trading212 key is read-only and cannot place orders.');
      }

      // T212 convention: sell orders use a negative quantity
      const signedQty =
        input.side === 'SELL' ? -Math.abs(input.quantity) : Math.abs(input.quantity);
      const type = input.orderType ?? 'MARKET';

      let entry: T212OrderType;
      switch (type) {
        case 'MARKET':
          entry = await client.placeOrder({
            ticker: input.ticker,
            quantity: signedQty,
            orderType: 'MARKET',
            extendedHours: input.extendedHours ?? false
          });
          break;
        case 'LIMIT':
          if (!input.limitPrice) {
            throw new Error('limitPrice is required for LIMIT orders');
          }
          entry = await client.placeOrder({
            ticker: input.ticker,
            quantity: signedQty,
            orderType: 'LIMIT',
            limitPrice: input.limitPrice,
            timeValidity: 'GOOD_TILL_CANCEL'
          });
          break;
        case 'STOP':
          if (!input.stopPrice) {
            throw new Error('stopPrice is required for STOP orders');
          }
          entry = await client.placeOrder({
            ticker: input.ticker,
            quantity: signedQty,
            orderType: 'STOP',
            stopPrice: input.stopPrice,
            timeValidity: 'GOOD_TILL_CANCEL'
          });
          break;
        case 'STOP_LIMIT':
          if (!input.stopPrice || !input.limitPrice) {
            throw new Error('stopPrice and limitPrice are required for STOP_LIMIT orders');
          }
          entry = await client.placeOrder({
            ticker: input.ticker,
            quantity: signedQty,
            orderType: 'STOP_LIMIT',
            stopPrice: input.stopPrice,
            limitPrice: input.limitPrice,
            timeValidity: 'GOOD_TILL_CANCEL'
          });
          break;
        default:
          throw new Error(`Unsupported order type: ${type}`);
      }

      // Optional protections (separate stop + limit orders, opposite side of entry).
      // Only applied to MARKET/LIMIT entries; stop-based entries already define risk.
      let stop: OrderLegResult | null = null;
      let takeProfit: OrderLegResult | null = null;
      if (type === 'MARKET' || type === 'LIMIT') {
        if (input.stopLoss != null && input.stopLoss > 0) {
          const s = await client.placeOrder({
            ticker: input.ticker,
            quantity: -signedQty,
            orderType: 'STOP',
            stopPrice: input.stopLoss,
            timeValidity: 'GOOD_TILL_CANCEL'
          });
          stop = { id: String(s.id), status: s.status };
        }

        if (input.takeProfit != null && input.takeProfit > 0) {
          const tp = await client.placeOrder({
            ticker: input.ticker,
            quantity: -signedQty,
            orderType: 'LIMIT',
            limitPrice: input.takeProfit,
            timeValidity: 'GOOD_TILL_CANCEL'
          });
          takeProfit = { id: String(tp.id), status: tp.status };
        }
      }

      return {
        id: String(entry.id),
        status: entry.status,
        stop,
        takeProfit
      };
    }
  };
}

function alpacaAccountToSummary(account: AlpacaAccount): AccountSummary {
  return {
    id: Number(account.account_number) || 0,
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
    getAccountMeta: async () => {
      const account = await client.getAccount();
      return {
        equity: Number(account.equity) || 0,
        buyingPower: Number(account.buying_power) || 0,
        patternDayTrader: account.pattern_day_trader,
        currency: account.currency || 'USD'
      };
    },
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
    getPendingOrders: async () => {
      const orders = await client.getPendingOrders();
      return orders.map((o: AlpacaOrder) => ({
        id: o.id,
        ticker: o.symbol,
        side: o.side === 'buy' ? 'BUY' : 'SELL',
        type: o.type,
        status: o.status,
        quantity: Number(o.qty) || 0,
        filledQuantity: Number(o.filled_qty) || 0,
        limitPrice: o.limit_price ? Number(o.limit_price) : null,
        stopPrice: o.stop_price ? Number(o.stop_price) : null,
        createdAt: o.created_at
      }));
    },
    getOrder: async orderId => {
      const order = await client.getOrder(orderId);
      if (!order) return null;
      return {
        id: order.id,
        status: order.status,
        ticker: order.symbol,
        side: order.side === 'buy' ? 'BUY' : 'SELL',
        quantity: Number(order.qty) || 0,
        filledQuantity: Number(order.filled_qty) || 0,
        filledAvgPrice: order.filled_avg_price ? Number(order.filled_avg_price) : null,
        limitPrice: order.limit_price ? Number(order.limit_price) : null,
        stopPrice: order.stop_price ? Number(order.stop_price) : null,
        createdAt: order.created_at
      };
    },
    cancelOrder: async orderId => {
      await client.cancelOrder(orderId);
    },
    replaceOrder: async (orderId, fields) => {
      await client.replaceOrder(orderId, fields);
    },
    placeOrder: async input => {
      const type = input.orderType ?? 'MARKET';
      const order = await client.placeOrder({
        symbol: input.ticker,
        side: input.side === 'SELL' ? 'sell' : 'buy',
        qty: Math.abs(input.quantity),
        type: type.toLowerCase() as 'market' | 'limit' | 'stop' | 'stop_limit',
        limitPrice: input.limitPrice,
        stopPrice: input.stopPrice,
        stopLoss: type === 'MARKET' || type === 'LIMIT' ? input.stopLoss : undefined,
        takeProfit: type === 'MARKET' || type === 'LIMIT' ? input.takeProfit : undefined,
        extendedHours: input.extendedHours,
        clientOrderId: input.clientOrderId
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
    apiKey: decryptSecret(key.apiKey),
    apiSecret: decryptSecret(key.apiSecret),
    environment: key.environment,
    provider: key.provider ?? 'trading212',
    accessType: key.accessType ?? 'full-access'
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
    service: new MarketDataService(new TwelveDataProvider(decryptSecret(key.apiKey)))
  };
}
