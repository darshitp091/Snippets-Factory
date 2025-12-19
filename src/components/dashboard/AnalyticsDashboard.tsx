'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AnalyticsDashboard() {
  // Mock analytics data
  const usageData = [
    { date: 'Mon', count: 12 },
    { date: 'Tue', count: 19 },
    { date: 'Wed', count: 15 },
    { date: 'Thu', count: 25 },
    { date: 'Fri', count: 22 },
    { date: 'Sat', count: 8 },
    { date: 'Sun', count: 10 },
  ];

  const topSnippets = [
    { name: 'React Hook Form', uses: 45 },
    { name: 'Tailwind Button', uses: 32 },
    { name: 'Async Fetch', uses: 28 },
    { name: 'JWT Auth', uses: 24 },
    { name: 'Error Handler', uses: 20 },
  ];

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="space-y-8"
    >
      <h2 className="text-3xl font-bold bg-gradient-to-r from-tech-blue to-tech-purple bg-clip-text text-transparent">
        Analytics
      </h2>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Usage Over Time */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-6">Weekly Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#00d4ff"
                strokeWidth={2}
                dot={{ fill: '#00d4ff', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Snippets */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-6">Most Used Snippets</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topSnippets} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="uses" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
