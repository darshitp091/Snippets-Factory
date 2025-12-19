'use client';

import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnimatedBackground from '@/components/effects/AnimatedBackground';

export default function PaymentCancelPage() {
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
          {/* Cancel Icon */}
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
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(245, 158, 11, 0.4)',
              margin: '0 auto',
            }}>
              <XCircle size={64} color="#FFFFFF" />
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
            Payment Cancelled
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: '1.25rem',
              color: '#A0AEC0',
              marginBottom: '1rem',
            }}
          >
            Your payment was cancelled. No charges have been made to your account.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              fontSize: '1rem',
              color: '#718096',
              marginBottom: '2.5rem',
            }}
          >
            You can try again anytime by visiting our pricing page or return to your dashboard.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/pricing"
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
              <RefreshCw size={18} />
              View Pricing
            </Link>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 32px',
                background: 'transparent',
                color: '#6366f1',
                border: '2px solid #6366f1',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
