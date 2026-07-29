import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  authMiddleware,
} from '../middleware/auth.js';
import { attributeReferral } from '../services/referralService.js';

export const authRouter: Router = Router();

// ─── Schemas ───────────────────────────────────────────────────────────────

const usernameSchema = z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/);
const emailSchema = z.string().trim().email().max(254).transform(value => value.toLowerCase());
const passwordSchema = z.string().min(12).max(128);

const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  adultConfirmed: z.literal(true),
  referralCode: z.string().trim().max(16).optional(),
  referralSource: z.string().trim().max(64).optional(),
  referralCampaign: z.string().trim().max(64).optional(),
});

const upgradeSchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  password: z.string().min(1).max(128),
}).refine(value => Boolean(value.username || value.email), 'Username or email is required');

const guestSchema = z.object({
  username: usernameSchema.optional(),
  adultConfirmed: z.literal(true),
  referralCode: z.string().trim().max(16).optional(),
  referralSource: z.string().trim().max(64).optional(),
  referralCampaign: z.string().trim().max(64).optional(),
});

// ─── Guest Login ───────────────────────────────────────────────────────────

authRouter.post('/guest', async (req: Request, res: Response) => {
  try {
    const { username, referralCode, referralSource, referralCampaign } = guestSchema.parse(req.body);

    const guestBase = username?.slice(0, 11) || 'Guest';
    const finalUsername = `${guestBase}_${randomBytes(4).toString('hex')}`;

    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        isGuest: true,
        adultConfirmedAt: new Date(),
        chips: BigInt(env.defaultChips),
      },
    });

    const payload = { userId: user.id, username: user.username, isGuest: true };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const referralAttribution = await attributeReferral(user.id, referralCode, {
      source: referralSource,
      campaign: referralCampaign,
      deviceId: typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : undefined,
      ip: req.ip,
    }).catch(error => {
      console.error('Guest referral attribution error:', error);
      return { attributed: false as const, reason: 'unavailable' as const };
    });

    res.status(201).json({
      user: serializeUser(user),
      token,
      refreshToken,
      referralAttribution,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Register ──────────────────────────────────────────────────────────────

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existing) {
      res.status(409).json({
        error: existing.username === data.username ? 'Username taken' : 'Email already registered',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        adultConfirmedAt: new Date(),
        chips: BigInt(env.defaultChips),
      },
    });

    const payload = { userId: user.id, username: user.username, isGuest: false };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const referralAttribution = await attributeReferral(user.id, data.referralCode, {
      source: data.referralSource,
      campaign: data.referralCampaign,
      deviceId: typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : undefined,
      ip: req.ip,
    }).catch(error => {
      console.error('Registration referral attribution error:', error);
      return { attributed: false as const, reason: 'unavailable' as const };
    });

    res.status(201).json({
      user: serializeUser(user),
      token,
      refreshToken,
      referralAttribution,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Username or email already registered' });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Login ─────────────────────────────────────────────────────────────────

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(data.username ? [{ username: data.username }] : []),
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Account suspended', reason: user.banReason });
      return;
    }

    // Update online status
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });

    const payload = { userId: user.id, username: user.username, isGuest: user.isGuest };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      user: serializeUser(user),
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Refresh Token ─────────────────────────────────────────────────────────

authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken: oldRefreshToken } = req.body;
    if (!oldRefreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const payload = verifyRefreshToken(oldRefreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || user.isBanned) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const newPayload = { userId: user.id, username: user.username, isGuest: user.isGuest };
    const token = generateToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);

    res.json({ token, refreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ─── Get Current User (Profile) ────────────────────────────────────────────

authRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        achievements: { where: { isCompleted: true }, include: { achievement: true } },
        _count: { select: { sentFriendRequests: true, receivedFriendRequests: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Upgrade Guest to Full Account ─────────────────────────────────────────

authRouter.post('/upgrade', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user!.isGuest) {
      res.status(400).json({ error: 'Not a guest account' });
      return;
    }

    const { email, password, username } = upgradeSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        email,
        passwordHash,
        username: username || undefined,
        isGuest: false,
      },
    });

    const payload = { userId: user.id, username: user.username, isGuest: false };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      user: serializeUser(user),
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Username or email already registered' });
      return;
    }
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function serializeUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isGuest: user.isGuest,
    chips: user.chips.toString(),
    diamonds: user.diamonds,
    beliBalance: user.beliBalance,
    referralCode: user.referralCode,
    vipTier: user.vipTier,
    vipPoints: user.vipPoints,
    level: user.level,
    experience: user.experience,
    totalGames: user.totalGames,
    gamesWon: user.gamesWon,
    biggestWin: user.biggestWin?.toString() ?? '0',
    totalWinnings: user.totalWinnings?.toString() ?? '0',
    currentStreak: user.currentStreak,
    bestStreak: user.bestStreak,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt,
  };
}
