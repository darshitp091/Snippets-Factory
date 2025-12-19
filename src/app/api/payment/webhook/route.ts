import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhook } from '@/lib/razorpay';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyRazorpayWebhook(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.authorized':
      case 'payment.captured':
        await handlePaymentSuccess(event.payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(payment: any) {
  try {
    const orderId = payment.order_id;

    // Log the payment success
    await supabase.from('audit_logs').insert({
      team_id: payment.notes?.userId || 'webhook',
      user_id: payment.notes?.userId || 'webhook',
      action: 'payment_webhook_received',
      resource_type: 'payment',
      resource_id: payment.id,
      metadata: {
        event: 'payment.captured',
        order_id: orderId,
        payment_id: payment.id,
        amount: payment.amount / 100,
        status: payment.status,
      },
    });

    console.log('Payment success webhook processed:', payment.id);
  } catch (error) {
    console.error('Error handling payment success webhook:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    // Log the payment failure
    await supabase.from('audit_logs').insert({
      team_id: payment.notes?.userId || 'webhook',
      user_id: payment.notes?.userId || 'webhook',
      action: 'payment_failed',
      resource_type: 'payment',
      resource_id: payment.id,
      metadata: {
        event: 'payment.failed',
        order_id: payment.order_id,
        payment_id: payment.id,
        error_code: payment.error_code,
        error_description: payment.error_description,
      },
    });

    console.log('Payment failed webhook processed:', payment.id);
  } catch (error) {
    console.error('Error handling payment failed webhook:', error);
  }
}

async function handleOrderPaid(order: any) {
  try {
    const { userId, plan, billing } = order.notes;

    if (!userId || !plan) {
      console.error('Missing order information in webhook');
      return;
    }

    // Update user's plan
    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan: plan as 'pro' | 'enterprise',
        max_snippets: -1, // Unlimited
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user plan from webhook:', updateError);
      return;
    }

    // Log the order completion
    await supabase.from('audit_logs').insert({
      team_id: userId,
      user_id: userId,
      action: 'payment_completed_webhook',
      resource_type: 'payment',
      resource_id: order.id,
      metadata: {
        event: 'order.paid',
        order_id: order.id,
        plan,
        billing,
        amount: order.amount / 100,
        status: 'completed',
      },
    });

    console.log('Order paid webhook processed:', order.id);
  } catch (error) {
    console.error('Error handling order paid webhook:', error);
  }
}
