'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Users,
  Crown,
  UserPlus,
  Mail,
  Shield,
  Eye,
  Trash2,
  MoreVertical,
  Check,
  X,
  Loader,
  ArrowRight,
  Settings,
  Code2,
} from 'lucide-react';
import styles from './page.module.css';

interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: string;
  max_members: number;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  users: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Get user plan
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single();

      setUserPlan(userData?.plan || 'free');

      // If not Pro/Enterprise, don't load team data
      if (userData?.plan === 'free') {
        setLoading(false);
        return;
      }

      // Get user's team (from team_members)
      const { data: membershipData } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .single();

      if (!membershipData) {
        // No team yet - user needs to create one
        setLoading(false);
        return;
      }

      // Get team details
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', membershipData.team_id)
        .single();

      if (teamData) {
        setTeam(teamData);

        // Get all team members
        const { data: membersData } = await supabase
          .from('team_members')
          .select(`
            id,
            user_id,
            role,
            joined_at,
            users:user_id (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('team_id', teamData.id)
          .order('joined_at', { ascending: true });

        if (membersData) {
          setMembers(membersData as any);
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !team || !currentUserId) return;

    try {
      setInviting(true);

      // Check if user exists
      const { data: invitedUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', inviteEmail.toLowerCase())
        .single();

      if (!invitedUser) {
        setToast({
          show: true,
          message: 'User with this email not found. They need to sign up first!',
          type: 'error',
        });
        setInviting(false);
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', invitedUser.id)
        .single();

      if (existingMember) {
        setToast({
          show: true,
          message: 'This user is already a team member!',
          type: 'error',
        });
        setInviting(false);
        return;
      }

      // Check member limit
      if (members.length >= team.max_members) {
        setToast({
          show: true,
          message: `Team member limit reached (${team.max_members} members). Upgrade to add more!`,
          type: 'error',
        });
        setInviting(false);
        return;
      }

      // Add member
      const { error } = await supabase.from('team_members').insert([
        {
          team_id: team.id,
          user_id: invitedUser.id,
          role: inviteRole,
        },
      ]);

      if (error) throw error;

      setToast({
        show: true,
        message: 'Team member added successfully!',
        type: 'success',
      });

      // Reload team data
      await loadTeamData();

      // Reset form
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      setToast({
        show: true,
        message: 'Failed to add team member',
        type: 'error',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (!team || !currentUserId) return;

    // Cannot remove owner
    if (memberUserId === team.owner_id) {
      setToast({
        show: true,
        message: 'Cannot remove team owner!',
        type: 'error',
      });
      return;
    }

    // Check if current user has permission (owner or admin)
    const currentMember = members.find((m) => m.user_id === currentUserId);
    if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
      setToast({
        show: true,
        message: 'You do not have permission to remove members',
        type: 'error',
      });
      return;
    }

    if (!confirm('Are you sure you want to remove this member from the team?')) return;

    try {
      const { error } = await supabase.from('team_members').delete().eq('id', memberId);

      if (error) throw error;

      setToast({
        show: true,
        message: 'Team member removed successfully',
        type: 'success',
      });

      await loadTeamData();
    } catch (error) {
      console.error('Error removing member:', error);
      setToast({
        show: true,
        message: 'Failed to remove team member',
        type: 'error',
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#E9C46A';
      case 'admin':
        return '#588157';
      case 'member':
        return '#3A5A40';
      case 'viewer':
        return '#264653';
      default:
        return '#999';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={14} />;
      case 'admin':
        return <Shield size={14} />;
      case 'member':
        return <Users size={14} />;
      case 'viewer':
        return <Eye size={14} />;
      default:
        return null;
    }
  };

  // Show upgrade prompt for free users
  if (userPlan === 'free' && !loading) {
    return (
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.upgradePrompt}
        >
          <div className={styles.upgradeIcon}>
            <Users size={60} color="#588157" />
          </div>
          <h2>Team Management</h2>
          <p>Collaborate with your team on code snippets with Pro or Enterprise plans.</p>

          <div className={styles.featuresList}>
            <div className={styles.feature}>
              <Check size={20} color="#10b981" />
              <span>Invite unlimited team members</span>
            </div>
            <div className={styles.feature}>
              <Check size={20} color="#10b981" />
              <span>Role-based access control</span>
            </div>
            <div className={styles.feature}>
              <Check size={20} color="#10b981" />
              <span>Shared snippet library</span>
            </div>
            <div className={styles.feature}>
              <Check size={20} color="#10b981" />
              <span>Team activity tracking</span>
            </div>
          </div>

          <Link href="/pricing" className={styles.upgradeButton}>
            <Crown size={20} />
            Upgrade to Pro
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader className={styles.spinner} size={40} />
        <p>Loading team data...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.noTeam}
        >
          <Users size={60} />
          <h2>No Team Yet</h2>
          <p>You don't have a team set up. Contact support to create your team workspace.</p>
        </motion.div>
      </div>
    );
  }

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const canManageTeam =
    currentMember && (currentMember.role === 'owner' || currentMember.role === 'admin');

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Team Management</h1>
          <p className={styles.subtitle}>{team.name}</p>
        </div>

        {canManageTeam && (
          <button onClick={() => setShowInviteModal(true)} className={styles.inviteButton}>
            <UserPlus size={18} />
            Invite Member
          </button>
        )}
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#588157' }}>
            <Users size={24} color="white" />
          </div>
          <div>
            <p className={styles.statLabel}>Team Members</p>
            <h3 className={styles.statValue}>
              {members.length} / {team.max_members}
            </h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#3A5A40' }}>
            <Code2 size={24} color="white" />
          </div>
          <div>
            <p className={styles.statLabel}>Plan</p>
            <h3 className={styles.statValue} style={{ textTransform: 'capitalize' }}>
              {team.plan}
            </h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#E9C46A' }}>
            <Shield size={24} color="white" />
          </div>
          <div>
            <p className={styles.statLabel}>Your Role</p>
            <h3 className={styles.statValue} style={{ textTransform: 'capitalize' }}>
              {currentMember?.role}
            </h3>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Team Members</h2>
          <span className={styles.memberCount}>{members.length} members</span>
        </div>

        <div className={styles.membersList}>
          {members.map((member) => (
            <motion.div
              key={member.id}
              className={styles.memberItem}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.memberInfo}>
                <div className={styles.memberAvatar}>
                  {member.users?.avatar_url ? (
                    <img src={member.users.avatar_url} alt={member.users.full_name} />
                  ) : (
                    <Users size={24} />
                  )}
                </div>
                <div>
                  <h4 className={styles.memberName}>{member.users?.full_name || 'Unknown'}</h4>
                  <p className={styles.memberEmail}>{member.users?.email}</p>
                </div>
              </div>

              <div className={styles.memberActions}>
                <div
                  className={styles.roleBadge}
                  style={{ background: getRoleBadgeColor(member.role) }}
                >
                  {getRoleIcon(member.role)}
                  <span>{member.role}</span>
                </div>

                {canManageTeam && member.user_id !== team.owner_id && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.user_id)}
                    className={styles.removeButton}
                    title="Remove member"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="member">Member - Can create and edit snippets</option>
                  <option value="admin">Admin - Can manage team and members</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className={styles.cancelButton}
                  disabled={inviting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  className={styles.submitButton}
                  disabled={inviting || !inviteEmail}
                >
                  {inviting ? (
                    <>
                      <Loader className={styles.buttonSpinner} size={16} />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          className={`${styles.toast} ${styles[toast.type]}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          onAnimationComplete={() => {
            setTimeout(() => setToast({ ...toast, show: false }), 3000);
          }}
        >
          {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span>{toast.message}</span>
        </motion.div>
      )}
    </div>
  );
}
