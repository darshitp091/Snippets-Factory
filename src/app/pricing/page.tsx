'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Users, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnimatedBackground from '@/components/effects/AnimatedBackground';
import RazorpayCheckout from '@/components/payment/RazorpayCheckout';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const plans = [
    {
      name: 'Free',
      icon: Zap,
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for individual developers',
      features: [
        '50 snippets',
        '1 team',
        'Basic search',
        'Community support',
        'Mobile app access',
      ],
      cta: 'Get Started',
      color: 'from-gray-600 to-gray-800',
      popular: false,
    },
    {
      name: 'Pro',
      icon: Users,
      price: { monthly: 15, annual: 144 },
      description: 'For growing teams',
      features: [
        'Unlimited snippets',
        'Unlimited teams',
        'Advanced search with NLP',
        'Placeholder system',
        'Analytics dashboard',
        'Priority support',
        'Version history',
        'Custom categories',
        'Export functionality',
      ],
      cta: 'Start Free Trial',
      color: 'from-tech-blue to-tech-cyan',
      popular: true,
    },
    {
      name: 'Enterprise',
      icon: Building2,
      price: 'Custom',
      description: 'For large organizations',
      features: [
        'Everything in Pro',
        'SSO/SAML authentication',
        'Custom integrations',
        'Dedicated support',
        'On-premise option',
        'Advanced security',
        'Custom SLA',
        'Audit logs',
        'API access',
        'White-label option',
      ],
      cta: 'Contact Sales',
      color: 'from-tech-purple to-tech-pink',
      popular: false,
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
                border: '1px solid rgba(88, 129, 87, 0.3)',
                borderRadius: '30px',
                marginBottom: '24px'
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                background: '#588157',
                borderRadius: '50%'
              }} />
              <span style={{ color: '#588157', fontSize: '14px', fontWeight: '500' }}>
                Flexible Pricing
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: '700',
                lineHeight: '1.2',
                marginBottom: '24px',
                color: '#2C3E2B'
              }}
            >
              Simple, Transparent
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #588157 0%, #D4A373 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Pricing
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              style={{
                fontSize: '1.25rem',
                color: '#666',
                maxWidth: '700px',
                margin: '0 auto 40px',
                lineHeight: '1.6'
              }}
            >
              Choose the perfect plan for your team. All plans include a 14-day free trial.
            </motion.p>

            {/* Billing Toggle */}
            <motion.div
              variants={fadeInUp}
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
                  Save 20%
                </span>
              </button>
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
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '32px',
              marginBottom: '80px',
              alignItems: 'stretch'
            }}
          >
            {plans.map((plan) => (
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
                  {typeof plan.price === 'object' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{
                          fontSize: '3.5rem',
                          fontWeight: '700',
                          color: '#2C3E2B'
                        }}>
                          ${billingPeriod === 'monthly' ? plan.price.monthly : Math.floor(plan.price.annual / 12)}
                        </span>
                        <span style={{ color: '#666', fontSize: '1rem' }}>/user/mo</span>
                      </div>
                      {billingPeriod === 'annual' && (
                        <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '8px' }}>
                          ${plan.price.annual} billed annually
                        </p>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: '3rem', fontWeight: '700', color: '#2C3E2B' }}>
                      {plan.price}
                    </div>
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
                ) : isLoggedIn ? (
                  <RazorpayCheckout
                    plan="pro"
                    billing={billingPeriod === 'monthly' ? 'monthly' : 'yearly'}
                    amount={billingPeriod === 'monthly' ? 2999 : 29999}
                    className={plan.popular ? 'popular' : ''}
                  />
                ) : (
                  <Link
                    href="/signup"
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
                      background: 'linear-gradient(135deg, #588157 0%, #3d5a3c 100%)',
                      color: '#FAF9F6',
                      boxShadow: '0 4px 20px rgba(88, 129, 87, 0.3)'
                    }}
                  >
                    {plan.cta}
                    <ArrowRight size={20} />
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ maxWidth: '900px', margin: '0 auto' }}
          >
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              color: '#2C3E2B',
              textAlign: 'center',
              marginBottom: '48px'
            }}>
              Frequently Asked Questions
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                {
                  q: 'Can I change plans later?',
                  a: 'Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, PayPal, and offer invoicing for Enterprise plans.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start.',
                },
                {
                  q: 'What happens to my snippets if I cancel?',
                  a: 'You can export all your snippets before canceling. Data is retained for 30 days after cancellation.',
                },
              ].map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(88, 129, 87, 0.2)',
                    borderRadius: '16px',
                    padding: '28px'
                  }}
                >
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#588157',
                    marginBottom: '12px'
                  }}>
                    {faq.q}
                  </h3>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
