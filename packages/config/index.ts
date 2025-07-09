import { z } from 'zod';

// Database configuration schema
export const databaseConfigSchema = z.object({
  DATABASE_URL: z.string().url('Invalid database URL'),
});

// API configuration schema
export const apiConfigSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ENCRYPTION_KEY: z.string().length(32, 'Encryption key must be exactly 32 characters'),
});

// Rate limiting configuration schema
export const rateLimitConfigSchema = z.object({
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().min(1)),
  RATE_LIMIT_WINDOW: z.string().transform(Number).pipe(z.number().min(1000)),
});

// Combined server configuration schema
export const serverConfigSchema = databaseConfigSchema
  .merge(apiConfigSchema)
  .merge(rateLimitConfigSchema);

// Client configuration schema
export const clientConfigSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('Invalid API URL'),
  NEXT_PUBLIC_ENABLE_REGISTRATION: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  NEXT_PUBLIC_ENABLE_API_KEYS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

// Type exports
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type ApiConfig = z.infer<typeof apiConfigSchema>;
export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;
export type ServerConfig = z.infer<typeof serverConfigSchema>;
export type ClientConfig = z.infer<typeof clientConfigSchema>;

// Configuration validation functions
export function validateServerConfig(env: Record<string, string | undefined>): ServerConfig {
  try {
    return serverConfigSchema.parse(env);
  } catch (error) {
    console.error('Server configuration validation failed:', error);
    throw new Error('Invalid server configuration');
  }
}

export function validateClientConfig(env: Record<string, string | undefined>): ClientConfig {
  try {
    return clientConfigSchema.parse(env);
  } catch (error) {
    console.error('Client configuration validation failed:', error);
    throw new Error('Invalid client configuration');
  }
}

export function validateDatabaseConfig(env: Record<string, string | undefined>): DatabaseConfig {
  try {
    return databaseConfigSchema.parse(env);
  } catch (error) {
    console.error('Database configuration validation failed:', error);
    throw new Error('Invalid database configuration');
  }
}
