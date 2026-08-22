import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import { AlpacaClient, AlpacaEnvironment } from '@greed-advisor/alpaca';
import type { AlpacaAccount, AlpacaOrder } from '@greed-advisor/alpaca';

const fetchMock = jest.fn<typeof fetch>();
globalThis.fetch = fetchMock as unknown as typeof fetch;

const mockAccount: AlpacaAccount = {
  id: 'acc-id',
  account_number: 'ACC123',
  status: 'ACTIVE',
  currency: 'USD',
  cash: '10000',
  portfolio_value: '25000',
  equity: '25000',
  last_equity: '24000',
  buying_power: '50000',
  multiplier: '2',
  pattern_day_trader: false,
  daytrading_buying_power: '50000',
  regt_buying_power: '50000',
  non_marginable_buying_power: '50000',
  created_at: '2026-01-01T00:00:00Z',
  shorting_enabled: true,
  long_market_value: '15000',
  short_market_value: '0',
  initial_margin: '7500',
  maintenance_margin: '6000'
};

const mockOrder: AlpacaOrder = {
  id: 'order-1',
  client_order_id: 'co-1',
  symbol: 'AAPL',
  asset_class: 'us_equity',
  qty: '5',
  filled_qty: '0',
  filled_avg_price: null,
  order_class: 'bracket',
  side: 'buy',
  type: 'market',
  status: 'accepted',
  limit_price: null,
  stop_price: null,
  time_in_force: 'day',
  created_at: '2026-08-21T00:00:00Z',
  updated_at: '2026-08-21T00:00:00Z',
  legs: null
};

function jsonResponse(data: unknown): Response {
  return {
    ok: true,
    text: async () => JSON.stringify(data)
  } as unknown as Response;
}

function errorResponse(status: number, body: string): Response {
  return {
    ok: false,
    status,
    text: async () => body
  } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe('AlpacaClient', () => {
  it('requests the paper account endpoint with auth headers', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(mockAccount));

    const client = new AlpacaClient({
      apiKey: 'KEY',
      apiSecret: 'SECRET',
      environment: AlpacaEnvironment.PAPER
    });
    const account = await client.getAccount();

    expect(account.account_number).toBe('ACC123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://paper-api.alpaca.markets/v2/account');
    expect(options.method).toBe('GET');
    expect((options.headers as Record<string, string>)['APCA-API-KEY-ID']).toBe('KEY');
    expect((options.headers as Record<string, string>)['APCA-API-SECRET-KEY']).toBe('SECRET');
  });

  it('uses the live base URL in the live environment', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(mockAccount));

    const client = new AlpacaClient({
      apiKey: 'KEY',
      apiSecret: 'SECRET',
      environment: AlpacaEnvironment.LIVE
    });
    await client.getAccount();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://api.alpaca.markets/v2/account');
  });

  it('places a bracket order with protective legs', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(mockOrder));

    const client = new AlpacaClient({
      apiKey: 'KEY',
      apiSecret: 'SECRET',
      environment: AlpacaEnvironment.PAPER
    });
    await client.placeOrder({
      symbol: 'AAPL',
      side: 'buy',
      qty: 5,
      takeProfit: 210,
      stopLoss: 185
    });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://paper-api.alpaca.markets/v2/orders');
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body as string);
    expect(body.symbol).toBe('AAPL');
    expect(body.side).toBe('buy');
    expect(body.qty).toBe('5');
    expect(body.type).toBe('market');
    expect(body.time_in_force).toBe('day');
    expect(body.order_class).toBe('bracket');
    expect(body.take_profit).toEqual({ limit_price: '210' });
    expect(body.stop_loss).toEqual({ stop_price: '185' });
  });

  it('rejects a limit order without a limit price', async () => {
    const client = new AlpacaClient({
      apiKey: 'KEY',
      apiSecret: 'SECRET',
      environment: AlpacaEnvironment.PAPER
    });

    await expect(
      client.placeOrder({ symbol: 'AAPL', side: 'buy', qty: 5, type: 'limit' })
    ).rejects.toThrow('limitPrice');
  });

  it('builds asset query parameters', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    const client = new AlpacaClient({
      apiKey: 'KEY',
      apiSecret: 'SECRET',
      environment: AlpacaEnvironment.PAPER
    });
    await client.getAssets({ status: 'active', tradable: true });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://paper-api.alpaca.markets/v2/assets?status=active&tradable=true');
  });

  it('throws on a non-ok response', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(500, 'boom'));

    const client = new AlpacaClient({
      apiKey: 'KEY',
      apiSecret: 'SECRET',
      environment: AlpacaEnvironment.PAPER
    });

    await expect(client.getAccount()).rejects.toThrow('Alpaca API error 500');
  });

  it('returns null from getPosition when the position is not found', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(404, 'position does not exist'));

    const client = new AlpacaClient({
      apiKey: 'KEY',
      apiSecret: 'SECRET',
      environment: AlpacaEnvironment.PAPER
    });

    await expect(client.getPosition('AAPL')).resolves.toBeNull();
  });
});
