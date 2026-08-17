import { describe, expect, it } from '@jest/globals';

import { watchlistItemSchema, reportSchema, orderSchema } from '@greed-advisor/validations';

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
      accountValue: '25000',
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
      stopLoss: '180',
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
      side: 'BUY',
    });
    expect(result.success).toBe(false);
  });
});
