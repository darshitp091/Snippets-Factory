import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature, getRazorpayOrder } from '@/lib/razorpay';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await getRazorpayOrder(razorpay_order_id);

    if (!order || !order.notes) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    // Extract user_id and plan_type from notes (matching our create-order format)
    const userId = order.notes.user_id;
    const plan = order.notes.plan_type;
    const billing = order.notes.duration_type;

    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'Missing order information' },
        { status: 400 }
      );
    }

    // Update user's plan in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan: plan as 'basic' | 'pro' | 'enterprise',
        max_snippets: -1, // Unlimited
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user plan' },
        { status: 500 }
      );
    }

    // Log successful payment
    await supabase.from('audit_logs').insert({
      team_id: userId,
      user_id: userId,
      action: 'payment_completed',
      resource_type: 'payment',
      resource_id: razorpay_order_id,
      metadata: {
        plan,
        billing,
        status: 'completed',
        amount: order.amount / 100, // Convert paise to rupees
        razorpay_order_id,
        razorpay_payment_id,
      },
    });

    return NextResponse.json({
      success: true,
      plan,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
