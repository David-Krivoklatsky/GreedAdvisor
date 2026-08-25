export type AiProvider = 'openai' | 'anthropic' | 'google' | 'claude' | 'opencode';

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
  news?: Array<{
    title: string;
    source?: string;
    publishedAt?: string;
    summary?: string;
    url?: string;
  }>;
  earnings?: {
    date?: string;
    estimate?: string;
  };
  indicators?: {
    ema9?: number | null;
    ema21?: number | null;
    sma200?: number | null;
    rsi?: number | null;
    macd?: number | null;
    macdSignal?: number | null;
    macdHistogram?: number | null;
    vwap?: number | null;
    atr?: number | null;
    bollingerUpper?: number | null;
    bollingerMiddle?: number | null;
    bollingerLower?: number | null;
  };
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
  aggressive: 0.03
};

const PRODUCT_NOTES: Record<AiProductType, string> = {
  INVEST:
    'INVEST (long-term share dealing): no leverage. Recommend ADD/HOLD/TRIM accumulation actions. Stop-loss is optional; focus on thesis, valuation and long horizon. If the action is ADD/TRIM suggest a smaller position than a full BUY/SELL.',
  CFD: 'CFD (leveraged contracts for difference): high risk, leverage amplifies losses. You MUST set a stopLoss and takeProfit. Position size must be conservative. Add an explicit leverage warning in risks.',
  CRYPTO:
    'CRYPTO (24/7, highly volatile): high risk. You MUST set a stopLoss and takeProfit. Position size must be small due to volatility. Add an explicit volatility warning in risks.'
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

Technical indicators (computed from the candle series above):
- EMA 9: ${input.indicators?.ema9 ?? 'n/a'}
- EMA 21: ${input.indicators?.ema21 ?? 'n/a'}
- SMA 200: ${input.indicators?.sma200 ?? 'n/a'}
- RSI (14): ${input.indicators?.rsi ?? 'n/a'}
- MACD: ${input.indicators?.macd ?? 'n/a'}
- MACD signal: ${input.indicators?.macdSignal ?? 'n/a'}
- MACD histogram: ${input.indicators?.macdHistogram ?? 'n/a'}
- VWAP: ${input.indicators?.vwap ?? 'n/a'}
- ATR (14): ${input.indicators?.atr ?? 'n/a'}
- Bollinger upper/middle/lower (20, 2): ${input.indicators?.bollingerUpper ?? 'n/a'} / ${input.indicators?.bollingerMiddle ?? 'n/a'} / ${input.indicators?.bollingerLower ?? 'n/a'}

Use the indicators alongside the price action. Reference the trend structure
(EMA 9/21 alignment and crossovers, price vs SMA 200 regime), momentum (RSI
overbought/oversold and divergences, MACD signal-line crossovers), value vs
VWAP, and volatility context (Bollinger band width/squeeze, ATR for stop
sizing) in the "technicals" analysis. Do not invent indicator values;
only use the ones provided.

${
  input.news && input.news.length > 0
    ? `
Recent news headlines (do NOT treat these as definitive; treat as sentiment/risk context):
${input.news
  .map(
    n =>
      `- [${n.publishedAt ?? 'recent'}] ${n.title}${n.source ? ` (${n.source})` : ''}${n.summary ? ` — ${n.summary}` : ''}`
  )
  .join('\n')}

Weigh this news against the technicals. Flag material catalysts or event risk
(earnings, guidance, regulatory, macro) in the "sentiment" and "risks" fields,
and widen the stop-loss or downgrade the action if an event could gap the price.
`
    : 'No recent news available. Proceed on technicals alone.'
}

${
  input.earnings?.date
    ? `
Upcoming earnings: ${input.earnings.date}${
        input.earnings.estimate ? ` (EPS estimate ${input.earnings.estimate})` : ''
      }.
Earnings can gap the price. If the report is within 3 trading days, prefer HOLD or a
wider stop-loss, and explicitly note the event risk in "risks".
`
    : 'No upcoming earnings data available.'
}

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
      risks: raw.analysis?.risks
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
      takeProfit
    },
    generatedAt: new Date().toISOString(),
    provider
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a financial analyst returning JSON only.' },
          { role: 'user', content: REPORT_PROMPT(input) }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: REPORT_PROMPT(input) }]
      })
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
          contents: [{ parts: [{ text: REPORT_PROMPT(input) }] }]
        })
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

