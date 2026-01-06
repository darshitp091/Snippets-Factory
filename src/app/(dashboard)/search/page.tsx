'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Code2,
  Users,
  User,
  Filter,
  X,
  Loader,
  TrendingUp,
  Clock,
  Star,
  Eye,
  Heart,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import ConditionalAd from '@/components/ConditionalAd';
import styles from './page.module.css';

interface SearchResult {
  snippets: any[];
  communities: any[];
  users: any[];
  total: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [type, setType] = useState<'all' | 'snippets' | 'communities' | 'users'>(
    (searchParams?.get('type') as any) || 'all'
  );
  const [language, setLanguage] = useState(searchParams?.get('language') || '');
  const [sortBy, setSortBy] = useState(searchParams?.get('sortBy') || 'relevance');
  const [results, setResults] = useState<SearchResult>({
    snippets: [],
    communities: [],
    users: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const languages = [
    'TypeScript',
    'JavaScript',
    'Python',
    'Java',
    'Go',
    'Rust',
    'C++',
    'C#',
    'PHP',
    'Ruby',
    'Swift',
    'Kotlin',
    'SQL',
  ];

  const performSearch = useCallback(async () => {
    if (!query || query.length < 2) return;

    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set('q', query);
      if (type !== 'all') params.set('type', type);
      if (language) params.set('language', language);
      if (sortBy !== 'relevance') params.set('sortBy', sortBy);

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        console.error('Search error:', data.error);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [query, type, language, sortBy]);

  useEffect(() => {
    const initialQuery = searchParams?.get('q');
    if (initialQuery) {
      performSearch();
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 2) {
      const params = new URLSearchParams();
      params.set('q', query);
      if (type !== 'all') params.set('type', type);
      if (language) params.set('language', language);
      if (sortBy !== 'relevance') params.set('sortBy', sortBy);

      router.push(`/search?${params.toString()}`);
      performSearch();
    }
  };

  const clearFilters = () => {
    setLanguage('');
    setSortBy('relevance');
  };

  return (
    <div className={styles.container}>
      {/* Search Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Search</h1>
        <p className={styles.subtitle}>Find snippets, communities, and developers</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for code snippets, communities, or users..."
            className={styles.searchInput}
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className={styles.clearButton}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button type="submit" className={styles.searchButton} disabled={loading}>
          {loading ? <Loader className={styles.spinner} size={20} /> : 'Search'}
        </button>
      </form>

      {/* Type Filters */}
      <div className={styles.typeFilters}>
        {(['all', 'snippets', 'communities', 'users'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`${styles.typeButton} ${type === t ? styles.active : ''}`}
          >
            {t === 'snippets' && <Code2 size={16} />}
            {t === 'communities' && <Users size={16} />}
            {t === 'users' && <User size={16} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {results.total > 0 && (
              <span className={styles.count}>
                {t === 'all'
                  ? results.total
                  : t === 'snippets'
                  ? results.snippets.length
                  : t === 'communities'
                  ? results.communities.length
                  : results.users.length}
              </span>
            )}
          </button>
        ))}

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          className={styles.filtersPanel}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className={styles.filterSection}>
            <label>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={styles.select}>
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang.toLowerCase()}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterSection}>
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.select}>
              <option value="relevance">Relevance</option>
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          <button onClick={clearFilters} className={styles.clearFilters}>
            Clear Filters
          </button>
        </motion.div>
      )}

      {/* Ad Banner (Free users only) */}
      <ConditionalAd slot="1234567890" format="auto" responsive />

      {/* Results */}
      <div className={styles.results}>
        {loading ? (
          <div className={styles.loadingState}>
            <Loader className={styles.spinner} size={40} />
            <p>Searching...</p>
          </div>
        ) : results.total === 0 && query ? (
          <div className={styles.emptyState}>
            <Search size={60} />
            <h2>No results found</h2>
            <p>Try different keywords or adjust your filters</p>
          </div>
        ) : (
          <>
            {/* Snippets Results */}
            {(type === 'all' || type === 'snippets') && results.snippets.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <Code2 size={20} />
                  Snippets ({results.snippets.length})
                </h2>
                <div className={styles.snippetsGrid}>
                  {results.snippets.map((snippet) => (
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
                      <div className={styles.author}>
                        {snippet.users?.avatar_url ? (
                          <img
                            src={snippet.users.avatar_url}
                            alt={snippet.users.full_name}
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            <User size={14} />
                          </div>
                        )}
                        <span>{snippet.users?.full_name || 'Anonymous'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* In-feed Ad (Free users only) */}
            {results.snippets.length > 0 && (
              <ConditionalAd slot="9876543210" format="fluid" responsive />
            )}

            {/* Communities Results */}
            {(type === 'all' || type === 'communities') && results.communities.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <Users size={20} />
                  Communities ({results.communities.length})
                </h2>
                <div className={styles.communitiesGrid}>
                  {results.communities.map((community) => (
                    <Link
                      key={community.id}
                      href={`/communities/${community.slug}`}
                      className={styles.communityCard}
                    >
                      <div className={styles.communityHeader}>
                        {community.avatar_url ? (
                          <img
                            src={community.avatar_url}
                            alt={community.name}
                            className={styles.communityAvatar}
                          />
                        ) : (
                          <div className={styles.communityAvatarPlaceholder}>
                            <Users size={24} />
                          </div>
                        )}
                        <div>
                          <div className={styles.communityName}>
                            {community.name}
                            {community.is_verified && (
                              <CheckCircle2
                                size={16}
                                color={
                                  community.verification_tier === 'gold'
                                    ? '#F59E0B'
                                    : community.verification_tier === 'green'
                                    ? '#10B981'
                                    : '#3B82F6'
                                }
                              />
                            )}
                          </div>
                          <p className={styles.communitySlug}>c/{community.slug}</p>
                        </div>
                      </div>
                      {community.description && (
                        <p className={styles.communityDescription}>{community.description}</p>
                      )}
                      <div className={styles.communityStats}>
                        <span>
                          <Users size={14} /> {community.member_count || 0} members
                        </span>
                        <span>
                          <Code2 size={14} /> {community.snippet_count || 0} snippets
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users Results */}
            {(type === 'all' || type === 'users') && results.users.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <User size={20} />
                  Developers ({results.users.length})
                </h2>
                <div className={styles.usersGrid}>
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.email.split('@')[0]}`}
                      className={styles.userCard}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className={styles.userAvatar} />
                      ) : (
                        <div className={styles.userAvatarPlaceholder}>
                          <User size={32} />
                        </div>
                      )}
                      <h3 className={styles.userName}>{user.full_name}</h3>
                      <div className={styles.userMeta}>
                        <span className={styles.reputationBadge}>{user.reputation_level}</span>
                        <span className={styles.reputation}>
                          <Star size={14} /> {user.reputation || 0}
                        </span>
                      </div>
                      {user.bio && <p className={styles.userBio}>{user.bio}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
