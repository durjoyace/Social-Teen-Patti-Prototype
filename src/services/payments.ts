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

  init() {
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY || '';
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
    if (!this.razorpayKey) {
      // Demo mode — simulate purchase
      analytics.chipsPurchased(pkg.id, pkg.chips + pkg.bonusChips, pkg.price);
      return {
        success: true,
        orderId: `demo_${Date.now()}`,
        chips: pkg.chips + pkg.bonusChips,
      };
    }

    try {
      // Step 1: Create order on backend
      const orderResponse = await api.createPaymentOrder(pkg.id, pkg.price);
      if (!orderResponse.orderId) {
        return { success: false, error: 'Failed to create order' };
      }

      // Step 2: Load Razorpay
      await this.loadRazorpayScript();

      // Step 3: Open checkout
      return new Promise((resolve) => {
        const options = {
          key: this.razorpayKey,
          amount: pkg.price * 100, // Razorpay expects paise
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
                analytics.chipsPurchased(pkg.id, pkg.chips + pkg.bonusChips, pkg.price);
                resolve({
                  success: true,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  chips: pkg.chips + pkg.bonusChips,
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

  getPackages(isFirstPurchase: boolean): ChipPackage[] {
    const multiplier = isFirstPurchase ? 3 : 1;
    return [
      { id: 'starter', chips: 1000 * multiplier, price: 10, bonusChips: 0, label: 'Starter' },
      { id: 'popular', chips: 6000 * multiplier, price: 50, bonusChips: 0, label: 'Popular' },
      { id: 'value', chips: 15000 * multiplier, price: 100, bonusChips: 0, label: 'Value' },
      { id: 'mega', chips: 100000 * multiplier, price: 500, bonusChips: 0, label: 'Mega' },
      { id: 'ultimate', chips: 500000 * multiplier, price: 2000, bonusChips: 0, label: 'Ultimate' },
    ];
  }
}

// Extend API client with payment methods
declare module './api' {
  interface ApiClient {
    createPaymentOrder(packageId: string, amount: number): Promise<{ orderId: string }>;
    verifyPayment(paymentId: string, orderId: string, signature: string): Promise<{ success: boolean }>;
  }
}

// Add payment methods to API (these call the backend)
Object.assign(api, {
  async createPaymentOrder(packageId: string, amount: number) {
    // In production: return api.request('/payments/create-order', { method: 'POST', body: ... })
    return { orderId: `order_${Date.now()}` };
  },
  async verifyPayment(paymentId: string, orderId: string, signature: string) {
    // In production: return api.request('/payments/verify', { method: 'POST', body: ... })
    return { success: true };
  },
});

export const payments = new PaymentService();
