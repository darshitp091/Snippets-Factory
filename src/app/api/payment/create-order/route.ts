import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder, getPlanPrice } from '@/lib/razorpay';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { plan, billing } = await request.json();

    // Get authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user session with token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Validate input
    if (!plan || !billing) {
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

    // Verify user exists in database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, plan')
      .eq('id', userId)
      .single();

    if (dbError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already on this plan or higher
    if (plan === 'pro' && (userData.plan === 'pro' || userData.plan === 'enterprise')) {
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
      team_id: userData.id, // Using user_id as team_id for now
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
