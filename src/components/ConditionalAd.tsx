'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import GoogleAd from './GoogleAd';

interface ConditionalAdProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

/**
 * Conditional Ad Component
 *
 * Only shows ads to free users. Pro and Enterprise users see nothing.
 * This is a key benefit of upgrading - ad-free experience!
 *
 * Usage:
 * <ConditionalAd slot="1234567890" format="auto" responsive />
 */

export default function ConditionalAd(props: ConditionalAdProps) {
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserPlan() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('plan')
            .eq('id', session.user.id)
            .single();

          setUserPlan(userData?.plan || 'free');
        } else {
          setUserPlan('free');
        }
      } catch (error) {
        console.error('Error checking user plan:', error);
        setUserPlan('free');
      } finally {
        setLoading(false);
      }
    }

    checkUserPlan();
  }, []);

  // Don't show anything while loading
  if (loading) {
    return null;
  }

  // Don't show ads to Pro/Enterprise users
  if (userPlan === 'pro' || userPlan === 'enterprise' || userPlan === 'basic') {
    return null;
  }

  // Show ads to free users
  return <GoogleAd {...props} />;
}
