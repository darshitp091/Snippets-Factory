'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Check } from 'lucide-react';
import RazorpayCheckout from './RazorpayCheckout';
import styles from './UpgradeToPro.module.css';

interface UpgradeToProProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeToPro({ isOpen, onClose }: UpgradeToProProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [error, setError] = useState('');

  const prices = {
    pro: {
      monthly: 2999, // Amount in paise
      yearly: 29999, // Amount in paise
      monthlyDisplay: '29.99',
      yearlyDisplay: '299.99',
      yearlyMonthly: '24.99',
    },
  };

  const savings = ((parseFloat(prices.pro.monthlyDisplay) * 12 - parseFloat(prices.pro.yearlyDisplay)) / (parseFloat(prices.pro.monthlyDisplay) * 12) * 100).toFixed(0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={styles.overlay} onClick={onClose}>
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>

          <div className={styles.icon}>
            <Crown size={48} />
          </div>

          <h2 className={styles.title}>Upgrade to Pro</h2>
          <p className={styles.subtitle}>
            Unlock unlimited snippets and premium features
          </p>

          {/* Billing Toggle */}
          <div className={styles.billingToggle}>
            <button
              className={`${styles.billingOption} ${billing === 'monthly' ? styles.billingOptionActive : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </button>
            <button
              className={`${styles.billingOption} ${billing === 'yearly' ? styles.billingOptionActive : ''}`}
              onClick={() => setBilling('yearly')}
            >
              Yearly
              <span className={styles.savingsBadge}>Save {savings}%</span>
            </button>
          </div>

          {/* Price Display */}
          <div className={styles.priceSection}>
            <div className={styles.price}>
              <span className={styles.currency}>$</span>
              <span className={styles.amount}>
                {billing === 'yearly' ? prices.pro.yearlyMonthly : prices.pro.monthlyDisplay}
              </span>
              <span className={styles.period}>/month</span>
            </div>
            {billing === 'yearly' && (
              <p className={styles.billedInfo}>
                Billed ${prices.pro.yearlyDisplay} annually
              </p>
            )}
          </div>

          {/* Features */}
          <div className={styles.features}>
            <div className={styles.feature}>
              <Check size={18} />
              <span>Unlimited snippets</span>
            </div>
            <div className={styles.feature}>
              <Check size={18} />
              <span>Advanced analytics</span>
            </div>
            <div className={styles.feature}>
              <Check size={18} />
              <span>Team collaboration (up to 10)</span>
            </div>
            <div className={styles.feature}>
              <Check size={18} />
              <span>AI-powered categorization</span>
            </div>
            <div className={styles.feature}>
              <Check size={18} />
              <span>Priority support</span>
            </div>
          </div>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {/* Razorpay Checkout Button */}
          <RazorpayCheckout
            plan="pro"
            billing={billing}
            amount={billing === 'yearly' ? prices.pro.yearly : prices.pro.monthly}
            onError={(err) => setError(err)}
          />

          <p className={styles.guarantee}>
            30-day money-back guarantee
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
