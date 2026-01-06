'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Code2, Zap, Shield, Users, Database, GitBranch, ArrowRight, CheckCircle2, Cloud, Terminal, FileCode, Workflow, BarChart3, Bell } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnimatedBackground from '@/components/effects/AnimatedBackground';

export default function FeaturesPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const coreFeatures = [
    {
      icon: <Code2 size={32} />,
      title: 'Smart Organization',
      description: 'AI-powered categorization automatically organizes your snippets with intelligent tagging and classification.',
      details: [
        'Automatic language detection',
        'Smart category suggestions',
        'Custom tags and labels',
        'Hierarchical folder structure'
      ]
    },
    {
      icon: <Zap size={32} />,
      title: 'Instant Search',
      description: 'Find any snippet in milliseconds with fuzzy search, filters, and natural language processing.',
      details: [
        'Full-text search',
        'Regex pattern matching',
        'Multi-language support',
        'Search by tags, language, or date'
      ]
    },
    {
      icon: <Users size={32} />,
      title: 'Team Collaboration',
      description: 'Share snippets across teams with role-based access control and real-time synchronization.',
      details: [
        'Real-time collaboration',
        'Role-based permissions',
        'Team workspaces',
        'Activity tracking'
      ]
    },
    {
      icon: <Shield size={32} />,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, SOC 2 compliance, and comprehensive audit logging for peace of mind.',
      details: [
        'End-to-end encryption',
        'SOC 2 Type II certified',
        'GDPR compliant',
        'Complete audit logs'
      ]
    },
    {
      icon: <Database size={32} />,
      title: 'Unlimited Storage',
      description: 'Store unlimited snippets with automatic backups and version control.',
      details: [
        'Unlimited snippet storage',
        'Automatic daily backups',
        'Version history tracking',
        'Export to multiple formats'
      ]
    },
    {
      icon: <GitBranch size={32} />,
      title: 'Version Control',
      description: 'Track every change with complete version history and side-by-side diff viewing.',
      details: [
        'Automatic versioning',
        'Diff viewer',
        'Rollback capability',
        'Change annotations'
      ]
    }
  ];

  const advancedFeatures = [
    {
      icon: <Terminal size={28} />,
      title: 'CLI Integration',
      description: 'Access your snippets directly from the terminal with powerful commands'
    },
    {
      icon: <Cloud size={28} />,
      title: 'Cloud Sync',
      description: 'Seamless synchronization across all your devices in real-time'
    },
    {
      icon: <FileCode size={28} />,
      title: 'Code Highlighting',
      description: 'Beautiful syntax highlighting for 100+ programming languages'
    },
    {
      icon: <Workflow size={28} />,
      title: 'Public API',
      description: 'RESTful API with rate limiting for custom integrations (Pro+)'
    },
    {
      icon: <Zap size={28} />,
      title: 'AI Code Generation',
      description: 'Generate code snippets with AI assistance (Pro: 100/mo, Enterprise: unlimited)'
    },
    {
      icon: <BarChart3 size={28} />,
      title: 'Usage Analytics',
      description: 'Track snippet usage and discover valuable insights (Pro+)'
    },
    {
      icon: <Code2 size={28} />,
      title: 'Coins & Awards',
      description: 'Reddit-style awards to recognize great code (Silver, Gold, Platinum)'
    },
    {
      icon: <Bell size={28} />,
      title: 'Ad-Free Experience',
      description: 'Enjoy distraction-free coding (Basic, Pro, Enterprise)'
    },
    {
      icon: <Shield size={28} />,
      title: 'Subscription Automation',
      description: 'Automatic expiry management and billing with Razorpay integration'
    }
  ];

  const integrations = [
    { name: 'VS Code', logo: '📝' },
    { name: 'GitHub', logo: '🐙' },
    { name: 'GitLab', logo: '🦊' },
    { name: 'Slack', logo: '💬' },
    { name: 'Discord', logo: '🎮' },
    { name: 'Notion', logo: '📄' }
  ];

  return (
    <>
      <AnimatedBackground />
      <Header />

      <main style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '60px' }}>
        {/* Hero Section */}
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', marginBottom: '100px' }}>
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            style={{ textAlign: 'center' }}
          >
            <motion.div
              variants={fadeInUp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                background: 'rgba(88, 129, 87, 0.1)',
                border: '1px solid rgba(88, 129, 87, 0.3)',
                borderRadius: '30px',
                marginBottom: '24px'
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                background: '#588157',
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              <span style={{ color: '#588157', fontSize: '14px', fontWeight: '500' }}>
                Powerful Features
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: '700',
                lineHeight: '1.2',
                marginBottom: '24px',
                color: '#2C3E2B'
              }}
            >
              Everything you need to
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #588157 0%, #D4A373 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                manage your code
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              style={{
                fontSize: '1.25rem',
                color: '#666',
                maxWidth: '700px',
                margin: '0 auto 40px',
                lineHeight: '1.6'
              }}
            >
              Discover powerful features designed to boost your productivity and
              streamline your development workflow.
            </motion.p>

            <motion.div variants={fadeInUp}>
              <Link
                href="/signup"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #588157 0%, #3d5a3c 100%)',
                  color: '#FAF9F6',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(88, 129, 87, 0.3)'
                }}
              >
                Start Free Trial
                <ArrowRight size={20} />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Core Features Section */}
        <section style={{ maxWidth: '1200px', margin: '0 auto 120px', padding: '0 24px' }}>
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px'
            }}>
              {coreFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60, scale: 0.9, rotateY: -15 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.7,
                    delay: index * 0.15,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  whileHover={{
                    y: -12,
                    scale: 1.03,
                    rotateY: 5,
                    rotateX: 5,
                    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(250, 249, 246, 0.95), rgba(237, 233, 224, 0.8))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(88, 129, 87, 0.25)',
                    borderRadius: '20px',
                    padding: '36px',
                    position: 'relative',
                    overflow: 'hidden',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(88, 129, 87, 0.1)',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  onHoverStart={() => {}}
                  onHoverEnd={() => {}}
                >
                  <div style={{
                    content: '',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 50% 0%, rgba(163, 177, 138, 0.2), transparent 70%)',
                    opacity: 0,
                    transition: 'opacity 0.4s ease',
                    pointerEvents: 'none',
                    zIndex: 0
                  }} className="card-overlay" />

                  <motion.div
                    initial={{ scale: 0.8, rotate: -20 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.15 + 0.2,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    whileHover={{
                      scale: 1.15,
                      rotate: 10,
                      transition: { duration: 0.3 }
                    }}
                    style={{
                      width: '72px',
                      height: '72px',
                      background: 'linear-gradient(135deg, #588157 0%, #3A5A40 100%)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FAF9F6',
                      marginBottom: '24px',
                      boxShadow: '0 6px 20px rgba(88, 129, 87, 0.3)',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#2C3E2B',
                    marginBottom: '12px',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'color 0.3s ease'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    color: '#666',
                    marginBottom: '20px',
                    lineHeight: '1.6',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {feature.description}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, position: 'relative', zIndex: 1 }}>
                    {feature.details.map((detail, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.15 + 0.3 + (idx * 0.1) }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '10px',
                          color: '#666',
                          fontSize: '0.95rem'
                        }}
                      >
                        <CheckCircle2 size={18} style={{ color: '#588157', flexShrink: 0 }} />
                        {detail}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Advanced Features Grid */}
        <section style={{
          maxWidth: '1200px',
          margin: '0 auto 120px',
          padding: '0 24px'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '60px' }}
          >
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              color: '#2C3E2B',
              marginBottom: '16px'
            }}>
              Advanced Capabilities
            </h2>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>
              Professional tools for professional developers
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '28px'
            }}
          >
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={{
                  scale: 1.05,
                  y: -8,
                  transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
                }}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(250, 249, 246, 0.7))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(88, 129, 87, 0.2)',
                  borderRadius: '16px',
                  padding: '28px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(88, 129, 87, 0.08)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 50% 0%, rgba(163, 177, 138, 0.15), transparent 60%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'none'
                }} className="advanced-overlay" />

                <motion.div
                  initial={{ scale: 0.8, rotate: -15 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1 + 0.15,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                  whileHover={{
                    scale: 1.15,
                    rotate: 8,
                    transition: { duration: 0.25 }
                  }}
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, rgba(88, 129, 87, 0.15), rgba(163, 177, 138, 0.1))',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#588157',
                    margin: '0 auto 20px',
                    boxShadow: '0 4px 12px rgba(88, 129, 87, 0.15)',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {feature.icon}
                </motion.div>
                <h4 style={{
                  fontSize: '1.15rem',
                  fontWeight: '600',
                  color: '#2C3E2B',
                  marginBottom: '10px',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'color 0.3s ease'
                }}>
                  {feature.title}
                </h4>
                <p style={{
                  color: '#666',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Integrations Section */}
        <section style={{
          maxWidth: '1200px',
          margin: '0 auto 80px',
          padding: '60px 24px',
          background: 'rgba(88, 129, 87, 0.05)',
          borderRadius: '24px',
          textAlign: 'center'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              color: '#2C3E2B',
              marginBottom: '16px'
            }}>
              Integrates with your tools
            </h2>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '48px' }}>
              Connect with the tools you already use every day
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '24px',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {integrations.map((integration, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(88, 129, 87, 0.2)',
                    borderRadius: '12px',
                    padding: '24px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#2C3E2B',
                    minWidth: '140px'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{integration.logo}</span>
                  {integration.name}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              background: 'linear-gradient(135deg, #588157 0%, #3d5a3c 100%)',
              borderRadius: '24px',
              padding: '60px 40px',
              textAlign: 'center',
              color: '#FAF9F6'
            }}
          >
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              marginBottom: '16px',
              color: '#FAF9F6'
            }}>
              Ready to get started?
            </h2>
            <p style={{
              fontSize: '1.2rem',
              marginBottom: '32px',
              color: 'rgba(250, 249, 246, 0.95)',
              fontWeight: '500'
            }}>
              Join thousands of developers using Snippet Factory
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/signup"
                style={{
                  padding: '16px 32px',
                  background: '#FAF9F6',
                  color: '#2C3E2B',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                }}
              >
                Get Started Free
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/pricing"
                style={{
                  padding: '16px 32px',
                  background: 'transparent',
                  color: '#FAF9F6',
                  border: '2px solid #FAF9F6',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
