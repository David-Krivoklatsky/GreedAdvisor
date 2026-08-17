export type AiProvider = 'openai' | 'anthropic' | 'google' | 'claude';

export type AiAction = 'BUY' | 'SELL' | 'HOLD' | 'ADD' | 'TRIM';
export type AiProductType = 'INVEST' | 'CFD' | 'CRYPTO';
export type AiRiskProfile = 'conservative' | 'balanced' | 'aggressive';

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
  productType?: AiProductType;
  riskProfile?: AiRiskProfile;
  accountValue?: number;
}

export interface AiReport {
  action: AiAction;
  productType: AiProductType;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  summary: string;
  analysis: {
    fundamentals?: string;
    technicals: string;
    sentiment?: string;
    risks?: string;
  };
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  riskAmount?: number;
  riskPerUnit?: number;
  priceTargets: {
    current: number;
    stopLoss?: number;
    takeProfit?: number;
  };
  generatedAt: string;
  provider: AiProvider;
}

const RISK_PCT: Record<AiRiskProfile, number> = {
  conservative: 0.01,
  balanced: 0.02,
  aggressive: 0.03,
};

const PRODUCT_NOTES: Record<AiProductType, string> = {
  INVEST:
    'INVEST (long-term share dealing): no leverage. Recommend ADD/HOLD/TRIM accumulation actions. Stop-loss is optional; focus on thesis, valuation and long horizon. If the action is ADD/TRIM suggest a smaller position than a full BUY/SELL.',
  CFD: 'CFD (leveraged contracts for difference): high risk, leverage amplifies losses. You MUST set a stopLoss and takeProfit. Position size must be conservative. Add an explicit leverage warning in risks.',
  CRYPTO:
    'CRYPTO (24/7, highly volatile): high risk. You MUST set a stopLoss and takeProfit. Position size must be small due to volatility. Add an explicit volatility warning in risks.',
};

const REPORT_PROMPT = (input: AiReportInput): string => {
  const riskPct = input.riskProfile ? RISK_PCT[input.riskProfile] : RISK_PCT.balanced;
  return `
You are a professional financial analyst. Analyze the following instrument and produce a
structured TRADE PLAN as valid JSON only (no markdown, no code fences).

Product type: ${input.productType ?? 'INVEST'}
${PRODUCT_NOTES[input.productType ?? 'INVEST']}

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

User risk profile: ${input.riskProfile ?? 'balanced'} (max risk ${(riskPct * 100).toFixed(0)}% of account per trade)
Account value: ${input.accountValue ?? 'unknown'}

Return JSON with this exact shape:
{
  "action": "BUY" | "SELL" | "HOLD" | "ADD" | "TRIM",
  "recommendation": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "summary": "2-3 sentence overall assessment",
  "analysis": {
    "fundamentals": "optional",
    "technicals": "technical analysis of the price action",
    "sentiment": "optional",
    "risks": "risk warnings including leverage/volatility for CFD/CRYPTO"
  },
  "entryPrice": ${input.quote.price},
  "stopLoss": number | null,
  "takeProfit": number | null,
  "positionSize": number | null,
  "riskAmount": number | null,
  "riskPerUnit": number | null
}

Position sizing guidance (user decides final size — this is a suggestion only):
- riskAmount should be approximately maxRisk% of accountValue (or of a default portfolio value if accountValue is unknown).
- riskPerUnit = |entryPrice - stopLoss|.
- suggested positionSize = riskAmount / riskPerUnit (round down; may be fractional for CFDs/forex).
- For INVEST, if stopLoss is null use a sensible long-term risk assumption (e.g. 10% of entry).
`;
};

interface RawReport {
  action?: string;
  productType?: string;
  recommendation?: string;
  confidence?: number;
  summary?: string;
  analysis?: {
    fundamentals?: string;
    technicals?: string;
    sentiment?: string;
    risks?: string;
  };
  entryPrice?: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  positionSize?: number | null;
  riskAmount?: number | null;
  riskPerUnit?: number | null;
  priceTargets?: {
    current?: number;
    stopLoss?: number | null;
    takeProfit?: number | null;
  };
}

function normalizeAction(value?: string): AiAction {
  const upper = (value ?? 'HOLD').toUpperCase();
  if (upper.startsWith('BUY')) return 'BUY';
  if (upper.startsWith('SELL')) return 'SELL';
  if (upper.startsWith('ADD')) return 'ADD';
  if (upper.startsWith('TRIM')) return 'TRIM';
  return 'HOLD';
}

function normalizeRecommendation(value?: string): 'BUY' | 'SELL' | 'HOLD' {
  const upper = (value ?? 'HOLD').toUpperCase();
  if (upper.startsWith('BUY')) return 'BUY';
  if (upper.startsWith('SELL')) return 'SELL';
  return 'HOLD';
}

function normalizeProductType(value?: string): AiProductType {
  const upper = (value ?? '').toUpperCase();
  if (upper === 'CFD') return 'CFD';
  if (upper === 'CRYPTO' || upper === 'CRYPTOCURRENCY') return 'CRYPTO';
  return 'INVEST';
}

function toReport(raw: RawReport, provider: AiProvider, input: AiReportInput): AiReport {
  const action = normalizeAction(raw.action);
  const entryPrice = Number(raw.entryPrice ?? raw.priceTargets?.current ?? input.quote.price) || 0;
  const stopLoss = raw.stopLoss ?? raw.priceTargets?.stopLoss ?? undefined;
  const takeProfit = raw.takeProfit ?? raw.priceTargets?.takeProfit ?? undefined;
  const riskPerUnit = raw.riskPerUnit ?? (stopLoss ? Math.abs(entryPrice - stopLoss) : undefined);
  const riskAmount = raw.riskAmount ?? undefined;
  const positionSize = raw.positionSize ?? undefined;

  return {
    action,
    productType: normalizeProductType(raw.productType ?? input.productType),
    recommendation: normalizeRecommendation(raw.recommendation ?? action),
    confidence: Math.min(100, Math.max(0, Number(raw.confidence) || 50)),
    summary: raw.summary ?? 'No summary provided.',
    analysis: {
      fundamentals: raw.analysis?.fundamentals,
      technicals: raw.analysis?.technicals ?? 'No technical analysis provided.',
      sentiment: raw.analysis?.sentiment,
      risks: raw.analysis?.risks,
    },
    entryPrice,
    stopLoss,
    takeProfit,
    positionSize,
    riskAmount,
    riskPerUnit,
    priceTargets: {
      current: entryPrice || input.quote.price,
      stopLoss,
      takeProfit,
    },
    generatedAt: new Date().toISOString(),
    provider,
  };
}

export interface AiProviderClient {
  generateReport(input: AiReportInput): Promise<AiReport>;
}

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
    return this.parse(content, 'openai', input);
  }

  private parse(content: string, provider: AiProvider, input: AiReportInput): AiReport {
    const raw = JSON.parse(content) as RawReport;
    return toReport(raw, provider, input);
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
    return this.parse(content, 'claude', input);
  }

  private parse(content: string, provider: AiProvider, input: AiReportInput): AiReport {
    const json = content.match(/\{[\s\S]*\}/);
    const raw = JSON.parse(json?.[0] ?? content) as RawReport;
    return toReport(raw, provider, input);
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
    return this.parse(content, 'google', input);
  }

  private parse(content: string, provider: AiProvider, input: AiReportInput): AiReport {
    const json = content.match(/\{[\s\S]*\}/);
    const raw = JSON.parse(json?.[0] ?? content) as RawReport;
    return toReport(raw, provider, input);
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
