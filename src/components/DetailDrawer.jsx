// src/components/DetailDrawer.jsx
import React, { useEffect } from 'react';
import { formatDeadlineDateTime, formatDeadlineCountdown } from '../data/initialData';
import InstitutionLogo from './InstitutionLogo';
import { BookmarkIcon } from './icons';
import { trackEvent } from '../lib/posthog';
import './DetailDrawer.css';

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
          {/* Full-width 48px Apply on Unstop Primary Action */}
          <a
            href={item.unstopUrl || 'https://unstop.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-drawer-apply-btn"
            onClick={() => {
              trackEvent('competition_unstop_outbound_clicked', {
                competition_id: item.id,
                title: item.title,
                unstop_url: item.unstopUrl || 'https://unstop.com',
              });
            }}
          >
            <span>Apply on Unstop</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>

          {/* Dual 44px Row: Post a squad + Bookmark */}
          <div className="detail-drawer-dual-row">
            <button
              onClick={() => onOpenPostSquad(item)}
              className="detail-drawer-post-btn"
            >
              Post a squad
            </button>

            <button
              onClick={() => onToggleBookmark(item.id)}
              className={`detail-drawer-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            >
              <BookmarkIcon size={16} filled={isBookmarked} color={isBookmarked ? '#0F3FFE' : 'currentColor'} />
              <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
            </button>
          </div>

          <p className="detail-drawer-squad-note">
            {squadNote}
          </p>
        </div>
      </div>
    </div>
  );
}
