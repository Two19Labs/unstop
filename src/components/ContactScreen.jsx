// src/components/ContactScreen.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ContactScreen.css';

const WHATSAPP_NUMBER = '7007679485';
const WHATSAPP_INTL = '917007679485';

const CATEGORIES = [
  { id: 'hire', label: '💼 Hire Two19 Labs (Client Build)' },
  { id: 'feedback', label: '⚡ OneStop Feedback & Bugs' },
  { id: 'partnership', label: '🎓 College Society / Fest' },
  { id: 'general', label: '💬 General Inquiry' }
];

const PROMPT_SUGGESTIONS = {
  hire: [
    'We need a custom web platform built for our business from scratch.',
    'Looking to automate our internal workflows and replace spreadsheets.',
    'Need technical leadership / CTO-as-a-service for our early-stage venture.'
  ],
  feedback: [
    'Found a bug while applying to a squad in Team Finder.',
    'Suggestion: Please add a quick filter for debate competitions.',
    'Love the round tracker! Would love to see notifications for my college.'
  ],
  partnership: [
    'We are organizing our annual college fest and want OneStop as our discovery partner.',
    'Our college society would love to list our upcoming case competition.',
    'Inquiring about a campus ambassador or collegiate partnership program.'
  ],
  general: [
    'Hi Aditya, saw OneStop and wanted to connect with Two19 Labs!',
    'Interested in knowing more about your engineering tech stack.',
    'Had a question regarding competition eligibility rules.'
  ]
};

