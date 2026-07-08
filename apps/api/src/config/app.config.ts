import { registerAs } from '@nestjs/config';

/**
 * Application configuration factory.
 *
 * All environment variables are read ONCE here.
 * No module reads process.env directly — they use ConfigService.get('app.*').
 * This enables easy testing (override config in tests) and type safety.
 */
export const appConfig = registerAs('app', () => ({
  nodeEnv:    process.env.NODE_ENV     ?? 'development',
  port:       parseInt(process.env.PORT ?? '3000', 10),
  apiUrl:     process.env.API_URL      ?? 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN  ?? 'http://localhost:3001',

  /** JWT — access token */
  jwtSecret:     process.env.JWT_SECRET     ?? '',
  jwtExpiresIn:  process.env.JWT_EXPIRES_IN ?? '15m',

  /** JWT — refresh token */
  jwtRefreshSecret:    process.env.JWT_REFRESH_SECRET    ?? '',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',

  /** Supabase */
  supabaseUrl:            process.env.SUPABASE_URL             ?? '',
  supabaseAnonKey:        process.env.SUPABASE_ANON_KEY        ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseStorageBucket:  process.env.STORAGE_BUCKET            ?? 'visaflow',

  /** Redis (BullMQ) */
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',

  /** Email */
  emailProvider: process.env.EMAIL_PROVIDER ?? 'console',
  emailFrom:     process.env.EMAIL_FROM     ?? 'noreply@visaflow.ai',
  emailApiKey:   process.env.EMAIL_API_KEY  ?? '',
}));

export type AppConfig = ReturnType<typeof appConfig>;
