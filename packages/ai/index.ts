export type AiProvider = 'openai' | 'anthropic' | 'google' | 'claude';

export interface AiReportInput {
  symbol: string;
  companyName?: string;
  quote: {
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
  };
  candles: {
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  reportType: string;
}

export interface AiReport {
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  summary: string;
  analysis: {
    fundamentals?: string;
    technicals: string;
    sentiment?: string;
    risks?: string;
  };
  priceTargets: {
    current: number;
    stopLoss?: number;
    takeProfit?: number;
  };
  generatedAt: string;
  provider: AiProvider;
}

export interface AiProviderClient {
  generateReport(input: AiReportInput): Promise<AiReport>;
}

const REPORT_PROMPT = (input: AiReportInput): string => `
You are a professional financial analyst. Analyze the following stock data and produce a
structured trading report as valid JSON only (no markdown, no code fences).

Symbol: ${input.symbol}${input.companyName ? ` (${input.companyName})` : ''}
Report type: ${input.reportType}

Current quote:
- Price: ${input.quote.price}
- Previous close: ${input.quote.previousClose}
- Change: ${input.quote.change} (${input.quote.changePercent}%)

Recent price history (oldest → newest):
${input.candles
  .map(c => `${c.datetime} | O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${c.volume}`)
  .join('\n')}

Return JSON with this exact shape:
{
  "recommendation": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "summary": "2-3 sentence overall assessment",
  "analysis": {
    "fundamentals": "optional",
    "technicals": "technical analysis of the price action",
    "sentiment": "optional",
    "risks": "optional"
  },
  "priceTargets": {
    "current": ${input.quote.price},
    "stopLoss": number | null,
    "takeProfit": number | null
  }
}
`;

export class OpenAIProvider implements AiProviderClient {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-4o-mini'
  ) {}

  async generateReport(input: AiReportInput): Promise<AiReport> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a financial analyst returning JSON only.' },
          { role: 'user', content: REPORT_PROMPT(input) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return this.parse(content, 'openai');
  }

  private parse(content: string, provider: AiProvider): AiReport {
    const raw = JSON.parse(content) as Partial<AiReport> & {
      priceTargets?: { current?: number; stopLoss?: number | null; takeProfit?: number | null };
    };
    return {
      recommendation: this.normalizeRecommendation(raw.recommendation),
      confidence: Math.min(100, Math.max(0, Number(raw.confidence) || 50)),
      summary: raw.summary ?? 'No summary provided.',
      analysis: {
        fundamentals: raw.analysis?.fundamentals,
        technicals: raw.analysis?.technicals ?? 'No technical analysis provided.',
        sentiment: raw.analysis?.sentiment,
        risks: raw.analysis?.risks,
      },
      priceTargets: {
        current: Number(raw.priceTargets?.current) || 0,
        stopLoss: raw.priceTargets?.stopLoss ?? undefined,
        takeProfit: raw.priceTargets?.takeProfit ?? undefined,
      },
      generatedAt: new Date().toISOString(),
      provider,
    };
  }

  private normalizeRecommendation(value?: string): 'BUY' | 'SELL' | 'HOLD' {
    const upper = (value ?? 'HOLD').toUpperCase();
    if (upper.startsWith('BUY')) return 'BUY';
    if (upper.startsWith('SELL')) return 'SELL';
    return 'HOLD';
  }
}

export class AnthropicProvider implements AiProviderClient {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'claude-3-5-sonnet-latest'
  ) {}

  async generateReport(input: AiReportInput): Promise<AiReport> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: REPORT_PROMPT(input) }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    return this.parse(content, 'claude');
  }

  private parse(content: string, provider: AiProvider): AiReport {
    const json = content.match(/\{[\s\S]*\}/);
    const raw = JSON.parse(json?.[0] ?? content) as Partial<AiReport> & {
      priceTargets?: { current?: number; stopLoss?: number | null; takeProfit?: number | null };
    };
    return {
      recommendation: this.normalizeRecommendation(raw.recommendation),
      confidence: Math.min(100, Math.max(0, Number(raw.confidence) || 50)),
      summary: raw.summary ?? 'No summary provided.',
      analysis: {
        fundamentals: raw.analysis?.fundamentals,
        technicals: raw.analysis?.technicals ?? 'No technical analysis provided.',
        sentiment: raw.analysis?.sentiment,
        risks: raw.analysis?.risks,
      },
      priceTargets: {
        current: Number(raw.priceTargets?.current) || 0,
        stopLoss: raw.priceTargets?.stopLoss ?? undefined,
        takeProfit: raw.priceTargets?.takeProfit ?? undefined,
      },
      generatedAt: new Date().toISOString(),
      provider,
    };
  }

  private normalizeRecommendation(value?: string): 'BUY' | 'SELL' | 'HOLD' {
    const upper = (value ?? 'HOLD').toUpperCase();
    if (upper.startsWith('BUY')) return 'BUY';
    if (upper.startsWith('SELL')) return 'SELL';
    return 'HOLD';
  }
}

export class GoogleProvider implements AiProviderClient {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'gemini-1.5-flash'
  ) {}

  async generateReport(input: AiReportInput): Promise<AiReport> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: REPORT_PROMPT(input) }] }],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return this.parse(content, 'google');
  }

  private parse(content: string, provider: AiProvider): AiReport {
    const json = content.match(/\{[\s\S]*\}/);
    const raw = JSON.parse(json?.[0] ?? content) as Partial<AiReport> & {
      priceTargets?: { current?: number; stopLoss?: number | null; takeProfit?: number | null };
    };
    return {
      recommendation: this.normalizeRecommendation(raw.recommendation),
      confidence: Math.min(100, Math.max(0, Number(raw.confidence) || 50)),
      summary: raw.summary ?? 'No summary provided.',
      analysis: {
        fundamentals: raw.analysis?.fundamentals,
        technicals: raw.analysis?.technicals ?? 'No technical analysis provided.',
        sentiment: raw.analysis?.sentiment,
        risks: raw.analysis?.risks,
      },
      priceTargets: {
        current: Number(raw.priceTargets?.current) || 0,
        stopLoss: raw.priceTargets?.stopLoss ?? undefined,
        takeProfit: raw.priceTargets?.takeProfit ?? undefined,
      },
      generatedAt: new Date().toISOString(),
      provider,
    };
  }

  private normalizeRecommendation(value?: string): 'BUY' | 'SELL' | 'HOLD' {
    const upper = (value ?? 'HOLD').toUpperCase();
    if (upper.startsWith('BUY')) return 'BUY';
    if (upper.startsWith('SELL')) return 'SELL';
    return 'HOLD';
  }
}

export function createAiProvider(provider: AiProvider, apiKey: string): AiProviderClient {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'anthropic':
    case 'claude':
      return new AnthropicProvider(apiKey);
    case 'google':
      return new GoogleProvider(apiKey);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
