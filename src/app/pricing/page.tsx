'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Users, Building2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnimatedBackground from '@/components/effects/AnimatedBackground';
import CurrencySelector from '@/components/pricing/CurrencySelector';
import { PRICING_INR, convertPrice, formatPrice, getRazorpayAmount } from '@/lib/currencyConverter';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string, planPrice: number) => {
    if (!isLoggedIn) {
      window.location.href = '/signup';
      return;
    }

    setProcessingPlan(planName);

    try {
      // Create Razorpay order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planName.toLowerCase(),
          billing: billingPeriod,
          amount: getRazorpayAmount(planPrice, selectedCurrency),
          currency: selectedCurrency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const { orderId, amount, currency } = await response.json();

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount,
          currency,
          name: 'Snippet Factory',
          description: `${planName} Plan - ${billingPeriod === 'monthly' ? 'Monthly' : 'Annual'} Subscription`,
          order_id: orderId,
          handler: async function (response: any) {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyResponse.ok) {
              window.location.href = '/payment/success';
            } else {
              window.location.href = '/payment/cancel';
            }
          },
          prefill: {
            email: '',
            contact: '',
          },
          theme: {
            color: '#588157',
          },
          modal: {
            ondismiss: function() {
              setProcessingPlan(null);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setProcessingPlan(null);
      };
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
      setProcessingPlan(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      icon: Zap,
      priceINR: PRICING_INR.free,
      description: 'Perfect for trying out',
      features: [
        '10 snippets',
        '1 collection',
        'Basic search',
        'Community support',
        'Mobile app access',
        'With ads',
      ],
      cta: 'Get Started',
      color: 'from-gray-600 to-gray-800',
      popular: false,
    },
    {
      name: 'Basic',
      icon: Zap,
      priceINR: PRICING_INR.basic,
      description: 'For individual developers',
      features: [
        '50 snippets',
        '5 collections',
        'No ads',
        'Advanced search',
        'Email support',
        'All export formats',
        'Syntax highlighting',
      ],
      cta: 'Upgrade',
      color: 'from-green-600 to-green-800',
      popular: false,
      savings: billingPeriod === 'annual' ? 'Save 17%' : null,
    },
    {
      name: 'Pro',
      icon: Users,
      priceINR: PRICING_INR.pro,
      description: 'For professional developers',
      features: [
        'Everything in Basic',
        'Unlimited snippets',
        'Unlimited collections',
        'Team collaboration (5 members)',
        'Analytics dashboard',
        'AI code generation (100/mo)',
        'API access (1,000 calls/mo)',
        'Version history',
        'Priority support',
      ],
      cta: 'Upgrade',
      color: 'from-tech-blue to-tech-cyan',
      popular: true,
      savings: billingPeriod === 'annual' ? 'Save 17%' : null,
    },
    {
      name: 'Enterprise',
      icon: Building2,
      priceINR: PRICING_INR.enterprise,
      description: 'For large organizations',
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'Unlimited AI generation',
        'Unlimited API access',
        'SSO/SAML authentication',
        'Advanced security (SOC 2)',
        'Dedicated support',
        'Custom integrations',
        'Audit logs',
        'White-label option',
        '99.9% SLA',
      ],
      cta: 'Contact Sales',
      color: 'from-tech-purple to-tech-pink',
      popular: false,
      savings: billingPeriod === 'annual' ? 'Save 17%' : null,
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <AnimatedBackground />
      <Header />

      <main style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          {/* Header */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            style={{ textAlign: 'center', marginBottom: '80px' }}
          >
            <motion.div
              variants={fadeInUp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                background: 'rgba(88, 129, 87, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(88, 129, 87, 0.3)',
                borderRadius: '50px',
                marginBottom: '32px'
              }}
            >
              <Zap size={16} style={{ color: '#588157' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#588157' }}>
                Affordable Pricing for Everyone
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              style={{
                fontSize: '3.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #2C3E2B 0%, #588157 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '24px',
                lineHeight: '1.1'
              }}
            >
              Simple, Transparent Pricing
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              style={{ fontSize: '1.25rem', color: '#666', maxWidth: '700px', margin: '0 auto 40px' }}
            >
              Choose the perfect plan for your team. All plans include a 14-day free trial.
            </motion.p>

            {/* Currency Selector and Billing Toggle */}
            <motion.div
              variants={fadeInUp}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              }}
            >
              {/* Currency Selector */}
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
              />

              {/* Billing Toggle */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(88, 129, 87, 0.2)',
                  borderRadius: '12px'
                }}
              >
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    border: 'none',
                    background: billingPeriod === 'monthly' ? 'linear-gradient(135deg, #588157 0%, #3d5a3c 100%)' : 'transparent',
                    color: billingPeriod === 'monthly' ? '#FAF9F6' : '#666',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    border: 'none',
                    background: billingPeriod === 'annual' ? 'linear-gradient(135deg, #588157 0%, #3d5a3c 100%)' : 'transparent',
                    color: billingPeriod === 'annual' ? '#FAF9F6' : '#666',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Annual
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'rgba(88, 129, 87, 0.2)',
                    color: '#588157',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontWeight: '600'
                  }}>
                    Save 17%
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '80px',
              alignItems: 'stretch',
              maxWidth: '1400px'
            }}
          >
            {plans.map((plan) => {
              const priceINR = billingPeriod === 'monthly' ? plan.priceINR.monthly : plan.priceINR.annual;
              const convertedPrice = convertPrice(priceINR, selectedCurrency);
              const monthlyPrice = billingPeriod === 'annual' ? Math.round(convertedPrice / 12) : convertedPrice;
              const isProcessing = processingPlan === plan.name;

              return (
                <motion.div
                  key={plan.name}
                  variants={fadeInUp}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  style={{
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: plan.popular ? '2px solid #588157' : '1px solid rgba(88, 129, 87, 0.2)',
                    borderRadius: '20px',
                    padding: '40px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    boxShadow: plan.popular ? '0 10px 40px rgba(88, 129, 87, 0.15)' : '0 4px 20px rgba(88, 129, 87, 0.08)'
                  }}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'linear-gradient(135deg, #588157 0%, #D4A373 100%)',
                      color: '#FAF9F6',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '8px 20px',
                      borderBottomLeftRadius: '12px'
                    }}>
                      POPULAR
                    </div>
                  )}

                  {/* Icon */}
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #588157 0%, #D4A373 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FAF9F6',
                    marginBottom: '24px'
                  }}>
                    <plan.icon size={36} />
                  </div>

                  {/* Plan Name */}
                  <h3 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#2C3E2B',
                    marginBottom: '8px'
                  }}>
                    {plan.name}
                  </h3>
                  <p style={{ color: '#666', marginBottom: '24px', fontSize: '1rem' }}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{
                        fontSize: '3.5rem',
                        fontWeight: '700',
                        color: '#2C3E2B'
                      }}>
                        {formatPrice(monthlyPrice, selectedCurrency)}
                      </span>
                      <span style={{ color: '#666', fontSize: '1rem' }}>/user/mo</span>
                    </div>
                    {plan.savings && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '0.875rem',
                        color: '#588157',
                        fontWeight: '600'
                      }}>
                        {plan.savings}
                      </div>
                    )}
                    {billingPeriod === 'annual' && priceINR > 0 && (
                      <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '8px' }}>
                        {formatPrice(convertedPrice, selectedCurrency)} billed annually
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    flex: 1,
                    marginBottom: '32px'
                  }}>
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          marginBottom: '16px',
                          color: '#666'
                        }}
                      >
                        <Check size={20} style={{ color: '#588157', flexShrink: 0, marginTop: '2px' }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {plan.name === 'Free' ? (
                    <Link
                      href={isLoggedIn ? '/dashboard' : '/signup'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        fontSize: '1.05rem',
                        fontWeight: '600',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        marginTop: 'auto',
                        border: '2px solid #588157',
                        color: '#588157',
                        background: 'transparent'
                      }}
                    >
                      {isLoggedIn ? 'Current Plan' : plan.cta}
                    </Link>
                  ) : plan.name === 'Enterprise' ? (
                    <Link
                      href="/contact"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        fontSize: '1.05rem',
                        fontWeight: '600',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        marginTop: 'auto',
                        border: '2px solid #588157',
                        color: '#588157',
                        background: 'transparent'
                      }}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.name, billingPeriod === 'monthly' ? plan.priceINR.monthly : plan.priceINR.annual)}
                      disabled={isProcessing}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        fontSize: '1.05rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        marginTop: 'auto',
                        background: isProcessing ? '#999' : 'linear-gradient(135deg, #588157 0%, #3d5a3c 100%)',
                        color: '#FAF9F6',
                        boxShadow: '0 4px 20px rgba(88, 129, 87, 0.3)',
                        opacity: isProcessing ? 0.7 : 1
                      }}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                          Processing...
                        </>
                      ) : (
                        <>
                          {isLoggedIn ? plan.cta : 'Get Started'}
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
