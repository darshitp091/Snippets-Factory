'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnimatedBackground from '@/components/effects/AnimatedBackground';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <>
      <AnimatedBackground />
      <Header />
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              display: 'inline-block',
              marginBottom: '2rem',
            }}
          >
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)',
              margin: '0 auto',
            }}>
              <CheckCircle2 size={64} color="#FFFFFF" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: '3rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #FFFFFF, #A0AEC0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
            }}
          >
            Payment Successful!
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: '1.25rem',
              color: '#A0AEC0',
              marginBottom: '2rem',
            }}
          >
            Welcome to Snippet Factory Pro! Your account has been upgraded.
          </motion.p>

          {/* Features Unlocked */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '1rem',
            }}>
              <Sparkles size={20} color="#6366f1" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#FFFFFF' }}>
                Features Unlocked
              </h3>
            </div>
            <div style={{
              display: 'grid',
              gap: '0.75rem',
              textAlign: 'left',
              color: '#CBD5E0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span>Unlimited snippets</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span>Advanced analytics and insights</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span>Team collaboration (up to 10 members)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span>AI-powered categorization</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span>Priority support</span>
              </div>
            </div>
          </motion.div>

          {/* Redirect Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              fontSize: '0.95rem',
              color: '#718096',
              marginBottom: '1.5rem',
            }}
          >
            Redirecting to dashboard in {countdown} seconds...
          </motion.p>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
              }}
            >
              Go to Dashboard
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
