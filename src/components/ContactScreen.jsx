// src/components/ContactScreen.jsx
import React, { useEffect, useState } from 'react';
import './InfoPages.css';

const WHATSAPP_NUMBER = '917007679485';
const EMAIL = 'two19labs@gmail.com';

const TOPICS = [
  { id: 'bug', label: 'Report a bug', placeholder: 'What happened, and what were you trying to do?' },
  { id: 'feedback', label: 'Feedback', placeholder: 'What should we add, change or remove?' },
  { id: 'question', label: 'Question', placeholder: 'Ask away.' },
  { id: 'other', label: 'Something else', placeholder: "What's on your mind?" }
];

function describeDevice() {
  const ua = navigator.userAgent || '';
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /OPR\//.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : 'Browser';
  const os = /Android/.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : 'unknown OS';
  return `${browser} on ${os}`;
}

export default function ContactScreen({ profileName = '' }) {
  const [topicId, setTopicId] = useState('bug');
  const [name, setName] = useState(profileName);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profileName) setName((current) => current || profileName);
  }, [profileName]);

  const topic = TOPICS.find((t) => t.id === topicId);
  const canSend = message.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSend) return;
    const lines = [`[OneStop · ${topic.label}]`];
    if (name.trim()) lines.push(`From: ${name.trim()}`);
    lines.push('', message.trim());
    if (topicId === 'bug') {
      lines.push('', `Device: ${describeDevice()}`);
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="info-page">
      <header className="info-hero">
        <span className="info-label">Contact &amp; support</span>
        <h1 className="info-title">
          Something broken? Just want to say hi<span className="info-dot">?</span>
        </h1>
        <p className="info-sub">
          Write your message below and hit send. It opens WhatsApp with your message ready to go, straight to us.
        </p>
      </header>

      <form className="contact-card" onSubmit={handleSubmit}>
        <fieldset className="contact-field">
          <legend className="contact-field-label">What's this about?</legend>
          <div className="contact-chips">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`contact-chip${t.id === topicId ? ' is-active' : ''}`}
                aria-pressed={t.id === topicId}
                onClick={() => setTopicId(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="contact-field">
          <span className="contact-field-label">Your name <span className="contact-optional">(optional)</span></span>
          <input
            type="text"
            className="contact-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
          />
        </label>

        <label className="contact-field">
          <span className="contact-field-label">Message</span>
          <textarea
            className="contact-input contact-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={topic.placeholder}
            rows={6}
            maxLength={2000}
          />
        </label>

        <button type="submit" className="contact-send" disabled={!canSend}>
          Send on WhatsApp
        </button>
      </form>

      <p className="contact-alt">
        Prefer email? <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </p>
    </div>
  );
}
