'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Shield,
  Check,
  ArrowLeft,
  Crown,
  CheckCircle2,
  Loader2,
  Sparkles,
  TrendingUp,
  BarChart3,
  Zap,
} from 'lucide-react';
import styles from './page.module.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Community {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  is_verified: boolean;
  verification_tier?: 'none' | 'blue' | 'green' | 'gold';
}

const VERIFICATION_TIERS = [
  {
    tier: 'blue',
    name: 'Blue Verification',
    price: 499,
    icon: '✓',
    color: '#3B82F6',
    features: [
      'Blue verified badge',
      'Priority support',
      'Enhanced visibility in search',
      'Verified badge on all posts',
      'Email support',
    ],
  },
  {
    tier: 'green',
    name: 'Green Verification',
    price: 999,
    icon: '🛡️',
    color: '#10B981',
    popular: true,
    features: [
      'Green verified badge',
      'All Blue features',
      'Analytics dashboard',
      'Featured placement in discovery',
      'Priority support (24h response)',
      'Custom community badge color',
    ],
  },
  {
    tier: 'gold',
    name: 'Gold Verification',
    price: 1999,
    icon: '👑',
    color: '#F59E0B',
    features: [
      'Gold verified badge',
      'All Green features',
      'API access for integrations',
      'Custom integrations',
      'Top priority placement',
      'Dedicated account manager',
      'White-label options',
    ],
  },
];

