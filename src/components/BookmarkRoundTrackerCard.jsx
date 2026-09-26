// src/components/BookmarkRoundTrackerCard.jsx
// Pixel-accurate round deadline tracker card for the bookmarks rail
// Matches the reference design with status-themed pastel backgrounds, clean inner box, and vibrant Unstop blue button

import React from 'react';
import InstitutionLogo from './InstitutionLogo';
import {
  formatRoundDeadlineDue,
  formatRoundNextDate,
  getRoundCountdown,
  getActiveOrNextRound,
  useLiveSecondTicker
} from '../utils/roundDeadlineUtils';
import './BookmarkRoundTrackerCard.css';

const ExternalLinkIcon = ({ size = 13, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
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
  const portalUrl = currentRound?.publicUrl || competition.unstopUrl || 'https://unstop.com';

  // Fallback if no rounds data yet
  if (!currentRound) {
    return (
      <div
        className="br-card br-card--syncing"
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

        <div className="br-hero-box br-hero-box--normal">
          <div className="br-hero-header">
            <span className="br-stage-tag">ACTIVE ROUND</span>
            <span className="br-badge br-badge--active">Tracking</span>
          </div>
          <div className="br-round-title">Syncing round schedule...</div>
          <div className="br-deadline-row">
            <span className="br-deadline-date">Updating status</span>
            <span className="br-countdown-val">⏱ ...</span>
          </div>
        </div>

        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="br-action-btn"
          onClick={(e) => e.stopPropagation()}
        >
          <span>Open Unstop</span>
          <ExternalLinkIcon size={13} color="#FFFFFF" />
        </a>
      </div>
    );
  }

  // Calculate live countdown to the round deadline
  const countdown = getRoundCountdown(currentRound.endDate, nowMs);
  const deadlineFormatted = formatRoundDeadlineDue(currentRound.endDate);
  const roundName = currentRound.title || `Round ${currentRoundIndex}`;

  // Urgency status mapping:
  // 1. Critical (under 2 hours or due very soon) -> Red theme
  // 2. Urgent (under 24 hours / closing soon) -> Amber theme
  // 3. Live or normal active -> Green theme
  let statusTheme = 'normal';
  if (countdown.isCritical) {
    statusTheme = 'due-soon';
  } else if (countdown.isUrgent) {
    statusTheme = 'closing-soon';
  } else if (isLive || countdown.days <= 4) {
    statusTheme = 'live-now';
  }

  return (
    <div
      className={`br-card br-card--${statusTheme}`}
      onClick={() => onOpenDetail && onOpenDetail(competition.id)}
    >
      {/* Top Bar: Logo, Host Name, and Compact Rounded Square Remove Button */}
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

      {/* Competition Title (Clamped to 2 lines) */}
      <h3 className="br-title" title={compTitle}>{compTitle}</h3>

      {/* Hero Inner Box with Clean Layout: Header -> Round Name -> Deadline & Countdown */}
      <div className={`br-hero-box br-hero-box--${statusTheme}`}>
        <div className="br-hero-header">
          <span className="br-stage-tag">
            {totalRounds > 1 ? `ROUND ${currentRoundIndex} OF ${totalRounds}` : 'ACTIVE ROUND'}
          </span>
          {statusTheme === 'due-soon' && (
            <span className="br-badge br-badge--due-soon">Due soon</span>
          )}
          {statusTheme === 'closing-soon' && (
            <span className="br-badge br-badge--closing-soon">Closing soon</span>
          )}
          {statusTheme === 'live-now' && (
            <span className="br-badge br-badge--live-now">
              <span className="br-live-dot" />
              Live now
            </span>
          )}
          {statusTheme === 'normal' && (
            <span className="br-badge br-badge--active">Active</span>
          )}
        </div>

        {/* Clean Bold Round Title without distracting emojis */}
        <div className="br-round-title" title={roundName}>
          {roundName}
        </div>

        {/* Deadline Date on Left, Active Ticking Countdown on Right */}
        <div className="br-deadline-row">
          <span className="br-deadline-date">{deadlineFormatted}</span>
          <span className="br-countdown-val">
            <span className="br-clock-icon">⏱</span>
            <span>{countdown.timerText || countdown.text}</span>
          </span>
        </div>
      </div>

      {/* Subsequent Round Strip (Single line text teaser) */}
      {subsequentRound ? (
        <div className="br-next-row" title={`Next: ${subsequentRound.title}`}>
          <span className="br-next-arrow">→</span>
          <span className="br-next-label">Next: </span>
          <span className="br-next-name">{subsequentRound.title}</span>
          {subsequentRound.endDate && (
            <span className="br-next-date"> · {formatRoundNextDate(subsequentRound.endDate)}</span>
          )}
        </div>
      ) : (
        <div className="br-next-row br-next-row--empty" aria-hidden="true" />
      )}

      {/* Action Button: Full-width vibrant Unstop royal blue button */}
      <a
        href={portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="br-action-btn"
        onClick={(e) => e.stopPropagation()}
      >
        <span>Open Unstop</span>
        <ExternalLinkIcon size={13} color="#FFFFFF" />
      </a>
    </div>
  );
}
