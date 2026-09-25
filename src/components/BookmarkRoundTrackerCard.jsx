// src/components/BookmarkRoundTrackerCard.jsx
// Dedicated post-registration deadline tracker card for the bookmarks rail
// Focuses strictly on round name, accurate deadline, and real-time live ticking countdown (hours, minutes, seconds)

import React from 'react';
import InstitutionLogo from './InstitutionLogo';
import {
  formatRoundDeadlineTime,
  getRoundCountdown,
  getActiveOrNextRound,
  useLiveSecondTicker
} from '../utils/roundDeadlineUtils';
import './BookmarkRoundTrackerCard.css';

const ExternalLinkIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export default function BookmarkRoundTrackerCard({
  competition,
  roundsData,
  onOpenDetail,
  onToggleBookmark
}) {
  // Live 1-second ticker drives precision countdowns without re-rendering parent rails
  const nowMs = useLiveSecondTicker();

  const {
    currentRound,
    currentRoundIndex,
    totalRounds,
    subsequentRound,
    isLive,
    isStartingSoon
  } = getActiveOrNextRound(roundsData, nowMs);

  const compTitle = competition.title || 'Competition';
  const hostName = competition.host || competition.orgName || 'Host Institution';
  const logo = competition.logo || competition.orgLogo;

  // If no rounds data available or still synchronizing
  if (!currentRound) {
    return (
      <div
        className="br-card"
        onClick={() => onOpenDetail && onOpenDetail(competition.id)}
      >
        <div className="br-top-row">
          <div className="br-host-wrap">
            <InstitutionLogo logo={logo} name={hostName} size={30} borderRadius={7} fontSize={10.5} />
            <span className="br-host-name" title={hostName}>{hostName}</span>
          </div>
          <button
            type="button"
            className="br-remove-btn"
            title="Remove bookmark"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleBookmark) onToggleBookmark(competition.id);
            }}
          >
            ×
          </button>
        </div>

        <h3 className="br-title" title={compTitle}>{compTitle}</h3>

        <div className="br-hero-box">
          <div className="br-hero-header">
            <span className="br-stage-tag">Registration Closed</span>
            <span className="br-live-tag tag-normal">Tracking</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', padding: '6px 0' }}>
            Syncing round deadlines from Unstop...
          </div>
        </div>

        <a
          href={competition.unstopUrl || 'https://unstop.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="br-portal-btn"
          onClick={(e) => e.stopPropagation()}
        >
          <span>Open Unstop Portal</span>
          <ExternalLinkIcon size={12} color="#FFFFFF" />
        </a>
      </div>
    );
  }

  // Calculate live countdown to the round deadline
  const countdown = getRoundCountdown(currentRound.endDate, nowMs);
  const deadlineFormatted = formatRoundDeadlineTime(currentRound.endDate);

  const roundName = currentRound.title || `Round ${currentRoundIndex}`;
  const roundEmoji = currentRound.typeEmoji || '🎯';

  let heroBoxClass = 'hero-normal';
  let cardClass = '';
  let liveTagClass = 'tag-normal';
  let liveTagText = '⏳ ACTIVE';

  if (isLive) {
    heroBoxClass = 'hero-live';
    cardClass = 'is-live';
    liveTagClass = 'tag-live';
    liveTagText = '🔴 LIVE NOW';
  } else if (countdown.isCritical) {
    heroBoxClass = 'hero-critical';
    cardClass = 'is-critical';
    liveTagClass = 'tag-critical';
    liveTagText = '⚡ DUE SOON';
  } else if (countdown.isUrgent) {
    heroBoxClass = 'hero-urgent';
    cardClass = 'is-urgent';
    liveTagClass = 'tag-urgent';
    liveTagText = isStartingSoon ? '⏰ OPENS SOON' : '⚡ CLOSING SOON';
  }

  const portalUrl = currentRound.publicUrl || competition.unstopUrl || 'https://unstop.com';

  return (
    <div
      className={`br-card ${cardClass}`}
      onClick={() => onOpenDetail && onOpenDetail(competition.id)}
    >
      {/* Top Bar: Logo, Host, and Bookmark Remove Button */}
      <div className="br-top-row">
        <div className="br-host-wrap">
          <InstitutionLogo logo={logo} name={hostName} size={30} borderRadius={7} fontSize={10.5} />
          <span className="br-host-name" title={hostName}>{hostName}</span>
        </div>
        <button
          type="button"
          className="br-remove-btn"
          title="Remove bookmark"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleBookmark) onToggleBookmark(competition.id);
          }}
        >
          ×
        </button>
      </div>

      {/* Competition Title */}
      <h3 className="br-title" title={compTitle}>{compTitle}</h3>

      {/* Hero Round Deadline Box (NO descriptions, 100% focus on round name and accurate ticking deadline) */}
      <div className={`br-hero-box ${heroBoxClass}`}>
        <div className="br-hero-header">
          <span className="br-stage-tag">
            {totalRounds > 1 ? `Round ${currentRoundIndex} of ${totalRounds}` : 'Active Round'}
          </span>
          <span className={`br-live-tag ${liveTagClass}`}>
            {liveTagText}
          </span>
        </div>

        {/* Round Name ONLY */}
        <div className="br-round-name-row">
          <span className="br-round-emoji">{roundEmoji}</span>
          <span className="br-round-name" title={roundName}>{roundName}</span>
        </div>

        {/* Accurate Formatted Deadline */}
        <div className="br-deadline-row">
          <span className="br-deadline-label">Deadline</span>
          <span className="br-deadline-time">{deadlineFormatted}</span>
        </div>

        {/* Real-time Ticking Countdown in Hours, Minutes, and Seconds */}
        <div className="br-countdown-banner">
          <span style={{ fontSize: '13px' }}>⏱️</span>
          <span>{countdown.text}</span>
        </div>
      </div>

      {/* Subsequent Round Strip (Minimal, single-line teaser without descriptions) */}
      {subsequentRound && (
        <div className="br-subsequent-strip" title={`Next: ${subsequentRound.title}`}>
          <span>Next: </span>
          <strong>{subsequentRound.title}</strong>
          {subsequentRound.endDate && (
            <span> ({new Date(subsequentRound.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})</span>
          )}
        </div>
      )}

      {/* Action Button */}
      <a
        href={portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="br-portal-btn"
        onClick={(e) => e.stopPropagation()}
      >
        <span>Open Unstop Portal</span>
        <ExternalLinkIcon size={12} color="#FFFFFF" />
      </a>
    </div>
  );
}
