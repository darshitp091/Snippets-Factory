'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayButtonProps {
  plan: 'basic' | 'pro' | 'enterprise';
  billing: 'monthly' | 'yearly';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export default function RazorpayButton({
  plan,
  billing,
  onSuccess,
  onError,
  children,
  className = '',
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (scriptLoaded) return;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      onError?.('Failed to load payment gateway');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [scriptLoaded, onError]);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      onError?.('Payment gateway is still loading');
      return;
    }

    setLoading(true);

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Please log in to continue');
      }

      // Create order
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan, billing }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Initialize Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Snippet Factory',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${billing === 'monthly' ? 'Monthly' : 'Yearly'}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            // Success
            onSuccess?.();
            window.location.href = '/payment/success';
          } catch (error: any) {
            console.error('Payment verification error:', error);
            onError?.(error.message || 'Payment verification failed');
            window.location.href = '/payment/cancel';
          }
        },
        prefill: {
          email: session.user.email || '',
          contact: '',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        onError?.(response.error.description || 'Payment failed');
        setLoading(false);
      });

    } catch (error: any) {
      console.error('Payment error:', error);
      onError?.(error.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || !scriptLoaded}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
        loading || !scriptLoaded
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:opacity-90'
      } ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : !scriptLoaded ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        children || <span>Pay Now</span>
      )}
    </button>
  );
}
