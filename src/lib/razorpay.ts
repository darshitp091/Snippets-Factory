/**
 * Razorpay Integration Service
 * Handles payment processing and subscription management
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy initialize Razorpay instance to avoid build-time errors
let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }
  return razorpayInstance;
}

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
 * Plan pricing configuration (competitive market pricing)
 * Amounts in paise (1 INR = 100 paise)
 * Pricing based on market research with 40-50% profit margin
 */
export const PLAN_PRICES = {
  basic: {
    monthly: 59900, // ₹599/mo (~$6.63/mo) - competitive with GitHub Teams
    yearly: 599900, // ₹5,999/year (~$66.43/year, save 17%)
    yearlyMonthly: 49992, // Effective monthly price for yearly (₹5999/12)
  },
  pro: {
    monthly: 179900, // ₹1,799/mo (~$19.92/mo) - premium team features
    yearly: 1799900, // ₹17,999/year (~$199.32/year, save 17%)
    yearlyMonthly: 149992, // Effective monthly price for yearly (₹17999/12)
  },
  enterprise: {
    monthly: 799900, // ₹7,999/mo (~$88.56/mo) - full enterprise support
    yearly: 7999900, // ₹79,999/year (~$885.60/year, save 17%)
    yearlyMonthly: 666658, // Effective monthly price for yearly (₹79999/12)
  },
};

/**
 * Get plan price based on billing cycle (in paise)
 */
export function getPlanPrice(plan: 'basic' | 'pro' | 'enterprise', billing: 'monthly' | 'yearly'): number {
  return billing === 'monthly'
    ? PLAN_PRICES[plan].monthly
    : PLAN_PRICES[plan].yearly;
}

/**
 * Create Razorpay order for payment
 */
export async function createRazorpayOrder(
  amount: number, // Amount in paise
  plan: 'basic' | 'pro' | 'enterprise',
  billing: 'monthly' | 'yearly',
  userId: string
): Promise<RazorpayOrder> {
  try {
    const options = {
      amount: amount, // Amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        user_id: userId, // Changed from userId to user_id for webhook compatibility
        plan_type: plan, // Changed from plan to plan_type for webhook compatibility
        duration_type: billing === 'monthly' ? 'monthly' : 'yearly', // Changed from billing to duration_type
      },
    };

    const razorpay = getRazorpayInstance();
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
    const razorpay = getRazorpayInstance();
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
    const razorpay = getRazorpayInstance();
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
    const razorpay = getRazorpayInstance();
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
