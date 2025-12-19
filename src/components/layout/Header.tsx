'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { User, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './Header.module.css';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

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
    window.location.href = '/';
  };

  return (
    <motion.header
      className={styles.header}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>Snippet Factory</span>
          </motion.div>
        </Link>

        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/features" className={styles.navLink}>
            Features
          </Link>
          <Link href="/pricing" className={styles.navLink}>
            Pricing
          </Link>
          <Link href="/about" className={styles.navLink}>
            About
          </Link>
          <Link href="/contact" className={styles.navLink}>
            Contact Us
          </Link>
        </nav>

        <div className={styles.actions}>
          {user ? (
            <div className={styles.userMenuWrapper}>
              <motion.button
                className={styles.userMenuButton}
                onClick={() => setShowMenu(!showMenu)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={styles.userAvatar}>
                  <User size={18} />
                </div>
                <span className={styles.userName}>
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </span>
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <motion.div
                      className={styles.menuOverlay}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      className={styles.userMenu}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link href="/dashboard" className={styles.menuItem} onClick={() => setShowMenu(false)}>
                        <LayoutDashboard size={18} />
                        Dashboard
                      </Link>
                      <Link href="/settings" className={styles.menuItem} onClick={() => setShowMenu(false)}>
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
          ) : (
            <>
              <Link href="/login" className={styles.loginBtn}>
                Sign In
              </Link>
              <Link href="/signup" className={styles.signupBtn}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
