'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BarChart3, Crown, TrendingUp, ArrowRight } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div style={{ paddingTop: '24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: '1200px', margin: '0 auto' }}
      >
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#2C3E2B',
            marginBottom: '8px'
          }}>
            Analytics
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            Track usage and discover insights about your snippets
          </p>
        </div>

        {/* Pro Feature Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 249, 246, 0.9))',
            backdropFilter: 'blur(30px)',
            border: '2px solid rgba(88, 129, 87, 0.3)',
            borderRadius: '24px',
            padding: '80px 60px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(88, 129, 87, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Pro Badge */}
          <div style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #588157 0%, #3A5A40 100%)',
            color: '#FAF9F6',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(88, 129, 87, 0.3)'
          }}>
            <Crown size={16} />
            PRO FEATURE
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            background: 'linear-gradient(135deg, #588157 0%, #3A5A40 100%)',
            borderRadius: '24px',
            marginBottom: '32px',
            boxShadow: '0 12px 40px rgba(88, 129, 87, 0.3)'
          }}>
            <BarChart3 size={60} color="#FAF9F6" />
          </div>

          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#2C3E2B',
            marginBottom: '16px'
          }}>
            Unlock Advanced Analytics
          </h2>

          <p style={{
            fontSize: '1.1rem',
            color: '#666',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}>
            Get deep insights into your snippet usage, performance metrics, and team activity with Pro or Enterprise plans.
          </p>

          {/* Features Grid */}
          <div style={{
            marginBottom: '40px',
            padding: '32px',
            background: 'rgba(88, 129, 87, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(88, 129, 87, 0.15)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#2C3E2B',
              marginBottom: '24px'
            }}>
              What You'll Get
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              textAlign: 'left'
            }}>
              {[
                {
                  title: 'Usage Tracking',
                  description: 'See how often each snippet is used'
                },
                {
                  title: 'Performance Metrics',
                  description: 'Track copy rates and engagement'
                },
                {
                  title: 'Team Activity',
                  description: 'Monitor team member contributions'
                },
                {
                  title: 'Trend Analysis',
                  description: 'Identify popular snippets over time'
                },
                {
                  title: 'Custom Reports',
                  description: 'Generate detailed analytics reports'
                },
                {
                  title: 'Export Data',
                  description: 'Export analytics to CSV/JSON'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '12px',
                    border: '1px solid rgba(163, 177, 138, 0.2)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <TrendingUp size={20} color="#588157" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#2C3E2B',
                        marginBottom: '4px'
                      }}>
                        {feature.title}
                      </h4>
                      <p style={{
                        fontSize: '0.9rem',
                        color: '#666'
                      }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/pricing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #588157 0%, #3A5A40 100%)',
              color: '#FAF9F6',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '1.05rem',
              fontWeight: '600',
              boxShadow: '0 6px 24px rgba(88, 129, 87, 0.35)',
              transition: 'all 0.3s ease'
            }}
          >
            <Crown size={20} />
            Upgrade to Pro
            <ArrowRight size={20} />
          </Link>

          <p style={{
            marginTop: '20px',
            fontSize: '0.9rem',
            color: '#999'
          }}>
            Starting at $12/month • Cancel anytime
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
