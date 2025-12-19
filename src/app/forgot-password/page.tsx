'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.background} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.card}
        >
          <div className={styles.successIcon}>
            <CheckCircle size={64} color="#588157" />
          </div>
          <h1 className={styles.title}>Check Your Email</h1>
          <p className={styles.successMessage}>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className={styles.subtitle}>
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </p>
          <Link href="/login" className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.background} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>Snippet Factory</span>
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>Forgot Password?</h1>
          <p className={styles.subtitle}>
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={styles.error}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={20} className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <Link href="/login" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </motion.div>
    </div>
  );
}
