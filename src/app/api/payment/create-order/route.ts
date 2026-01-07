import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder, getPlanPrice } from '@/lib/razorpay';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { plan, billing, userId } = await request.json();

    // Validate input
    if (!plan || !billing || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['basic', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, plan')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already on this plan or higher
    if (plan === 'pro' && (user.plan === 'pro' || user.plan === 'enterprise')) {
      return NextResponse.json(
        { error: 'You already have this plan or higher' },
        { status: 400 }
      );
    }

    // Get plan price (in paise)
    const amount = getPlanPrice(plan as 'basic' | 'pro' | 'enterprise', billing as 'monthly' | 'yearly');

    // Create Razorpay order
    const order = await createRazorpayOrder(
      amount,
      plan as 'basic' | 'pro' | 'enterprise',
      billing as 'monthly' | 'yearly',
      userId
    );

    // Store pending order in database (optional, for tracking)
    await supabase.from('audit_logs').insert({
      team_id: user.id, // Using user_id as team_id for now
      user_id: userId,
      action: 'payment_initiated',
      resource_type: 'payment',
      resource_id: order.id,
      metadata: {
        plan,
        billing,
        amount,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
