import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan pricing in paise (INR)
const PLAN_PRICES = {
  basic: {
    monthly: 59900,
    yearly: 599900,
  },
  pro: {
    monthly: 179900,
    yearly: 1799900,
  },
  enterprise: {
    monthly: 799900,
    yearly: 7999900,
  },
};

export async function POST(req: NextRequest) {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify user with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { plan, billing } = body;

    // Validate plan and billing
    if (!plan || !billing) {
      return NextResponse.json(
        { success: false, error: 'Missing plan or billing parameter' },
        { status: 400 }
      );
    }

    if (!['basic', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json(
        { success: false, error: 'Invalid billing period' },
        { status: 400 }
      );
    }

    // Get amount from pricing
    const amount = PLAN_PRICES[plan as keyof typeof PLAN_PRICES][billing as 'monthly' | 'yearly'];

    // Create Razorpay order
    // Generate a short receipt ID (max 40 chars for Razorpay)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const userIdShort = user.id.substring(0, 20); // First 20 chars of UUID
    const receipt = `rcpt_${userIdShort}_${timestamp}`; // Will be ~35 chars

    const options = {
      amount: amount, // Amount in paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        user_id: user.id,
        plan: plan,
        billing: billing,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