export default function CommunityVerifyPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    loadCurrentUser();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadCommunity();
    }
  }, [currentUser, slug]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadCommunity = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      // Check if current user is owner
      if (data.owner_id !== currentUser?.id) {
        router.push(`/communities/${slug}`);
        return;
      }

      setCommunity(data);
    } catch (error) {
      console.error('Error loading community:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseVerification = async (tier: string, price: number) => {
    if (!community || !currentUser) return;

    try {
      setProcessing(true);
      setSelectedTier(tier);

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('verification_payments')
        .insert([
          {
            community_id: community.id,
            user_id: currentUser.id,
            verification_tier: tier,
            amount: price,
            currency: 'INR',
            payment_status: 'pending',
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create Razorpay order
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: price * 100, // Convert to paise
          currency: 'INR',
          notes: {
            community_id: community.id,
            verification_tier: tier,
            payment_id: orderData.id,
          },
        }),
      });

      const order = await response.json();

      if (!order.id) {
        throw new Error('Failed to create order');
      }

      // Update payment record with Razorpay order ID
      await supabase
        .from('verification_payments')
        .update({ razorpay_order_id: order.id })
        .eq('id', orderData.id);

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: price * 100,
        currency: 'INR',
        name: 'Snippet Factory',
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Verification for ${community.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          // Payment successful
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Update community verification status
              const expiresAt = new Date();
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);

              await supabase
                .from('communities')
                .update({
                  is_verified: true,
                  verification_tier: tier,
                  verification_paid_at: new Date().toISOString(),
                  verification_expires_at: expiresAt.toISOString(),
                })
                .eq('id', community.id);

              // Update payment status
              await supabase
                .from('verification_payments')
                .update({
                  payment_status: 'completed',
                  razorpay_payment_id: response.razorpay_payment_id,
                  paid_at: new Date().toISOString(),
                  expires_at: expiresAt.toISOString(),
                })
                .eq('id', orderData.id);

              // Redirect to success page
              router.push(`/communities/${slug}/settings?verified=true`);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
            setSelectedTier(null);
          }
        },
        prefill: {
          name: currentUser.user_metadata?.full_name || '',
          email: currentUser.email || '',
        },
        theme: {
          color: '#588157',
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setSelectedTier(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Error purchasing verification:', error);
      alert(error.message || 'Failed to process payment');
      setProcessing(false);
      setSelectedTier(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={40} className={styles.spinner} />
        <p>Loading verification options...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className={styles.notFound}>
        <Shield size={60} />
        <h2>Community Not Found</h2>
        <Link href="/communities" className={styles.backButton}>
          Back to Communities
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href={`/communities/${slug}/settings`} className={styles.backLink}>
          <ArrowLeft size={20} />
          Back to Settings
        </Link>
        <h1 className={styles.title}>
          <Shield size={36} />
          Get Verified
        </h1>
        <p className={styles.subtitle}>
          Stand out with a verified badge for <strong>{community.name}</strong>
        </p>
      </div>

      {/* Already Verified */}
      {community.is_verified && (
        <div className={styles.alreadyVerified}>
          <CheckCircle2 size={48} color="#10B981" />
          <h3>Already Verified</h3>
          <p>
            Your community already has{' '}
            <strong>
              {community.verification_tier && (
                community.verification_tier.charAt(0).toUpperCase() +
                community.verification_tier.slice(1)
              )}
            </strong>{' '}
            verification.
          </p>
          <p className={styles.upgradeText}>
            You can upgrade to a higher tier for more features.
          </p>
        </div>
      )}

      {/* Benefits Section */}
      <div className={styles.benefits}>
        <h2>Why Get Verified?</h2>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <Sparkles size={32} />
            <h3>Stand Out</h3>
            <p>Get a verified badge that shows your community is authentic and trusted</p>
          </div>
          <div className={styles.benefitCard}>
            <TrendingUp size={32} />
            <h3>Grow Faster</h3>
            <p>Verified communities get priority placement in search and discovery</p>
          </div>
          <div className={styles.benefitCard}>
            <BarChart3 size={32} />
            <h3>Analytics</h3>
            <p>Access detailed analytics to track your community's growth and engagement</p>
          </div>
          <div className={styles.benefitCard}>
            <Zap size={32} />
            <h3>Priority Support</h3>
            <p>Get faster response times and dedicated support for your community</p>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className={styles.pricingSection}>
        <h2>Choose Your Tier</h2>
        <div className={styles.tiersGrid}>
          {VERIFICATION_TIERS.map((tierData) => (
            <motion.div
              key={tierData.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -8 }}
              className={`${styles.tierCard} ${tierData.popular ? styles.popular : ''}`}
              style={{ borderColor: `${tierData.color}40` }}
            >
              {tierData.popular && (
                <div className={styles.popularBadge} style={{ background: tierData.color }}>
                  POPULAR
                </div>
              )}

              <div className={styles.tierIcon} style={{ color: tierData.color }}>
                <span style={{ fontSize: '3rem' }}>{tierData.icon}</span>
              </div>

              <h3 className={styles.tierName}>{tierData.name}</h3>

              <div className={styles.tierPrice}>
                <span className={styles.currency}>₹</span>
                <span className={styles.amount}>{tierData.price.toLocaleString()}</span>
                <span className={styles.period}>/year</span>
              </div>

              <ul className={styles.featuresList}>
                {tierData.features.map((feature, idx) => (
                  <li key={idx}>
                    <Check size={18} style={{ color: tierData.color }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchaseVerification(tierData.tier, tierData.price)}
                disabled={processing}
                className={styles.purchaseButton}
                style={{
                  background:
                    processing && selectedTier === tierData.tier
                      ? '#999'
                      : `linear-gradient(135deg, ${tierData.color} 0%, ${tierData.color}CC 100%)`,
                }}
              >
                {processing && selectedTier === tierData.tier ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    Processing...
                  </>
                ) : community.is_verified &&
                  community.verification_tier === tierData.tier ? (
                  'Current Plan'
                ) : (
                  `Get ${tierData.name.split(' ')[0]}`
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className={styles.faq}>
        <h2>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <h3>How long does verification last?</h3>
            <p>All verification tiers are valid for one year from the date of purchase.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Can I upgrade my tier later?</h3>
            <p>
              Yes! You can upgrade to a higher tier at any time. The new tier will be active
              immediately.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3>What happens when my verification expires?</h3>
            <p>
              You'll receive email notifications 30 days and 7 days before expiry. You can renew
              at any time to maintain your verified status.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3>Is there a refund policy?</h3>
            <p>
              We offer a 7-day money-back guarantee. If you're not satisfied, contact our support
              team for a full refund.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
