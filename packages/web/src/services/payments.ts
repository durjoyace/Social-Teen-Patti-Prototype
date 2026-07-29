/**
 * PAYMENT SERVICE — Razorpay Integration
 *
 * Handles chip purchases via Razorpay (India's leading payment gateway).
 * Supports UPI, cards, wallets, net banking.
 *
 * To activate: set VITE_RAZORPAY_KEY in .env
 * Backend needs: RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in server .env
 *
 * Flow:
 * 1. User selects chip package
 * 2. Frontend calls backend to create Razorpay order
 * 3. Razorpay checkout opens
 * 4. On success, backend verifies payment and credits chips
 * 5. Frontend updates chip balance
 */

import { api } from './api';
import { analytics } from './analytics';

interface ChipPackage {
  id: string;
  chips: number;
  price: number;       // INR
  bonusChips: number;
  label: string;
}

interface PaymentResult {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  chips?: number;
  error?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

class PaymentService {
  private razorpayKey: string = '';
  private scriptLoaded = false;
  private enabled = false;

  init() {
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY || '';
    this.enabled = import.meta.env.VITE_PURCHASES_ENABLED === 'true';
  }

  private async loadRazorpayScript(): Promise<void> {
    if (this.scriptLoaded) return;
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.head.appendChild(script);
    });
  }

  async purchaseChips(pkg: ChipPackage, userInfo: {
    userId: string;
    username: string;
    email?: string;
    phone?: string;
  }): Promise<PaymentResult> {
    if (!this.enabled) {
      return { success: false, error: 'Purchases are not available' };
    }

    try {
      // Step 1: Create order on backend
      const orderResponse = await api.createPaymentOrder(pkg.id);
      if (!orderResponse.orderId) {
        return { success: false, error: 'Failed to create order' };
      }

      // Step 2: Load Razorpay
      await this.loadRazorpayScript();

      // Step 3: Open checkout
      return new Promise((resolve) => {
        const options = {
          key: orderResponse.keyId || this.razorpayKey,
          amount: orderResponse.amount,
          currency: 'INR',
          name: 'Social Teen Patti',
          description: `${pkg.label} — ${pkg.chips.toLocaleString()} chips`,
          order_id: orderResponse.orderId,
          prefill: {
            name: userInfo.username,
            email: userInfo.email || '',
            contact: userInfo.phone || '',
          },
          theme: {
            color: '#D4AF37',
            backdrop_color: 'rgba(0,0,0,0.8)',
          },
          modal: {
            ondismiss: () => {
              resolve({ success: false, error: 'Payment cancelled' });
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // Step 4: Verify payment on backend
              const verification = await api.verifyPayment(
                response.razorpay_payment_id,
                response.razorpay_order_id,
                response.razorpay_signature
              );

              if (verification.success) {
                const creditedChips = Number(verification.chips);
                analytics.chipsPurchased(pkg.id, creditedChips, pkg.price);
                resolve({
                  success: true,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  chips: creditedChips,
                });
              } else {
                resolve({ success: false, error: 'Payment verification failed' });
              }
            } catch {
              resolve({ success: false, error: 'Payment verification error' });
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          resolve({
            success: false,
            error: response.error?.description || 'Payment failed',
          });
        });
        rzp.open();
      });
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Payment error',
      };
    }
  }

  // ─── Chip Packages ───────────────────────────────────────────────────

  getPackages(_isFirstPurchase: boolean): ChipPackage[] {
    return [
      { id: 'starter', chips: 1000, price: 10, bonusChips: 0, label: 'Starter' },
      { id: 'popular', chips: 6000, price: 50, bonusChips: 0, label: 'Popular' },
      { id: 'value', chips: 15000, price: 100, bonusChips: 0, label: 'Value' },
      { id: 'mega', chips: 100000, price: 500, bonusChips: 0, label: 'Mega' },
      { id: 'ultimate', chips: 500000, price: 2000, bonusChips: 0, label: 'Ultimate' },
    ];
  }
}

export const payments = new PaymentService();
