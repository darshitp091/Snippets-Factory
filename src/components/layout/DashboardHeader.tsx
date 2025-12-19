'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, User, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  onMenuToggle: () => void;
}

export default function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <motion.header
      className={styles.header}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.container}>
        {/* Left Section: Menu Toggle (Mobile) */}
        <button className={styles.menuButton} onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={24} />
        </button>

        {/* Center Section: Search Bar */}
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <kbd className={styles.searchKbd}>⌘K</kbd>
        </div>

        {/* Right Section: Notifications & User Menu */}
        <div className={styles.actions}>
          {/* Notifications */}
          <button className={styles.iconButton} aria-label="Notifications">
            <Bell size={20} />
            <span className={styles.notificationBadge}>3</span>
          </button>

          {/* User Menu */}
          {user && (
            <div className={styles.userMenuWrapper}>
              <motion.button
                className={styles.userButton}
                onClick={() => setShowUserMenu(!showUserMenu)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className={styles.userAvatar}>
                  <User size={16} />
                </div>
                <span className={styles.userName}>
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </span>
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <motion.div
                      className={styles.menuOverlay}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowUserMenu(false)}
                    />
                    <motion.div
                      className={styles.userMenu}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Link
                        href="/dashboard"
                        className={styles.menuItem}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <LayoutDashboard size={18} />
                        Dashboard
                      </Link>
                      <Link
                        href="/settings"
                        className={styles.menuItem}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={18} />
                        Settings
                      </Link>
                      <div className={styles.menuDivider} />
                      <button className={styles.menuItem} onClick={handleLogout}>
                        <LogOut size={18} />
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
