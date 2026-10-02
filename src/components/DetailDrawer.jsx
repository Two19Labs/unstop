// src/components/DetailDrawer.jsx
import React, { useEffect, useMemo } from 'react';
import { formatDeadlineDateTime, formatDeadlineCountdown } from '../data/initialData';
import InstitutionLogo from './InstitutionLogo';
import { BookmarkIcon } from './icons';
import { trackEvent } from '../lib/posthog';
import { useAuth } from '../context/AuthContext';
import { isEligibleForUndergrad, checkIsPostgraduate } from '../utils/eligibilityUtils';
import './DetailDrawer.css';

export default function DetailDrawer({
  item,
  onClose,
  isBookmarked = false,
  onToggleBookmark,
  onOpenPostSquad,
  squadsCount = 0
}) {
  const { profile } = useAuth();

  const isPostgraduate = useMemo(() => {
    return checkIsPostgraduate(profile);
  }, [profile]);

  const isCompPGExclusive = Boolean(
    item?.isPGOnly ||
    item?.targetLevel === 'pg' ||
    item?.isUndergradEligible === false ||
    (item && !isEligibleForUndergrad(item))
  );
  const showIneligibilityNotice = !isPostgraduate && isCompPGExclusive;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const disciplineCircuit = `${item.discipline || 'Competition'} · ${item.circuit || 'All Circuits'}`;

  const eligibilityDisplay = isCompPGExclusive
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

  const isSolo = (item.maxTeam !== undefined && Number(item.maxTeam) <= 1) ||
    (item.team && (String(item.team).toLowerCase().includes('solo') || String(item.team).toLowerCase().includes('individual') || String(item.team).trim() === '1')) ||
    (item.teamSizeDisplay && (String(item.teamSizeDisplay).toLowerCase().includes('solo') || String(item.teamSizeDisplay).toLowerCase().includes('individual'))) ||
    item.isSolo === true;

  const squadNote = !isSolo ? (squadsCount > 0
    ? `${squadsCount} ${squadsCount === 1 ? 'squad is' : 'squads are'} already looking for teammates on this.`
    : 'No squads posted for this yet  -  post one and applicants come to you.') : null;

  return (
    <div className="detail-drawer-overlay" onClick={onClose}>
      <div
        className="detail-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Competition details"
      >
        {/* Header Bar */}
        <div className="detail-drawer-header">
          <span className="detail-drawer-discipline">{disciplineCircuit}</span>
          <button
            onClick={onClose}
            className="detail-drawer-close-btn"
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        {/* Body Overview */}
        <div className="detail-drawer-hero">
          <InstitutionLogo
            logo={item.logo || item.orgLogo || item.bannerUrl}
            name={item.host || item.orgName}
            size={46}
            borderRadius={10}
            fontSize={14}
          />

          <div className="detail-drawer-hero-info">
            <h2 className="detail-drawer-title">
              {item.title}
            </h2>
            <p className="detail-drawer-host">
              {item.host || item.orgName}
            </p>
            <p className="detail-drawer-desc">
              {item.desc || 'No additional description provided for this listing.'}
            </p>
          </div>
        </div>

        {/* Ineligibility Warning for Undergraduate users viewing PG-only competitions */}
        {showIneligibilityNotice && (
          <div style={{
            margin: '0 20px 16px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>⚠️</span>
            <div style={{ fontSize: '13px', lineHeight: 1.4, color: 'var(--ink)' }}>
              <strong style={{ color: 'var(--urgency-red, #EF4444)' }}>Ineligible for Undergraduate Standing:</strong> This competition is strictly restricted to Postgraduate / MBA students based on organizer guidelines.
            </div>
          </div>
        )}

        {/* Fact Table */}
        <div className="detail-drawer-facts">
          {facts.map((f, i) => (
            <div key={i} className="detail-drawer-fact-row">
              <span className="detail-drawer-fact-key">{f.k}</span>
              <span className="detail-drawer-fact-val">{f.v}</span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="detail-drawer-footer">
          {/* Full-width 48px Apply Primary Action */}
          <a
            href={item.unstopUrl || 'https://unstop.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-drawer-apply-btn"
            onClick={() => {
              trackEvent('competition_outbound_clicked', {
                competition_id: item.id,
                title: item.title,
                url: item.unstopUrl || 'https://unstop.com',
              });
            }}
          >
            <span>Apply</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>

          {/* Action Row: Post a squad (for team comps) + Bookmark */}
          <div className="detail-drawer-dual-row">
            {!isSolo && (
              <button
                onClick={() => onOpenPostSquad(item)}
                className="detail-drawer-post-btn"
              >
                Post a squad
              </button>
            )}

            <button
              onClick={() => onToggleBookmark(item.id)}
              className={`detail-drawer-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
              style={isSolo ? { flex: 1 } : {}}
            >
              <BookmarkIcon size={16} filled={isBookmarked} color={isBookmarked ? '#0F3FFE' : 'currentColor'} />
              <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
            </button>
          </div>

          {squadNote && (
            <p className="detail-drawer-squad-note">
              {squadNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
