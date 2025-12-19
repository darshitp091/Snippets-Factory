'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Code2,
  BarChart3,
  Settings,
  Users,
  LogOut,
  Crown,
  Lock,
  User,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePlanAccess } from '@/lib/plans';
import UsageCounter from '@/components/ui/UsageCounter';
import styles from './DashboardSidebar.module.css';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'enterprise'>('free');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);

      // Fetch user plan from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('plan')
        .eq('id', session.user.id)
        .single();

      if (!error && userData) {
        setUserPlan(userData.plan as 'free' | 'pro' | 'enterprise');
      } else {
        // Fallback to free if fetch fails
        setUserPlan('free');
      }
    }
  };

  const planAccess = usePlanAccess(userPlan);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      requiresPlan: null,
    },
    {
      name: 'My Snippets',
      href: '/snippets',
      icon: Code2,
      requiresPlan: null,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      requiresPlan: 'pro' as const,
    },
    {
      name: 'Team',
      href: '/team',
      icon: Users,
      requiresPlan: 'pro' as const,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      requiresPlan: null,
    },
  ];

  const planBadgeConfig = {
    free: { label: 'Free', color: '#999' },
    pro: { label: 'Pro', color: '#588157' },
    enterprise: { label: 'Enterprise', color: '#3A5A40' },
  };

  const currentPlan = planBadgeConfig[userPlan];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <Link href="/dashboard" onClick={onClose}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>Snippet Factory</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const isLocked = item.requiresPlan && !planAccess.hasFeature('analytics');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={isLocked ? '#' : item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${
                  isLocked ? styles.navItemLocked : ''
                }`}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                  } else {
                    onClose();
                  }
                }}
              >
                <Icon size={20} />
                <span>{item.name}</span>
                {isLocked && <Lock size={16} className={styles.lockIcon} />}
              </Link>
            );
          })}
        </nav>

        {/* Usage Counter */}
        <div className={styles.usageSection}>
          <UsageCounter />
        </div>

        {/* User Section */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              <User size={20} />
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <div className={styles.planBadge} style={{ background: currentPlan.color }}>
                {currentPlan.label}
              </div>
            </div>
          </div>

          {userPlan === 'free' && (
            <Link href="/pricing" className={styles.upgradeButton}>
              <Crown size={16} />
              Upgrade to Pro
            </Link>
          )}

          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
