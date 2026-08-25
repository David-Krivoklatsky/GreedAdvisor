import { prisma } from '@greed-advisor/db';
import type { AutomationConfig } from '@greed-advisor/db';
import { computeIndicators, MarketDataService } from '@greed-advisor/market-data';
import type { TradingClientBinding } from '@greed-advisor/trading';
import { log } from './config';
import { notify } from './notify';
import { computeTrailStop } from './trail';

function normalizeSymbol(symbol: string): string {
  return symbol.split('_')[0].toUpperCase();
}

function normalizeBrokerStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'filled':
      return 'filled';
    case 'partially_filled':
      return 'partial';
    case 'canceled':
      return 'cancelled';
    case 'rejected':
      return 'rejected';
    case 'expired':
      return 'expired';
    case 'accepted':
    case 'new':
    case 'held':
    case 'pending_new':
    case 'pending_cancel':
    case 'pending_replace':
      return status.toLowerCase();
    default:
      return status.toLowerCase();
  }
}

const NON_TERMINAL = [
  'accepted',
  'new',
  'held',
  'partial',
  'pending_new',
  'pending_cancel',
  'pending_replace'
];
const TERMINAL = ['filled', 'cancelled', 'rejected', 'expired'];

// Syncs TradeRecord status/fill data with the broker for engine-placed orders.
export async function reconcileOrders(
  config: AutomationConfig,
  binding: TradingClientBinding
): Promise<void> {
  const openOrders = await binding.getPendingOrders();
  const openIds = new Set(openOrders.map(o => o.id));

  const records = await prisma.tradeRecord.findMany({
    where: {
      userId: config.userId,
      automationConfigId: config.id,
      status: { notIn: TERMINAL }
    }
  });

  for (const record of records) {
    let order;
    try {
      order = await binding.getOrder(record.orderId);
    } catch {
      continue;
    }

    if (!order) {
      if (!openIds.has(record.orderId)) {
        await prisma.tradeRecord.update({
          where: { id: record.id },
          data: { status: 'cancelled', closedAt: new Date() }
        });
      }
      continue;
    }

    const status = normalizeBrokerStatus(order.status);

    if (status === 'filled') {
      const filledAvg = order.filledAvgPrice ?? record.filledAvgPrice;
      const data: {
        status: string;
        filledQuantity: number;
        filledAvgPrice: number | null;
        closedAt: Date;
        exitPrice?: number;
        realizedPnl?: number;
      } = {
        status,
        filledQuantity: order.filledQuantity,
        filledAvgPrice: filledAvg,
        closedAt: new Date()
      };
      // Refine realized PnL for closing sells once the actual fill is known.
      if (record.side === 'SELL' && filledAvg && record.entryPrice) {
        data.exitPrice = filledAvg;
        data.realizedPnl = (filledAvg - record.entryPrice) * order.filledQuantity;
      }
      await prisma.tradeRecord.update({ where: { id: record.id }, data });
    } else if (NON_TERMINAL.includes(status)) {
      await prisma.tradeRecord.update({
        where: { id: record.id },
        data: {
          status,
          filledQuantity: order.filledQuantity,
          filledAvgPrice: order.filledAvgPrice ?? record.filledAvgPrice
        }
      });
    } else {
      await prisma.tradeRecord.update({
        where: { id: record.id },
        data: { status, closedAt: new Date() }
      });
    }
  }
}

// Trail stops: once a long position is up at least one ATR, ratchet the stop
// to breakeven and then trail it one ATR behind price. Alpaca only.
export async function manageStops(
  config: AutomationConfig,
  binding: TradingClientBinding,
  marketData: MarketDataService
): Promise<void> {
  if (binding.provider !== 'alpaca' || !config.manageStops) return;

  const records = await prisma.tradeRecord.findMany({
    where: {
      userId: config.userId,
      automationConfigId: config.id,
      tradingKeyId: binding.key.id,
      side: 'BUY',
      status: { in: ['accepted', 'new', 'held', 'partial', 'filled'] },
      stopOrderId: { not: null }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (records.length === 0) return;

  const positions = await binding.getPositions();

  for (const record of records) {
    if (!record.stopOrderId) continue;
    const symbol = normalizeSymbol(record.symbol);
    const position = positions.find(p => normalizeSymbol(p.instrument.ticker) === symbol);
    if (!position || position.quantity <= 0) continue;

    const entry = position.averagePricePaid > 0 ? position.averagePricePaid : record.entryPrice;
    if (!entry || entry <= 0) continue;

    const price = position.currentPrice;
    if (price <= 0) continue;

    const atr = computeIndicators(await marketData.getCandles(symbol, '1day', 20)).snapshot.atr;
    if (!atr || atr <= 0) continue;

    const stopOrder = await binding.getOrder(record.stopOrderId);
    const currentStop = stopOrder?.stopPrice ?? null;

    const desiredStop = computeTrailStop({
      entry,
      price,
      atr,
      currentStop
    });

    if (desiredStop) {
      await binding.replaceOrder(record.stopOrderId, {
        stopPrice: desiredStop
      });
      log('info', `Trailed stop ${symbol} ${currentStop ?? '—'} → ${desiredStop}`);
      await notify(
        config.userId,
        config.telegramChatId,
        'sl_tp',
        `Stop moved ${symbol}`,
        `Stop ${currentStop ?? '—'} → ${desiredStop}`
      );
    }
  }
}
