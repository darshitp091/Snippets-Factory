'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  BarChart3,
  Crown,
  TrendingUp,
  ArrowRight,
  Code2,
  Eye,
  Heart,
  MessageSquare,
  Users,
  Award,
  Calendar,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Loader,
} from 'lucide-react';
import styles from './page.module.css';

interface AnalyticsData {
  totalSnippets: number;
  publicSnippets: number;
  privateSnippets: number;
  totalViews: number;
  totalUpvotes: number;
  totalComments: number;
  totalShares: number;
  topSnippets: Array<{
    id: string;
    title: string;
    language: string;
    upvote_count: number;
    view_count: number;
    comment_count: number;
  }>;
  languageBreakdown: Array<{
    language: string;
    count: number;
  }>;
  recentActivity: Array<{
    type: string;
    count: number;
    change: number;
  }>;
  communityStats: {
    communitiesJoined: number;
    snippetsShared: number;
    totalReach: number;
  };
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user plan
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single();

      setUserPlan(userData?.plan || 'free');

      // If not Pro/Enterprise, don't load analytics
      if (userData?.plan === 'free') {
        setLoading(false);
        return;
      }

      // Fetch all snippets
      const { data: snippets } = await supabase
        .from('snippets')
        .select('*')
        .eq('created_by', user.id);

      if (!snippets) {
        setLoading(false);
        return;
      }

      // Calculate analytics
      const totalSnippets = snippets.length;
      const publicSnippets = snippets.filter((s) => !s.is_private).length;
      const privateSnippets = snippets.filter((s) => s.is_private).length;
      const totalViews = snippets.reduce((sum, s) => sum + (s.view_count || 0), 0);
      const totalUpvotes = snippets.reduce((sum, s) => sum + (s.upvote_count || 0), 0);
      const totalComments = snippets.reduce((sum, s) => sum + (s.comment_count || 0), 0);
      const totalShares = snippets.reduce((sum, s) => sum + (s.share_count || 0), 0);

