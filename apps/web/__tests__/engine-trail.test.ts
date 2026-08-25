import { describe, expect, it } from '@jest/globals';
import { computeTrailStop } from '@greed-advisor/engine/src/trail';

describe('computeTrailStop', () => {
  it('returns null when the position has not moved enough', () => {
    expect(computeTrailStop({ entry: 100, price: 101, atr: 2, currentStop: null })).toBeNull();
  });

  it('moves a stop to breakeven once price is up one ATR', () => {
    expect(computeTrailStop({ entry: 100, price: 103, atr: 3, currentStop: null })).toBe(100);
  });

  it('trails one ATR behind price when profit exceeds one ATR', () => {
    expect(computeTrailStop({ entry: 100, price: 110, atr: 3, currentStop: null })).toBe(107);
  });

  it('never lowers the stop (ratchet up only)', () => {
    expect(computeTrailStop({ entry: 100, price: 108, atr: 3, currentStop: 109 })).toBeNull();
  });

  it('keeps a higher trail when the existing stop is already above breakeven', () => {
    expect(computeTrailStop({ entry: 100, price: 112, atr: 3, currentStop: 105 })).toBe(109);
  });

  it('returns null for invalid inputs', () => {
    expect(computeTrailStop({ entry: 0, price: 110, atr: 3, currentStop: null })).toBeNull();
    expect(computeTrailStop({ entry: 100, price: 110, atr: 0, currentStop: null })).toBeNull();
  });
});
