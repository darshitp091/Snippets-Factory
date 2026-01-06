'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Code2, Zap, Shield, Users, Search, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SplineScene from '@/components/3d/SplineScene';
import AnimatedBackground from '@/components/effects/AnimatedBackground';
import styles from './page.module.css';

export default function HomePage() {
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

  const features = [
    {
      icon: <Code2 size={28} />,
      title: 'Smart Organization',
      description: 'AI-powered categorization keeps your snippets perfectly organized without manual tagging.'
    },
    {
      icon: <Zap size={28} />,
      title: 'AI Code Generation',
      description: 'Generate code snippets with AI assistance. Pro: 100/mo, Enterprise: unlimited.'
    },
    {
      icon: <Users size={28} />,
      title: 'Team Collaboration',
      description: 'Share across teams with role-based access and real-time synchronization. Pro: 5 members, Enterprise: unlimited.'
    },
    {
      icon: <Shield size={28} />,
      title: 'Coins & Awards',
      description: 'Reddit-style virtual currency to recognize great code. Give Silver, Gold, or Platinum awards!'
    },
    {
      icon: <Search size={28} />,
      title: 'Usage Analytics',
      description: 'Track snippet usage and discover valuable insights. Available on Pro and Enterprise plans.'
    },
    {
      icon: <Lock size={28} />,
      title: 'Public API Access',
      description: 'RESTful API with authentication and rate limiting. Pro: 1,000 calls/mo, Enterprise: unlimited.'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Developers' },
    { value: '2M+', label: 'Code Snippets' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '<50ms', label: 'Search Speed' }
  ];

  const benefits = [
    'Save 10+ hours per week searching for code',
    'Reduce code duplication by 80%',
    'Onboard new developers 3x faster',
    'Share knowledge seamlessly across teams'
  ];

  return (
    <>
      <AnimatedBackground />
      <Header />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContainer}>
            <motion.div
              className={styles.heroContent}
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className={styles.badge}>
                <span className={styles.badgeDot} />
                Professional Code Management
              </motion.div>

              <motion.h1 variants={fadeInUp} className={styles.heroTitle}>
                Your code library,
                <br />
                <span className={styles.highlight}>reimagined.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className={styles.heroSubtitle}>
                The modern platform for managing, sharing, and discovering code snippets.
                Built for developers who value quality and efficiency.
              </motion.p>

              <motion.div variants={fadeInUp} className={styles.heroButtons}>
                <Link href="/signup" className={styles.primaryBtn}>
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <Link href="/demo" className={styles.secondaryBtn}>
                  Watch Demo
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp} className={styles.socialProof}>
                <div className={styles.avatars}>
                  <div className={styles.avatar} />
                  <div className={styles.avatar} />
                  <div className={styles.avatar} />
                  <div className={styles.avatar} />
                </div>
                <p className={styles.socialText}>
                  Trusted by <strong>50,000+</strong> developers worldwide
                </p>
              </motion.div>
            </motion.div>

            {/* 3D Spline Scene */}
            <motion.div
              className={styles.sceneContainer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <SplineScene />
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <motion.div
            className={styles.statsGrid}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInUp} className={styles.statCard}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <div className={styles.container}>
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className={styles.sectionTitle}>Everything you need</h2>
              <p className={styles.sectionSubtitle}>
                Powerful features designed for professional developers and teams
              </p>
            </motion.div>

            <motion.div
              className={styles.featuresGrid}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className={styles.featureCard}
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  <motion.div
                    className={styles.featureIcon}
                    initial={{ scale: 0.8, rotate: -10 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1 + 0.2,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className={styles.benefitsSection}>
          <div className={styles.container}>
            <motion.div
              className={styles.benefitsContent}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className={styles.benefitsLeft}>
                <h2 className={styles.benefitsTitle}>
                  Built for developer
                  <br />
                  productivity
                </h2>
                <p className={styles.benefitsText}>
                  Stop wasting time searching through scattered code files, outdated wikis,
                  and Slack messages. Snippet Factory centralizes your team's knowledge.
                </p>
                <Link href="/features" className={styles.learnMoreBtn}>
                  Learn more about features
                  <ArrowRight size={18} />
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp} className={styles.benefitsRight}>
                {benefits.map((benefit, index) => (
                  <div key={index} className={styles.benefitItem}>
                    <CheckCircle2 size={24} className={styles.checkIcon} />
                    <span>{benefit}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <motion.div
            className={styles.ctaCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className={styles.ctaTitle}>
              Ready to transform your workflow?
            </h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of developers using Snippet Factory to code smarter, not harder.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/signup" className={styles.primaryBtn}>
                Get Started Free
                <ArrowRight size={20} />
              </Link>
              <Link href="/pricing" className={styles.secondaryBtn}>
                View Pricing
              </Link>
            </div>
            <div className={styles.ctaFooter}>
              <span className={styles.ctaBadge}>No credit card required</span>
              <span className={styles.ctaBadge}>14-day free trial</span>
              <span className={styles.ctaBadge}>Cancel anytime</span>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
