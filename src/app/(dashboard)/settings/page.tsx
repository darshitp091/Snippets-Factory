'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { User, Lock, Bell, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './settings.module.css';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    theme: 'light'
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      setFormData({
        fullName: session.user.user_metadata?.full_name || '',
        email: session.user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className={styles.container}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.header}>
            <h1>Settings</h1>
            <p>Manage your account settings and preferences</p>
          </div>

          {message.text && (
            <motion.div
              className={message.type === 'error' ? styles.errorBox : styles.successBox}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              <span>{message.text}</span>
            </motion.div>
          )}

          <div className={styles.sections}>
            {/* Profile Section */}
            <motion.section className={styles.section} {...fadeInUp}>
              <div className={styles.sectionHeader}>
                <User size={24} />
                <h2>Profile Information</h2>
              </div>
              <form onSubmit={handleUpdateProfile} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    disabled
                    className={styles.input}
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                  <p className={styles.helpText}>Email cannot be changed</p>
                </div>
                <button type="submit" disabled={saving} className={styles.saveButton}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </motion.section>

            {/* Password Section */}
            <motion.section className={styles.section} {...fadeInUp} transition={{ delay: 0.1 }}>
              <div className={styles.sectionHeader}>
                <Lock size={24} />
                <h2>Change Password</h2>
              </div>
              <form onSubmit={handleUpdatePassword} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className={styles.input}
                    placeholder="Enter new password"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={styles.input}
                    placeholder="Confirm new password"
                  />
                </div>
                <button type="submit" disabled={saving} className={styles.saveButton}>
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </motion.section>

            {/* Notifications Section */}
            <motion.section className={styles.section} {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className={styles.sectionHeader}>
                <Bell size={24} />
                <h2>Notifications</h2>
              </div>
              <div className={styles.form}>
                <div className={styles.toggleGroup}>
                  <div className={styles.toggleInfo}>
                    <h3>Email Notifications</h3>
                    <p>Receive email updates about your snippets</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.toggleGroup}>
                  <div className={styles.toggleInfo}>
                    <h3>Weekly Digest</h3>
                    <p>Get a weekly summary of your activity</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={preferences.weeklyDigest}
                      onChange={(e) => setPreferences({ ...preferences, weeklyDigest: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </motion.section>

            {/* Plan Section */}
            <motion.section className={styles.section} {...fadeInUp} transition={{ delay: 0.3 }}>
              <div className={styles.sectionHeader}>
                <CreditCard size={24} />
                <h2>Subscription Plan</h2>
              </div>
              <div className={styles.planInfo}>
                <div className={styles.currentPlan}>
                  <h3>Free Plan</h3>
                  <p>Upgrade to unlock more features</p>
                </div>
                <button
                  onClick={() => router.push('/pricing')}
                  className={styles.upgradeButton}
                >
                  Upgrade Plan
                </button>
              </div>
            </motion.section>
          </div>
        </motion.div>
    </div>
  );
}
