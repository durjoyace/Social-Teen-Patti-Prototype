import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { paymentsRouter } from './routes/payments.js';
import { setupSocketHandlers } from './services/socketHandler.js';

const app = express();
const httpServer = createServer(app);

// ─── Socket.io Setup ───────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: env.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000,
});

// ─── Middleware ─────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// ─── Health Check ──────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/payments', paymentsRouter);

// ─── Error Handler ─────────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: env.nodeEnv === 'production' ? 'Internal server error' : err.message,
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
      console.log(`   CORS Origin: ${env.corsOrigin}`);
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

start();
