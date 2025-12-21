'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Hash,
  Settings,
  CheckCircle2,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  ArrowUp,
  MessageSquare,
  Eye,
  Copy,
  Check,
  Share2,
  Plus,
  TrendingUp,
  Clock,
  Star,
  Globe,
  Lock,
  User,
} from 'lucide-react';
import styles from './page.module.css';

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar_url?: string;
  banner_url?: string;
  owner_id: string;
  is_verified: boolean;
  verification_tier?: 'none' | 'blue' | 'green' | 'gold';
  visibility: string;
  member_count: number;
  follower_count: number;
  snippet_count: number;
  category?: string;
  created_at: string;
}

interface CommunitySnippet {
  id: string;
  snippet_id: string;
  posted_at: string;
  is_pinned: boolean;
  snippets: {
    id: string;
    title: string;
    description: string;
    code: string;
    language: string;
    tags: string[];
    upvote_count: number;
    downvote_count: number;
    comment_count: number;
    view_count: number;
    created_at: string;
    users: {
      full_name: string;
      avatar_url?: string;
    };
  };
}

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [snippets, setSnippets] = useState<CommunitySnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadCommunity();
  }, [slug]);

  useEffect(() => {
    if (community) {
      loadSnippets();
    }
  }, [community, sortBy]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadCommunity = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      setCommunity(data);

      // Check if user is member
      if (currentUser) {
        const { data: memberData } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', data.id)
          .eq('user_id', currentUser.id)
          .single();

        setIsMember(!!memberData);

        // Check if following
        const { data: followerData } = await supabase
          .from('community_followers')
          .select('id')
          .eq('community_id', data.id)
          .eq('user_id', currentUser.id)
          .single();

        setIsFollowing(!!followerData);
      }
    } catch (error) {
      console.error('Error loading community:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSnippets = async () => {
    if (!community) return;

    try {
      let query = supabase
        .from('community_snippets')
        .select(`
          *,
          snippets:snippet_id (
            id,
            title,
            description,
            code,
            language,
            tags,
            upvote_count,
            downvote_count,
            comment_count,
            view_count,
            created_at,
            users:user_id (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('community_id', community.id);

      // Sort
      switch (sortBy) {
        case 'new':
          query = query.order('posted_at', { ascending: false });
          break;
        case 'top':
          query = query.order('snippets.upvote_count', { ascending: false });
          break;
        case 'hot':
        default:
          query = query.order('is_pinned', { ascending: false }).order('posted_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      setSnippets(data || []);
    } catch (error) {
      console.error('Error loading snippets:', error);
    }
  };

  const handleJoin = async () => {
    if (!currentUser || !community) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .insert([
          {
            community_id: community.id,
            user_id: currentUser.id,
            role: 'member',
          },
        ]);

      if (error) throw error;

      setIsMember(true);
      setCommunity({ ...community, member_count: community.member_count + 1 });
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  const handleLeave = async () => {
    if (!currentUser || !community) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', community.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setIsMember(false);
      setCommunity({ ...community, member_count: community.member_count - 1 });
    } catch (error) {
      console.error('Error leaving community:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !community) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('community_followers')
          .delete()
          .eq('community_id', community.id)
          .eq('user_id', currentUser.id);

        if (error) throw error;

        setIsFollowing(false);
        setCommunity({ ...community, follower_count: community.follower_count - 1 });
      } else {
        const { error } = await supabase
          .from('community_followers')
          .insert([
            {
              community_id: community.id,
              user_id: currentUser.id,
            },
          ]);

        if (error) throw error;

        setIsFollowing(true);
        setCommunity({ ...community, follower_count: community.follower_count + 1 });
      }
    } catch (error) {
      console.error('Error following community:', error);
    }
  };

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getVerificationBadge = (tier?: string) => {
    switch (tier) {
      case 'blue':
        return <CheckCircle2 size={24} color="#3B82F6" />;
      case 'green':
        return <Shield size={24} color="#10B981" />;
      case 'gold':
        return <Crown size={24} color="#F59E0B" />;
      default:
        return null;
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      typescript: '#3178C6',
      javascript: '#F7DF1E',
      python: '#3776AB',
      java: '#007396',
      go: '#00ADD8',
      rust: '#CE422B',
      cpp: '#00599C',
      csharp: '#239120',
      php: '#777BB4',
      ruby: '#CC342D',
      swift: '#FA7343',
      kotlin: '#7F52FF',
      sql: '#CC2927',
    };
    return colors[language.toLowerCase()] || '#588157';
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading community...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className={styles.notFound}>
        <Users size={60} />
        <h2>Community Not Found</h2>
        <p>The community you're looking for doesn't exist.</p>
        <Link href="/communities" className={styles.backButton}>
          Browse Communities
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === community.owner_id;

  return (
    <div className={styles.container}>
      {/* Banner */}
      <div
        className={styles.banner}
        style={{
          backgroundImage: community.banner_url
            ? `url(${community.banner_url})`
            : 'linear-gradient(135deg, #588157 0%, #3A5A40 100%)',
        }}
      />

      {/* Community Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.communityInfo}>
            {community.avatar_url ? (
              <img src={community.avatar_url} alt={community.name} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <Users size={40} />
              </div>
            )}

            <div className={styles.infoText}>
              <div className={styles.nameWrapper}>
                <h1 className={styles.communityName}>{community.name}</h1>
                {community.is_verified && getVerificationBadge(community.verification_tier)}
              </div>
              <p className={styles.slug}>c/{community.slug}</p>
              <p className={styles.description}>{community.description}</p>
            </div>
          </div>

          <div className={styles.actions}>
            {isOwner ? (
              <Link href={`/communities/${slug}/settings`} className={styles.settingsButton}>
                <Settings size={18} />
                Settings
              </Link>
            ) : (
              <>
                {isMember ? (
                  <button onClick={handleLeave} className={styles.leaveButton}>
                    <UserMinus size={18} />
                    Leave
                  </button>
                ) : (
                  <button onClick={handleJoin} className={styles.joinButton}>
                    <UserPlus size={18} />
                    Join
                  </button>
                )}
                <button
                  onClick={handleFollow}
                  className={isFollowing ? styles.followingButton : styles.followButton}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <Users size={18} />
            <span>
              <strong>{community.member_count.toLocaleString()}</strong> members
            </span>
          </div>
          <div className={styles.stat}>
            <Eye size={18} />
            <span>
              <strong>{community.follower_count.toLocaleString()}</strong> followers
            </span>
          </div>
          <div className={styles.stat}>
            <Hash size={18} />
            <span>
              <strong>{community.snippet_count.toLocaleString()}</strong> snippets
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.content}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3>About Community</h3>
            <p className={styles.aboutText}>{community.description}</p>

            <div className={styles.sidebarStats}>
              <div className={styles.sidebarStat}>
                <span className={styles.statLabel}>Created</span>
                <span className={styles.statValue}>
                  {new Date(community.created_at).toLocaleDateString()}
                </span>
              </div>
              {community.category && (
                <div className={styles.sidebarStat}>
                  <span className={styles.statLabel}>Category</span>
                  <span className={styles.statValue}>{community.category.replace('-', ' ')}</span>
                </div>
              )}
              <div className={styles.sidebarStat}>
                <span className={styles.statLabel}>Visibility</span>
                <span className={styles.statValue}>
                  {community.visibility === 'public' ? (
                    <>
                      <Globe size={14} /> Public
                    </>
                  ) : community.visibility === 'followers_only' ? (
                    <>
                      <UserPlus size={14} /> Followers Only
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> Private
                    </>
                  )}
                </span>
              </div>
            </div>

            {isMember && (
              <Link href={`/communities/${slug}/submit`} className={styles.submitButton}>
                <Plus size={18} />
                Submit Snippet
              </Link>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {/* Sort Options */}
          <div className={styles.sortBar}>
            <button
              onClick={() => setSortBy('hot')}
              className={`${styles.sortButton} ${sortBy === 'hot' ? styles.active : ''}`}
            >
              <TrendingUp size={16} />
              Hot
            </button>
            <button
              onClick={() => setSortBy('new')}
              className={`${styles.sortButton} ${sortBy === 'new' ? styles.active : ''}`}
            >
              <Clock size={16} />
              New
            </button>
            <button
              onClick={() => setSortBy('top')}
              className={`${styles.sortButton} ${sortBy === 'top' ? styles.active : ''}`}
            >
              <Star size={16} />
              Top
            </button>
          </div>

          {/* Snippets */}
          <div className={styles.snippets}>
            <AnimatePresence mode="popLayout">
              {snippets.map((item, index) => {
                const snippet = item.snippets as any;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={styles.snippetCard}
                  >
                    {item.is_pinned && (
                      <div className={styles.pinnedBadge}>
                        <Star size={14} />
                        Pinned
                      </div>
                    )}

                    <div className={styles.cardHeader}>
                      <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                          {snippet.users?.avatar_url ? (
                            <img src={snippet.users.avatar_url} alt={snippet.users.full_name} />
                          ) : (
                            <User size={18} />
                          )}
                        </div>
                        <div>
                          <p className={styles.userName}>{snippet.users?.full_name || 'Anonymous'}</p>
                          <p className={styles.timeAgo}>{timeAgo(item.posted_at)}</p>
                        </div>
                      </div>

                      <div
                        className={styles.languageBadge}
                        style={{
                          backgroundColor: `${getLanguageColor(snippet.language)}20`,
                          color: getLanguageColor(snippet.language),
                        }}
                      >
                        <div
                          className={styles.languageDot}
                          style={{ backgroundColor: getLanguageColor(snippet.language) }}
                        />
                        {snippet.language}
                      </div>
                    </div>

                    <h3 className={styles.snippetTitle}>{snippet.title}</h3>
                    {snippet.description && (
                      <p className={styles.snippetDescription}>{snippet.description}</p>
                    )}

                    <div className={styles.codeBlock}>
                      <pre>
                        <code>
                          {snippet.code.slice(0, 300)}
                          {snippet.code.length > 300 ? '...' : ''}
                        </code>
                      </pre>
                    </div>

                    {snippet.tags && snippet.tags.length > 0 && (
                      <div className={styles.tags}>
                        {snippet.tags.slice(0, 5).map((tag: string, i: number) => (
                          <span key={i} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      <div className={styles.footerStats}>
                        <div className={styles.footerStat}>
                          <ArrowUp size={16} />
                          {snippet.upvote_count}
                        </div>
                        <div className={styles.footerStat}>
                          <MessageSquare size={16} />
                          {snippet.comment_count}
                        </div>
                        <div className={styles.footerStat}>
                          <Eye size={16} />
                          {snippet.view_count}
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          onClick={() => handleCopy(snippet.code, snippet.id)}
                          className={styles.actionButton}
                        >
                          {copiedId === snippet.id ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button className={styles.actionButton}>
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {snippets.length === 0 && (
              <div className={styles.emptyState}>
                <Hash size={60} />
                <p>No snippets yet</p>
                {isMember && (
                  <Link href={`/communities/${slug}/submit`} className={styles.submitButton}>
                    <Plus size={18} />
                    Be the first to submit
                  </Link>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
