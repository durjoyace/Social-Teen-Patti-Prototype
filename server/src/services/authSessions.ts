import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyToken,
  type AuthPayload,
} from "../middleware/auth.js";
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function issueSession(payload: AuthPayload) {
  const sessionId = randomUUID();
  const claims = { ...payload, sessionId };
  const token = generateToken(claims),
    refreshToken = generateRefreshToken(claims);
  const expiresAt = new Date(
    (jwt.decode(refreshToken) as { exp: number }).exp * 1000,
  );
  await prisma.authSession.create({
    data: {
      id: sessionId,
      userId: payload.userId,
      refreshHash: hash(refreshToken),
      expiresAt,
    },
  });
  return { token, refreshToken };
}
export async function rotateSession(oldToken: string) {
  const payload = verifyRefreshToken(oldToken);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.isBanned) throw new Error("Invalid session");
  const id = payload.sessionId || `legacy-${hash(oldToken)}`;
  if (!payload.sessionId) {
    await prisma.authSession.create({
      data: {
        id,
        userId: user.id,
        refreshHash: hash(oldToken),
        expiresAt: new Date(
          (jwt.decode(oldToken) as { exp: number }).exp * 1000,
        ),
      },
    });
  }
  const claims = {
    userId: user.id,
    username: user.username,
    isGuest: user.isGuest,
    sessionId: id,
  };
  const refreshToken = generateRefreshToken(claims);
  const token = generateToken(claims);
  const updated = await prisma.authSession.updateMany({
    where: {
      id,
      userId: user.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
      refreshHash: hash(oldToken),
    },
    data: {
      refreshHash: hash(refreshToken),
      expiresAt: new Date(
        (jwt.decode(refreshToken) as { exp: number }).exp * 1000,
      ),
    },
  });
  if (updated.count !== 1) {
    await prisma.authSession.updateMany({
      where: { id, userId: user.id },
      data: { revokedAt: new Date() },
    });
    throw new Error("Session revoked");
  }
  return { token, refreshToken };
}
export async function sessionActive(payload: AuthPayload) {
  if (!payload.sessionId) return false;
  return !!(await prisma.authSession.findFirst({
    where: {
      id: payload.sessionId,
      userId: payload.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  }));
}

/** One-time exchange for older mobile clients which saved only an access token. */
export async function exchangeLegacyAccess(oldToken: string) {
  const payload = verifyToken(oldToken);
  if (payload.sessionId) throw new Error("Use your refresh token");
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.isBanned) throw new Error("Invalid session");
  const sessionId = `legacy-access-${hash(oldToken)}`;
  const claims = {
    userId: user.id,
    username: user.username,
    isGuest: user.isGuest,
    sessionId,
  };
  const token = generateToken(claims),
    refreshToken = generateRefreshToken(claims);
  await prisma.authSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshHash: hash(refreshToken),
      expiresAt: new Date(
        (jwt.decode(refreshToken) as { exp: number }).exp * 1000,
      ),
    },
  });
  return { token, refreshToken };
}
