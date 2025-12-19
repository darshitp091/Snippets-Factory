'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Crown, Infinity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import styles from './UsageCounter.module.css';

interface UsageCounterProps {
  className?: string;
}

export default function UsageCounter({ className }: UsageCounterProps) {
  const [plan, setPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [snippetCount, setSnippetCount] = useState(0);
  const [maxSnippets, setMaxSnippets] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('users')
        .select('plan, snippet_count, max_snippets')
        .eq('id', session.user.id)
        .single();

      if (!error && data) {
        setPlan(data.plan as 'free' | 'pro' | 'enterprise');
        setSnippetCount(data.snippet_count || 0);
        setMaxSnippets(data.max_snippets || 50);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${styles.counter} ${className || ''}`}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  // Pro and Enterprise users see "Unlimited"
  if (plan === 'pro' || plan === 'enterprise') {
    return (
      <div className={`${styles.counter} ${styles.unlimited} ${className || ''}`}>
        <div className={styles.icon}>
          <Infinity size={20} />
        </div>
        <div className={styles.text}>
          <span className={styles.label}>Snippets</span>
          <span className={styles.value}>Unlimited</span>
        </div>
      </div>
    );
  }

  // Free users see count with progress
  const percentage = (snippetCount / maxSnippets) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className={`${styles.counter} ${className || ''}`}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <Code2 size={18} />
          </div>
          <div className={styles.info}>
            <span className={styles.label}>Snippet Usage</span>
            <span className={`${styles.count} ${isAtLimit ? styles.countDanger : isNearLimit ? styles.countWarning : ''}`}>
              {snippetCount} / {maxSnippets}
            </span>
          </div>
        </div>

        <div className={styles.progressBar}>
          <motion.div
            className={`${styles.progress} ${isAtLimit ? styles.progressDanger : isNearLimit ? styles.progressWarning : ''}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {isNearLimit && (
          <div className={styles.message}>
            {isAtLimit ? (
              <span className={styles.messageDanger}>
                Limit reached! Upgrade to continue.
              </span>
            ) : (
              <span className={styles.messageWarning}>
                {maxSnippets - snippetCount} snippets remaining
              </span>
            )}
          </div>
        )}

        {plan === 'free' && (
          <Link href="/pricing" className={styles.upgradeLink}>
            <Crown size={14} />
            <span>Upgrade for unlimited</span>
          </Link>
        )}
      </div>
    </div>
  );
}
