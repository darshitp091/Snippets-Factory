import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature, getRazorpayOrder } from '@/lib/razorpay';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentId, signature } = await request.json();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = verifyRazorpaySignature(orderId, paymentId, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await getRazorpayOrder(orderId);

    if (!order || !order.notes) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    const { userId, plan, billing } = order.notes;

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
        plan: plan as 'pro' | 'enterprise',
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
      resource_id: orderId,
      metadata: {
        plan,
        billing,
        status: 'completed',
        amount: order.amount / 100, // Convert paise to rupees
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
      },
    });

    return NextResponse.json({
      success: true,
      plan,
      orderId,
      paymentId,
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
