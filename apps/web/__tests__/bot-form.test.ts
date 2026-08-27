import { describe, expect, it } from '@jest/globals';
import { splitSymbols, toFormState, type EditableBot } from '@/components/automation/bot-form';

function makeBot(overrides: Partial<EditableBot> = {}): EditableBot {
  return {
    id: 1,
    title: 'Bot A',
    mode: 'paper',
    execution: 'approval',
    market: 'us',
    strategy: 'momentum',
    universe: 'watchlist',
    symbols: ['AAPL', 'MSFT'],
    scanIntervalMinutes: 5,
    maxCandidates: 5,
    maxPositions: 5,
    maxRiskPerTradePct: 0.02,
    maxDailySpendPct: 0.2,
    dailyLossLimitPct: 0.03,
    stopOnLoss: true,
    maxDailyTrades: 5,
    confidenceThreshold: 70,
    cooldownMinutes: 30,
    orderType: 'MARKET',
    manageStops: true,
    flattenAtClose: false,
    tradingKeyId: 3,
    aiKeyId: 4,
    marketDataKeyId: 5,
    model: 'glm-5.2',
    telegramChatId: null,
    ...overrides
  };
}

describe('bot form mapping', () => {
  it('maps a bot to its form state (edit mode)', () => {
    const form = toFormState(
      makeBot({
        title: 'EU Crypto',
        market: 'crypto',
        strategy: 'breakout',
        symbols: ['BTC', 'ETH']
      })
    );
    expect(form.title).toBe('EU Crypto');
    expect(form.market).toBe('crypto');
    expect(form.strategy).toBe('breakout');
    expect(form.symbolsText).toBe('BTC, ETH');
    expect(form.execution).toBe('approval');
    expect(form.tradingKeyId).toBe('3');
    expect(form.maxRiskPerTradePct).toBe(2);
  });

  it('returns the empty form for create mode (no bot)', () => {
    const form = toFormState(null);
    expect(form.title).toBe('');
    expect(form.market).toBe('us');
    expect(form.symbolsText).toBe('');
    expect(form.execution).toBe('approval');
  });

  it('produces different state for different bots (stale-edit bug guard)', () => {
    const a = toFormState(makeBot({ id: 1, title: 'Bot One', symbols: ['AAPL'] }));
    const b = toFormState(makeBot({ id: 2, title: 'Bot Two', symbols: ['GOOG'] }));
    expect(a.title).toBe('Bot One');
    expect(b.title).toBe('Bot Two');
    expect(a.symbolsText).toBe('AAPL');
    expect(b.symbolsText).toBe('GOOG');
    expect(a.title).not.toBe(b.title);
  });

  it('uppercases and dedupes symbols', () => {
    expect(splitSymbols('aapl, GOOG, aapl, msft')).toEqual(['AAPL', 'GOOG', 'MSFT']);
    expect(splitSymbols('')).toEqual([]);
  });
});
