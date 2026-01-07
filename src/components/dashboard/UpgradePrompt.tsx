'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { X, Zap, ArrowRight, Crown } from 'lucide-react';
import styles from './UpgradePrompt.module.css';

interface UpgradePromptProps {
  feature: string;
  recommendedPlan: 'pro' | 'enterprise';
  onClose: () => void;
}

export default function UpgradePrompt({ feature, recommendedPlan, onClose }: UpgradePromptProps) {
  const planDetails = {
    pro: {
      name: 'Pro',
      price: '$12',
      features: [
        'Unlimited snippets',
        'Up to 10 team members',
        'Advanced analytics',
        'API access',
        'AI categorization',
        'Priority support',
      ],
      color: '#588157',
    },
    enterprise: {
      name: 'Enterprise',
      price: '$49',
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'Audit logs',
        'SSO authentication',
        'Custom branding',
        'Dedicated support',
      ],
      color: '#3A5A40',
    },
  };

  const plan = planDetails[recommendedPlan];

  return (
    <>
      {/* Overlay */}
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
      >
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.header}>
          <div className={styles.icon}>
            <Crown size={32} />
          </div>
          <h2>Upgrade to {plan.name}</h2>
          <p>Unlock {feature} and many more premium features</p>
        </div>

        <div className={styles.pricing}>
          <div className={styles.price}>
            <span className={styles.priceAmount}>{plan.price}</span>
            <span className={styles.pricePeriod}>/month</span>
          </div>
        </div>

        <div className={styles.features}>
          <h3>What you'll get:</h3>
          <ul>
            {plan.features.map((feat, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Zap size={18} />
                <span>{feat}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className={styles.actions}>
          <Link href="/pricing" className={styles.upgradeButton}>
            Upgrade to {plan.name}
            <ArrowRight size={18} />
          </Link>
          <button onClick={onClose} className={styles.cancelButton}>
            Maybe later
          </button>
        </div>

        <p className={styles.guarantee}>
          Cancel anytime
        </p>
      </motion.div>
    </>
  );
}
