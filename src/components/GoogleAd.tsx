'use client';

import { useEffect } from 'react';
import styles from './GoogleAd.module.css';

interface GoogleAdProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

/**
 * Google AdSense Component
 *
 * Usage:
 * <GoogleAd slot="1234567890" format="auto" responsive />
 *
 * Ad slots (create these in Google AdSense dashboard):
 * - Homepage Banner: slot="XXXXX1"
 * - Sidebar: slot="XXXXX2"
 * - In-feed: slot="XXXXX3"
 * - Mobile Banner: slot="XXXXX4"
 *
 * Note: Only shows ads for free users. Pro/Enterprise users see no ads.
 */

export default function GoogleAd({
  slot,
  format = 'auto',
  style = {},
  className = '',
  responsive = true,
}: GoogleAdProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      if (window.adsbygoogle && process.env.NODE_ENV === 'production') {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('Error loading ad:', error);
    }
  }, []);

  // Don't render ads in development
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className={`${styles.adPlaceholder} ${className}`} style={style}>
        <div className={styles.adPlaceholderContent}>
          <p>Ad Placeholder</p>
          <p className={styles.adDetails}>Slot: {slot}</p>
          <p className={styles.adDetails}>Format: {format}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.adContainer} ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style,
        }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
