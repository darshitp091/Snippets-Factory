'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Crown, Zap } from 'lucide-react';
import styles from './UpgradeModal.module.css';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  currentCount?: number;
  maxCount?: number;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = 'Upgrade Required',
  message,
  currentCount,
  maxCount,
}: UpgradeModalProps) {
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

          <h2 className={styles.title}>{title}</h2>

          {message && <p className={styles.message}>{message}</p>}

          {currentCount !== undefined && maxCount !== undefined && (
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Current Usage</span>
                <span className={styles.statValue}>
                  {currentCount} / {maxCount} snippets
                </span>
              </div>
            </div>
          )}

          <div className={styles.features}>
            <h3 className={styles.featuresTitle}>Upgrade to Pro and get:</h3>
            <ul className={styles.featuresList}>
              <li>
                <Zap size={16} />
                <span>Unlimited snippets</span>
              </li>
              <li>
                <Zap size={16} />
                <span>Advanced analytics</span>
              </li>
              <li>
                <Zap size={16} />
                <span>Team collaboration (up to 10 members)</span>
              </li>
              <li>
                <Zap size={16} />
                <span>AI-powered categorization</span>
              </li>
              <li>
                <Zap size={16} />
                <span>Priority support</span>
              </li>
            </ul>
          </div>

          <div className={styles.actions}>
            <Link href="/pricing" className={styles.upgradeButton}>
              <Crown size={18} />
              Upgrade to Pro
            </Link>
            <button onClick={onClose} className={styles.cancelButton}>
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
