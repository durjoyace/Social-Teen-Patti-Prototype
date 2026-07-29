import 'dotenv/config';
import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform(value => value === 'true');

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  PUBLIC_APP_URL: z.string().url().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(1),
  APP_VERSION: z.string().default('dev'),
  SENTRY_DSN: z.union([z.string().url(), z.literal('')]).default(''),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.05),

  DATABASE_URL: z.string().default(''),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  JWT_SECRET: z.string().default('dev-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret'),
  JWT_EXPIRY: z.string().default('7d'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  REFERRAL_HASH_SECRET: z.string().default('dev-referral-hash-secret'),

  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  PURCHASES_ENABLED: booleanString.default('false'),
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),

  DEFAULT_CHIPS: z.coerce.number().int().positive().default(10000),
  MIN_BUY_IN: z.coerce.number().int().positive().default(100),
  MAX_BUY_IN: z.coerce.number().int().positive().default(1000000),
  TURN_TIMEOUT_SECONDS: z.coerce.number().int().min(10).max(120).default(30),
  MAX_PLAYERS_PER_TABLE: z.coerce.number().int().min(2).max(9).default(9),
}).superRefine((value, context) => {
  if (value.NODE_ENV !== 'production') return;

  if (!/^(postgres|postgresql):\/\//.test(value.DATABASE_URL)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DATABASE_URL'],
      message: 'DATABASE_URL must be a PostgreSQL connection URL in production',
    });
  }

  const requiredSecrets = [
    ['JWT_SECRET', value.JWT_SECRET],
    ['JWT_REFRESH_SECRET', value.JWT_REFRESH_SECRET],
    ['REFERRAL_HASH_SECRET', value.REFERRAL_HASH_SECRET],
  ] as const;

  for (const [name, secret] of requiredSecrets) {
    if (!secret || secret.length < 32) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [name],
        message: `${name} must contain at least 32 characters in production`,
      });
    }
  }

  if (new Set(requiredSecrets.map(([, secret]) => secret)).size !== requiredSecrets.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'JWT and referral secrets must be distinct in production',
    });
  }

  const origins = value.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);
  if (!origins.length || origins.some(origin => !origin.startsWith('https://'))) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGIN'],
      message: 'CORS_ORIGIN must contain explicit HTTPS origins in production',
    });
  }

  if (!value.PUBLIC_APP_URL.startsWith('https://')) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['PUBLIC_APP_URL'],
      message: 'PUBLIC_APP_URL must use HTTPS in production',
    });
  }

  if (value.PURCHASES_ENABLED && (!value.RAZORPAY_KEY_ID || !value.RAZORPAY_KEY_SECRET)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['PURCHASES_ENABLED'],
      message: 'Razorpay credentials are required when purchases are enabled',
    });
  }
});

const parsed = rawEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[CONFIG] Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const raw = parsed.data;
const corsOrigins = raw.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);

export const env = {
  port: raw.PORT,
  nodeEnv: raw.NODE_ENV,
  corsOrigins,
  publicAppUrl: raw.PUBLIC_APP_URL.replace(/\/$/, ''),
  trustProxy: raw.TRUST_PROXY,
  appVersion: raw.APP_VERSION,
  sentryDsn: raw.SENTRY_DSN,
  sentryTracesSampleRate: raw.SENTRY_TRACES_SAMPLE_RATE,

  databaseUrl: raw.DATABASE_URL,
  redisUrl: raw.REDIS_URL,

  jwtSecret: raw.JWT_SECRET,
  jwtRefreshSecret: raw.JWT_REFRESH_SECRET,
  jwtExpiry: raw.JWT_EXPIRY,
  jwtRefreshExpiry: raw.JWT_REFRESH_EXPIRY,
  referralHashSecret: raw.REFERRAL_HASH_SECRET,

  googleClientId: raw.GOOGLE_CLIENT_ID,
  googleClientSecret: raw.GOOGLE_CLIENT_SECRET,
  purchasesEnabled: raw.PURCHASES_ENABLED,
  razorpayKeyId: raw.RAZORPAY_KEY_ID,
  razorpayKeySecret: raw.RAZORPAY_KEY_SECRET,

  defaultChips: raw.DEFAULT_CHIPS,
  minBuyIn: raw.MIN_BUY_IN,
  maxBuyIn: raw.MAX_BUY_IN,
  turnTimeoutSeconds: raw.TURN_TIMEOUT_SECONDS,
  maxPlayersPerTable: raw.MAX_PLAYERS_PER_TABLE,
} as const;
