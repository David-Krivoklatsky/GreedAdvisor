import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const aiApiKeySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  provider: z.enum(['openai', 'anthropic', 'google', 'claude', 'other'], {
    required_error: 'Provider is required',
  }),
  apiKey: z.string().min(1, 'API key is required'),
});

export const t212ApiKeySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  accessType: z.enum(['read-only', 'full-access'], {
    required_error: 'Access type is required',
  }),
  environment: z.enum(['demo', 'live']).default('demo'),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
});

export const updateAiApiKeySchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  provider: z.enum(['openai', 'anthropic', 'google', 'claude', 'other']).optional(),
  apiKey: z.string().min(1, 'API key is required').optional(),
  isActive: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  profilePicture: z.string().optional(),
});

export const updateT212ApiKeySchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  accessType: z.enum(['read-only', 'full-access']).optional(),
  environment: z.enum(['demo', 'live']).optional(),
  apiKey: z.string().min(1, 'API key is required').optional(),
  apiSecret: z.string().min(1, 'API secret is required').optional(),
  isActive: z.boolean().optional(),
});

export const marketDataKeySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  provider: z.enum(['twelvedata'], {
    required_error: 'Provider is required',
  }),
  apiKey: z.string().min(1, 'API key is required'),
});

export const updateMarketDataKeySchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  provider: z.enum(['twelvedata']).optional(),
  apiKey: z.string().min(1, 'API key is required').optional(),
  isActive: z.boolean().optional(),
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

// Re-export zod for convenience
export { z };
