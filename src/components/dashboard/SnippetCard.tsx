'use client';

import { motion } from 'framer-motion';
import { Copy, Edit, Trash2, Eye } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SnippetCardProps {
  snippet: any;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SnippetCard({ snippet, index, onEdit, onDelete }: SnippetCardProps) {
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(snippet.code);
    // Show toast notification
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="card group overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{snippet.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="px-2 py-1 bg-tech-blue/10 text-tech-blue rounded">
              {snippet.language}
            </span>
            <span className="px-2 py-1 bg-tech-purple/10 text-tech-purple rounded">
              {snippet.category}
            </span>
          </div>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={copyToClipboard}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-hover"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-hover"
            title="Edit snippet"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors cursor-hover"
            title="Delete snippet"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Code Preview */}
      <div className="mb-4 rounded-lg overflow-hidden">
        <SyntaxHighlighter
          language={snippet.language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            maxHeight: '150px',
          }}
        >
          {snippet.code}
        </SyntaxHighlighter>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {snippet.tags.map((tag: string) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs bg-gray-700/50 rounded-full text-gray-300"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>{snippet.usage_count} uses</span>
        </div>
        <span>{new Date(snippet.created_at).toLocaleDateString()}</span>
      </div>
    </motion.div>
  );
}
