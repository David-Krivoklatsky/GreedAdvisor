import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import { OpenCodeProvider, createAiProvider, AI_MODEL_OPTIONS } from '@greed-advisor/ai';
import type { AiReportInput } from '@greed-advisor/ai';

const fetchMock = jest.fn<typeof fetch>();
globalThis.fetch = fetchMock as unknown as typeof fetch;

const input: AiReportInput = {
  symbol: 'AAPL',
  companyName: 'Apple Inc.',
  quote: { price: 200, previousClose: 195, change: 5, changePercent: 2.56 },
  candles: [{ datetime: '2026-08-20', open: 195, high: 201, low: 194, close: 200, volume: 1000 }],
  reportType: 'thesis',
  productType: 'INVEST',
  riskProfile: 'balanced'
};

const rawReport = {
  action: 'BUY',
  recommendation: 'BUY',
  confidence: 80,
  summary: 'Strong buy.',
  analysis: { technicals: 'Uptrend.', risks: 'Market risk.' },
  entryPrice: 200,
  stopLoss: 190,
  takeProfit: 220
};

function jsonResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
    json: async () => data
  } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe('OpenCodeProvider', () => {
  it('calls the OpenCode chat completions endpoint with bearer auth', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ choices: [{ message: { content: JSON.stringify(rawReport) } }] })
    );

    const provider = new OpenCodeProvider('opencode-key');
    await provider.generateReport(input);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://opencode.ai/zen/go/v1/chat/completions');
    expect(options.method).toBe('POST');
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer opencode-key');
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe('glm-5.2');
    expect(body.messages[1].role).toBe('user');
  });

  it('uses a custom model when provided', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ choices: [{ message: { content: JSON.stringify(rawReport) } }] })
    );

    const provider = new OpenCodeProvider('key', 'deepseek-v4-pro');
    await provider.generateReport(input);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe('deepseek-v4-pro');
  });

  it('passes the selected model through createAiProvider', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ choices: [{ message: { content: JSON.stringify(rawReport) } }] })
    );

    const provider = createAiProvider('opencode', 'key', 'minimax-m3');
    await provider.generateReport(input);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe('minimax-m3');
  });

  it('exposes model options for every provider', () => {
    for (const models of Object.values(AI_MODEL_OPTIONS)) {
      expect(models.length).toBeGreaterThan(0);
      for (const model of models) {
        expect(model.value).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);
        expect(model.label.length).toBeGreaterThan(0);
      }
    }
    expect(AI_MODEL_OPTIONS.opencode[0].value).toBe('glm-5.2');
  });

  it('parses and normalizes the report', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ choices: [{ message: { content: JSON.stringify(rawReport) } }] })
    );

    const provider = new OpenCodeProvider('key');
    const report = await provider.generateReport(input);

    expect(report.action).toBe('BUY');
    expect(report.recommendation).toBe('BUY');
    expect(report.confidence).toBe(80);
    expect(report.entryPrice).toBe(200);
    expect(report.stopLoss).toBe(190);
    expect(report.provider).toBe('opencode');
  });

  it('extracts JSON even when wrapped in prose or fences', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        choices: [
          {
            message: {
              content: 'Here is the plan: ```json\n' + JSON.stringify(rawReport) + '\n```'
            }
          }
        ]
      })
    );

    const provider = new OpenCodeProvider('key');
    const report = await provider.generateReport(input);
    expect(report.recommendation).toBe('BUY');
  });

  it('throws on a non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'unauthorized'
    } as unknown as Response);

    const provider = new OpenCodeProvider('key');
    await expect(provider.generateReport(input)).rejects.toThrow('OpenCode API error 401');
  });
});
