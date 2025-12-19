'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Search...'}
        className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/20 transition-all cursor-text"
      />
    </div>
  );
}
