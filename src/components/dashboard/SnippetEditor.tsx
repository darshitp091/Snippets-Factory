'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Code2, Tag, FolderOpen } from 'lucide-react';

interface SnippetEditorProps {
  snippet?: any;
  onClose: () => void;
  onSave: (snippet: any) => void;
}

export default function SnippetEditor({ snippet, onClose, onSave }: SnippetEditorProps) {
  const [formData, setFormData] = useState({
    title: snippet?.title || '',
    code: snippet?.code || '',
    language: snippet?.language || 'javascript',
    category: snippet?.category || '',
    tags: snippet?.tags?.join(', ') || '',
    description: snippet?.description || '',
    placeholders: snippet?.placeholders || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur p-6 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-tech-blue to-tech-purple bg-clip-text text-transparent">
              {snippet ? 'Edit Snippet' : 'Create New Snippet'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-hover"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/20 transition-all cursor-text"
                placeholder="Enter snippet title..."
              />
            </div>

            {/* Language and Category */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Language *
                </label>
                <select
                  required
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/20 transition-all cursor-pointer"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="jsx">JSX</option>
                  <option value="tsx">TSX</option>
                  <option value="css">CSS</option>
                  <option value="html">HTML</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="sql">SQL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/20 transition-all cursor-text"
                  placeholder="e.g., React, Utils, API"
                />
              </div>
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Code *
              </label>
              <textarea
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                rows={12}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/20 transition-all font-mono text-sm cursor-text"
                placeholder="Paste your code here..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/20 transition-all cursor-text"
                placeholder="react, hooks, async, api"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/20 transition-all cursor-text"
                placeholder="Optional description..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors cursor-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Snippet
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
