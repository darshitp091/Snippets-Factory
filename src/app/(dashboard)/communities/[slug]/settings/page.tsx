'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Settings,
  Save,
  Trash2,
  Upload,
  X,
  Users,
  Shield,
  Eye,
  Globe,
  Lock,
  UserPlus,
  Crown,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertTriangle,
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
  verification_expires_at?: string;
  visibility: 'public' | 'followers_only' | 'private';
  category?: string;
  rules: string[];
  tags: string[];
}

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'moderator' | 'member';
  joined_at: string;
  users: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

const CATEGORIES = [
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

export default function CommunitySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'verification' | 'danger'>('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'web-development',
    visibility: 'public' as 'public' | 'followers_only' | 'private',
    rules: [''],
    tags: [''],
  });

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadCommunity();
      loadMembers();
    }
  }, [currentUser, slug]);

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

      // Check if current user is owner
      if (data.owner_id !== currentUser?.id) {
        router.push(`/communities/${slug}`);
        return;
      }

      setCommunity(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        category: data.category || 'web-development',
        visibility: data.visibility,
        rules: data.rules?.length > 0 ? data.rules : [''],
        tags: data.tags?.length > 0 ? data.tags : [''],
      });
    } catch (error) {
      console.error('Error loading community:', error);
      setToast({ show: true, message: 'Failed to load community', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const { data: communityData } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!communityData) return;

      const { data, error } = await supabase
        .from('community_members')
        .select(`
          *,
          users:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('community_id', communityData.id)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: false });

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleSave = async () => {
    if (!community) return;

    try {
      setSaving(true);

      // Filter out empty rules and tags
      const cleanRules = formData.rules.filter(r => r.trim() !== '');
      const cleanTags = formData.tags.filter(t => t.trim() !== '');

      const { error } = await supabase
        .from('communities')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          visibility: formData.visibility,
          rules: cleanRules,
          tags: cleanTags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', community.id);

      if (error) throw error;

      setToast({ show: true, message: 'Settings saved successfully!', type: 'success' });
      loadCommunity();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setToast({ show: true, message: error.message || 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (!community) return;

    // Don't allow removing the owner
    if (userId === community.owner_id) {
      setToast({ show: true, message: 'Cannot remove the community owner', type: 'error' });
      return;
    }

    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setToast({ show: true, message: 'Member removed successfully', type: 'success' });
      loadMembers();
    } catch (error: any) {
      console.error('Error removing member:', error);
      setToast({ show: true, message: 'Failed to remove member', type: 'error' });
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'moderator' | 'member') => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      setToast({ show: true, message: `Role updated to ${newRole}`, type: 'success' });
      loadMembers();
    } catch (error: any) {
      console.error('Error changing role:', error);
      setToast({ show: true, message: 'Failed to change role', type: 'error' });
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community) return;

    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', community.id);

      if (error) throw error;

      setToast({ show: true, message: 'Community deleted successfully', type: 'success' });
      setTimeout(() => router.push('/communities'), 1500);
    } catch (error: any) {
      console.error('Error deleting community:', error);
      setToast({ show: true, message: 'Failed to delete community', type: 'error' });
    }
  };

  const addRule = () => {
    setFormData({ ...formData, rules: [...formData.rules, ''] });
  };

  const removeRule = (index: number) => {
    const newRules = formData.rules.filter((_, i) => i !== index);
    setFormData({ ...formData, rules: newRules.length > 0 ? newRules : [''] });
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData({ ...formData, rules: newRules });
  };

  const addTag = () => {
    setFormData({ ...formData, tags: [...formData.tags, ''] });
  };

  const removeTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({ ...formData, tags: newTags.length > 0 ? newTags : [''] });
  };

  const updateTag = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData({ ...formData, tags: newTags });
  };

  const getVerificationBadge = (tier?: string) => {
    switch (tier) {
      case 'blue':
        return { icon: <CheckCircle2 size={20} color="#3B82F6" />, name: 'Blue Verified' };
      case 'green':
        return { icon: <Shield size={20} color="#10B981" />, name: 'Green Verified' };
      case 'gold':
        return { icon: <Crown size={20} color="#F59E0B" />, name: 'Gold Verified' };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={40} className={styles.spinner} />
        <p>Loading settings...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className={styles.notFound}>
        <Settings size={60} />
        <h2>Community Not Found</h2>
        <Link href="/communities" className={styles.backButton}>
          Back to Communities
        </Link>
      </div>
    );
  }

  const verificationBadge = getVerificationBadge(community.verification_tier);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href={`/communities/${slug}`} className={styles.backLink}>
          <ArrowLeft size={20} />
          Back to Community
        </Link>
        <h1 className={styles.title}>
          <Settings size={32} />
          Community Settings
        </h1>
        <p className={styles.subtitle}>Manage your community</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('general')}
          className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`}
        >
          <Settings size={18} />
          General
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`${styles.tab} ${activeTab === 'members' ? styles.active : ''}`}
        >
          <Users size={18} />
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`${styles.tab} ${activeTab === 'verification' ? styles.active : ''}`}
        >
          <Shield size={18} />
          Verification
        </button>
        <button
          onClick={() => setActiveTab('danger')}
          className={`${styles.tab} ${activeTab === 'danger' ? styles.dangerTab : ''}`}
        >
          <AlertTriangle size={18} />
          Danger Zone
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* General Tab */}
        {activeTab === 'general' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.section}
          >
            <h2 className={styles.sectionTitle}>General Settings</h2>

            <div className={styles.formGroup}>
              <label>Community Name <span className={styles.required}>*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={styles.input}
                placeholder="My Awesome Community"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={styles.textarea}
                placeholder="Describe what your community is about..."
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
                  {CATEGORIES.map((cat) => (
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
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                  className={styles.select}
                >
                  <option value="public">
                    🌍 Public - Anyone can view
                  </option>
                  <option value="followers_only">
                    👥 Followers Only - Only followers can view
                  </option>
                  <option value="private">
                    🔒 Private - Only members can view
                  </option>
                </select>
              </div>
            </div>

            {/* Community Rules */}
            <div className={styles.formGroup}>
              <label>Community Rules</label>
              {formData.rules.map((rule, index) => (
                <div key={index} className={styles.inputGroup}>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    className={styles.input}
                    placeholder={`Rule ${index + 1}`}
                  />
                  {formData.rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className={styles.removeButton}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addRule} className={styles.addButton}>
                + Add Rule
              </button>
            </div>

            {/* Tags */}
            <div className={styles.formGroup}>
              <label>Tags</label>
              <div className={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <div key={index} className={styles.inputGroup}>
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateTag(index, e.target.value)}
                      className={styles.input}
                      placeholder="javascript"
                    />
                    {formData.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className={styles.removeButton}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addTag} className={styles.addButton}>
                + Add Tag
              </button>
            </div>

            <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.section}
          >
            <h2 className={styles.sectionTitle}>Manage Members</h2>

            <div className={styles.membersList}>
              {members.map((member) => (
                <div key={member.id} className={styles.memberCard}>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberAvatar}>
                      {member.users.avatar_url ? (
                        <img src={member.users.avatar_url} alt={member.users.full_name} />
                      ) : (
                        <Users size={20} />
                      )}
                    </div>
                    <div>
                      <p className={styles.memberName}>{member.users.full_name}</p>
                      <p className={styles.memberEmail}>{member.users.email}</p>
                      <p className={styles.memberDate}>
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className={styles.memberActions}>
                    {member.role === 'owner' ? (
                      <span className={styles.ownerBadge}>
                        <Crown size={16} />
                        Owner
                      </span>
                    ) : (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(member.id, e.target.value as any)}
                          className={styles.roleSelect}
                        >
                          <option value="moderator">Moderator</option>
                          <option value="member">Member</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id, member.user_id)}
                          className={styles.removeButton}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.section}
          >
            <h2 className={styles.sectionTitle}>Verification Status</h2>

            {community.is_verified && verificationBadge ? (
              <div className={styles.verifiedCard}>
                <div className={styles.verifiedBadge}>
                  {verificationBadge.icon}
                  <div>
                    <h3>{verificationBadge.name}</h3>
                    <p>Your community is verified</p>
                  </div>
                </div>
                {community.verification_expires_at && (
                  <p className={styles.expiryText}>
                    Expires on {new Date(community.verification_expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.notVerifiedCard}>
                <Shield size={48} />
                <h3>Get Verified</h3>
                <p>Stand out with a verified badge and unlock premium features</p>
                <Link
                  href={`/communities/${slug}/verify`}
                  className={styles.verifyButton}
                >
                  View Verification Options
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.section}
          >
            <h2 className={styles.sectionTitle}>Danger Zone</h2>

            <div className={styles.dangerCard}>
              <div className={styles.dangerInfo}>
                <h3>Delete Community</h3>
                <p>
                  Once you delete a community, there is no going back. This will permanently
                  delete all snippets, members, and data associated with this community.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.deleteButton}
              >
                <Trash2 size={18} />
                Delete Community
              </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
                <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                  <AlertTriangle size={48} color="#dc2626" />
                  <h3>Are you absolutely sure?</h3>
                  <p>
                    This action cannot be undone. This will permanently delete the{' '}
                    <strong>{community.name}</strong> community and all associated data.
                  </p>
                  <div className={styles.modalActions}>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button onClick={handleDeleteCommunity} className={styles.confirmDeleteButton}>
                      Yes, Delete Community
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
