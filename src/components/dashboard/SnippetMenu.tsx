'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Trash2, Copy, Share2, FolderOpen } from 'lucide-react';
import styles from './SnippetMenu.module.css';

interface SnippetMenuProps {
  snippetId: string;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onShare: (id: string) => void;
  onMove?: (id: string) => void;
}

export default function SnippetMenu({
  snippetId,
  onDelete,
  onDuplicate,
  onShare,
  onMove,
}: SnippetMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={styles.menuButton}
        aria-label="More options"
      >
        <MoreVertical size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdown}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onDuplicate(snippetId));
              }}
              className={styles.menuItem}
            >
              <Copy size={16} />
              <span>Duplicate</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onShare(snippetId));
              }}
              className={styles.menuItem}
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>

            {onMove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMove(snippetId));
                }}
                className={styles.menuItem}
              >
                <FolderOpen size={16} />
                <span>Move to Folder</span>
              </button>
            )}

            <div className={styles.divider} />

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onDelete(snippetId));
              }}
              className={`${styles.menuItem} ${styles.danger}`}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
