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
    <div className="t19-page t19-contact">
      <header className="t19-panel t19-halftone t19-hero t19-contact-intro">
        <div className="t19-hero-top t19-label">
          <span>Contact &amp; support</span>
        </div>
        <h1 className="t19-display t19-hero-title">
          Something broken? Just want to say hi<span className="t19-dot">?</span>
        </h1>
        <p className="t19-hero-sub">
          Write your message and hit send. It opens WhatsApp with your message ready to go, straight to us.
        </p>
        <div className="t19-contact-alt">
          <span className="t19-label">Prefer email?</span>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </div>
      </header>

      <form className="t19-panel t19-form" onSubmit={handleSubmit}>
        <fieldset className="t19-field t19-field--full">
          <legend className="t19-label t19-field-label">01 · What's this about?</legend>
          <div className="t19-chips">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`t19-chip${t.id === topicId ? ' is-active' : ''}`}
                aria-pressed={t.id === topicId}
                onClick={() => setTopicId(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="t19-field t19-field--full">
          <span className="t19-label t19-field-label">02 · Your name <span className="t19-optional">(optional)</span></span>
          <input
            type="text"
            className="t19-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
          />
        </label>

        <label className="t19-field t19-field--full">
          <span className="t19-label t19-field-label">03 · Message</span>
          <textarea
            className="t19-input t19-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={topic.placeholder}
            rows={7}
            maxLength={2000}
          />
        </label>

        <div className="t19-form-actions">
          <button type="submit" className="t19-btn t19-btn--dark t19-btn--lg" disabled={!canSend}>
            Send on WhatsApp
          </button>
          <span className="t19-hint">Opens WhatsApp. Nothing is sent until you hit send there.</span>
        </div>
      </form>
    </div>
  );
}
