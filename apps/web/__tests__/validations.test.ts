import { describe, expect, it } from '@jest/globals';

import {
  t212ApiKeySchema,
  updateT212ApiKeySchema,
  watchlistItemSchema,
  reportSchema,
  orderSchema
} from '@greed-advisor/validations';

describe('@greed-advisor/validations', () => {
  it('accepts a valid watchlist item', () => {
    const result = watchlistItemSchema.safeParse({ ticker: 'AAPL' });
    expect(result.success).toBe(true);
  });

  it('rejects a watchlist item without a ticker', () => {
    const result = watchlistItemSchema.safeParse({ name: 'Apple' });
    expect(result.success).toBe(false);
  });

  it('coerces string numbers in reportSchema', () => {
    const result = reportSchema.safeParse({
      tradingKeyId: '3',
      aiKeyId: '2',
      marketDataKeyId: '1',
      reportType: 'thesis',
      symbol: 'AAPL',
      accountValue: '25000'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tradingKeyId).toBe(3);
      expect(result.data.accountValue).toBe(25000);
      expect(result.data.productType).toBe('INVEST');
      expect(result.data.riskProfile).toBe('balanced');
    }
  });

  it('coerces and validates orderSchema', () => {
    const result = orderSchema.safeParse({
      tradingKeyId: '1',
      ticker: 'AAPL',
      quantity: '5',
      side: 'BUY',
      stopLoss: '180'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(5);
      expect(result.data.side).toBe('BUY');
    }
  });

  it('rejects an order with a non-positive quantity', () => {
    const result = orderSchema.safeParse({
      tradingKeyId: 1,
      ticker: 'AAPL',
      quantity: 0,
      side: 'BUY'
    });
    expect(result.success).toBe(false);
  });

  it('defaults t212ApiKeySchema to trading212/demo/read-only', () => {
    const result = t212ApiKeySchema.safeParse({
      title: 'My Key',
      apiKey: 'a',
      apiSecret: 'b'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provider).toBe('trading212');
      expect(result.data.environment).toBe('demo');
      expect(result.data.accessType).toBe('read-only');
    }
  });

  it('accepts an alpaca trading key', () => {
    const result = t212ApiKeySchema.safeParse({
      title: 'Alpaca Key',
      provider: 'alpaca',
      environment: 'paper',
      apiKey: 'a',
      apiSecret: 'b'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provider).toBe('alpaca');
      expect(result.data.environment).toBe('paper');
    }
  });

  it('rejects an unknown trading provider', () => {
    const result = t212ApiKeySchema.safeParse({
      title: 'Bad',
      provider: 'ibkr',
      apiKey: 'a',
      apiSecret: 'b'
    });
    expect(result.success).toBe(false);
  });

  it('accepts demo environment regardless of provider', () => {
    const result = t212ApiKeySchema.safeParse({
      title: 'Bad',
      provider: 'alpaca',
      environment: 'demo',
      apiKey: 'a',
      apiSecret: 'b'
    });
    expect(result.success).toBe(true);
  });

  it('strips provider from updates so it stays immutable', () => {
    const result = updateT212ApiKeySchema.safeParse({ provider: 'alpaca', title: 'Renamed' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('provider');
      expect(result.data.title).toBe('Renamed');
    }
  });
});
