'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Code2,
  Eye,
  Heart,
  MessageSquare,
  Users,
  Award,
  Calendar,
  MapPin,
  Link2,
  Github,
  Twitter,
  Globe,
  TrendingUp,
  Star,
  Zap,
  Loader,
  Settings,
} from 'lucide-react';
import styles from './page.module.css';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  github_username?: string;
  twitter_username?: string;
  plan: string;
  created_at: string;
  reputation?: number;
}

interface UserStats {
  totalSnippets: number;
  publicSnippets: number;
  totalViews: number;
  totalUpvotes: number;
  totalComments: number;
  communitiesJoined: number;
  snippetsShared: number;
  followers: number;
  following: number;
}

interface Snippet {
  id: string;
  title: string;
  description: string;
  language: string;
  upvote_count: number;
  view_count: number;
  comment_count: number;
  created_at: string;
  is_private: boolean;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'snippets' | 'stats'>('snippets');

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Find user by email (using username as email identifier)
      // In a real app, you'd have a username field
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', `${username}%`)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userError);
        setLoading(false);
        return;
      }

      setProfile(userData);

      // Load user stats
      const [snippetsData, communitiesData, sharedData] = await Promise.all([
        supabase.from('snippets').select('*').eq('created_by', userData.id),
        supabase.from('community_members').select('id').eq('user_id', userData.id),
        supabase.from('community_snippets').select('id').eq('posted_by', userData.id),
      ]);

      const allSnippets = snippetsData.data || [];
      const publicSnippets = allSnippets.filter((s) => !s.is_private);

      const userStats: UserStats = {
        totalSnippets: allSnippets.length,
        publicSnippets: publicSnippets.length,
        totalViews: allSnippets.reduce((sum, s) => sum + (s.view_count || 0), 0),
        totalUpvotes: allSnippets.reduce((sum, s) => sum + (s.upvote_count || 0), 0),
        totalComments: allSnippets.reduce((sum, s) => sum + (s.comment_count || 0), 0),
        communitiesJoined: communitiesData.data?.length || 0,
        snippetsShared: sharedData.data?.length || 0,
        followers: 0, // TODO: Implement user followers
        following: 0, // TODO: Implement user following
      };

      setStats(userStats);

      // Load public snippets
      setSnippets(
        publicSnippets
          .sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0))
          .slice(0, 10)
      );
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReputation = () => {
    if (!stats) return 0;
    // Simple reputation calculation
    return stats.totalUpvotes * 10 + stats.totalComments * 2 + stats.totalViews;
  };

  const getReputationLevel = (reputation: number) => {
    if (reputation >= 10000) return { level: 'Legend', color: '#E9C46A', icon: <Award /> };
    if (reputation >= 5000) return { level: 'Expert', color: '#588157', icon: <Star /> };
    if (reputation >= 1000) return { level: 'Advanced', color: '#3A5A40', icon: <TrendingUp /> };
    if (reputation >= 100) return { level: 'Intermediate', color: '#264653', icon: <Zap /> };
    return { level: 'Beginner', color: '#999', icon: <User /> };
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader className={styles.spinner} size={40} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.notFound}>
        <User size={60} />
        <h2>User Not Found</h2>
        <p>The profile you're looking for doesn't exist.</p>
        <Link href="/discover" className={styles.backButton}>
          Back to Discover
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;
  const reputation = calculateReputation();
  const reputationInfo = getReputationLevel(reputation);

  return (
    <div className={styles.container}>
      {/* Profile Header */}
      <div className={styles.header}>
        <div className={styles.banner} />
        <div className={styles.profileInfo}>
          <div className={styles.avatarSection}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <User size={48} />
              </div>
            )}
            <div className={styles.reputationBadge} style={{ background: reputationInfo.color }}>
              {reputationInfo.icon}
              <span>{reputationInfo.level}</span>
            </div>
          </div>

          <div className={styles.details}>
            <div className={styles.nameSection}>
              <h1 className={styles.name}>{profile.full_name}</h1>
              <span className={styles.planBadge}>{profile.plan.toUpperCase()}</span>
            </div>

            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <Calendar size={16} />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              {profile.location && (
                <div className={styles.metaItem}>
                  <MapPin size={16} />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>

            <div className={styles.socialLinks}>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <Globe size={18} />
                </a>
              )}
              {profile.github_username && (
                <a
                  href={`https://github.com/${profile.github_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <Github size={18} />
                </a>
              )}
              {profile.twitter_username && (
                <a
                  href={`https://twitter.com/${profile.twitter_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <Twitter size={18} />
                </a>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <Link href="/settings" className={styles.editButton}>
              <Settings size={18} />
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#588157' }}>
              <Code2 size={24} color="white" />
            </div>
            <div>
              <p className={styles.statLabel}>Snippets</p>
              <h3 className={styles.statValue}>{stats.publicSnippets}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#3A5A40' }}>
              <Eye size={24} color="white" />
            </div>
            <div>
              <p className={styles.statLabel}>Views</p>
              <h3 className={styles.statValue}>{stats.totalViews.toLocaleString()}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#E9C46A' }}>
              <Heart size={24} color="white" />
            </div>
            <div>
              <p className={styles.statLabel}>Upvotes</p>
              <h3 className={styles.statValue}>{stats.totalUpvotes.toLocaleString()}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#264653' }}>
              <Award size={24} color="white" />
            </div>
            <div>
              <p className={styles.statLabel}>Reputation</p>
              <h3 className={styles.statValue}>{reputation.toLocaleString()}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#A3B18A' }}>
              <Users size={24} color="white" />
            </div>
            <div>
              <p className={styles.statLabel}>Communities</p>
              <h3 className={styles.statValue}>{stats.communitiesJoined}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#588157' }}>
              <MessageSquare size={24} color="white" />
            </div>
            <div>
              <p className={styles.statLabel}>Comments</p>
              <h3 className={styles.statValue}>{stats.totalComments}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('snippets')}
          className={`${styles.tab} ${activeTab === 'snippets' ? styles.active : ''}`}
        >
          <Code2 size={18} />
          Public Snippets
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
        >
          <TrendingUp size={18} />
          Activity
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'snippets' ? (
          snippets.length === 0 ? (
            <div className={styles.emptyState}>
              <Code2 size={60} />
              <p>No public snippets yet</p>
            </div>
          ) : (
            <div className={styles.snippetsGrid}>
              {snippets.map((snippet) => (
                <Link
                  key={snippet.id}
                  href={`/snippets/${snippet.id}`}
                  className={styles.snippetCard}
                >
                  <h3 className={styles.snippetTitle}>{snippet.title}</h3>
                  {snippet.description && (
                    <p className={styles.snippetDescription}>{snippet.description}</p>
                  )}
                  <div className={styles.snippetMeta}>
                    <span className={styles.language}>{snippet.language}</span>
                    <div className={styles.snippetStats}>
                      <span>
                        <Heart size={14} /> {snippet.upvote_count || 0}
                      </span>
                      <span>
                        <Eye size={14} /> {snippet.view_count || 0}
                      </span>
                      <span>
                        <MessageSquare size={14} /> {snippet.comment_count || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          <div className={styles.activitySection}>
            <div className={styles.activityCard}>
              <h3>Contribution Summary</h3>
              <div className={styles.contributionGrid}>
                <div className={styles.contribution}>
                  <span className={styles.contributionLabel}>Total Contributions</span>
                  <span className={styles.contributionValue}>
                    {(stats?.totalSnippets || 0) + (stats?.totalComments || 0)}
                  </span>
                </div>
                <div className={styles.contribution}>
                  <span className={styles.contributionLabel}>Snippets Shared</span>
                  <span className={styles.contributionValue}>{stats?.snippetsShared || 0}</span>
                </div>
                <div className={styles.contribution}>
                  <span className={styles.contributionLabel}>Engagement Rate</span>
                  <span className={styles.contributionValue}>
                    {stats?.totalSnippets
                      ? Math.round(
                          ((stats.totalUpvotes + stats.totalComments) / stats.totalSnippets) * 10
                        ) / 10
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