      // Top performing snippets
      const topSnippets = snippets
        .sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0))
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          title: s.title,
          language: s.language,
          upvote_count: s.upvote_count || 0,
          view_count: s.view_count || 0,
          comment_count: s.comment_count || 0,
        }));

      // Language breakdown
      const languageMap = new Map<string, number>();
      snippets.forEach((s) => {
        const lang = s.language || 'other';
        languageMap.set(lang, (languageMap.get(lang) || 0) + 1);
      });
      const languageBreakdown = Array.from(languageMap.entries())
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Community stats
      const { data: communityMemberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      const { data: communitySnippets } = await supabase
        .from('community_snippets')
        .select('*')
        .eq('posted_by', user.id);

      const communityStats = {
        communitiesJoined: communityMemberships?.length || 0,
        snippetsShared: communitySnippets?.length || 0,
        totalReach: communitySnippets?.length * 10 || 0, // Estimate
      };

      // Recent activity (mock data for now - can be enhanced with time-series)
      const recentActivity = [
        { type: 'Views', count: totalViews, change: 12 },
        { type: 'Upvotes', count: totalUpvotes, change: 8 },
        { type: 'Comments', count: totalComments, change: -3 },
        { type: 'Shares', count: totalShares, change: 15 },
      ];

      setAnalytics({
        totalSnippets,
        publicSnippets,
        privateSnippets,
        totalViews,
        totalUpvotes,
        totalComments,
        totalShares,
        topSnippets,
        languageBreakdown,
        recentActivity,
        communityStats,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show upgrade prompt for free users
  if (userPlan === 'free' && !loading) {
    return (
      <div style={{ paddingTop: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: '1200px', margin: '0 auto' }}
        >
          <div style={{ marginBottom: '40px' }}>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#2C3E2B',
                marginBottom: '8px',
              }}
            >
              Analytics
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>
              Track usage and discover insights about your snippets
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 249, 246, 0.9))',
              backdropFilter: 'blur(30px)',
              border: '2px solid rgba(88, 129, 87, 0.3)',
              borderRadius: '24px',
              padding: '80px 60px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(88, 129, 87, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #588157 0%, #3A5A40 100%)',
                color: '#FAF9F6',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(88, 129, 87, 0.3)',
              }}
            >
              <Crown size={16} />
              PRO FEATURE
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, #588157 0%, #3A5A40 100%)',
                borderRadius: '24px',
                marginBottom: '32px',
                boxShadow: '0 12px 40px rgba(88, 129, 87, 0.3)',
              }}
            >
              <BarChart3 size={60} color="#FAF9F6" />
            </div>

            <h2
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#2C3E2B',
                marginBottom: '16px',
              }}
            >
              Unlock Advanced Analytics
            </h2>

            <p
              style={{
                fontSize: '1.1rem',
                color: '#666',
                marginBottom: '32px',
                maxWidth: '600px',
                margin: '0 auto 40px',
              }}
            >
              Get deep insights into your snippet usage, performance metrics, and community
              activity with Pro or Enterprise plans.
            </p>

            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #588157 0%, #3A5A40 100%)',
                color: '#FAF9F6',
                textDecoration: 'none',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontWeight: '600',
                boxShadow: '0 6px 24px rgba(88, 129, 87, 0.35)',
                transition: 'all 0.3s ease',
              }}
            >
              <Crown size={20} />
              Upgrade to Pro
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader className={styles.spinner} size={40} />
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={styles.errorContainer}>
        <BarChart3 size={60} />
        <p>Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics Dashboard</h1>
          <p className={styles.subtitle}>
            Track your snippet performance and community engagement
          </p>
        </div>

        {/* Time Range Selector */}
        <div className={styles.timeRangeSelector}>
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`${styles.timeRangeButton} ${
                timeRange === range ? styles.active : ''
              }`}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <motion.div
          className={styles.metricCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.metricIcon} style={{ background: '#588157' }}>
            <Code2 size={24} color="white" />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Total Snippets</p>
            <h3 className={styles.metricValue}>{analytics.totalSnippets}</h3>
            <p className={styles.metricDetail}>
              {analytics.publicSnippets} public • {analytics.privateSnippets} private
            </p>
          </div>
        </motion.div>

        <motion.div
          className={styles.metricCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.metricIcon} style={{ background: '#3A5A40' }}>
            <Eye size={24} color="white" />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Total Views</p>
            <h3 className={styles.metricValue}>{analytics.totalViews.toLocaleString()}</h3>
            <p className={styles.metricDetail}>
              <span className={styles.positive}>
                <ArrowUp size={14} />
                12%
              </span>{' '}
              vs last period
            </p>
          </div>
        </motion.div>

        <motion.div
          className={styles.metricCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.metricIcon} style={{ background: '#E9C46A' }}>
            <Heart size={24} color="white" />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Total Upvotes</p>
            <h3 className={styles.metricValue}>{analytics.totalUpvotes.toLocaleString()}</h3>
            <p className={styles.metricDetail}>
              <span className={styles.positive}>
                <ArrowUp size={14} />
                8%
              </span>{' '}
              vs last period
            </p>
          </div>
        </motion.div>

        <motion.div
          className={styles.metricCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.metricIcon} style={{ background: '#264653' }}>
            <MessageSquare size={24} color="white" />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Total Comments</p>
            <h3 className={styles.metricValue}>{analytics.totalComments.toLocaleString()}</h3>
            <p className={styles.metricDetail}>
              <span className={styles.negative}>
                <ArrowDown size={14} />
                3%
              </span>{' '}
              vs last period
            </p>
          </div>
        </motion.div>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Top Snippets */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Sparkles size={20} />
              Top Performing Snippets
            </h2>
          </div>
          <div className={styles.cardContent}>
            {analytics.topSnippets.length === 0 ? (
              <p className={styles.emptyState}>No snippets yet</p>
            ) : (
              <div className={styles.snippetList}>
                {analytics.topSnippets.map((snippet, index) => (
                  <Link
                    key={snippet.id}
                    href={`/snippets/${snippet.id}`}
                    className={styles.snippetItem}
                  >
                    <div className={styles.snippetRank}>{index + 1}</div>
                    <div className={styles.snippetInfo}>
                      <h4 className={styles.snippetTitle}>{snippet.title}</h4>
                      <p className={styles.snippetLanguage}>{snippet.language}</p>
                    </div>
                    <div className={styles.snippetStats}>
                      <span>
                        <Heart size={14} /> {snippet.upvote_count}
                      </span>
                      <span>
                        <Eye size={14} /> {snippet.view_count}
                      </span>
                      <span>
                        <MessageSquare size={14} /> {snippet.comment_count}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Language Breakdown */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Code2 size={20} />
              Language Breakdown
            </h2>
          </div>
          <div className={styles.cardContent}>
            {analytics.languageBreakdown.length === 0 ? (
              <p className={styles.emptyState}>No data available</p>
            ) : (
              <div className={styles.languageList}>
                {analytics.languageBreakdown.map((item) => {
                  const percentage = (item.count / analytics.totalSnippets) * 100;
                  return (
                    <div key={item.language} className={styles.languageItem}>
                      <div className={styles.languageInfo}>
                        <span className={styles.languageName}>{item.language}</span>
                        <span className={styles.languageCount}>{item.count} snippets</span>
                      </div>
                      <div className={styles.languageBar}>
                        <div
                          className={styles.languageBarFill}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={styles.languagePercentage}>{percentage.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Community Stats */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Users size={20} />
              Community Impact
            </h2>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.communityStats}>
              <div className={styles.communityStat}>
                <div className={styles.communityStatIcon}>
                  <Users size={24} />
                </div>
                <div>
                  <p className={styles.communityStatLabel}>Communities Joined</p>
                  <h4 className={styles.communityStatValue}>
                    {analytics.communityStats.communitiesJoined}
                  </h4>
                </div>
              </div>
              <div className={styles.communityStat}>
                <div className={styles.communityStatIcon}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className={styles.communityStatLabel}>Snippets Shared</p>
                  <h4 className={styles.communityStatValue}>
                    {analytics.communityStats.snippetsShared}
                  </h4>
                </div>
              </div>
              <div className={styles.communityStat}>
                <div className={styles.communityStatIcon}>
                  <Award size={24} />
                </div>
                <div>
                  <p className={styles.communityStatLabel}>Estimated Reach</p>
                  <h4 className={styles.communityStatValue}>
                    {analytics.communityStats.totalReach}+
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
