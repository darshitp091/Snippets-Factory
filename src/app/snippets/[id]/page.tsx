'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, ArrowLeft, Lock, Eye, User, Calendar } from 'lucide-react';
import { getLanguageColor } from '@/lib/languageColors';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Link from 'next/link';
import Toast from '@/components/ui/Toast';
import AwardButtons from '@/components/snippets/AwardButtons';
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
  is_private: boolean;
  created_by: string;
  creator?: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function PublicSnippetPage() {
  const params = useParams();
  const router = useRouter();
  const snippetId = params.id as string;

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchSnippet();
  }, [snippetId]);

  const fetchSnippet = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/snippets/${snippetId}/public`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Snippet not found');
        } else if (response.status === 403) {
          setError('This snippet is private');
        } else {
          setError('Failed to load snippet');
        }
        return;
      }

      const data = await response.json();
      setSnippet(data.snippet);
    } catch (err) {
      console.error('Error fetching snippet:', err);
      setError('Failed to load snippet');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!snippet) return;

    try {
      await navigator.clipboard.writeText(snippet.code);
      setToast({ show: true, message: 'Code copied to clipboard!', type: 'success' });

      // Increment usage count
      await fetch(`/api/snippets/${snippetId}/public`, {
        method: 'POST',
      });
    } catch (error) {
      setToast({ show: true, message: 'Failed to copy code', type: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading snippet...</p>
        </div>
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error === 'This snippet is private' ? (
            <>
              <Lock size={64} className={styles.errorIcon} />
              <h1 className={styles.errorTitle}>Private Snippet</h1>
              <p className={styles.errorMessage}>
                This snippet is private and cannot be viewed publicly.
              </p>
            </>
          ) : (
            <>
              <Eye size={64} className={styles.errorIcon} />
              <h1 className={styles.errorTitle}>Snippet Not Found</h1>
              <p className={styles.errorMessage}>
                The snippet you're looking for doesn't exist or has been deleted.
              </p>
            </>
          )}
          <Link href="/" className={styles.homeButton}>
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const languageColor = getLanguageColor(snippet.language);

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Header */}
          <motion.div
            className={styles.header}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/" className={styles.backButton}>
              <ArrowLeft size={18} />
              Back
            </Link>

            <div className={styles.branding}>
              <span className={styles.logo}>⚡</span>
              <span className={styles.brandName}>Snippet Factory</span>
            </div>
          </motion.div>

          {/* Snippet Card */}
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Title & Meta */}
            <div className={styles.snippetHeader}>
              <div className={styles.titleSection}>
                <h1 className={styles.title}>{snippet.title}</h1>
                {snippet.description && (
                  <p className={styles.description}>{snippet.description}</p>
                )}
              </div>

              <div className={styles.meta}>
                <div className={styles.metaItem}>
                  <User size={16} />
                  <span>{snippet.creator?.full_name || 'Anonymous'}</span>
                </div>
                <div className={styles.metaItem}>
                  <Calendar size={16} />
                  <span>{formatDate(snippet.created_at)}</span>
                </div>
                <div className={styles.metaItem}>
                  <Eye size={16} />
                  <span>{snippet.usage_count} uses</span>
                </div>
              </div>
            </div>

            {/* Tags & Language */}
            <div className={styles.badges}>
              <div
                className={styles.languageBadge}
                style={{ backgroundColor: languageColor }}
              >
                {snippet.language}
              </div>
              {snippet.tags.map((tag, index) => (
                <div key={index} className={styles.tag}>
                  #{tag}
                </div>
              ))}
            </div>

            {/* Code Block */}
            <div className={styles.codeContainer}>
              <div className={styles.codeHeader}>
                <span className={styles.codeTitle}>Code</span>
                <button onClick={handleCopy} className={styles.copyButton}>
                  <Copy size={16} />
                  Copy Code
                </button>
              </div>

              <div className={styles.codeWrapper}>
                <SyntaxHighlighter
                  language={snippet.language.toLowerCase()}
                  style={vscDarkPlus}
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    borderRadius: '0 0 12px 12px',
                    fontSize: '0.9rem',
                  }}
                >
                  {snippet.code}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Awards Section */}
            <AwardButtons snippetId={snippetId} />
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className={styles.cta}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Create Your Own Code Snippets</h2>
              <p className={styles.ctaDescription}>
                Join Snippet Factory to organize, share, and manage your code snippets with ease.
              </p>
              <div className={styles.ctaButtons}>
                <Link href="/signup" className={styles.ctaPrimary}>
                  Sign Up Free
                </Link>
                <Link href="/login" className={styles.ctaSecondary}>
                  Log In
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
