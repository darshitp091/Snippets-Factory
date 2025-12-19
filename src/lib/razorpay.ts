/**
 * Razorpay Integration Service
 * Handles payment processing and subscription management
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Plan pricing configuration
 */
export const PLAN_PRICES = {
  pro: {
    monthly: 2999, // Amount in paise (₹29.99)
    yearly: 29999, // Amount in paise (₹299.99)
    yearlyMonthly: 2499, // Effective monthly price for yearly
  },
  enterprise: {
    monthly: 9999, // Amount in paise (₹99.99)
    yearly: 99999, // Amount in paise (₹999.99)
    yearlyMonthly: 8333,
  },
};

/**
 * Get plan price based on billing cycle (in paise)
 */
export function getPlanPrice(plan: 'pro' | 'enterprise', billing: 'monthly' | 'yearly'): number {
  return billing === 'monthly'
    ? PLAN_PRICES[plan].monthly
    : PLAN_PRICES[plan].yearly;
}

/**
 * Create Razorpay order for payment
 */
export async function createRazorpayOrder(
  amount: number, // Amount in paise
  plan: 'pro' | 'enterprise',
  billing: 'monthly' | 'yearly',
  userId: string
): Promise<RazorpayOrder> {
  try {
    const options = {
      amount: amount, // Amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId,
        plan,
        billing,
      },
    };

    const order = await razorpay.orders.create(options);
    return order as RazorpayOrder;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create Razorpay order');
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyRazorpayWebhook(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Get payment details
 */
export async function getRazorpayPayment(paymentId: string): Promise<any> {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw new Error('Failed to fetch payment details');
  }
}

/**
 * Get order details
 */
export async function getRazorpayOrder(orderId: string): Promise<any> {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error('Failed to fetch order details');
  }
}

/**
 * Refund payment
 */
export async function createRazorpayRefund(
  paymentId: string,
  amount?: number
): Promise<any> {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount, // Amount in paise, if not provided refunds full amount
      speed: 'normal',
    });
    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error('Failed to create refund');
  }
}
