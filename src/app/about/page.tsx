'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Target, AlertCircle, Lightbulb, ArrowRight, Code2, Users, Zap, Shield } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnimatedBackground from '@/components/effects/AnimatedBackground';

export default function AboutPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const problems = [
    {
      icon: <AlertCircle size={28} />,
      title: 'Scattered Code Knowledge',
      description: 'Developers waste hours searching through old projects, Slack messages, and outdated wikis trying to find that one snippet they wrote months ago.'
    },
    {
      icon: <AlertCircle size={28} />,
      title: 'Reinventing the Wheel',
      description: 'Teams repeatedly solve the same problems because there\'s no central repository of proven solutions, leading to inconsistent code quality.'
    },
    {
      icon: <AlertCircle size={28} />,
      title: 'Slow Onboarding',
      description: 'New developers struggle to learn team patterns and best practices, spending weeks to understand what could be documented in reusable snippets.'
    },
    {
      icon: <AlertCircle size={28} />,
      title: 'Lost Productivity',
      description: 'Context switching between tools and searching for code fragments disrupts focus and wastes valuable development time.'
    }
  ];

  const solutions = [
    {
      icon: <Code2 size={28} />,
      title: 'Centralized Knowledge',
      description: 'All your team\'s code snippets, patterns, and solutions in one searchable, organized platform.'
    },
    {
      icon: <Zap size={28} />,
      title: 'Instant Discovery',
      description: 'Find any snippet in milliseconds with AI-powered search and intelligent categorization.'
    },
    {
      icon: <Users size={28} />,
      title: 'Team Collaboration',
      description: 'Share knowledge seamlessly across teams with role-based access and real-time sync.'
    },
    {
      icon: <Shield size={28} />,
      title: 'Enterprise Ready',
      description: 'Built with security, compliance, and scalability for teams of all sizes.'
    }
  ];

  const values = [
    {
      title: 'Developer First',
      description: 'Built by developers, for developers. Every feature is designed to solve real development challenges.'
    },
    {
      title: 'Speed & Simplicity',
      description: 'Get started in seconds. No complex setup, no learning curve—just instant productivity.'
    },
    {
      title: 'Security & Privacy',
      description: 'Your code is yours. Enterprise-grade security with SOC 2 compliance and complete data control.'
    },
    {
      title: 'Continuous Innovation',
      description: 'We\'re constantly evolving based on developer feedback to build the best snippet management platform.'
    }
  ];

  return (
    <>
      <AnimatedBackground />
      <Header />

      <main style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '60px' }}>
        {/* Hero Section */}
        <section style={{ maxWidth: '1200px', margin: '0 auto 100px', padding: '0 24px' }}>
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
                borderRadius: '50%'
              }} />
              <span style={{ color: '#588157', fontSize: '14px', fontWeight: '500' }}>
                About Snippet Factory
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
              Empowering developers to
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #588157 0%, #D4A373 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                code smarter
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              style={{
                fontSize: '1.25rem',
                color: '#666',
                maxWidth: '800px',
                margin: '0 auto',
                lineHeight: '1.6'
              }}
            >
              Snippet Factory was built to solve a problem every developer faces: managing and sharing code snippets efficiently. We believe developers should spend time building, not searching.
            </motion.p>
          </motion.div>
        </section>

        {/* Mission Section */}
        <section style={{ maxWidth: '1200px', margin: '0 auto 100px', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{
              background: 'linear-gradient(135deg, #588157 0%, #3d5a3c 100%)',
              borderRadius: '24px',
              padding: '60px 48px',
              textAlign: 'center',
              color: '#FAF9F6'
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(250, 249, 246, 0.2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Target size={40} />
            </div>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              marginBottom: '20px'
            }}>
              Our Mission
            </h2>
            <p style={{
              fontSize: '1.3rem',
              lineHeight: '1.7',
              maxWidth: '900px',
              margin: '0 auto',
              color: '#FAF9F6'
            }}>
              To eliminate the friction in code knowledge management by providing developers with a fast, secure, and collaborative platform where their best code is always at their fingertips.
            </p>
          </motion.div>
        </section>

        {/* The Problem Section */}
        <section style={{ maxWidth: '1400px', margin: '0 auto 100px', padding: '0 24px' }}>
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
              The Problem We Solve
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              Developers face real challenges that slow down their productivity every single day
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px'
            }}
          >
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(212, 163, 115, 0.3)',
                  borderLeft: '4px solid #D4A373',
                  borderRadius: '16px',
                  padding: '32px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'rgba(212, 163, 115, 0.15)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D4A373',
                  marginBottom: '20px'
                }}>
                  {problem.icon}
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#2C3E2B',
                  marginBottom: '12px'
                }}>
                  {problem.title}
                </h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* The Solution Section */}
        <section style={{ maxWidth: '1400px', margin: '0 auto 100px', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '60px' }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #588157 0%, #D4A373 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FAF9F6',
              margin: '0 auto 24px'
            }}>
              <Lightbulb size={32} />
            </div>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              color: '#2C3E2B',
              marginBottom: '16px'
            }}>
              Our Solution
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              A modern platform designed from the ground up to make code management effortless
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px'
            }}
          >
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(88, 129, 87, 0.2)',
                  borderRadius: '16px',
                  padding: '32px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #588157 0%, #D4A373 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FAF9F6',
                  marginBottom: '20px'
                }}>
                  {solution.icon}
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#2C3E2B',
                  marginBottom: '12px'
                }}>
                  {solution.title}
                </h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  {solution.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Our Values Section */}
        <section style={{ maxWidth: '1200px', margin: '0 auto 100px', padding: '0 24px' }}>
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
              What We Stand For
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              Our core principles guide everything we build
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '32px'
            }}
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                style={{
                  textAlign: 'center',
                  padding: '24px'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  background: 'linear-gradient(135deg, #588157 0%, #D4A373 100%)',
                  borderRadius: '50%',
                  margin: '0 auto 20px'
                }} />
                <h3 style={{
                  fontSize: '1.4rem',
                  fontWeight: '600',
                  color: '#2C3E2B',
                  marginBottom: '12px'
                }}>
                  {value.title}
                </h3>
                <p style={{
                  color: '#666',
                  lineHeight: '1.6',
                  fontSize: '1rem'
                }}>
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA Section */}
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(88, 129, 87, 0.3)',
              borderRadius: '24px',
              padding: '60px 40px',
              textAlign: 'center'
            }}
          >
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              color: '#2C3E2B',
              marginBottom: '16px'
            }}>
              Join us on our mission
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              marginBottom: '32px',
              maxWidth: '600px',
              margin: '0 auto 32px'
            }}>
              Help us build the future of code knowledge management
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/signup"
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #588157 0%, #3d5a3c 100%)',
                  color: '#FAF9F6',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(88, 129, 87, 0.3)'
                }}
              >
                Get Started Free
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/contact"
                style={{
                  padding: '16px 32px',
                  background: 'transparent',
                  color: '#588157',
                  border: '2px solid #588157',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
