// src/components/DetailDrawer.jsx
import React, { useEffect } from 'react';
import { initialsOf, formatDeadlineDateTime, formatDeadlineCountdown } from '../data/initialData';
import InstitutionLogo from './InstitutionLogo';
import { trackEvent } from '../lib/posthog';

export default function DetailDrawer({
  item,
  onClose,
  isBookmarked = false,
  onToggleBookmark,
  onOpenPostSquad,
  squadsCount = 0
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const initials = initialsOf(item.host || item.orgName || 'Host');
  const disciplineCircuit = `${item.discipline || 'Competition'} · ${item.circuit || 'All Circuits'}`;

  const eligibilityDisplay = item.isPGOnly
    ? 'Postgraduate / MBA Exclusive'
    : (item.isMBAorPG ? 'Undergraduate & Postgraduate / MBA' : 'Undergraduate & All Collegiate');

  const deadlineFormatted = formatDeadlineDateTime(item.deadline);
  const countdownFormatted = formatDeadlineCountdown(item.deadline, item.remainDaysText, item.days);

  const facts = [
    { k: 'Host', v: item.host || item.orgName || 'Organizer' },
    { k: 'Circuit', v: item.circuit || 'Collegiate' },
    { k: 'Eligibility', v: eligibilityDisplay },
    { k: 'Team size', v: item.team || (item.minTeam === item.maxTeam ? `${item.minTeam}` : `${item.minTeam}-${item.maxTeam}`) },
    { k: 'Format', v: item.mode || 'Online' },
    { k: 'Prize', v: item.prize || 'Recognition' },
    { k: 'Entry', v: item.fee || (item.isFree ? 'Free' : 'Paid') },
    ...(deadlineFormatted ? [{ k: 'Deadline', v: deadlineFormatted }] : []),
    { k: 'Closes in', v: countdownFormatted }
  ];

  const squadNote = squadsCount > 0
    ? `${squadsCount} ${squadsCount === 1 ? 'squad is' : 'squads are'} already looking for teammates on this.`
    : 'No squads posted for this yet  -  post one and applicants come to you.';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--scrim)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(460px, 100%)',
          height: '100%',
          overflowY: 'auto',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: 'max(15px, var(--sat, 15px)) 20px 15px',
            borderBottom: '1px solid var(--line)'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-secondary)' }}>{disciplineCircuit}</span>
          <button
            onClick={onClose}
            style={{
              border: '1px solid var(--line)',
              borderRadius: '8px',
              background: 'var(--surface-sunken)',
              color: 'var(--ink-secondary)',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 120ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-muted)';
              e.currentTarget.style.color = 'var(--ink)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-sunken)';
              e.currentTarget.style.color = 'var(--ink-secondary)';
            }}
          >
            ×
          </button>
        </div>

        {/* Body Overview */}
        <div style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <InstitutionLogo
            logo={item.logo || item.orgLogo || item.bannerUrl}
            name={item.host || item.orgName}
            size={46}
            borderRadius={10}
            fontSize={14}
          />

          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                textWrap: 'pretty',
                color: 'var(--ink)'
              }}
            >
              {item.title}
            </h2>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'var(--ink-secondary)' }}>
              {item.host || item.orgName}
            </p>
            <p style={{ margin: '10px 0 0', fontSize: '14px', lineHeight: 1.55, color: 'var(--ink-secondary)' }}>
              {item.desc || 'No additional description provided for this listing.'}
            </p>
          </div>
        </div>

        {/* Fact Table */}
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {facts.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '108px minmax(0, 1fr)',
                gap: '14px',
                padding: '12px 20px',
                borderBottom: '1px solid var(--line-light)'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>{f.k}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>{f.v}</span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '20px 20px calc(20px + var(--sab, 0px))', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '9px' }}>
          <button

            onClick={() => onOpenPostSquad(item)}
            style={{
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
            Post a squad for this
          </button>

          <button
            onClick={() => onToggleBookmark(item.id)}
            style={{
              border: '1px solid var(--line)',
              borderRadius: '9px',
              background: 'var(--surface)',
              color: 'var(--ink)',
              padding: '13px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
          >
            {isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          </button>

          <a
            href={item.unstopUrl || 'https://unstop.com'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent('competition_unstop_outbound_clicked', {
                competition_id: item.id,
                title: item.title,
                unstop_url: item.unstopUrl || 'https://unstop.com',
              });
            }}
            style={{
              border: '1px solid var(--line)',
              borderRadius: '9px',
              background: 'var(--surface)',
              color: 'var(--ink)',
              padding: '13px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
          >
            Open on Unstop
          </a>

          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
            {squadNote}
          </p>
        </div>
      </div>
    </div>
  );
}
