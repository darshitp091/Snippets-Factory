'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Users, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import styles from './ShareToCommunityModal.module.css';

interface Community {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  member_count: number;
  is_verified: boolean;
  verification_tier?: 'blue' | 'green' | 'gold';
}

interface ShareToCommunityModalProps {
  snippetId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ShareToCommunityModal({
  snippetId,
  isOpen,
  onClose,
  onSuccess,
}: ShareToCommunityModalProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUserCommunities();
      loadCurrentUser();
    }
  }, [isOpen]);

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadUserCommunities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get communities where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setCommunities([]);
        return;
      }

      const communityIds = memberships.map((m) => m.community_id);

      // Fetch community details
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('id, name, slug, avatar_url, member_count, is_verified, verification_tier')
        .in('id', communityIds)
        .order('name');

      if (communitiesError) throw communitiesError;

      setCommunities(communitiesData || []);
    } catch (err) {
      console.error('Error loading communities:', err);
      setError('Failed to load your communities');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (communityId: string) => {
    if (!currentUserId) return;

    try {
      setSharing(true);
      setError(null);
      setSelectedCommunity(communityId);

      const response = await fetch(`/api/communities/${communityId}/snippets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet_id: snippetId,
          user_id: currentUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share snippet');
      }

      setSuccess(true);
      if (onSuccess) onSuccess();

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error sharing snippet:', err);
      setError(err.message || 'Failed to share snippet to community');
    } finally {
      setSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Share to Community</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader className={styles.spinner} size={32} />
              <p>Loading your communities...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <AlertCircle size={40} color="#ef4444" />
              <p>{error}</p>
              <button onClick={loadUserCommunities} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          ) : success ? (
            <div className={styles.successState}>
              <CheckCircle2 size={40} color="#10b981" />
              <p>Snippet shared successfully!</p>
            </div>
          ) : communities.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={40} />
              <p>You're not a member of any communities yet</p>
              <p className={styles.emptyHint}>
                Join a community first to share your snippets
              </p>
            </div>
          ) : (
            <div className={styles.communitiesList}>
              {communities.map((community) => (
                <button
                  key={community.id}
                  onClick={() => handleShare(community.id)}
                  disabled={sharing}
                  className={`${styles.communityItem} ${
                    sharing && selectedCommunity === community.id ? styles.sharing : ''
                  }`}
                >
                  <div className={styles.communityInfo}>
                    {community.avatar_url ? (
                      <img
                        src={community.avatar_url}
                        alt={community.name}
                        className={styles.communityAvatar}
                      />
                    ) : (
                      <div className={styles.communityAvatarPlaceholder}>
                        <Users size={20} />
                      </div>
                    )}
                    <div className={styles.communityDetails}>
                      <div className={styles.communityName}>
                        <span>{community.name}</span>
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
                      <p className={styles.communityMembers}>
                        {community.member_count.toLocaleString()} members
                      </p>
                    </div>
                  </div>

                  {sharing && selectedCommunity === community.id ? (
                    <Loader className={styles.buttonSpinner} size={18} />
                  ) : (
                    <span className={styles.shareText}>Share</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
