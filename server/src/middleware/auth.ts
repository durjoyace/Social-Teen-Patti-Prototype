import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { sessionActive } from "../services/authSessions.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";

export interface AuthPayload {
  sessionId?: string;
  userId: string;
  username: string;
  isGuest: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload as object, env.jwtSecret, {
    expiresIn: env.jwtExpiry as jwt.SignOptions["expiresIn"],
  });
}

export function generateRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload as object, env.jwtRefreshSecret, {
    jwtid: randomUUID(),
    expiresIn: env.jwtRefreshExpiry as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
  }) as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwtRefreshSecret, {
    algorithms: ["HS256"],
  }) as AuthPayload;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    if (!(await sessionActive(payload))) {
      res.status(401).json({ error: "Session expired" });
      return;
    }

    // Verify user still exists and isn't banned
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, isGuest: true, isBanned: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    if (user.isBanned) {
      res.status(403).json({ error: "Account suspended" });
      return;
    }

    req.user = {
      sessionId: payload.sessionId,
      userId: user.id,
      username: user.username,
      isGuest: user.isGuest,
    };
    next();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientInitializationError
    ) {
      res
        .status(503)
        .json({ error: "Session service temporarily unavailable" });
      return;
    }
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Extract and verify auth for Socket.io connections */
export function authenticateSocket(token: string): AuthPayload | null {
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
