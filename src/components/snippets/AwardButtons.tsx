'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './AwardButtons.module.css';

interface Award {
  type: 'silver' | 'gold' | 'platinum';
  name: string;
  icon: string;
  cost: number;
  color: string;
}

const AWARD_TYPES: Award[] = [
  {
    type: 'silver',
    name: 'Silver',
    icon: '🥈',
    cost: 100,
    color: '#C0C0C0',
  },
  {
    type: 'gold',
    name: 'Gold',
    icon: '🥇',
    cost: 500,
    color: '#FFD700',
  },
  {
    type: 'platinum',
    name: 'Platinum',
    icon: '💎',
    cost: 1800,
    color: '#E5E4E2',
  },
];

interface AwardButtonsProps {
  snippetId: string;
  onAwardGiven?: () => void;
}

export default function AwardButtons({ snippetId, onAwardGiven }: AwardButtonsProps) {
  const [userCoins, setUserCoins] = useState<number | null>(null);
  const [snippetAwards, setSnippetAwards] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [givingAward, setGivingAward] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
    loadUserCoins();
    loadSnippetAwards();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const loadUserCoins = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/coins/balance');
      if (response.ok) {
        const data = await response.json();
        setUserCoins(data.balance);
      }
    } catch (error) {
      console.error('Failed to load coin balance:', error);
    }
  };

  const loadSnippetAwards = async () => {
    try {
      const response = await fetch(`/api/awards/types?snippetId=${snippetId}`);
      if (response.ok) {
        const data = await response.json();
        const awardCounts: Record<string, number> = {};
        data.awards.forEach((award: any) => {
          awardCounts[award.award_type] = award.count || 0;
        });
        setSnippetAwards(awardCounts);
      }
    } catch (error) {
      console.error('Failed to load snippet awards:', error);
    }
  };

  const handleGiveAward = async (awardType: string, cost: number) => {
    if (!isAuthenticated) {
      setError('Please login to give awards');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (userCoins === null || userCoins < cost) {
      setError(`Insufficient coins. You need ${cost} coins for this award.`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setGivingAward(awardType);
    setError('');

    try {
      const response = await fetch('/api/awards/give', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snippet_id: snippetId,
          award_type: awardType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to give award');
      }

      // Update local state
      setUserCoins((prev) => (prev !== null ? prev - cost : null));
      setSnippetAwards((prev) => ({
        ...prev,
        [awardType]: (prev[awardType] || 0) + 1,
      }));

      if (onAwardGiven) {
        onAwardGiven();
      }
    } catch (error) {
      console.error('Error giving award:', error);
      setError(error instanceof Error ? error.message : 'Failed to give award');
      setTimeout(() => setError(''), 3000);
    } finally {
      setGivingAward(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Award size={20} />
        <h3>Give Award</h3>
        {isAuthenticated && userCoins !== null && (
          <div className={styles.coinBalance}>
            <span className={styles.coinIcon}>🪙</span>
            <span>{userCoins.toLocaleString()} coins</span>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.awards}>
        {AWARD_TYPES.map((award) => {
          const count = snippetAwards[award.type] || 0;
          const canAfford = isAuthenticated && userCoins !== null && userCoins >= award.cost;
          const isGiving = givingAward === award.type;

          return (
            <motion.button
              key={award.type}
              className={styles.awardButton}
              style={{
                borderColor: award.color,
              }}
              whileHover={canAfford ? { scale: 1.05 } : undefined}
              whileTap={canAfford ? { scale: 0.95 } : undefined}
              onClick={() => handleGiveAward(award.type, award.cost)}
              disabled={!canAfford || isGiving}
            >
              <div className={styles.awardIcon} style={{ fontSize: '2rem' }}>
                {award.icon}
              </div>
              <div className={styles.awardInfo}>
                <div className={styles.awardName}>{award.name}</div>
                <div className={styles.awardCost}>
                  🪙 {award.cost.toLocaleString()}
                </div>
                {count > 0 && (
                  <div className={styles.awardCount}>
                    {count} given
                  </div>
                )}
              </div>
              {isGiving && (
                <Loader2 size={16} className={styles.spinner} />
              )}
            </motion.button>
          );
        })}
      </div>

      {!isAuthenticated && (
        <div className={styles.loginPrompt}>
          <p>Please login to give awards</p>
        </div>
      )}
    </div>
  );
}
