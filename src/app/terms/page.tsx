'use client';

import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './terms.module.css';

export default function TermsPage() {
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
            <h1 className={styles.title}>Terms of Service</h1>
            <p className={styles.lastUpdated}>Last updated: December 14, 2024</p>
          </motion.div>

          <motion.div
            className={styles.content}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
              <p className={styles.paragraph}>
                By accessing and using Snippet Factory ("Service"), you accept and agree to be bound by the terms
                and provisions of this agreement. If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. Use License</h2>
              <p className={styles.paragraph}>
                Permission is granted to temporarily use Snippet Factory for personal or commercial purposes,
                subject to the restrictions in these Terms of Service:
              </p>
              <ul className={styles.list}>
                <li>You must not modify or copy the Service materials</li>
                <li>You must not use the materials for any commercial purpose without a paid subscription</li>
                <li>You must not attempt to reverse engineer any software contained in the Service</li>
                <li>You must not remove any copyright or proprietary notations</li>
                <li>You must not transfer the materials to another person or mirror on another server</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. User Accounts</h2>
              <p className={styles.paragraph}>
                When you create an account with us, you must provide accurate, complete, and current information.
                Failure to do so constitutes a breach of the Terms.
              </p>
              <ul className={styles.list}>
                <li>You are responsible for safeguarding your password</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>You are solely responsible for all activities under your account</li>
                <li>We reserve the right to refuse service or terminate accounts</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. Subscriptions and Billing</h2>
              <p className={styles.paragraph}>
                Some parts of the Service are billed on a subscription basis ("Subscription(s)").
              </p>
              <ul className={styles.list}>
                <li>You will be billed in advance on a recurring and periodic basis (monthly, annually)</li>
                <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                <li>Refunds are provided within 14 days of initial purchase for new subscribers</li>
                <li>We reserve the right to modify subscription fees with 30 days notice</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. Acceptable Use Policy</h2>
              <p className={styles.paragraph}>
                You agree not to use the Service to:
              </p>
              <ul className={styles.list}>
                <li>Upload, post, or transmit any unlawful, harmful, or objectionable content</li>
                <li>Violate any applicable local, state, national, or international law</li>
                <li>Infringe upon or violate our intellectual property rights or the rights of others</li>
                <li>Harass, abuse, or harm another person</li>
                <li>Transmit any viruses, malware, or other malicious code</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>6. Intellectual Property</h2>
              <p className={styles.paragraph}>
                The Service and its original content (excluding user-generated content), features, and functionality
                are and will remain the exclusive property of Snippet Factory.
              </p>
              <p className={styles.paragraph}>
                Your code snippets remain your property. By uploading content, you grant us a license to use, modify,
                and display your content solely for the purpose of providing the Service.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>7. Termination</h2>
              <p className={styles.paragraph}>
                We may terminate or suspend your account immediately, without prior notice, for any reason,
                including but not limited to:
              </p>
              <ul className={styles.list}>
                <li>Breach of these Terms of Service</li>
                <li>Request by law enforcement or government agencies</li>
                <li>Unexpected technical issues or problems</li>
                <li>Extended periods of inactivity</li>
                <li>Engagement in fraudulent or illegal activities</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>8. Limitation of Liability</h2>
              <p className={styles.paragraph}>
                In no event shall Snippet Factory, nor its directors, employees, partners, or agents, be liable
                for any indirect, incidental, special, consequential, or punitive damages, including without
                limitation, loss of profits, data, use, or goodwill, arising out of your use of the Service.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>9. Disclaimer of Warranties</h2>
              <p className={styles.paragraph}>
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed
                or implied, regarding:
              </p>
              <ul className={styles.list}>
                <li>The Service will be uninterrupted, secure, or error-free</li>
                <li>The results obtained from the use of the Service will be accurate or reliable</li>
                <li>The quality of any products, services, or information obtained through the Service</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>10. Service Level Agreement (SLA)</h2>
              <p className={styles.paragraph}>
                For Enterprise customers, we commit to:
              </p>
              <ul className={styles.list}>
                <li>99.9% uptime guarantee</li>
                <li>24/7 priority support</li>
                <li>Guaranteed response times based on severity level</li>
                <li>Service credits for downtime exceeding SLA commitments</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>11. Changes to Terms</h2>
              <p className={styles.paragraph}>
                We reserve the right to modify or replace these Terms at any time. We will provide notice of
                material changes at least 30 days prior to any new terms taking effect. Your continued use of
                the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>12. Governing Law</h2>
              <p className={styles.paragraph}>
                These Terms shall be governed by and construed in accordance with the laws of the State of California,
                United States, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>13. Contact Information</h2>
              <p className={styles.paragraph}>
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className={styles.contactBox}>
                <p><strong>Email:</strong> legal@snippetfactory.com</p>
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
