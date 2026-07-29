import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'node:crypto';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { paymentsRouter } from './routes/payments.js';
import { referralsRouter } from './routes/referrals.js';
import { setupSocketHandlers } from './services/socketHandler.js';
import { rateLimit } from './middleware/rateLimit.js';
import { captureException, flushErrorTelemetry } from './instrument.js';

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
app.set('io', io);

// ─── Middleware ─────────────────────────────────────────────────────────────

app.use(helmet());
app.set('trust proxy', env.trustProxy);
app.use(cors({ origin: (origin, callback) => callback(null, isAllowedOrigin(origin)), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const requestId = typeof req.headers['x-request-id'] === 'string'
    ? req.headers['x-request-id'].slice(0, 128)
    : crypto.randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  const startedAt = performance.now();
  res.on('finish', () => {
    console.log(JSON.stringify({
      type: 'http_request',
      requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
    }));
  });
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
  captureException(err, { request_id: String(res.locals.requestId || 'unknown') });
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
    await terminateAfterFatal(error, 'startup');
  }
}

let isShuttingDown = false;

async function terminateAfterFatal(error: unknown, source: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  captureException(error, { fatal_source: source });
  await flushErrorTelemetry();
  process.exit(1);
}

process.on('uncaughtException', error => {
  console.error('[FATAL] Uncaught exception:', error);
  void terminateAfterFatal(error, 'uncaught_exception');
});
process.on('unhandledRejection', error => {
  console.error('[FATAL] Unhandled rejection:', error);
  void terminateAfterFatal(error, 'unhandled_rejection');
});

// Graceful shutdown
async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[SHUTDOWN] ${signal}`);
  await new Promise<void>(resolve => io.close(() => resolve()));
  await prisma.$disconnect();
  await flushErrorTelemetry();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

if (env.nodeEnv !== 'test') start();
