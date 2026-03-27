import 'dotenv/config';

export const env = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

  // Game
  defaultChips: parseInt(process.env.DEFAULT_CHIPS || '10000', 10),
  minBuyIn: parseInt(process.env.MIN_BUY_IN || '100', 10),
  maxBuyIn: parseInt(process.env.MAX_BUY_IN || '1000000', 10),
  turnTimeoutSeconds: parseInt(process.env.TURN_TIMEOUT_SECONDS || '30', 10),
  maxPlayersPerTable: parseInt(process.env.MAX_PLAYERS_PER_TABLE || '9', 10),
} as const;
