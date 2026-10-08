// src/components/ContactScreen.jsx
import React, { useState } from 'react';
import './InfoPages.css';

const WHATSAPP_NUMBER = '917007679485';
const EMAIL = 'two19labs@gmail.com';

const TOPICS = [
  {
    id: 'bug',
    label: 'Report a bug',
    sub: "Something isn't working",
    placeholder: 'What happened, and what were you trying to do?',
    hint: 'The more detail, the faster we fix it.'
  },
  {
    id: 'feedback',
    label: 'Feedback',
    sub: 'Add, change or remove',
    placeholder: 'What should we add, change or remove?',
    hint: 'We read every one.'
  },
  {
    id: 'question',
    label: 'Question',
    sub: 'Ask us anything',
    placeholder: 'Ask away.',
    hint: 'No question is too small.'
  },
  {
    id: 'other',
    label: 'Something else',
    sub: 'Partnerships, ideas, hi',
    placeholder: "What's on your mind?",
    hint: 'Anything goes.'
  }
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

export default function ContactScreen() {
  const [topicId, setTopicId] = useState('bug');
  const [message, setMessage] = useState('');

  const topic = TOPICS.find((t) => t.id === topicId);
  const canSend = message.trim().length > 0;

  const lines = [`[OneStop · ${topic.label}]`, '', message.trim()];
  if (topicId === 'bug') lines.push('', `Device: ${describeDevice()}`);
  const body = lines.join('\n');

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(body)}`;
  const emailUrl = `mailto:${EMAIL}?subject=${encodeURIComponent(`OneStop · ${topic.label}`)}&body=${encodeURIComponent(body)}`;

  const note = !canSend
    ? 'Write a message to send.'
    : topicId === 'bug'
      ? "We'll add your browser and device."
      : 'Nothing is sent until you hit send.';

  // Anchors can't be disabled, so block them until there's a message
  const sendProps = (href) => (canSend
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { 'aria-disabled': true, tabIndex: -1, role: 'link' });

  return (
    <div className="t19-page t19-contact">
      <div className="t19-panel t19-halftone t19-contact-panel">
        <header className="t19-contact-head">
          <div className="t19-contact-head-title">
            <span className="t19-label">Contact &amp; support</span>
            <h1 className="t19-display t19-contact-title">
              Say hi<span className="t19-dot">.</span>
            </h1>
          </div>
          <p className="t19-serif t19-contact-lede">
            Something broken? Just want to say hi? We usually reply within a day.
          </p>
        </header>

        <div className="t19-contact-block" role="group" aria-labelledby="t19-contact-topic">
          <div className="t19-contact-heading">
            <div className="t19-contact-heading-main">
              <span className="t19-num">01</span>
              <h2 id="t19-contact-topic" className="t19-contact-h2">
                What's this about<span className="t19-dot">?</span>
              </h2>
            </div>
          </div>
          <div className="t19-topics-wrap">
            <div className="t19-topics">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`t19-topic${t.id === topicId ? ' is-active' : ''}`}
                  aria-pressed={t.id === topicId}
                  onClick={() => setTopicId(t.id)}
                >
                  <span className="t19-topic-title">{t.label}</span>
                  <span className="t19-topic-sub">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="t19-contact-block t19-contact-block--grow">
          <div className="t19-contact-heading">
            <div className="t19-contact-heading-main">
              <span className="t19-num">02</span>
              <h2 className="t19-contact-h2">
                <label htmlFor="t19-contact-message">Tell us<span className="t19-dot">.</span></label>
              </h2>
            </div>
            <span className="t19-contact-hint">{topic.hint}</span>
          </div>
          <textarea
            id="t19-contact-message"
            className="t19-contact-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={topic.placeholder}
            maxLength={2000}
          />
        </div>

        <div className="t19-send-row">
          <a className={`t19-btn t19-btn--primary${canSend ? '' : ' is-disabled'}`} {...sendProps(whatsappUrl)}>
            Send on WhatsApp
          </a>
          <a className={`t19-btn t19-btn--outline${canSend ? '' : ' is-disabled'}`} {...sendProps(emailUrl)}>
            Email
          </a>
          <span className="t19-send-note">{note}</span>
        </div>
      </div>
    </div>
  );
}
