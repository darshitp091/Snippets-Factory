'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Github, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AnimatedBackground from '@/components/effects/AnimatedBackground';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        // Redirect to dashboard with full page reload to ensure session is recognized
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to sign in with GitHub');
    }
  };

  return (
    <>
      <AnimatedBackground />

      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
          }}
          className={styles.formCard}
        >
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
          {/* Logo */}
          <motion.div variants={fadeInUp} style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>⚡</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2C3E2B' }}>
                  Snippet Factory
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div variants={fadeInUp} style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#2C3E2B',
              marginBottom: '8px'
            }}>
              Welcome back
            </h1>
            <p style={{ color: '#666', fontSize: '1rem' }}>
              Sign in to your account to continue
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={styles.errorBox}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* OAuth Buttons */}
          <motion.div
            variants={fadeInUp}
            style={{ marginBottom: '24px' }}
          >
            <motion.button
              onClick={handleGithubLogin}
              className={styles.oauthButton}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Github size={20} />
              Continue with GitHub
            </motion.button>
          </motion.div>

          {/* Divider */}
          <motion.div
            variants={fadeInUp}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'rgba(88, 129, 87, 0.2)' }} />
            <span style={{ color: '#999', fontSize: '0.9rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(88, 129, 87, 0.2)' }} />
          </motion.div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <motion.div variants={fadeInUp} style={{ marginBottom: '20px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#2C3E2B',
                  marginBottom: '10px'
                }}
              >
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={20} className={styles.inputIcon} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="Enter your email"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} style={{ marginBottom: '8px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#2C3E2B',
                  marginBottom: '10px'
                }}
              >
                Password
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={20} className={styles.inputIcon} />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="Enter your password"
                />
              </div>
            </motion.div>

            {/* Forgot Password Link */}
            <motion.div variants={fadeInUp} style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link
                href="/forgot-password"
                style={{
                  color: '#588157',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Forgot password?
              </Link>
            </motion.div>

            <motion.button
              variants={fadeInUp}
              type="submit"
              disabled={loading}
              className={styles.submitButton}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                marginBottom: '20px',
                background: loading ? '#999' : undefined,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <Sparkles size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          {/* Sign Up Link */}
          <motion.div variants={fadeInUp} style={{ textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>
              Don't have an account?{' '}
              <Link
                href="/signup"
                style={{
                  color: '#588157',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#3A5A40'}
                onMouseOut={(e) => e.currentTarget.style.color = '#588157'}
              >
                Sign up
              </Link>
            </p>
          </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
