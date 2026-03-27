import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { env } from '../config/env.js';

export const paymentsRouter = Router();
paymentsRouter.use(authMiddleware);

// Chip packages
const CHIP_PACKAGES: Record<string, { chips: number; price: number; label: string }> = {
  starter: { chips: 1000, price: 10, label: 'Starter' },
  popular: { chips: 6000, price: 50, label: 'Popular' },
  value: { chips: 15000, price: 100, label: 'Value' },
  mega: { chips: 100000, price: 500, label: 'Mega' },
  ultimate: { chips: 500000, price: 2000, label: 'Ultimate' },
};

// ─── Create Order ──────────────────────────────────────────────────────────

paymentsRouter.post('/create-order', async (req: Request, res: Response) => {
  const { packageId } = req.body;
  const pkg = CHIP_PACKAGES[packageId];

  if (!pkg) {
    res.status(400).json({ error: 'Invalid package' });
    return;
  }

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeyId || !razorpaySecret) {
    // Demo mode — return a fake order ID
    res.json({ orderId: `demo_order_${Date.now()}`, amount: pkg.price * 100 });
    return;
  }

  try {
    // Create Razorpay order via their API
    const auth = Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64');
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: pkg.price * 100, // paise
        currency: 'INR',
        receipt: `receipt_${req.user!.userId}_${Date.now()}`,
        notes: {
          userId: req.user!.userId,
          packageId,
          chips: pkg.chips,
        },
      }),
    });

    const order = await orderResponse.json() as any;

    if (!order.id) {
      res.status(500).json({ error: 'Failed to create Razorpay order' });
      return;
    }

    res.json({ orderId: order.id, amount: order.amount });
  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(500).json({ error: 'Payment service unavailable' });
  }
});

// ─── Verify Payment ────────────────────────────────────────────────────────

paymentsRouter.post('/verify', async (req: Request, res: Response) => {
  const { paymentId, orderId, signature } = req.body;

  if (!paymentId || !orderId || !signature) {
    res.status(400).json({ error: 'Missing payment details' });
    return;
  }

  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpaySecret) {
    // Demo mode — auto-verify
    res.json({ success: true });
    return;
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSignature !== signature) {
    res.status(400).json({ error: 'Invalid payment signature' });
    return;
  }

  // Payment verified — credit chips
  try {
    // Fetch order to get package details
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${razorpaySecret}`).toString('base64');
    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    const order = await orderResponse.json() as any;

    const packageId = order.notes?.packageId;
    const pkg = CHIP_PACKAGES[packageId];

    if (!pkg) {
      res.status(400).json({ error: 'Invalid package in order' });
      return;
    }

    // Check if first purchase for bonus
    const prevPurchases = await prisma.transaction.count({
      where: { userId: req.user!.userId, type: 'PURCHASE' },
    });
    const isFirstPurchase = prevPurchases === 0;
    const totalChips = isFirstPurchase ? pkg.chips * 3 : pkg.chips;

    // Credit chips and record transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          chips: { increment: BigInt(totalChips) },
          vipPoints: { increment: Math.floor(pkg.price / 10) },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: req.user!.userId,
          type: 'PURCHASE',
          amount: BigInt(totalChips),
          balanceBefore: 0n, // Simplified
          balanceAfter: 0n,
          description: `${pkg.label} package — ${totalChips.toLocaleString()} chips${isFirstPurchase ? ' (3x first purchase bonus!)' : ''}`,
          referenceId: paymentId,
          metadata: { packageId, price: pkg.price, isFirstPurchase },
        },
      }),
    ]);

    res.json({
      success: true,
      chips: totalChips,
      isFirstPurchase,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to credit chips' });
  }
});

// ─── Transaction History ───────────────────────────────────────────────────

paymentsRouter.get('/history', async (req: Request, res: Response) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user!.userId, type: 'PURCHASE' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json({
    transactions: transactions.map(t => ({
      ...t,
      amount: t.amount.toString(),
      balanceBefore: t.balanceBefore.toString(),
      balanceAfter: t.balanceAfter.toString(),
    })),
  });
});
