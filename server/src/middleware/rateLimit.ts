import type { NextFunction, Request, Response } from 'express';

interface WindowState {
  count: number;
  resetsAt: number;
}

export function rateLimit(options: { windowMs: number; max: number; name: string }) {
  const windows = new Map<string, WindowState>();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, state] of windows) {
      if (state.resetsAt <= now) windows.delete(key);
    }
  }, Math.min(options.windowMs, 60_000));
  cleanup.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${options.name}:${req.ip || 'unknown'}`;
    const current = windows.get(key);
    const state = !current || current.resetsAt <= now
      ? { count: 0, resetsAt: now + options.windowMs }
      : current;

    state.count += 1;
    windows.set(key, state);
    res.setHeader('RateLimit-Limit', String(options.max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, options.max - state.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(state.resetsAt / 1000)));

    if (state.count > options.max) {
      res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
      return;
    }
    next();
  };
}
