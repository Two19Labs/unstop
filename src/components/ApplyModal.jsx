// src/components/ApplyModal.jsx
import React, { useState, useEffect } from 'react';
import { SKILLS } from '../data/initialData';
import { sanitizeIndianPhone } from '../context/AuthContext';
import InstitutionLogo from './InstitutionLogo';

export default function ApplyModal({
  isOpen,
  onClose,
  post,
  competition = null,
  profile = null,
  onSubmitApply
}) {
  const [pitch, setPitch] = useState('');
  const [highlightedSkills, setHighlightedSkills] = useState([]);
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPitch('');
    setErrorMsg('');
    const userSkills = profile?.skills || [];
    setHighlightedSkills(userSkills.slice(0, 3));
    setPhone(sanitizeIndianPhone(profile?.phone || ''));
  }, [isOpen, profile]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const compTitle = post.competition_name || competition?.title || post.displayTitle || 'Competition';
  const compHost = post.organizer || competition?.host || competition?.orgName || post?.comp?.host || '';
  const leadName = post.created_by_name || post.lead || post.displayLead || 'Squad Lead';
  const spotsLeft = post.spots_left !== undefined ? post.spots_left : (post.displaySpotsLeft || 1);
  const spotsText = spotsLeft <= 1 ? '1 spot left' : `${spotsLeft} spots left`;

  const toggleSkill = (skill) => {
    setHighlightedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : prev.length < 4 ? [...prev, skill] : prev
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pitch.trim()) {
      setErrorMsg('Please write a brief pitch explaining what you bring to the squad.');
      return;
    }

    const cleanPhone = sanitizeIndianPhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid compulsory 10-digit WhatsApp number (e.g. 9876543210).');
      return;
    }

    onSubmitApply(post, pitch.trim(), highlightedSkills, cleanPhone);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 16px calc(16px + var(--sab, 0px))',
        zIndex: 60
      }}

    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(480px, 100%)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)'
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
              Request to join squad
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ink-secondary)' }}>
              {leadName} · {spotsText}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid var(--line)',
              borderRadius: '8px',
              background: 'var(--surface-sunken)',
              color: 'var(--ink-secondary)',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 120ms ease'
            }}
          >
            ×
          </button>
        </div>

        {/* Error */}
        {errorMsg && (
          <div
            style={{
              margin: '14px 20px 0',
              padding: '9px 13px',
              background: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--urgency-red)'
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Target Competition Card */}
          <div style={{ background: 'var(--surface-sunken)', padding: '12px 14px', borderRadius: '9px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
              <InstitutionLogo
                name={compHost}
                title={compTitle}
                logo={competition?.logo || competition?.orgLogo || post?.comp?.logo}
                size={36}
                borderRadius={8}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'uppercase' }}>
                  Applying for
                </span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginTop: '1px' }}>
                  {compTitle}
                </div>
              </div>
            </div>
            {post.skills_looking_for && post.skills_looking_for.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '7px' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-secondary)' }}>Lead wants:</span>
                {post.skills_looking_for.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: '4px',
                      padding: '1px 6px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--primary)'
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Highlighted Skills */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                Highlight Your Relevant Skills (Pick up to 3)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-secondary)' }}>
                {highlightedSkills.length} selected
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SKILLS.map((skill) => {
                const on = highlightedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    style={{
                      border: `1px solid ${on ? 'var(--primary)' : 'var(--line)'}`,
                      borderRadius: '20px',
                      background: on ? 'var(--primary)' : 'var(--surface-sunken)',
                      color: on ? '#FFFFFF' : 'var(--ink)',
                      padding: '5px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      transition: 'all 120ms ease'
                    }}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pitch */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
              Pitch Note *
            </span>
            <textarea
              rows="3"
              placeholder="Why you? Mention relevant past competitions, deck design skills, financial models, or analytical strengths..."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              style={{
                border: '1px solid var(--line)',
                borderRadius: '8px',
                background: 'var(--surface)',
                color: 'var(--ink)',
                padding: '9px 12px',
                fontSize: '13px',
                lineHeight: 1.5
              }}
            />
          </label>

          {/* WhatsApp Phone */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
              Your WhatsApp Phone Number *
            </span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '10px', fontSize: '13px', color: 'var(--ink-secondary)', fontWeight: 500 }}>
                +91
              </span>
              <input
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  padding: '9px 12px 9px 42px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ink-secondary)' }}>
              Compulsory 10-digit WhatsApp number. Shared with the lead only when your request is accepted.
            </span>
          </label>

          <button
            type="submit"
            style={{
              marginTop: '6px',
              border: '1px solid var(--primary)',
              borderRadius: '9px',
              background: 'var(--primary)',
              color: '#FFFFFF',
              padding: '13px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary)')}
          >
            Send request to {leadName.split(' ')[0]}
          </button>
        </form>
      </div>
    </div>
  );
}
