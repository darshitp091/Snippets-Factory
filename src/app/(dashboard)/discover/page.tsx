'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Code2,
  Search,
  TrendingUp,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  Copy,
  Check,
  Eye,
  Filter,
  RefreshCw,
  Flame,
  Star,
  ArrowUp,
  User,
} from 'lucide-react';
import styles from './page.module.css';

interface PublicSnippet {
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
  user_id: string;
  users: {
    full_name: string;
    avatar_url?: string;
  };
}

type SortOption = 'trending' | 'newest' | 'top' | 'hot';

const LANGUAGES = [
  'all',
  'typescript',
  'javascript',
  'python',
  'java',
  'go',
  'rust',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'sql',
];

export default function DiscoverPage() {
  const [snippets, setSnippets] = useState<PublicSnippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<PublicSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('hot');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(30);

  // Load public snippets
  const loadSnippets = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch snippets
      const { data: snippetsData, error: snippetsError } = await supabase
        .from('snippets')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (snippetsError) throw snippetsError;

      if (!snippetsData || snippetsData.length === 0) {
        setSnippets([]);
        setFilteredSnippets([]);
        setLastRefresh(new Date());
        setCountdown(30);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(snippetsData.map(s => s.user_id).filter(Boolean))];

      // Fetch user data
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // Create user map
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // Combine data
      const combined = snippetsData.map(snippet => ({
        ...snippet,
        users: usersMap.get(snippet.user_id) || { full_name: 'Anonymous', avatar_url: null }
      }));

      setSnippets(combined);
      setFilteredSnippets(combined);
      setLastRefresh(new Date());
      setCountdown(30);
    } catch (error) {
      console.error('Error loading snippets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const refreshInterval = setInterval(() => {
      loadSnippets();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [autoRefresh, loadSnippets]);

  // Countdown timer
  useEffect(() => {
    if (!autoRefresh) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoRefresh]);

  // Filter and sort snippets
  useEffect(() => {
    let filtered = [...snippets];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (snippet) =>
          snippet.title.toLowerCase().includes(query) ||
          snippet.description?.toLowerCase().includes(query) ||
          snippet.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by language
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter((snippet) => snippet.language === selectedLanguage);
    }

    // Sort
    switch (sortBy) {
      case 'hot':
        // Hot = combination of upvotes and recency
        filtered.sort((a, b) => {
          const aScore = a.upvote_count * 2 + a.view_count * 0.1 - a.downvote_count;
          const bScore = b.upvote_count * 2 + b.view_count * 0.1 - b.downvote_count;
          const aTime = new Date(a.created_at).getTime();
          const bTime = new Date(b.created_at).getTime();
          const aHot = aScore / Math.pow((Date.now() - aTime) / 3600000 + 2, 1.5);
          const bHot = bScore / Math.pow((Date.now() - bTime) / 3600000 + 2, 1.5);
          return bHot - aHot;
        });
        break;
      case 'trending':
        // Trending = most engagement in last 24h
        filtered.sort((a, b) => {
          const aRecent = new Date(a.created_at).getTime() > Date.now() - 86400000 ? 1 : 0;
          const bRecent = new Date(b.created_at).getTime() > Date.now() - 86400000 ? 1 : 0;
          const aScore = (a.upvote_count + a.comment_count * 2) * (aRecent ? 2 : 1);
          const bScore = (b.upvote_count + b.comment_count * 2) * (bRecent ? 2 : 1);
          return bScore - aScore;
        });
        break;
      case 'top':
        // Top = most upvotes
        filtered.sort((a, b) => b.upvote_count - a.upvote_count);
        break;
      case 'newest':
        // Newest = most recent
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredSnippets(filtered);
  }, [snippets, searchQuery, selectedLanguage, sortBy]);

  // Copy code to clipboard
  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get language color
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

  // Format time ago
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <Flame size={40} />
              Discover Snippets
            </h1>
            <p className={styles.subtitle}>
              Explore the best code snippets from the community
            </p>
          </div>

          {/* Auto-refresh indicator */}
          <div className={styles.refreshStatus}>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`${styles.autoRefreshToggle} ${autoRefresh ? styles.active : ''}`}
            >
              <RefreshCw size={16} className={autoRefresh ? styles.spinning : ''} />
              {autoRefresh ? `Auto-refresh: ${countdown}s` : 'Auto-refresh: Off'}
            </button>
            <button onClick={loadSnippets} className={styles.manualRefresh}>
              <RefreshCw size={16} />
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {/* Search */}
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Sort Options */}
        <div className={styles.sortOptions}>
          <button
            onClick={() => setSortBy('hot')}
            className={`${styles.sortButton} ${sortBy === 'hot' ? styles.active : ''}`}
          >
            <Flame size={16} />
            Hot
          </button>
          <button
            onClick={() => setSortBy('trending')}
            className={`${styles.sortButton} ${sortBy === 'trending' ? styles.active : ''}`}
          >
            <TrendingUp size={16} />
            Trending
          </button>
          <button
            onClick={() => setSortBy('top')}
            className={`${styles.sortButton} ${sortBy === 'top' ? styles.active : ''}`}
          >
            <Star size={16} />
            Top
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`${styles.sortButton} ${sortBy === 'newest' ? styles.active : ''}`}
          >
            <Clock size={16} />
            Newest
          </button>
        </div>

        {/* Language Filter */}
        <div className={styles.languageFilter}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`${styles.langPill} ${selectedLanguage === lang ? styles.active : ''}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && snippets.length === 0 ? (
        <div className={styles.loadingContainer}>
          <RefreshCw size={40} className={styles.spinner} />
          <p>Loading snippets...</p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className={styles.resultsInfo}>
            <p>
              Showing {filteredSnippets.length} of {snippets.length} snippets
            </p>
            <p className={styles.lastUpdate}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>

          {/* Snippets Grid */}
          <div className={styles.snippetsGrid}>
            <AnimatePresence mode="popLayout">
              {filteredSnippets.map((snippet, index) => (
                <motion.div
                  key={snippet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={styles.snippetCard}
                >
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>
                        {snippet.users?.avatar_url ? (
                          <img src={snippet.users.avatar_url} alt={snippet.users.full_name} />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <p className={styles.userName}>{snippet.users?.full_name || 'Anonymous'}</p>
                        <p className={styles.timeAgo}>{timeAgo(snippet.created_at)}</p>
                      </div>
                    </div>

                    {/* Language Badge */}
                    <div
                      className={styles.languageBadge}
                      style={{ backgroundColor: `${getLanguageColor(snippet.language)}20`, color: getLanguageColor(snippet.language) }}
                    >
                      <div
                        className={styles.languageDot}
                        style={{ backgroundColor: getLanguageColor(snippet.language) }}
                      />
                      {snippet.language}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className={styles.snippetTitle}>{snippet.title}</h3>
                  {snippet.description && (
                    <p className={styles.snippetDescription}>{snippet.description}</p>
                  )}

                  {/* Code Preview */}
                  <div className={styles.codeBlock}>
                    <pre>
                      <code>{snippet.code.slice(0, 300)}{snippet.code.length > 300 ? '...' : ''}</code>
                    </pre>
                  </div>

                  {/* Tags */}
                  {snippet.tags && snippet.tags.length > 0 && (
                    <div className={styles.tags}>
                      {snippet.tags.slice(0, 5).map((tag, i) => (
                        <span key={i} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className={styles.cardFooter}>
                    <div className={styles.stats}>
                      <div className={styles.stat}>
                        <ArrowUp size={16} />
                        {snippet.upvote_count}
                      </div>
                      <div className={styles.stat}>
                        <MessageSquare size={16} />
                        {snippet.comment_count}
                      </div>
                      <div className={styles.stat}>
                        <Eye size={16} />
                        {snippet.view_count}
                      </div>
                    </div>

                    <div className={styles.actions}>
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
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {filteredSnippets.length === 0 && (
            <div className={styles.emptyState}>
              <Code2 size={60} />
              <p>No snippets found matching your criteria</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
