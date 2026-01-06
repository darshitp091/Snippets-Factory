import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

// This webhook handles Razorpay payment events and automatically upgrades user plans
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the webhook payload
    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const { id: paymentId, amount, order_id, notes } = payment;

      console.log('Payment captured:', { paymentId, amount, order_id, notes });

      // Get payment details from notes
      const userId = notes?.user_id;
      const paymentType = notes?.type; // 'subscription' or 'coins_purchase'
      const planType = notes?.plan_type; // 'free', 'pro', 'enterprise'
      const durationType = notes?.duration_type; // 'monthly', 'yearly'

      if (!userId) {
        console.error('Missing user_id in payment notes');
        return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 });
      }

      // Handle coin purchases
      if (paymentType === 'coins_purchase') {
        const { error: coinError } = await supabase.rpc('complete_coin_purchase', {
          p_order_id: order_id,
          p_payment_id: paymentId,
          p_signature: signature,
        });

        if (coinError) {
          console.error('Error completing coin purchase:', coinError);
          return NextResponse.json({ error: 'Failed to complete coin purchase' }, { status: 500 });
        }

        console.log(`Successfully added coins to user ${userId}`);
        return NextResponse.json({ success: true, message: 'Coins added successfully' });
      }

      // Handle plan subscriptions
      if (!planType) {
        console.error('Missing plan_type in payment notes');
        return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 });
      }

      // Calculate plan expiry date
      const now = new Date();
      const expiryDate = new Date(now);
      if (durationType === 'monthly') {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (durationType === 'yearly') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else {
        // Default to monthly if not specified
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      }

      // Update user plan in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          plan: planType,
          plan_expires_at: expiryDate.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user plan:', updateError);
        return NextResponse.json({ error: 'Failed to update user plan' }, { status: 500 });
      }

      // Record payment in payment_history table
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert([
          {
            user_id: userId,
            payment_id: paymentId,
            order_id: order_id,
            amount: amount / 100, // Convert paise to rupees
            plan_type: planType,
            duration_type: durationType,
            status: 'success',
            payment_method: 'razorpay',
            razorpay_payment_id: paymentId,
          },
        ]);

      if (paymentError) {
        console.error('Error recording payment:', paymentError);
        // Don't fail the webhook, plan is already updated
      }

      console.log(`Successfully upgraded user ${userId} to ${planType} plan`);
      return NextResponse.json({ success: true, message: 'Plan upgraded successfully' });
    }

    // Handle payment.failed event
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const { id: paymentId, order_id, notes } = payment;

      const userId = notes?.user_id;
      const planType = notes?.plan_type;

      // Record failed payment
      if (userId && planType) {
        await supabase
          .from('payment_history')
          .insert([
            {
              user_id: userId,
              payment_id: paymentId,
              order_id: order_id,
              amount: 0,
              plan_type: planType,
              status: 'failed',
              payment_method: 'razorpay',
              razorpay_payment_id: paymentId,
            },
          ]);
      }

      console.log(`Payment failed for user ${userId}`);
      return NextResponse.json({ success: true, message: 'Payment failure recorded' });
    }

    // Handle subscription events (if you add subscription support later)
    if (event.event === 'subscription.activated') {
      // Handle subscription activation
      console.log('Subscription activated:', event.payload);
    }

    if (event.event === 'subscription.cancelled') {
      // Handle subscription cancellation
      console.log('Subscription cancelled:', event.payload);
    }

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
