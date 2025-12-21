'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Code2,
  Search,
  Copy,
  Edit2,
  Heart,
  Eye,
  EyeOff,
  X,
  Loader2,
} from 'lucide-react';
import { getLanguageColor } from '@/lib/languageColors';
import SnippetMenu from '@/components/dashboard/SnippetMenu';
import Toast from '@/components/ui/Toast';
import UpgradeModal from '@/components/ui/UpgradeModal';
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

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalData, setUpgradeModalData] = useState({ message: '', current: 0, max: 0 });
  const [isMounted, setIsMounted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    language: 'typescript',
    category: '',
    tags: '',
    is_private: false,
  });

  // Set mounted state for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load snippets from API
  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    try {
      setLoading(true);

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setToast({ show: true, message: 'Please login to view snippets', type: 'error' });
        setLoading(false);
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
        setLoading(false);
        return;
      }

      // Fetch snippets with team_id parameter
      const response = await fetch(`/api/snippets?team_id=${teamMember.team_id}`);

      if (!response.ok) {
        throw new Error('Failed to load snippets');
      }

      const data = await response.json();
      setSnippets(data.snippets || []);
      setFilteredSnippets(data.snippets || []);
    } catch (error) {
      console.error('Error loading snippets:', error);
      setToast({ show: true, message: 'Failed to load snippets', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter snippets
  useEffect(() => {
    let filtered = snippets;

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedLanguage !== 'all') {
      filtered = filtered.filter((s) => s.language === selectedLanguage);
    }

    setFilteredSnippets(filtered);
  }, [searchQuery, selectedLanguage, snippets]);

  const languages = ['all', ...new Set(snippets.map((s) => s.language))];

  // Copy to clipboard
  const handleCopy = async (code: string, snippetId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setToast({ show: true, message: 'Code copied to clipboard!', type: 'success' });

      // Update usage count via API
      await fetch(`/api/snippets/${snippetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usage_count: 1 }), // Increment by 1
      });

      // Update local state
      setSnippets((prev) =>
        prev.map((s) => (s.id === snippetId ? { ...s, usage_count: s.usage_count + 1 } : s))
      );
    } catch (error) {
      setToast({ show: true, message: 'Failed to copy code', type: 'error' });
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (snippetId: string) => {
    const snippet = snippets.find((s) => s.id === snippetId);
    if (!snippet) return;

    try {
      const response = await fetch(`/api/snippets/${snippetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !snippet.is_favorite }),
      });

      if (!response.ok) throw new Error('Failed to update favorite');

      setSnippets((prev) =>
        prev.map((s) => (s.id === snippetId ? { ...s, is_favorite: !s.is_favorite } : s))
      );
      setToast({ show: true, message: 'Favorite updated!', type: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Failed to update favorite', type: 'error' });
    }
  };

  // Toggle privacy
  const handleTogglePrivacy = async (snippetId: string) => {
    const snippet = snippets.find((s) => s.id === snippetId);
    if (!snippet) return;

    try {
      const response = await fetch(`/api/snippets/${snippetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_private: !snippet.is_private }),
      });

      if (!response.ok) throw new Error('Failed to update privacy');

      setSnippets((prev) =>
        prev.map((s) => (s.id === snippetId ? { ...s, is_private: !s.is_private } : s))
      );
      setToast({
        show: true,
        message: snippet.is_private ? 'Snippet is now public' : 'Snippet is now private',
        type: 'success',
      });
    } catch (error) {
      setToast({ show: true, message: 'Failed to update privacy', type: 'error' });
    }
  };

  // Delete snippet
  const handleDelete = async (snippetId: string) => {
    if (!window.confirm('Are you sure you want to delete this snippet?')) return;

    try {
      const response = await fetch(`/api/snippets/${snippetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete snippet');

      setSnippets((prev) => prev.filter((s) => s.id !== snippetId));
      setToast({ show: true, message: 'Snippet deleted!', type: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Failed to delete snippet', type: 'error' });
    }
  };

  // Duplicate snippet
  const handleDuplicate = async (snippetId: string) => {
    const snippet = snippets.find((s) => s.id === snippetId);
    if (!snippet) return;

    try {
      const response = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...snippet,
          title: `${snippet.title} (Copy)`,
          id: undefined, // Remove ID to create new
        }),
      });

      if (!response.ok) throw new Error('Failed to duplicate snippet');

      const { snippet: newSnippet } = await response.json();
      setSnippets((prev) => [newSnippet, ...prev]);
      setToast({ show: true, message: 'Snippet duplicated!', type: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Failed to duplicate snippet', type: 'error' });
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

  // Open create modal
  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      code: '',
      language: 'typescript',
      category: '',
      tags: '',
      is_private: false,
    });
    setEditingSnippet(null);
    setShowCreateModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (snippet: Snippet) => {
    setFormData({
      title: snippet.title,
      description: snippet.description,
      code: snippet.code,
      language: snippet.language,
      category: snippet.category,
      tags: snippet.tags.join(', '),
      is_private: snippet.is_private,
    });
    setEditingSnippet(snippet);
    setShowCreateModal(true);
  };

  // Save snippet (create or update)
  const handleSaveSnippet = async () => {
    if (!formData.title || !formData.code || !formData.language) {
      setToast({ show: true, message: 'Please fill in required fields', type: 'error' });
      return;
    }

    setSaving(true);

    try {
      const snippetData = {
        title: formData.title,
        description: formData.description,
        code: formData.code,
        language: formData.language,
        category: formData.category,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        is_private: formData.is_private,
      };

      if (editingSnippet) {
        // Update existing
        const response = await fetch(`/api/snippets/${editingSnippet.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snippetData),
        });

        if (!response.ok) throw new Error('Failed to update snippet');

        const { snippet: updatedSnippet } = await response.json();
        setSnippets((prev) =>
          prev.map((s) => (s.id === editingSnippet.id ? updatedSnippet : s))
        );
        setToast({ show: true, message: 'Snippet updated!', type: 'success' });
      } else {
        // Create new
        const response = await fetch('/api/snippets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snippetData),
        });

        const data = await response.json();

        if (!response.ok) {
          // Check if it's a limit reached error
          if (data.data?.limitReached) {
            setShowCreateModal(false);
            setUpgradeModalData({
              message: data.error || 'Snippet limit reached',
              current: data.data.current || 0,
              max: data.data.max || 50,
            });
            setShowUpgradeModal(true);
            return;
          }
          throw new Error(data.error || 'Failed to create snippet');
        }

        const { snippet: newSnippet } = data;
        setSnippets((prev) => [newSnippet, ...prev]);
        setToast({ show: true, message: 'Snippet created!', type: 'success' });
      }

      setShowCreateModal(false);
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || 'Failed to save snippet',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <p>Loading snippets...</p>
      </div>
    );
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeModalData.message}
        currentCount={upgradeModalData.current}
        maxCount={upgradeModalData.max}
      />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Snippets</h1>
            <p className={styles.subtitle}>Manage and organize all your code snippets</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenCreate}
            className={styles.createButton}
          >
            <Plus size={20} />
            Create Snippet
          </motion.button>
        </div>

        {/* Search and Filter */}
        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search snippets by title, code, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterPills}>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`${styles.filterPill} ${
                  selectedLanguage === lang ? styles.filterPillActive : ''
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Snippets Grid */}
        <div className={styles.snippetsGrid}>
          {filteredSnippets.map((snippet, idx) => {
            const languageColor = getLanguageColor(snippet.language);

            return (
              <motion.div
                key={snippet.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className={styles.snippetCard}
              >
                {/* Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <h3>{snippet.title}</h3>
                    {snippet.is_private && (
                      <span className={styles.privateBadge} title="Private snippet">
                        <EyeOff size={14} />
                      </span>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    {snippet.is_favorite && <Heart size={16} fill="#E9C46A" color="#E9C46A" />}
                    <SnippetMenu
                      snippetId={snippet.id}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onShare={handleShare}
                      onMove={() => handleTogglePrivacy(snippet.id)}
                    />
                  </div>
                </div>

                <p className={styles.cardDescription}>{snippet.description}</p>

                {/* Language Badge */}
                <div
                  className={styles.languageBadge}
                  style={{
                    background: `${languageColor}20`,
                    border: `1px solid ${languageColor}40`,
                    color: languageColor,
                  }}
                >
                  <div className={styles.languageDot} style={{ background: languageColor }} />
                  {snippet.language.toUpperCase()}
                </div>

                {/* Code Block */}
                <div className={styles.codeBlock}>
                  <pre>
                    <code>{snippet.code}</code>
                  </pre>
                </div>

                {/* Tags */}
                <div className={styles.tags}>
                  {snippet.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.tag}>
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className={styles.cardFooter}>
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
                      onClick={() => handleOpenEdit(snippet)}
                      className={styles.actionButton}
                      title="Edit snippet"
                    >
                      <Edit2 size={16} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTogglePrivacy(snippet.id)}
                      className={styles.actionButton}
                      title={snippet.is_private ? 'Make public' : 'Make private'}
                    >
                      {snippet.is_private ? <EyeOff size={16} /> : <Eye size={16} />}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredSnippets.length === 0 && (
          <div className={styles.emptyState}>
            <Code2 size={48} color="#999" />
            <p>
              {searchQuery || selectedLanguage !== 'all'
                ? 'No snippets found matching your filters'
                : 'No snippets yet. Create your first one!'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isMounted && createPortal(
        <AnimatePresence mode="wait">
          {showCreateModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={styles.modalOverlay}
                onClick={() => !saving && setShowCreateModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={styles.modal}
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
              <div className={styles.modalHeader}>
                <h2>{editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}</h2>
                <button
                  onClick={() => !saving && setShowCreateModal(false)}
                  className={styles.closeButton}
                  disabled={saving}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>
                    Title <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter snippet title"
                    className={styles.input}
                    disabled={saving}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of what this snippet does"
                    className={styles.input}
                    disabled={saving}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>
                      Language <span className={styles.required}>*</span>
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className={styles.select}
                      disabled={saving}
                    >
                      <option value="typescript">TypeScript</option>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="sql">SQL</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="php">PHP</option>
                      <option value="ruby">Ruby</option>
                      <option value="swift">Swift</option>
                      <option value="kotlin">Kotlin</option>
                      <option value="csharp">C#</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., React, Backend, Utils"
                      className={styles.input}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Code <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Paste your code here..."
                    className={styles.textarea}
                    rows={12}
                    disabled={saving}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Enter tags separated by commas (e.g., hooks, forms, validation)"
                    className={styles.input}
                    disabled={saving}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.is_private}
                      onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                      className={styles.checkbox}
                      disabled={saving}
                    />
                    <span>Make this snippet private</span>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={styles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSnippet}
                  className={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      {editingSnippet ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingSnippet ? 'Update Snippet' : 'Create Snippet'
                  )}
                </button>
              </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
