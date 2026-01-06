'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  Users,
  TrendingUp,
  Star,
  CheckCircle2,
  Crown,
  Shield,
  Eye,
  EyeOff,
  X,
  Loader2,
  Hash,
  Globe,
  Lock,
  UserPlus,
} from 'lucide-react';
import ConditionalAd from '@/components/ConditionalAd';
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
  visibility: 'public' | 'followers_only' | 'private';
  member_count: number;
  follower_count: number;
  snippet_count: number;
  category?: string;
  created_at: string;
  users: {
    full_name: string;
    avatar_url?: string;
  };
}

type SortOption = 'trending' | 'newest' | 'members' | 'snippets';

const CATEGORIES = [
  'all',
  'web-development',
  'mobile',
  'backend',
  'devops',
  'data-science',
  'machine-learning',
  'algorithms',
  'databases',
  'security',
  'testing',
  'other',
];

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'web-development',
    visibility: 'public' as 'public' | 'followers_only' | 'private',
  });

  useEffect(() => {
    setIsMounted(true);
    loadCurrentUser();
    loadCommunities();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadCommunities = async () => {
    try {
      setLoading(true);

      // Fetch communities
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (communitiesError) throw communitiesError;

      if (!communitiesData || communitiesData.length === 0) {
        setCommunities([]);
        setFilteredCommunities([]);
        setLoading(false);
        return;
      }

      // Get unique owner IDs
      const ownerIds = [...new Set(communitiesData.map(c => c.owner_id).filter(Boolean))];

      // Fetch user data
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', ownerIds);

      // Create user map
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // Combine data
      const combined = communitiesData.map(community => ({
        ...community,
        users: usersMap.get(community.owner_id) || { full_name: 'Anonymous', avatar_url: null }
      }));

      setCommunities(combined);
      setFilteredCommunities(combined);
    } catch (error) {
      console.error('Error loading communities:', error);
      setToast({ show: true, message: 'Failed to load communities', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort
  useEffect(() => {
    let filtered = [...communities];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.slug.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => {
          const aScore = a.member_count * 2 + a.snippet_count;
          const bScore = b.member_count * 2 + b.snippet_count;
          return bScore - aScore;
        });
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'members':
        filtered.sort((a, b) => b.member_count - a.member_count);
        break;
      case 'snippets':
        filtered.sort((a, b) => b.snippet_count - a.snippet_count);
        break;
    }

    setFilteredCommunities(filtered);
  }, [communities, searchQuery, selectedCategory, sortBy]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    });
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setToast({ show: true, message: 'Please login to create a community', type: 'error' });
      return;
    }

    try {
      setCreating(true);

      const { data, error } = await supabase
        .from('communities')
        .insert([
          {
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            category: formData.category,
            visibility: formData.visibility,
            owner_id: currentUser.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setToast({ show: true, message: 'Community created successfully!', type: 'success' });
      setShowCreateModal(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        category: 'web-development',
        visibility: 'public',
      });
      loadCommunities();
    } catch (error: any) {
      console.error('Error creating community:', error);
      setToast({
        show: true,
        message: error.message || 'Failed to create community',
        type: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const getVerificationBadge = (tier?: string) => {
    switch (tier) {
      case 'blue':
        return <CheckCircle2 size={18} color="#3B82F6" />;
      case 'green':
        return <Shield size={18} color="#10B981" />;
      case 'gold':
        return <Crown size={18} color="#F59E0B" />;
      default:
        return null;
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe size={14} />;
      case 'followers_only':
        return <UserPlus size={14} />;
      case 'private':
        return <Lock size={14} />;
      default:
        return <Globe size={14} />;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <Users size={40} />
              Communities
            </h1>
            <p className={styles.subtitle}>
              Join communities, share code, and learn together
            </p>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                setToast({ show: true, message: 'Please login to create a community', type: 'error' });
                return;
              }
              setShowCreateModal(true);
            }}
            className={styles.createButton}
          >
            <Plus size={20} />
            Create Community
          </button>
        </div>
      </div>

      {/* Ad for Free Users - Top */}
      <ConditionalAd slot="communities-top" />

      {/* Filters */}
      <div className={styles.filters}>
        {/* Search */}
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Sort Options */}
        <div className={styles.sortOptions}>
          <button
            onClick={() => setSortBy('trending')}
            className={`${styles.sortButton} ${sortBy === 'trending' ? styles.active : ''}`}
          >
            <TrendingUp size={16} />
            Trending
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`${styles.sortButton} ${sortBy === 'newest' ? styles.active : ''}`}
          >
            <Star size={16} />
            Newest
          </button>
          <button
            onClick={() => setSortBy('members')}
            className={`${styles.sortButton} ${sortBy === 'members' ? styles.active : ''}`}
          >
            <Users size={16} />
            Most Members
          </button>
          <button
            onClick={() => setSortBy('snippets')}
            className={`${styles.sortButton} ${sortBy === 'snippets' ? styles.active : ''}`}
          >
            <Hash size={16} />
            Most Snippets
          </button>
        </div>

        {/* Category Filter */}
        <div className={styles.categoryFilter}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`${styles.catPill} ${selectedCategory === cat ? styles.active : ''}`}
            >
              {cat.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Ad for Free Users - Before Communities */}
      <ConditionalAd slot="communities-mid" />

      {/* Loading State */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <Loader2 size={40} className={styles.spinner} />
          <p>Loading communities...</p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className={styles.resultsInfo}>
            <p>
              Showing {filteredCommunities.length} of {communities.length} communities
            </p>
          </div>

          {/* Communities Grid */}
          <div className={styles.communitiesGrid}>
            <AnimatePresence mode="popLayout">
              {filteredCommunities.map((community, index) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link href={`/communities/${community.slug}`} className={styles.communityCard}>
                    {/* Banner */}
                    {community.banner_url && (
                      <div
                        className={styles.banner}
                        style={{ backgroundImage: `url(${community.banner_url})` }}
                      />
                    )}

                    {/* Content */}
                    <div className={styles.cardContent}>
                      {/* Header */}
                      <div className={styles.cardHeader}>
                        <div className={styles.communityInfo}>
                          {community.avatar_url ? (
                            <img src={community.avatar_url} alt={community.name} className={styles.avatar} />
                          ) : (
                            <div className={styles.avatarPlaceholder}>
                              <Users size={24} />
                            </div>
                          )}
                          <div>
                            <div className={styles.nameWrapper}>
                              <h3 className={styles.communityName}>{community.name}</h3>
                              {community.is_verified && getVerificationBadge(community.verification_tier)}
                            </div>
                            <p className={styles.slug}>c/{community.slug}</p>
                          </div>
                        </div>

                        <div className={styles.visibilityBadge}>
                          {getVisibilityIcon(community.visibility)}
                        </div>
                      </div>

                      {/* Description */}
                      <p className={styles.description}>{community.description}</p>

                      {/* Stats */}
                      <div className={styles.stats}>
                        <div className={styles.stat}>
                          <Users size={16} />
                          <span>{community.member_count} members</span>
                        </div>
                        <div className={styles.stat}>
                          <Hash size={16} />
                          <span>{community.snippet_count} snippets</span>
                        </div>
                      </div>

                      {/* Category */}
                      {community.category && (
                        <div className={styles.category}>
                          {community.category.replace('-', ' ')}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {filteredCommunities.length === 0 && (
            <div className={styles.emptyState}>
              <Users size={60} />
              <p>No communities found</p>
              <button onClick={() => setShowCreateModal(true)} className={styles.createButton}>
                <Plus size={20} />
                Create the first one
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {isMounted && createPortal(
        <AnimatePresence mode="wait">
          {showCreateModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.modalOverlay}
                onClick={() => !creating && setShowCreateModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={styles.modal}
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className={styles.modalHeader}>
                  <h2>Create Community</h2>
                  <button
                    onClick={() => !creating && setShowCreateModal(false)}
                    className={styles.closeButton}
                    disabled={creating}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateCommunity} className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label>
                      Community Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={styles.input}
                      placeholder="JavaScript Wizards"
                      required
                      maxLength={100}
                      minLength={3}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      URL Slug <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.slugInput}>
                      <span className={styles.slugPrefix}>c/</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                          })
                        }
                        className={styles.input}
                        placeholder="javascript-wizards"
                        required
                        pattern="[a-z0-9-]+"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={styles.textarea}
                      placeholder="What is your community about?"
                      rows={4}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={styles.select}
                      >
                        {CATEGORIES.filter((c) => c !== 'all').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.replace('-', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Visibility</label>
                      <select
                        value={formData.visibility}
                        onChange={(e) =>
                          setFormData({ ...formData, visibility: e.target.value as any })
                        }
                        className={styles.select}
                      >
                        <option value="public">Public</option>
                        <option value="followers_only">Followers Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.modalFooter}>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className={styles.cancelButton}
                      disabled={creating}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={styles.saveButton} disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 size={16} className={styles.spinner} />
                          Creating...
                        </>
                      ) : (
                        'Create Community'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
