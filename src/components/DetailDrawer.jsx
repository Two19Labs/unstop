// src/components/DetailDrawer.jsx
import React, { useEffect } from 'react';
import { initialsOf, formatDeadlineDateTime, formatDeadlineCountdown } from '../data/initialData';

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
    { k: 'Team size', v: item.team || (item.minTeam === item.maxTeam ? `${item.minTeam}` : `${item.minTeam}–${item.maxTeam}`) },
    { k: 'Format', v: item.mode || 'Online' },
    { k: 'Prize', v: item.prize || 'Recognition' },
    { k: 'Entry', v: item.fee || (item.isFree ? 'Free' : 'Paid') },
    ...(deadlineFormatted ? [{ k: 'Deadline', v: deadlineFormatted }] : []),
    { k: 'Closes in', v: countdownFormatted }
  ];

  const squadNote = squadsCount > 0
    ? `${squadsCount} ${squadsCount === 1 ? 'squad is' : 'squads are'} already looking for teammates on this.`
    : 'No squads posted for this yet — post one and applicants come to you.';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,26,25,0.35)',
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
          background: '#FFFFFF',
          borderLeft: '1px solid #E7E6E2',
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
            padding: '15px 20px',
            borderBottom: '1px solid #E7E6E2'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#75736C' }}>{disciplineCircuit}</span>
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

        {/* Body Overview */}
        <div style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <span
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              border: '1px solid #EFEEEA',
              backgroundColor: item.logo ? '#FFFFFF' : '#F2F1ED',
              backgroundImage: item.logo ? `url("${item.logo}")` : 'none',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              color: '#55534D',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
              fontSize: '14px',
              fontWeight: 700
            }}
          >
            {!item.logo && <span>{initials}</span>}
          </span>

          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                textWrap: 'pretty',
                color: '#1A1A19'
              }}
            >
              {item.title}
            </h2>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#75736C' }}>
              {item.host || item.orgName}
            </p>
            <p style={{ margin: '10px 0 0', fontSize: '14px', lineHeight: 1.55, color: '#55534D' }}>
              {item.desc || 'No additional description provided for this listing.'}
            </p>
          </div>
        </div>

        {/* Fact Table */}
        <div style={{ borderTop: '1px solid #E7E6E2' }}>
          {facts.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '108px minmax(0, 1fr)',
                gap: '14px',
                padding: '12px 20px',
                borderBottom: '1px solid #F0EFEB'
              }}
            >
              <span style={{ fontSize: '13px', color: '#75736C' }}>{f.k}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A19' }}>{f.v}</span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '20px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '9px' }}>
          <button
            onClick={() => onOpenPostSquad(item)}
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
            Post a squad for this
          </button>

          <button
            onClick={() => onToggleBookmark(item.id)}
            style={{
              border: '1px solid #E7E6E2',
              borderRadius: '9px',
              background: '#FFFFFF',
              color: '#1A1A19',
              padding: '13px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1ED')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            {isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          </button>

          <a
            href={item.unstopUrl || 'https://unstop.com'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              border: '1px solid #E7E6E2',
              borderRadius: '9px',
              color: '#1A1A19',
              padding: '13px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1ED')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            Open on Unstop
          </a>

          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#75736C', lineHeight: 1.5 }}>
            {squadNote}
          </p>
        </div>
      </div>
    </div>
  );
}
