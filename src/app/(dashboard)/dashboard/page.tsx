'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Code2,
  Calendar,
  Eye,
  Star,
  Copy,
  Edit2,
  Heart,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { getLanguageColor, getContrastColor } from '@/lib/languageColors';
import SnippetMenu from '@/components/dashboard/SnippetMenu';
import Toast from '@/components/ui/Toast';
import ConditionalAd from '@/components/ConditionalAd';
import styles from './page.module.css';

interface Snippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  category: string;
  tags: string[];
  usage_count: number;
  created_at: string;
  is_favorite: boolean;
  is_private: boolean;
}

export default function DashboardPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [hoveredSnippet, setHoveredSnippet] = useState<string | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<string | null>(null);
  const [editedCode, setEditedCode] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    checkAuthAndLoadSnippets();
  }, []);

  const checkAuthAndLoadSnippets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }
    loadSnippets();
  };

  const loadSnippets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setToast({ show: true, message: 'Please login to view snippets', type: 'error' });
        return;
      }

      // Get user's team_id
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .single();

      if (!teamMember) {
        console.log('No team found for user');
        return;
      }

      // Fetch snippets for the user's team
      const { data: snippetsData, error } = await supabase
        .from('snippets')
        .select(`
          id,
          title,
          description,
          code,
          language,
          tags,
          usage_count,
          created_at,
          is_favorite,
          is_public,
          categories (
            name
          )
        `)
        .eq('team_id', teamMember.team_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading snippets:', error);
        setToast({ show: true, message: 'Failed to load snippets', type: 'error' });
        return;
      }

      // Transform the data to match the Snippet interface
      const transformedSnippets: Snippet[] = (snippetsData || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description || '',
        code: s.code,
        language: s.language,
        category: (s.categories && typeof s.categories === 'object' && !Array.isArray(s.categories))
          ? s.categories.name
          : 'Uncategorized',
        tags: s.tags || [],
        usage_count: s.usage_count || 0,
        created_at: s.created_at,
        is_favorite: s.is_favorite || false,
        is_private: !s.is_public,
      }));

      setSnippets(transformedSnippets);
    } catch (error) {
      console.error('Error in loadSnippets:', error);
      setToast({ show: true, message: 'Failed to load snippets', type: 'error' });
    }
  };

  // Real-time analytics calculations
  const totalSnippets = snippets.length;
  const thisMonthSnippets = snippets.filter(s => {
    const snippetDate = new Date(s.created_at);
    const now = new Date();
    return snippetDate.getMonth() === now.getMonth() && snippetDate.getFullYear() === now.getFullYear();
  }).length;
  const totalViews = snippets.reduce((sum, s) => sum + s.usage_count, 0);
  const favoriteCount = snippets.filter(s => s.is_favorite).length;
  const mostPopular = snippets.length > 0
    ? snippets.reduce((prev, current) => (prev.usage_count > current.usage_count) ? prev : current)
    : null;

  const stats = [
    { label: 'Total Snippets', value: totalSnippets.toString(), icon: Code2, color: '#588157' },
    { label: 'This Month', value: thisMonthSnippets.toString(), icon: Calendar, color: '#D4A373' },
    { label: 'Total Uses', value: totalViews.toString(), icon: Eye, color: '#A3B18A' },
    { label: 'Favorites', value: favoriteCount.toString(), icon: Star, color: '#E9C46A' },
  ];

  // Copy to clipboard
  const handleCopy = async (code: string, snippetId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setToast({ show: true, message: 'Code copied to clipboard!', type: 'success' });

      // Increment usage count
      setSnippets(prev => prev.map(s =>
        s.id === snippetId ? { ...s, usage_count: s.usage_count + 1 } : s
      ));
    } catch (error) {
      setToast({ show: true, message: 'Failed to copy code', type: 'error' });
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (snippetId: string) => {
    setSnippets(prev => prev.map(s =>
      s.id === snippetId ? { ...s, is_favorite: !s.is_favorite } : s
    ));
    setToast({ show: true, message: 'Favorite updated!', type: 'success' });
  };

  // Start inline editing
  const handleStartEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet.id);
    setEditedCode(snippet.code);
    setEditedTitle(snippet.title);
  };

  // Save inline edit
  const handleSaveEdit = (snippetId: string) => {
    setSnippets(prev => prev.map(s =>
      s.id === snippetId ? { ...s, code: editedCode, title: editedTitle } : s
    ));
    setEditingSnippet(null);
    setToast({ show: true, message: 'Snippet updated!', type: 'success' });
  };

  // Cancel inline edit
  const handleCancelEdit = () => {
    setEditingSnippet(null);
    setEditedCode('');
    setEditedTitle('');
  };

  // Delete snippet
  const handleDelete = (snippetId: string) => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      setSnippets(prev => prev.filter(s => s.id !== snippetId));
      setToast({ show: true, message: 'Snippet deleted!', type: 'success' });
    }
  };

  // Duplicate snippet
  const handleDuplicate = (snippetId: string) => {
    const snippet = snippets.find(s => s.id === snippetId);
    if (snippet) {
      const newSnippet = {
        ...snippet,
        id: Date.now().toString(),
        title: `${snippet.title} (Copy)`,
        created_at: new Date().toISOString(),
      };
      setSnippets(prev => [newSnippet, ...prev]);
      setToast({ show: true, message: 'Snippet duplicated!', type: 'success' });
    }
  };

  // Share snippet
  const handleShare = async (snippetId: string) => {
    const shareUrl = `${window.location.origin}/snippets/${snippetId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast({ show: true, message: 'Share link copied!', type: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Failed to copy share link', type: 'error' });
    }
  };

  // Toggle privacy (for move action in menu)
  const handleTogglePrivacy = (snippetId: string) => {
    setSnippets(prev => prev.map(s =>
      s.id === snippetId ? { ...s, is_private: !s.is_private } : s
    ));
    const snippet = snippets.find(s => s.id === snippetId);
    setToast({
      show: true,
      message: snippet?.is_private ? 'Snippet is now public' : 'Snippet is now private',
      type: 'success',
    });
  };

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className={styles.container}>
        {/* Page Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={styles.header}
        >
          <div>
            <h1 className={styles.title}>Snippet Dashboard</h1>
            <p className={styles.subtitle}>
              Manage your code snippets across 100+ programming languages
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={styles.newButton}
          >
            <Plus size={20} />
            New Snippet
          </motion.button>
        </motion.div>

        {/* Ad for Free Users - Top of Page */}
        <ConditionalAd slot="dashboard-top" />

        {/* Analytics Section */}
        <div className={styles.analyticsSection}>
          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={styles.statCard}
              >
                <div className={styles.statContent}>
                  <div>
                    <p className={styles.statLabel}>{stat.label}</p>
                    <p className={styles.statValue}>{stat.value}</p>
                  </div>
                  <div className={styles.statIcon} style={{ background: stat.color }}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Most Popular Snippet */}
          {mostPopular && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className={styles.popularCard}
            >
              <div className={styles.popularHeader}>
                <TrendingUp size={20} color="#588157" />
                <h3>Most Popular Snippet</h3>
              </div>
              <p className={styles.popularTitle}>{mostPopular.title}</p>
              <div className={styles.popularStats}>
                <span style={{
                  color: getLanguageColor(mostPopular.language),
                  fontWeight: 600
                }}>
                  {mostPopular.language.toUpperCase()}
                </span>
                <span>•</span>
                <span>{mostPopular.usage_count} uses</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Ad for Free Users - Mid Page */}
        <ConditionalAd slot="dashboard-mid" />

        {/* Snippets Column */}
        <div className={styles.snippetsSection}>
          <h2 className={styles.sectionTitle}>All Snippets</h2>

          <div className={styles.snippetsColumn}>
            {snippets.map((snippet, idx) => {
              const isHovered = hoveredSnippet === snippet.id;
              const isEditing = editingSnippet === snippet.id;
              const languageColor = getLanguageColor(snippet.language);

              return (
                <motion.div
                  key={snippet.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + idx * 0.05, duration: 0.4 }}
                  className={styles.snippetCard}
                  style={{
                    borderLeft: isHovered ? `4px solid ${languageColor}` : '4px solid transparent',
                  }}
                  onMouseEnter={() => !isEditing && setHoveredSnippet(snippet.id)}
                  onMouseLeave={() => !isEditing && setHoveredSnippet(null)}
                >
                  {/* Title */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className={styles.editTitleInput}
                    />
                  ) : (
                    <h3 className={styles.snippetTitle}>{snippet.title}</h3>
                  )}

                  {/* Code Block */}
                  {isEditing ? (
                    <div className={styles.editContainer}>
                      <textarea
                        value={editedCode}
                        onChange={(e) => setEditedCode(e.target.value)}
                        className={styles.editTextarea}
                        rows={10}
                      />
                      <div className={styles.editActions}>
                        <button
                          onClick={() => handleSaveEdit(snippet.id)}
                          className={styles.saveButton}
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={styles.cancelButton}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.codeBlock}>
                      <pre>
                        <code>{snippet.code}</code>
                      </pre>
                    </div>
                  )}

                  {/* Metadata (shown on hover) */}
                  <AnimatePresence>
                    {(isHovered || isEditing) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={styles.metadata}
                      >
                        {/* Language & Tags */}
                        <div className={styles.tagsContainer}>
                          <span
                            className={styles.languageBadge}
                            style={{
                              background: `${languageColor}20`,
                              border: `1px solid ${languageColor}40`,
                              color: languageColor,
                            }}
                          >
                            <div
                              className={styles.languageDot}
                              style={{ background: languageColor }}
                            />
                            {snippet.language.toUpperCase()}
                          </span>
                          {snippet.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className={styles.tag}>
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Stats & Actions */}
                        <div className={styles.footer}>
                          <div className={styles.stats}>
                            <Eye size={14} />
                            <span>{snippet.usage_count} uses</span>
                          </div>

                          <div className={styles.actions}>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCopy(snippet.code, snippet.id)}
                              className={styles.actionButton}
                              title="Copy to clipboard"
                            >
                              <Copy size={16} />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleToggleFavorite(snippet.id)}
                              className={styles.actionButton}
                              title={snippet.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Heart
                                size={16}
                                fill={snippet.is_favorite ? '#E9C46A' : 'none'}
                                color={snippet.is_favorite ? '#E9C46A' : 'currentColor'}
                              />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStartEdit(snippet)}
                              className={styles.actionButton}
                              title="Edit snippet"
                            >
                              <Edit2 size={16} />
                            </motion.button>

                            <SnippetMenu
                              snippetId={snippet.id}
                              onDelete={handleDelete}
                              onDuplicate={handleDuplicate}
                              onShare={handleShare}
                              onMove={handleTogglePrivacy}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {snippets.length === 0 && (
            <div className={styles.emptyState}>
              <Code2 size={48} color="#999" />
              <p>No snippets yet. Create your first one!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
