import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Fetch order details from Razorpay
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (!order || !order.notes) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Extract user details from order notes
    const userId = order.notes.user_id;
    const plan = order.notes.plan;
    const billing = order.notes.billing;

    if (!userId || !plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid order data' },
        { status: 400 }
      );
    }

    // Update user plan in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate subscription expiry date
    const now = new Date();
    const expiryDate = new Date(now);
    if (billing === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (billing === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    // Set plan-specific features
    const planFeatures = {
      basic: {
        max_snippets: 100,
        max_collections: 10,
        team_members: 1,
        ai_generations: 50,
        api_calls: 500,
      },
      pro: {
        max_snippets: -1, // Unlimited
        max_collections: -1,
        team_members: 5,
        ai_generations: 100,
        api_calls: 1000,
      },
      enterprise: {
        max_snippets: -1,
        max_collections: -1,
        team_members: -1, // Unlimited
        ai_generations: -1,
        api_calls: -1,
      },
    };

    const features = planFeatures[plan as keyof typeof planFeatures];

    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan: plan,
        max_snippets: features.max_snippets,
        max_collections: features.max_collections,
        team_members_limit: features.team_members,
        ai_generations_limit: features.ai_generations,
        api_calls_limit: features.api_calls,
        subscription_status: 'active',
        subscription_start: now.toISOString(),
        subscription_end: expiryDate.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update user plan' },
        { status: 500 }
      );
    }

    // Log payment in audit logs
    const orderAmount = typeof order.amount === 'number' ? order.amount : 0;
    await supabase.from('audit_logs').insert({
      team_id: userId,
      user_id: userId,
      action: 'payment_success',
      resource_type: 'subscription',
      resource_id: razorpay_order_id,
      metadata: {
        plan,
        billing,
        amount: orderAmount / 100, // Convert to rupees
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      plan: plan,
    });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
