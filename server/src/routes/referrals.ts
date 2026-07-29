import { ReferralSharePlatform } from '@prisma/client';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import {
  getReferralSummary,
  recordReferralShare,
  redeemBeliReward,
  ReferralError,
} from '../services/referralService.js';

export const referralsRouter: Router = Router();
referralsRouter.use(authMiddleware);

const shareSchema = z.object({
  platform: z.nativeEnum(ReferralSharePlatform),
  campaign: z.string().trim().max(64).optional(),
});
const redeemSchema = z.object({ itemId: z.string().trim().min(1).max(64) });

function handleError(error: unknown, res: Response) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: 'Invalid input', details: error.errors });
    return;
  }
  if (error instanceof ReferralError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error('Referral route error:', error);
  res.status(500).json({ error: 'Internal server error' });
}

referralsRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    res.json(await getReferralSummary(req.user!.userId));
  } catch (error) {
    handleError(error, res);
  }
});

referralsRouter.post('/share', async (req: Request, res: Response) => {
  try {
    const input = shareSchema.parse(req.body);
    const share = await recordReferralShare(req.user!.userId, input.platform, input.campaign);
    res.status(201).json({ share });
  } catch (error) {
    handleError(error, res);
  }
});

referralsRouter.post('/redeem', async (req: Request, res: Response) => {
  try {
    const input = redeemSchema.parse(req.body);
    res.json(await redeemBeliReward(req.user!.userId, input.itemId));
  } catch (error) {
    handleError(error, res);
  }
});
