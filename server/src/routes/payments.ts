import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { env } from '../config/env.js';

export const paymentsRouter: Router = Router();
paymentsRouter.use(authMiddleware);

const CHIP_PACKAGES: Record<string, { chips: number; price: number; label: string }> = {
  starter: { chips: 1000, price: 10, label: 'Starter' },
  popular: { chips: 6000, price: 50, label: 'Popular' },
  value: { chips: 15000, price: 100, label: 'Value' },
  mega: { chips: 100000, price: 500, label: 'Mega' },
  ultimate: { chips: 500000, price: 2000, label: 'Ultimate' },
};

const createOrderSchema = z.object({ packageId: z.string().trim().min(1).max(32) });
const verifySchema = z.object({
  paymentId: z.string().trim().min(1).max(128),
  orderId: z.string().trim().min(1).max(128),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

paymentsRouter.use((_req, res, next) => {
  if (!env.purchasesEnabled) {
    res.status(503).json({ error: 'Purchases are not available' });
    return;
  }
  next();
});

paymentsRouter.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { packageId } = createOrderSchema.parse(req.body);
    const pkg = CHIP_PACKAGES[packageId];
    if (!pkg) {
      res.status(400).json({ error: 'Invalid package' });
      return;
    }

    const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64');
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: pkg.price * 100,
        currency: 'INR',
        receipt: `tp_${crypto.randomUUID()}`,
        notes: { userId: req.user!.userId, packageId, chips: pkg.chips },
      }),
    });
    const order = await orderResponse.json() as { id?: string; amount?: number; error?: { description?: string } };
    if (!orderResponse.ok || !order.id || order.amount !== pkg.price * 100) {
      console.error('Razorpay order rejected:', order.error?.description || orderResponse.status);
      res.status(502).json({ error: 'Payment service unavailable' });
      return;
    }

    await prisma.paymentReceipt.create({
      data: {
        userId: req.user!.userId,
        orderId: order.id,
        packageId,
        amountPaise: order.amount,
        chips: BigInt(pkg.chips),
      },
    });
    res.json({ orderId: order.id, amount: order.amount, keyId: env.razorpayKeyId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Razorpay order error:', error);
    res.status(500).json({ error: 'Payment service unavailable' });
  }
});

paymentsRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const input = verifySchema.parse(req.body);
    const receipt = await prisma.paymentReceipt.findFirst({
      where: { orderId: input.orderId, userId: req.user!.userId },
    });
    if (!receipt) {
      res.status(404).json({ error: 'Payment order not found' });
      return;
    }
    if (receipt.status === 'VERIFIED') {
      res.status(409).json({ error: 'Payment already credited' });
      return;
    }

    const expected = crypto
      .createHmac('sha256', env.razorpayKeySecret)
      .update(`${input.orderId}|${input.paymentId}`)
      .digest('hex');
    const validSignature = crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(input.signature, 'hex'));
    if (!validSignature) {
      res.status(400).json({ error: 'Invalid payment signature' });
      return;
    }

    const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64');
    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${input.orderId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const order = await orderResponse.json() as {
      id?: string;
      amount?: number;
      status?: string;
      notes?: { userId?: string; packageId?: string };
    };
    if (
      !orderResponse.ok ||
      order.id !== receipt.orderId ||
      order.amount !== receipt.amountPaise ||
      order.status !== 'paid' ||
      order.notes?.userId !== req.user!.userId ||
      order.notes?.packageId !== receipt.packageId
    ) {
      res.status(400).json({ error: 'Payment could not be verified' });
      return;
    }

    const result = await prisma.$transaction(async tx => {
      const claimed = await tx.paymentReceipt.updateMany({
        where: { id: receipt.id, status: 'PENDING' },
        data: { status: 'VERIFIED', paymentId: input.paymentId, verifiedAt: new Date() },
      });
      if (claimed.count !== 1) throw new Error('PAYMENT_ALREADY_CLAIMED');

      const before = await tx.user.findUniqueOrThrow({
        where: { id: req.user!.userId },
        select: { chips: true },
      });
      const updated = await tx.user.update({
        where: { id: req.user!.userId },
        data: { chips: { increment: receipt.chips } },
        select: { chips: true },
      });
      await tx.transaction.create({
        data: {
          userId: req.user!.userId,
          type: 'PURCHASE',
          amount: receipt.chips,
          balanceBefore: before.chips,
          balanceAfter: updated.chips,
          description: `${CHIP_PACKAGES[receipt.packageId].label} chip package`,
          referenceId: input.paymentId,
          metadata: { packageId: receipt.packageId, amountPaise: receipt.amountPaise },
        },
      });
      return updated;
    });

    res.json({ success: true, chips: receipt.chips.toString(), balance: result.chips.toString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    if (error instanceof Error && error.message === 'PAYMENT_ALREADY_CLAIMED') {
      res.status(409).json({ error: 'Payment already credited' });
      return;
    }
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to credit chips' });
  }
});

paymentsRouter.get('/history', async (req: Request, res: Response) => {
  const receipts = await prisma.paymentReceipt.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({
    receipts: receipts.map(receipt => ({ ...receipt, chips: receipt.chips.toString() })),
  });
});
