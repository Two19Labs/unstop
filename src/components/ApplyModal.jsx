// src/components/ApplyModal.jsx
import React, { useState, useEffect } from 'react';

export default function ApplyModal({
  isOpen,
  onClose,
  post,
  competition,
  onSubmitApply
}) {
  const [pitch, setPitch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const compTitle = competition?.title || 'Competition';
  const spotsLeft = (post.size || 4) - (post.filled || 1);
  const spotsText = spotsLeft <= 1 ? '1 spot left' : `${spotsLeft} spots left`;
  const leadText = `${post.lead} · ${spotsText}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitApply(post, pitch.trim());
    setPitch('');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,26,25,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 55
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 100%)',
          background: '#FFFFFF',
          border: '1px solid #E7E6E2',
          borderRadius: '14px'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '15px 20px',
            borderBottom: '1px solid #E7E6E2'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1A19' }}>Request to join</h2>
          <button
            onClick={onClose}
            style={{
              border: '1px solid #E7E6E2',
              borderRadius: '8px',
              background: '#FFFFFF',
              color: '#75736C',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F2F1ED';
              e.currentTarget.style.color = '#1A1A19';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = '#75736C';
            }}
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>{compTitle}</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#75736C' }}>{leadText}</p>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Why you</span>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows="3"
              placeholder="One or two lines — what you bring and any relevant past competitions."
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '9px',
                background: '#FFFFFF',
                padding: '10px 12px',
                fontSize: '14px',
                lineHeight: 1.5,
                color: '#1A1A19'
              }}
            />
          </label>

          <p style={{ margin: 0, fontSize: '12px', color: '#75736C', lineHeight: 1.5 }}>
            Your profile, college, batch and skills go with this request. WhatsApp number is shared only if the lead accepts.
          </p>

          <button
            type="submit"
            style={{
              border: '1px solid #0F3FFE',
              borderRadius: '9px',
              background: '#0F3FFE',
              color: '#FFFFFF',
              padding: '13px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
          >
            Send request
          </button>
        </form>
      </div>
    </div>
  );
}
