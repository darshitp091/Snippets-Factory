'use client';

import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <motion.div
            className={styles.header}
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={styles.lastUpdated}>Last updated: December 14, 2024</p>
          </motion.div>

          <motion.div
            className={styles.content}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
              <p className={styles.paragraph}>
                At Snippet Factory, we collect information that you provide directly to us when you create an account,
                use our services, or communicate with us. This includes:
              </p>
              <ul className={styles.list}>
                <li>Account information (name, email address, password)</li>
                <li>Code snippets and related metadata</li>
                <li>Usage data and analytics</li>
                <li>Payment information (processed securely through third-party providers)</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
              <p className={styles.paragraph}>
                We use the information we collect to:
              </p>
              <ul className={styles.list}>
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and security alerts</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns and optimize user experience</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Data Security</h2>
              <p className={styles.paragraph}>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className={styles.list}>
                <li>End-to-end encryption for all data in transit</li>
                <li>Encryption at rest using AES-256</li>
                <li>Regular security audits and penetration testing</li>
                <li>SOC 2 Type II compliance</li>
                <li>GDPR and CCPA compliant data handling</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. Data Sharing</h2>
              <p className={styles.paragraph}>
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className={styles.list}>
                <li>With your consent or at your direction</li>
                <li>With service providers who assist in our operations</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. Your Rights</h2>
              <p className={styles.paragraph}>
                You have the right to:
              </p>
              <ul className={styles.list}>
                <li>Access, update, or delete your personal information</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
                <li>Request restriction of processing</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>6. Data Retention</h2>
              <p className={styles.paragraph}>
                We retain your information for as long as your account is active or as needed to provide services.
                You may request deletion of your data at any time by contacting our support team.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>7. Cookies and Tracking</h2>
              <p className={styles.paragraph}>
                We use cookies and similar technologies to enhance your experience, analyze usage, and personalize content.
                You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>8. International Data Transfers</h2>
              <p className={styles.paragraph}>
                Your information may be transferred to and processed in countries other than your country of residence.
                We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>9. Changes to This Policy</h2>
              <p className={styles.paragraph}>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by
                posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>10. Contact Us</h2>
              <p className={styles.paragraph}>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className={styles.contactBox}>
                <p><strong>Email:</strong> privacy@snippetfactory.com</p>
                <p><strong>Address:</strong> Snippet Factory, Inc., 123 Tech Street, San Francisco, CA 94105</p>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
