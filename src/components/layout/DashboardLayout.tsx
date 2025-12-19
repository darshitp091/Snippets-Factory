'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import AnimatedBackground from '@/components/effects/AnimatedBackground';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    setLoading(false);
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  if (loading) {
    return (
      <>
        <AnimatedBackground />
        <div className={styles.loadingContainer}>
          <Sparkles size={40} className="animate-spin" />
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />

      <div className={styles.wrapper}>
        <DashboardSidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

        <div className={styles.mainContent}>
          <DashboardHeader onMenuToggle={handleSidebarToggle} />

          <motion.main
            className={styles.contentArea}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {children}
          </motion.main>
        </div>
      </div>
    </>
  );
}
