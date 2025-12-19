'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './RazorpayCheckout.module.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  plan: 'pro' | 'enterprise';
  billing: 'monthly' | 'yearly';
  amount: number; // Amount in paise
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function RazorpayCheckout({
  plan,
  billing,
  amount,
  onSuccess,
  onError,
  className,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script
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
  }, []);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setUserLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!userId) {
      onError?.('Please log in to upgrade');
      return;
    }

    if (!scriptLoaded) {
      onError?.('Payment gateway is still loading. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Create Razorpay order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billing,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Initialize Razorpay
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Snippet Factory',
        description: `${plan === 'pro' ? 'Pro' : 'Enterprise'} Plan - ${billing === 'monthly' ? 'Monthly' : 'Yearly'}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/payment/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            // Success - redirect to success page
            window.location.href = '/payment/success';
            onSuccess?.();
          } catch (error: any) {
            console.error('Payment verification error:', error);
            onError?.(error.message || 'Payment verification failed');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        prefill: {
          email: '',
          contact: '',
        },
        theme: {
          color: '#6366f1',
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
      console.error('Checkout error:', error);
      onError?.(error.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || userLoading || !userId || !scriptLoaded}
      className={`${styles.button} ${className || ''}`}
    >
      {userLoading ? (
        <>
          <Loader2 size={18} className={styles.spinner} />
          <span>Loading...</span>
        </>
      ) : loading ? (
        <>
          <Loader2 size={18} className={styles.spinner} />
          <span>Processing...</span>
        </>
      ) : !scriptLoaded ? (
        <>
          <Loader2 size={18} className={styles.spinner} />
          <span>Loading Payment...</span>
        </>
      ) : (
        <>
          <img
            src="https://razorpay.com/assets/razorpay-glyph.svg"
            alt="Razorpay"
            className={styles.logo}
          />
          <span>Checkout with Razorpay</span>
        </>
      )}
    </button>
  );
}
