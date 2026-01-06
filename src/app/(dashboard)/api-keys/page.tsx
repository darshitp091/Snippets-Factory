'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/ui/Toast';
import UpgradeModal from '@/components/ui/UpgradeModal';
import styles from './page.module.css';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at?: string;
  usage_count: number;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usageLimit, setUsageLimit] = useState<number | null>(null);
  const [currentUsage, setCurrentUsage] = useState<number>(0);

  useEffect(() => {
    loadUserPlan();
    loadApiKeys();
  }, []);

  const loadUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('current_plan')
        .eq('id', user.id)
        .single();

      setUserPlan(data?.current_plan || 'free');

      // Set usage limits based on plan
      if (data?.current_plan === 'pro') {
        setUsageLimit(1000);
      } else if (data?.current_plan === 'enterprise') {
        setUsageLimit(null); // unlimited
      }
    } catch (error) {
      console.error('Failed to load user plan:', error);
    }
  };

  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/keys/list');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);

        // Calculate total usage
        const totalUsage = data.keys.reduce((sum: number, key: ApiKey) => sum + key.usage_count, 0);
        setCurrentUsage(totalUsage);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      setToast({ show: true, message: 'Failed to load API keys', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      setToast({ show: true, message: 'Please enter a key name', type: 'error' });
      return;
    }

    // Check if user has access to API keys
    if (userPlan !== 'pro' && userPlan !== 'enterprise') {
      setShowUpgradeModal(true);
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create API key');
      }

      const data = await response.json();
      setApiKeys((prev) => [data.key, ...prev]);
      setShowCreateModal(false);
      setKeyName('');
      setToast({ show: true, message: 'API key created successfully!', type: 'success' });

      // Auto-show the newly created key
      setVisibleKeys((prev) => new Set(prev).add(data.key.id));
    } catch (error) {
      console.error('Error creating API key:', error);
      setToast({
        show: true,
        message: error instanceof Error ? error.message : 'Failed to create API key',
        type: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete API key');

      setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
      setToast({ show: true, message: 'API key deleted', type: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Failed to delete API key', type: 'error' });
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setToast({ show: true, message: 'API key copied to clipboard!', type: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Failed to copy key', type: 'error' });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + '••••••••••••••••' + key.substring(key.length - 4);
  };

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
        message="API access is available on Pro and Enterprise plans"
        currentCount={0}
        maxCount={0}
      />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>API Keys</h1>
            <p className={styles.subtitle}>
              Manage your API keys for programmatic access to Snippet Factory
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className={styles.createButton}
            disabled={userPlan !== 'pro' && userPlan !== 'enterprise'}
          >
            <Plus size={20} />
            Generate New Key
          </motion.button>
        </div>

        {/* Plan Info Banner */}
        {userPlan === 'free' || userPlan === 'basic' ? (
          <motion.div
            className={styles.upgradeBanner}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={20} />
            <div className={styles.upgradeBannerContent}>
              <p className={styles.upgradeBannerTitle}>API Access Not Available</p>
              <p className={styles.upgradeBannerText}>
                Upgrade to Pro or Enterprise to get API access and integrate Snippet Factory into your workflow.
              </p>
            </div>
            <button
              className={styles.upgradeBannerButton}
              onClick={() => setShowUpgradeModal(true)}
            >
              Upgrade Now
            </button>
          </motion.div>
        ) : (
          <motion.div
            className={styles.usageBanner}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle2 size={20} color="#588157" />
            <div className={styles.usageBannerContent}>
              <p className={styles.usageBannerTitle}>API Usage This Month</p>
              <p className={styles.usageBannerText}>
                {currentUsage.toLocaleString()} / {usageLimit ? usageLimit.toLocaleString() : 'Unlimited'} calls
              </p>
            </div>
            {usageLimit && (
              <div className={styles.usageBar}>
                <div
                  className={styles.usageBarFill}
                  style={{ width: `${Math.min((currentUsage / usageLimit) * 100, 100)}%` }}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* API Keys List */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loader2 size={40} className={styles.spinner} />
            <p>Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className={styles.emptyState}>
            <Key size={64} color="#666" />
            <h3>No API Keys Yet</h3>
            <p>
              {userPlan === 'pro' || userPlan === 'enterprise'
                ? 'Create your first API key to start using the Snippet Factory API'
                : 'Upgrade to Pro or Enterprise to access the API'}
            </p>
          </div>
        ) : (
          <div className={styles.keysList}>
            {apiKeys.map((apiKey, idx) => (
              <motion.div
                key={apiKey.id}
                className={styles.keyCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className={styles.keyHeader}>
                  <div className={styles.keyIcon}>
                    <Key size={20} />
                  </div>
                  <div className={styles.keyInfo}>
                    <h3 className={styles.keyName}>{apiKey.name}</h3>
                    <div className={styles.keyMeta}>
                      <span>Created {formatDate(apiKey.created_at)}</span>
                      {apiKey.last_used_at && (
                        <>
                          <span>•</span>
                          <span>Last used {formatDate(apiKey.last_used_at)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{apiKey.usage_count.toLocaleString()} calls</span>
                    </div>
                  </div>
                </div>

                <div className={styles.keyValue}>
                  <code className={styles.keyCode}>
                    {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                  </code>
                  <div className={styles.keyActions}>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className={styles.actionButton}
                      title={visibleKeys.has(apiKey.id) ? 'Hide key' : 'Show key'}
                    >
                      {visibleKeys.has(apiKey.id) ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleCopyKey(apiKey.key)}
                      className={styles.actionButton}
                      title="Copy to clipboard"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteKey(apiKey.id)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      title="Delete key"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !creating && setShowCreateModal(false)}
            >
              <motion.div
                className={styles.modal}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className={styles.modalTitle}>Generate New API Key</h2>
                <p className={styles.modalDescription}>
                  Give your API key a descriptive name to help you remember what it's used for.
                </p>

                <div className={styles.formGroup}>
                  <label htmlFor="keyName" className={styles.label}>
                    Key Name
                  </label>
                  <input
                    id="keyName"
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g., Production Server, Mobile App, CI/CD"
                    className={styles.input}
                    disabled={creating}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={styles.cancelButton}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    className={styles.submitButton}
                    disabled={creating || !keyName.trim()}
                  >
                    {creating ? (
                      <>
                        <Loader2 size={18} className={styles.spinner} />
                        Generating...
                      </>
                    ) : (
                      'Generate Key'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Documentation Section */}
        <div className={styles.documentation}>
          <h2 className={styles.docTitle}>Using the API</h2>
          <p className={styles.docDescription}>
            Include your API key in the <code>Authorization</code> header of your requests:
          </p>
          <pre className={styles.codeBlock}>
            <code>{`curl https://snippetfactory.com/api/v1/snippets \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</code>
          </pre>
          <p className={styles.docFooter}>
            Visit our <a href="/docs/api" className={styles.link}>API documentation</a> to learn more.
          </p>
        </div>
      </div>
    </>
  );
}
