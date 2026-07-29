import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import crypto from 'node:crypto';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { paymentsRouter } from './routes/payments.js';
import { referralsRouter } from './routes/referrals.js';
import { setupSocketHandlers } from './services/socketHandler.js';
import { rateLimit } from './middleware/rateLimit.js';

export const app = express();
export const httpServer = createServer(app);

const isAllowedOrigin = (origin?: string) => !origin || env.corsOrigins.includes(origin);

// ─── Socket.io Setup ───────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000,
});

// ─── Middleware ─────────────────────────────────────────────────────────────

app.use(helmet());
app.set('trust proxy', env.trustProxy);
app.use(cors({ origin: (origin, callback) => callback(null, isAllowedOrigin(origin)), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use((req, res, next) => {
  const requestId = typeof req.headers['x-request-id'] === 'string'
    ? req.headers['x-request-id'].slice(0, 128)
    : crypto.randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// ─── Health Check ──────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    version: env.appVersion,
  });
});

app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', version: env.appVersion });
  } catch {
    res.status(503).json({ status: 'not_ready' });
  }
});

// ─── API Routes ────────────────────────────────────────────────────────────

app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 20, name: 'auth' }), authRouter);
app.use('/api/users', usersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/referrals', rateLimit({ windowMs: 60_000, max: 60, name: 'referrals' }), referralsRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// ─── Error Handler ─────────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: env.nodeEnv === 'production' ? 'Internal server error' : err.message,
    requestId: res.locals.requestId,
  });
});

// ─── Socket Handlers ───────────────────────────────────────────────────────

const roomManager = setupSocketHandlers(io);

// ─── Server Start ──────────────────────────────────────────────────────────

async function start() {
  try {
    console.log('[BOOT] Starting Teen Patti server...');
    console.log(`[BOOT] PORT=${env.port}, NODE_ENV=${env.nodeEnv}`);

    // Test database connection
    await prisma.$connect();
    console.log('[DB] Connected to database');

    httpServer.listen(env.port, () => {
      console.log(`\n🎴 Teen Patti Server running on port ${env.port}`);
      console.log(`   Environment: ${env.nodeEnv}`);
      console.log(`   CORS Origins: ${env.corsOrigins.join(', ')}`);
      console.log(`   WebSocket: ws://localhost:${env.port}`);
      console.log('');
    });
  } catch (error) {
    console.error('[FATAL] Failed to start server:', error);
    process.exit(1);
  }
}

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('[FATAL] Unhandled rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  io.close();
  await prisma.$disconnect();
  httpServer.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  io.close();
  await prisma.$disconnect();
  httpServer.close();
  process.exit(0);
});

if (env.nodeEnv !== 'test') start();
