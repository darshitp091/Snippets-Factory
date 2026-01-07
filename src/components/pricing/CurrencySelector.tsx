'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { SUPPORTED_CURRENCIES, Currency } from '@/lib/currencyConverter';
import styles from './CurrencySelector.module.css';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currencyCode: string) => void;
}

export default function CurrencySelector({ selectedCurrency, onCurrencyChange }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCurrencyData = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencySelect = (currencyCode: string) => {
    onCurrencyChange(currencyCode);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.selectedCurrency}>
          <span className={styles.currencySymbol}>{selectedCurrencyData?.symbol}</span>
          <span className={styles.currencyCode}>{selectedCurrencyData?.code}</span>
        </span>
        <ChevronDown
          size={16}
          className={styles.chevron}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdown}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            role="listbox"
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencySelect(currency.code)}
                className={`${styles.option} ${selectedCurrency === currency.code ? styles.selected : ''}`}
                role="option"
                aria-selected={selectedCurrency === currency.code}
              >
                <div className={styles.optionContent}>
                  <span className={styles.optionSymbol}>{currency.symbol}</span>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionCode}>{currency.code}</span>
                    <span className={styles.optionName}>{currency.name}</span>
                  </div>
                </div>
                {selectedCurrency === currency.code && (
                  <Check size={16} className={styles.checkIcon} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
