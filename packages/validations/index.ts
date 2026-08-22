import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const AI_PROVIDERS = ['openai', 'anthropic', 'google', 'claude'] as const;

export const aiApiKeySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  provider: z.enum(AI_PROVIDERS, { error: 'Provider is required' }),
  apiKey: z.string().min(1, 'API key is required')
});

const TRADING_PROVIDERS = ['trading212', 'alpaca'] as const;

export const t212ApiKeySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  accessType: z
    .enum({ 'read-only': 'read-only', 'full-access': 'full-access' })
    .optional()
    .default('read-only'),
  environment: z.enum({ demo: 'demo', live: 'live', paper: 'paper' }).default('demo'),
  provider: z.enum(TRADING_PROVIDERS).default('trading212'),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required')
});

export const updateAiApiKeySchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  provider: z.enum(AI_PROVIDERS).optional(),
  apiKey: z.string().min(1, 'API key is required').optional(),
  isActive: z.boolean().optional()
});

export const profileUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  profilePicture: z.string().optional(),
  riskProfile: z
    .enum({ conservative: 'conservative', balanced: 'balanced', aggressive: 'aggressive' })
    .optional()
});

export const updateT212ApiKeySchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  accessType: z.enum({ 'read-only': 'read-only', 'full-access': 'full-access' }).optional(),
  environment: z.enum({ demo: 'demo', live: 'live', paper: 'paper' }).optional(),
  apiKey: z.string().min(1, 'API key is required').optional(),
  apiSecret: z.string().min(1, 'API secret is required').optional(),
  isActive: z.boolean().optional()
});

export const marketDataKeySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  provider: z.enum({ twelvedata: 'twelvedata' }, { error: 'Provider is required' }),
  apiKey: z.string().min(1, 'API key is required')
});

export const updateMarketDataKeySchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  provider: z.enum({ twelvedata: 'twelvedata' }).optional(),
  apiKey: z.string().min(1, 'API key is required').optional(),
  isActive: z.boolean().optional()
});

export const watchlistItemSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required'),
  name: z.string().optional().nullable(),
  instrumentType: z
    .enum({ STOCK: 'STOCK', ETF: 'ETF', CRYPTO: 'CRYPTO', FOREX: 'FOREX' })
    .optional()
});

export const marketDataKeyTestSchema = z.object({
  keyId: z.coerce.number().int().positive('keyId is required')
});

export const orderSchema = z.object({
  tradingKeyId: z.coerce.number().int().positive('Trading account is required'),
  ticker: z.string().min(1, 'Ticker is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  side: z.enum({ BUY: 'BUY', SELL: 'SELL' }, { error: 'Side must be BUY or SELL' }),
  stopLoss: z.coerce.number().optional(),
  takeProfit: z.coerce.number().optional(),
  extendedHours: z.boolean().optional()
});

export const watchlistScanSchema = z.object({
  aiKeyId: z.coerce.number().int().positive('AI key is required'),
  marketDataKeyId: z.coerce.number().int().positive('Market data key is required'),
  productType: z.enum({ INVEST: 'INVEST', CFD: 'CFD', CRYPTO: 'CRYPTO' }).default('INVEST')
});

export const reportSchema = z.object({
  tradingKeyId: z.coerce.number().int().positive('Trading key is required'),
  aiKeyId: z.coerce.number().int().positive('AI key is required'),
  marketDataKeyId: z.coerce.number().int().positive('Market data key is required'),
  reportType: z.string().min(1, 'Report type is required'),
  symbol: z.string().min(1).optional(),
  productType: z.enum({ INVEST: 'INVEST', CFD: 'CFD', CRYPTO: 'CRYPTO' }).default('INVEST'),
  riskProfile: z
    .enum({ conservative: 'conservative', balanced: 'balanced', aggressive: 'aggressive' })
    .default('balanced'),
  accountValue: z.coerce.number().positive().optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AiApiKeyInput = z.infer<typeof aiApiKeySchema>;
export type T212ApiKeyInput = z.infer<typeof t212ApiKeySchema>;
export type UpdateAiApiKeyInput = z.infer<typeof updateAiApiKeySchema>;
export type UpdateT212ApiKeyInput = z.infer<typeof updateT212ApiKeySchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type MarketDataKeyInput = z.infer<typeof marketDataKeySchema>;
export type UpdateMarketDataKeyInput = z.infer<typeof updateMarketDataKeySchema>;
export type WatchlistItemInput = z.infer<typeof watchlistItemSchema>;
export type MarketDataKeyTestInput = z.infer<typeof marketDataKeyTestSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type WatchlistScanInput = z.infer<typeof watchlistScanSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