export default function ContactScreen({ onNavigate = () => {}, showToast = null }) {
  const { user, profile } = useAuth();

  const [category, setCategory] = useState('hire');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (profile?.name && !name) {
      setName(profile.name);
    } else if (user?.user_metadata?.full_name && !name) {
      setName(user.user_metadata.full_name);
    }

    if (profile?.college && !org) {
      setOrg(profile.college);
    }
  }, [profile, user]);

  const handleQuickPrompt = (promptText) => {
    setMessage(promptText);
  };

  const handleSendWhatsApp = (e) => {
    e?.preventDefault();

    const selectedCat = CATEGORIES.find(c => c.id === category)?.label || 'General Inquiry';
    const senderName = name.trim() || 'Anonymous User';
    const senderOrg = org.trim() ? ` (${org.trim()})` : '';
    const bodyText = message.trim() || 'Hi Aditya, reaching out from OneStop / Two19 Labs.';

    // Construct structured, readable WhatsApp message
    const formattedText = 
      `*OneStop / Two19 Labs Inquiry*\n` +
      `• *From:* ${senderName}${senderOrg}\n` +
      `• *Category:* ${selectedCat}\n` +
      `──────────────────────\n` +
      `${bodyText}`;

    const waUrl = `https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(formattedText)}`;

    if (showToast) {
      showToast('Opening WhatsApp...');
    }

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('+91 70076 79485').then(() => {
      setCopied(true);
      if (showToast) showToast('Phone number copied to clipboard: +91 70076 79485');
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      if (showToast) showToast('+91 70076 79485');
    });
  };

  return (
    <div className="contact-screen-container">
      {/* Hero Header */}
      <section className="contact-hero">
        <div className="contact-brand-tag">
          <span>Two19 Labs</span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />
          <span>Direct Access</span>
        </div>

        <h1 className="contact-hero-title">
          Contact Us &amp; Talk Directly<span className="dot-blue">.</span>
        </h1>

        <p className="contact-hero-accent">
          no middlemen, no automated support bots.
        </p>

        <p className="contact-hero-desc">
          Whether you want to hire <strong>Two19 Labs</strong> to build custom software, have feedback for <strong>OneStop</strong>, 
          or want to partner for your college fest — send a direct WhatsApp message to co-founder <strong>Aditya Singhani</strong> with one click.
        </p>
      </section>

      {/* Main Grid */}
      <div className="contact-main-grid">
        {/* Left: Interactive WhatsApp Composer */}
        <section className="contact-composer-card">
          <div className="contact-composer-header">
            <div className="contact-composer-label">
              <span>01</span>
              <span>WhatsApp Direct Message</span>
            </div>
            <span className="contact-composer-pill">
              Replies under 2 hrs
            </span>
          </div>

          <form onSubmit={handleSendWhatsApp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Category Selector */}
            <div>
              <span className="contact-chips-label">What are you reaching out about?</span>
              <div className="contact-chips-row">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`contact-chip-btn ${category === cat.id ? 'active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & College/Org Fields */}
            <div className="contact-form-row">
              <div className="contact-field-group">
                <label className="contact-field-label" htmlFor="contact-name">
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  className="contact-input"
                  placeholder="e.g. Aditya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="contact-field-group">
                <label className="contact-field-label" htmlFor="contact-org">
                  College or Company
                </label>
                <input
                  id="contact-org"
                  type="text"
                  className="contact-input"
                  placeholder="e.g. SSCBS, DU or Company Name"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                />
              </div>
            </div>

            {/* Type-in Message Box */}
            <div className="contact-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label className="contact-field-label" htmlFor="contact-msg">
                  Your Message
                </label>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                  {message.length} characters
                </span>
              </div>
              <textarea
                id="contact-msg"
                className="contact-textarea"
                placeholder={
                  category === 'hire'
                    ? 'Tell us about your project: what do you need built, your timeline, and any specific requirements...'
                    : category === 'feedback'
                    ? 'Share your thoughts, suggestions, or bug report for OneStop...'
                    : category === 'partnership'
                    ? 'Tell us about your college society, fest dates, and how we can collaborate...'
                    : 'Write your message here...'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>

            {/* Quick Fill Suggestions */}
            <div>
              <span className="contact-prompts-label">Quick suggestions:</span>
              <div className="contact-prompts-list">
                {(PROMPT_SUGGESTIONS[category] || []).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="contact-prompt-pill"
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    + {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="contact-wa-submit-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.764.814 2.791.814 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm9.969 5.766c0 5.508-4.482 9.99-9.969 9.99-1.748 0-3.385-.453-4.817-1.242l-5.214 1.368 1.396-5.086c-.928-1.503-1.465-3.268-1.465-5.03 0-5.508 4.482-9.99 9.969-9.99 5.508 0 9.969 4.482 9.969 9.99zm-4.041 3.511c-.244-.122-1.442-.712-1.666-.793-.223-.082-.386-.122-.549.122-.163.245-.631.794-.773.957-.143.163-.285.184-.529.061-.244-.122-1.031-.38-1.963-1.211-.726-.648-1.217-1.448-1.36-1.692-.143-.245-.015-.377.107-.499.11-.11.244-.286.366-.429.122-.143.163-.245.244-.408.082-.163.041-.306-.02-.429-.061-.122-.549-1.325-.753-1.815-.198-.477-.399-.413-.549-.42l-.468-.008c-.163 0-.429.061-.652.306-.224.245-.856.836-.856 2.039 0 1.203.876 2.365.998 2.528.122.163 1.724 2.632 4.176 3.69 2.453 1.058 2.453.705 2.895.665.442-.041 1.442-.59 1.645-1.161.204-.571.204-1.06.143-1.161-.061-.102-.224-.163-.468-.285z" />
              </svg>
              <span>Send via WhatsApp (+91 {WHATSAPP_NUMBER})</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>

            <p className="contact-disclaimer">
              Opens WhatsApp directly with your structured message pre-filled. You can review before sending.
            </p>
          </form>
        </section>

        {/* Right: Direct Information Rail */}
        <div className="contact-info-rail">
          <section className="contact-direct-card">
            <h3 className="contact-direct-head">
              <span>02</span>
              <span>Direct Coordinates</span>
            </h3>

            {/* WhatsApp / Phone */}
            <div className="contact-item-row">
              <div className="contact-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div className="contact-item-content">
                <span className="contact-item-title">Phone &amp; WhatsApp</span>
                <a href={`https://wa.me/${WHATSAPP_INTL}`} target="_blank" rel="noopener noreferrer" className="contact-item-val">
                  +91 {WHATSAPP_NUMBER}
                </a>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginTop: '2px'
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy Number'}
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="contact-item-row">
              <div className="contact-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className="contact-item-content">
                <span className="contact-item-title">Agency Email</span>
                <a href="mailto:two19labs@gmail.com" className="contact-item-val">
                  two19labs@gmail.com
                </a>
              </div>
            </div>

            {/* Official Website */}
            <div className="contact-item-row">
              <div className="contact-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <div className="contact-item-content">
                <span className="contact-item-title">Studio Website</span>
                <a href="https://two19labs.in" target="_blank" rel="noopener noreferrer" className="contact-item-val">
                  two19labs.in ↗
                </a>
              </div>
            </div>

            {/* Co-Founders */}
            <div className="contact-item-row">
              <div className="contact-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="contact-item-content">
                <span className="contact-item-title">Co-Founders</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                  <a
                    href="https://www.linkedin.com/in/aditya-singhani-69294a27a/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-item-val"
                    style={{ fontSize: '13px' }}
                  >
                    Aditya Singhani (LinkedIn ↗)
                  </a>
                  <a
                    href="https://www.linkedin.com/in/manthan-kabra/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-item-val"
                    style={{ fontSize: '13px' }}
                  >
                    Manthan Kabra (LinkedIn ↗)
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Two19 Labs Quality Stamp */}
          <div className="contact-agency-stamp">
            <span className="contact-agency-tag">Agency Guarantee</span>
            <p className="contact-agency-quote">
              "No templates. Ever. Everything we build is bespoke, owned by you, and made to evolve."
            </p>
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Read our story &amp; portfolio →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
