'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Github, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AnimatedBackground from '@/components/effects/AnimatedBackground';
import styles from './signup.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // Auto-confirmed, redirect to dashboard
          window.location.href = '/dashboard';
        } else {
          // Email confirmation required
          setEmailSent(true);
          setLoading(false);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
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
      setError('Failed to sign up with GitHub');
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
              Create your account
            </h1>
            <p style={{ color: '#666', fontSize: '1rem' }}>
              Start managing your code snippets today
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

          {/* Success Message */}
          {emailSent && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={styles.successBox}
            >
              <CheckCircle size={18} />
              <div>
                <p style={{ fontWeight: '600', marginBottom: '4px' }}>Confirmation email sent!</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  Please check your email ({formData.email}) and click the confirmation link to activate your account.
                </p>
              </div>
            </motion.div>
          )}

          {!emailSent && (
            <>
              {/* OAuth Buttons */}
              <motion.div variants={fadeInUp} style={{ marginBottom: '24px' }}>
                <motion.button
                  onClick={handleGithubSignup}
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
            </>
          )}

          {/* Signup Form */}
          {!emailSent && <form onSubmit={handleSignup}>
            <motion.div variants={fadeInUp} style={{ marginBottom: '20px' }}>
              <label
                htmlFor="fullName"
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#2C3E2B',
                  marginBottom: '10px'
                }}
              >
                Full Name
              </label>
              <div className={styles.inputWrapper}>
                <User size={20} className={styles.inputIcon} />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="Enter your full name"
                />
              </div>
            </motion.div>

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

            <motion.div variants={fadeInUp} style={{ marginBottom: '20px' }}>
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
                  minLength={8}
                  className={styles.input}
                  placeholder="Create a password (8+ characters)"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} style={{ marginBottom: '24px' }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#2C3E2B',
                  marginBottom: '10px'
                }}
              >
                Confirm Password
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={20} className={styles.inputIcon} />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className={styles.input}
                  placeholder="Confirm your password"
                />
              </div>
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>}

          {/* Sign In Link */}
          {emailSent ? (
            <motion.div variants={fadeInUp} style={{ textAlign: 'center', marginTop: '24px' }}>
              <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '12px' }}>
                Didn't receive the email?{' '}
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
                  }}
                  style={{
                    color: '#588157',
                    textDecoration: 'none',
                    fontWeight: '600',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  Try again
                </button>
              </p>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>
                Already confirmed?{' '}
                <Link
                  href="/login"
                  style={{
                    color: '#588157',
                    textDecoration: 'none',
                    fontWeight: '600',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#3A5A40'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#588157'}
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div variants={fadeInUp} style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    style={{
                      color: '#588157',
                      textDecoration: 'none',
                      fontWeight: '600',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#3A5A40'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#588157'}
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>

              {/* Terms */}
              <motion.div variants={fadeInUp} style={{ textAlign: 'center' }}>
                <p style={{ color: '#999', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  By signing up, you agree to our{' '}
                  <Link href="/terms" style={{ color: '#588157', textDecoration: 'none', fontWeight: '500' }}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" style={{ color: '#588157', textDecoration: 'none', fontWeight: '500' }}>
                    Privacy Policy
                  </Link>
                </p>
              </motion.div>
            </>
          )}
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