export class OpenCodeProvider implements AiProviderClient {
  // OpenCode GO subscription gateway (OpenAI-compatible)
  private static readonly BASE_URL = 'https://opencode.ai/zen/go/v1/chat/completions';

  constructor(
    private readonly apiKey: string,
    private readonly model = 'glm-5.2'
  ) {}

  async generateReport(input: AiReportInput): Promise<AiReport> {
    const response = await fetch(OpenCodeProvider.BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a financial analyst returning JSON only.' },
          { role: 'user', content: REPORT_PROMPT(input) }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenCode API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return this.parse(content, 'opencode', input);
  }

  private parse(content: string, provider: AiProvider, input: AiReportInput): AiReport {
    const json = content.match(/\{[\s\S]*\}/);
    const raw = JSON.parse(json?.[0] ?? content) as RawReport;
    return toReport(raw, provider, input);
  }
}

// Selectable models per provider. `opencode` lists the OpenCode GO gateway
// models; other providers list their most common chat models.
export const AI_MODEL_OPTIONS: Record<AiProvider, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
    { value: 'gpt-4.1', label: 'GPT-4.1' }
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet' }
  ],
  claude: [
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet' }
  ],
  google: [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
  ],
  opencode: [
    { value: 'glm-5.2', label: 'GLM 5.2' },
    { value: 'glm-5.3', label: 'GLM 5.3' },
    { value: 'glm-5.1', label: 'GLM 5.1' },
    { value: 'glm-5', label: 'GLM 5' },
    { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
    { value: 'deepseek-v4-flash-vision-exp', label: 'DeepSeek V4 Flash Vision (exp)' },
    { value: 'minimax-m3', label: 'Minimax M3' },
    { value: 'minimax-m2.7', label: 'Minimax M2.7' },
    { value: 'minimax-m2.5', label: 'Minimax M2.5' },
    { value: 'kimi-k2.7-code', label: 'Kimi K2.7 Code' },
    { value: 'kimi-k2.6', label: 'Kimi K2.6' },
    { value: 'kimi-k2.5', label: 'Kimi K2.5' },
    { value: 'qwen3.8-max', label: 'Qwen 3.8 Max' },
    { value: 'qwen3.7-max', label: 'Qwen 3.7 Max' },
    { value: 'qwen3.7-plus', label: 'Qwen 3.7 Plus' },
    { value: 'qwen3.6-plus', label: 'Qwen 3.6 Plus' },
    { value: 'qwen3.5-plus', label: 'Qwen 3.5 Plus' },
    { value: 'gpt-5.6-luna', label: 'GPT 5.6 Luna' },
    { value: 'grok-4.5', label: 'Grok 4.5' },
    { value: 'mimo-v2.5-pro', label: 'Mimo V2.5 Pro' },
    { value: 'mimo-v2.5', label: 'Mimo V2.5' },
    { value: 'mimo-v2-pro', label: 'Mimo V2 Pro' },
    { value: 'mimo-v2-omni', label: 'Mimo V2 Omni' },
    { value: 'hy3', label: 'Hy3' },
    { value: 'hy3-preview', label: 'Hy3 Preview' },
    { value: 'ox-alpha-free', label: 'Ox Alpha (free)' },
    { value: 'muse-spark-1.2-contributor', label: 'Muse Spark 1.2' }
  ]
};

export function createAiProvider(
  provider: AiProvider,
  apiKey: string,
  model?: string
): AiProviderClient {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey, model);
    case 'anthropic':
    case 'claude':
      return new AnthropicProvider(apiKey, model);
    case 'google':
      return new GoogleProvider(apiKey, model);
    case 'opencode':
      return new OpenCodeProvider(apiKey, model);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
