'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, MessageSquare, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnimatedBackground from '@/components/effects/AnimatedBackground';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual form submission
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', company: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactInfo = [
    {
      icon: <Mail size={24} />,
      title: 'Email Us',
      content: 'support@snippetfactory.com',
      link: 'mailto:support@snippetfactory.com'
    },
    {
      icon: <Phone size={24} />,
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      link: 'tel:+15551234567'
    },
    {
      icon: <MapPin size={24} />,
      title: 'Visit Us',
      content: 'San Francisco, CA 94103',
      link: null
    },
    {
      icon: <MessageSquare size={24} />,
      title: 'Live Chat',
      content: 'Available Mon-Fri 9am-6pm PT',
      link: null
    }
  ];

  return (
    <>
      <AnimatedBackground />
      <Header />

      <main style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '60px' }}>
        {/* Hero Section */}
        <section style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 24px' }}>
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
                Get in Touch
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
              We'd love to
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #588157 0%, #D4A373 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                hear from you
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              style={{
                fontSize: '1.25rem',
                color: '#666',
                maxWidth: '700px',
                margin: '0 auto',
                lineHeight: '1.6'
              }}
            >
              Have a question or want to learn more? Our team is here to help you get started.
            </motion.p>
          </motion.div>
        </section>

        {/* Contact Info Cards */}
        <section style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 24px' }}>
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(88, 129, 87, 0.2)',
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(88, 129, 87, 0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#588157',
                  margin: '0 auto 20px'
                }}>
                  {info.icon}
                </div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#2C3E2B',
                  marginBottom: '8px'
                }}>
                  {info.title}
                </h3>
                {info.link ? (
                  <a
                    href={info.link}
                    style={{
                      color: '#588157',
                      textDecoration: 'none',
                      fontSize: '0.95rem'
                    }}
                  >
                    {info.content}
                  </a>
                ) : (
                  <p style={{ color: '#666', fontSize: '0.95rem' }}>
                    {info.content}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Contact Form Section */}
        <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(88, 129, 87, 0.2)',
              borderRadius: '24px',
              padding: '48px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  zIndex: 10
                }}
              >
                <CheckCircle2 size={64} style={{ color: '#588157' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2C3E2B' }}>
                  Message Sent!
                </h3>
                <p style={{ color: '#666' }}>
                  We'll get back to you within 24 hours.
                </p>
              </motion.div>
            )}

            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#2C3E2B',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              Send us a message
            </h2>
            <p style={{
              color: '#666',
              textAlign: 'center',
              marginBottom: '40px'
            }}>
              Fill out the form below and we'll get back to you as soon as possible.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                <div>
                  <label
                    htmlFor="name"
                    style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#2C3E2B',
                      marginBottom: '8px'
                    }}
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid rgba(88, 129, 87, 0.3)',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      background: 'rgba(255, 255, 255, 0.5)',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#588157'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(88, 129, 87, 0.3)'}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#2C3E2B',
                      marginBottom: '8px'
                    }}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid rgba(88, 129, 87, 0.3)',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      background: 'rgba(255, 255, 255, 0.5)',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#588157'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(88, 129, 87, 0.3)'}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="company"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#2C3E2B',
                    marginBottom: '8px'
                  }}
                >
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid rgba(88, 129, 87, 0.3)',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: 'rgba(255, 255, 255, 0.5)',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#588157'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(88, 129, 87, 0.3)'}
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#2C3E2B',
                    marginBottom: '8px'
                  }}
                >
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid rgba(88, 129, 87, 0.3)',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: 'rgba(255, 255, 255, 0.5)',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#588157'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(88, 129, 87, 0.3)'}
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#2C3E2B',
                    marginBottom: '8px'
                  }}
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid rgba(88, 129, 87, 0.3)',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: 'rgba(255, 255, 255, 0.5)',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#588157'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(88, 129, 87, 0.3)'}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #588157 0%, #3d5a3c 100%)',
                  color: '#FAF9F6',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(88, 129, 87, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Send Message
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
