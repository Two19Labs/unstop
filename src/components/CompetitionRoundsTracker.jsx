// src/components/CompetitionRoundsTracker.jsx
import React, { useState, useMemo } from 'react';
import { useCompetitionRounds } from '../hooks/useCompetitionRounds';
import InstitutionLogo from './InstitutionLogo';
import {
  formatRoundDeadlineTime,
  getRoundCountdown,
  useLiveSecondTicker
} from '../utils/roundDeadlineUtils';
import './CompetitionRoundsTracker.css';

// SVG Icons
const ExternalLinkIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const UsersIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BookmarkFilledIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

function formatRoundDateRange(startStr, endStr) {
  if (!endStr) return 'Dates TBA';

  const endD = new Date(endStr);
  if (isNaN(endD.getTime())) return 'Dates TBA';

  const dateOptions = { month: 'short', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

  if (!startStr) {
    return `Due ${endD.toLocaleDateString('en-IN', dateOptions)} (${endD.toLocaleTimeString('en-IN', timeOptions)})`;
  }

  const startD = new Date(startStr);
  const sameDay = startD.toDateString() === endD.toDateString();

  if (sameDay) {
    return `${startD.toLocaleDateString('en-IN', dateOptions)}, ${startD.toLocaleTimeString('en-IN', timeOptions)} – ${endD.toLocaleTimeString('en-IN', timeOptions)}`;
  }

  return `${startD.toLocaleDateString('en-IN', dateOptions)} – ${endD.toLocaleDateString('en-IN', dateOptions)}`;
}

export default function CompetitionRoundsTracker({
  competitions = [],
  onToggleBookmark,
  onFindTeammates,
  onOpenDetail,
  showToast = () => {}
}) {
  const compIds = useMemo(() => competitions.map(c => c.id), [competitions]);
  const { roundsMap, loading, imminentRounds, getRoundsForComp } = useCompetitionRounds(compIds);

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'open' | 'rounds' | 'imminent'
  const [expandedRoundState, setExpandedRoundState] = useState({}); // compId -> selectedRoundId

  const handleToggleExpandRound = (compId, roundId) => {
    setExpandedRoundState(prev => ({
      ...prev,
      [compId]: prev[compId] === roundId ? null : roundId
    }));
  };

  const handleRemoveBookmark = (compId, title) => {
    if (onToggleBookmark) {
      onToggleBookmark(compId);
      showToast(`Removed "${title?.slice(0, 28) || 'Competition'}..." from bookmarks`);
    }
  };

  // Filter out State 3: Auto-remove concluded competitions (all rounds ended)
  // And filter by user selected filter (All Active, Registration Open, Rounds In-Flight, Due in 48h)
  const filteredComps = useMemo(() => {
    const now = Date.now();

    return competitions.filter(comp => {
      const compData = getRoundsForComp(comp.id);

      // Check if registration has closed
      const isRegClosed = compData?.isRegistrationClosed !== undefined
        ? compData.isRegistrationClosed
        : (comp.deadline ? new Date(comp.deadline).getTime() <= now : false);

      // Check if all rounds have concluded (State 3: Auto-Removal)
      if (compData) {
        if (compData.isConcluded) return false;
        if (compData.rounds && compData.rounds.length > 0) {
          const allFinished = compData.rounds.every(r => r.endDate && new Date(r.endDate).getTime() < now);
          if (allFinished) return false;
        }
      } else if (comp.deadline && new Date(comp.deadline).getTime() < now) {
        // If data hasn't loaded yet and deadline was long past with no rounds, treat as closed/check loading
      }

      // Filter tabs
      if (activeFilter === 'open') {
        return !isRegClosed;
      }
      if (activeFilter === 'rounds') {
        return isRegClosed;
      }
      if (activeFilter === 'imminent') {
        if (!compData) return false;
        return compData.rounds.some(r => {
          if (!r.endDate) return false;
          const diff = new Date(r.endDate).getTime() - now;
          return diff > 0 && diff <= 48 * 60 * 60 * 1000;
        });
      }

      return true;
    });
  }, [competitions, roundsMap, activeFilter, getRoundsForComp]);

  const nowMs = useLiveSecondTicker();

  return (
    <div className="rounds-tracker-container">
      {/* 🚨 Urgent Milestone Banner (closing within 48h) */}
      {imminentRounds.length > 0 && (
        <div className="rounds-urgent-banner">
          <span className="rounds-urgent-icon">🚨</span>
          <div className="rounds-urgent-body">
            <div className="rounds-urgent-title">
              <span>Upcoming Milestone: {imminentRounds[0].round.title}</span>
              <span className="rounds-urgent-badge">
                {imminentRounds[0].hoursRemaining <= 1 ? 'Under 1 hour left!' : `In ${imminentRounds[0].hoursRemaining} hrs`}
              </span>
            </div>
            <div className="rounds-urgent-desc">
              <strong>{imminentRounds[0].competitionTitle}</strong> · Closes {new Date(imminentRounds[0].round.endDate).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="rounds-controls-bar">
        <div className="rounds-filter-group">
          <button
            className={`rounds-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Active ({filteredComps.length})
          </button>
          <button
            className={`rounds-filter-btn ${activeFilter === 'open' ? 'active' : ''}`}
            onClick={() => setActiveFilter('open')}
          >
            Registration Open
          </button>
          <button
            className={`rounds-filter-btn ${activeFilter === 'rounds' ? 'active' : ''}`}
            onClick={() => setActiveFilter('rounds')}
          >
            Rounds In-Flight
          </button>
          <button
            className={`rounds-filter-btn ${activeFilter === 'imminent' ? 'active' : ''}`}
            onClick={() => setActiveFilter('imminent')}
          >
            Due in 48h ({imminentRounds.length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && Object.keys(roundsMap).length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-secondary)', fontSize: '13px' }}>
          Syncing round schedules and deadlines directly from Unstop...
        </div>
      )}

      {/* Competitions Pipeline List */}
      {filteredComps.map(comp => {
        const compData = getRoundsForComp(comp.id);
        const isRegClosed = compData?.isRegistrationClosed !== undefined
          ? compData.isRegistrationClosed
          : (comp.deadline ? new Date(comp.deadline).getTime() <= nowMs : false);

        const rounds = compData?.rounds || [
          {
            order: 0,
            title: 'Registration',
            type: 'registration',
            typeEmoji: '📝',
            endDate: comp.deadline,
            status: isRegClosed ? 'completed' : 'live',
            displayText: comp.remainDaysText
          }
        ];

        const selectedRoundId = expandedRoundState[comp.id] || (compData?.nextRound?.id || rounds[0]?.id);
        const selectedRound = rounds.find(r => r.id === selectedRoundId) || rounds[0];

        return (
          <div key={comp.id} className={`rounds-comp-card ${isRegClosed ? 'is-in-flight' : 'is-reg-open'}`}>
            {/* Header */}
            <div className="rounds-comp-header">
              <div className="rounds-comp-main">
                <div className="rounds-comp-logo">
                  <InstitutionLogo
                    logoUrl={comp.logo || comp.orgLogo}
                    hostName={comp.host || comp.orgName}
                    size={46}
                  />
                </div>
                <div className="rounds-comp-info">
                  <div className="rounds-comp-title-row">
                    <span
                      className="rounds-comp-title"
                      onClick={() => onOpenDetail && onOpenDetail(comp.id)}
                    >
                      {comp.title}
                    </span>
                  </div>
                  <div className="rounds-comp-meta">
                    <span>{comp.host || comp.orgName}</span>
                    <span>•</span>
                    <span className="rounds-comp-tag">{comp.circuit || 'DU Circuit'}</span>
                    <span className="rounds-comp-tag">{comp.discipline || 'Case Comp'}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{comp.prizes || comp.prize || 'Recognition'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="rounds-comp-actions">
                {/* STATE 1: If registration is still open, allow squad finding */}
                {!isRegClosed && (
                  <button
                    className="rounds-btn-action"
                    onClick={() => onFindTeammates && onFindTeammates(comp)}
                    title="Find teammates / recruit squad"
                  >
                    <UsersIcon size={14} />
                    <span>Find Teammates</span>
                  </button>
                )}

                {/* Remove from bookmarks immediately */}
                <button
                  className="rounds-btn-icon active"
                  onClick={() => handleRemoveBookmark(comp.id, comp.title)}
                  title="Remove from Bookmarks"
                >
                  <BookmarkFilledIcon size={16} />
                </button>
              </div>
            </div>

            {/* ── STATE 1: PRE-REGISTRATION (REGISTRATION IS OPEN) ── */}
            {!isRegClosed ? (
              <div className="rounds-pre-reg-box">
                <div className="rounds-pre-reg-info">
                  <div className="rounds-pre-reg-item">
                    <span className="rounds-pre-reg-label">⏰ Registration Deadline</span>
                    <span className="rounds-pre-reg-value">
                      {comp.deadline ? new Date(comp.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'Ongoing'}
                      <span className="rounds-reg-countdown"> ({comp.remainDaysText || 'Open'})</span>
                    </span>
                  </div>

                  <div className="rounds-pre-reg-item">
                    <span className="rounds-pre-reg-label">👥 Team Size Requirement</span>
                    <span className="rounds-pre-reg-value">
                      {comp.team || comp.teamSizeDisplay || 'Solo / Team'}
                    </span>
                  </div>
                </div>

                <div className="rounds-pre-reg-actions">
                  <span className="rounds-pre-reg-note">
                    ℹ️ Later round deadlines & guidelines will unlock here once registrations close.
                  </span>

                  <a
                    href={comp.unstopUrl || 'https://unstop.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounds-btn-apply"
                  >
                    <span>Apply / Register on Unstop</span>
                    <ExternalLinkIcon size={13} />
                  </a>
                </div>
              </div>
            ) : (
              /* ── STATE 2: POST-REGISTRATION (ROUNDS IN-FLIGHT TRACKER) ── */
              <div className="rounds-inflight-wrapper">
                {/* Next Action Bar & Progress */}
                <div className="rounds-next-action-bar">
                  <div className="rounds-next-left">
                    <span className="rounds-status-tag-closed">🔒 Registration Closed</span>
                    <span>⚡ Next Up:</span>
                    <span className="rounds-next-title">
                      {compData?.nextRound?.title || compData?.nextDeadlineLabel || 'Round'}
                      {(() => {
                        const targetEndDate = compData?.nextRound?.endDate || compData?.nextDeadline;
                        if (!targetEndDate) return null;
                        const cd = getRoundCountdown(targetEndDate, nowMs);
                        return (
                          <span style={{ color: cd.isCritical ? '#e11d48' : (cd.isUrgent ? '#d97706' : 'var(--ink-secondary)'), marginLeft: '6px', fontWeight: 700 }}>
                            ({cd.text})
                          </span>
                        );
                      })()}
                    </span>
                  </div>

                  <div className="rounds-progress-track">
                    <div className="rounds-progress-bar-bg">
                      <div
                        className="rounds-progress-bar-fill"
                        style={{ width: `${compData?.progressPercent || 0}%` }}
                      />
                    </div>
                    <span className="rounds-progress-text">
                      {compData?.completedStages || 0} of {rounds.length} stages completed
                    </span>
                  </div>
                </div>

                {/* Visual Pipeline Stepper */}
                <div className="rounds-pipeline-wrapper">
                  <div className="rounds-pipeline">
                    {rounds.map((rnd, idx) => {
                      const isSelected = selectedRoundId === rnd.id;
                      const isCompleted = rnd.status === 'completed';
                      const isLive = rnd.status === 'live';

                      return (
                        <div
                          key={rnd.id || idx}
                          className={`rounds-stage-item ${isCompleted ? 'completed' : ''} ${isLive ? 'live' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleExpandRound(comp.id, rnd.id)}
                        >
                          {idx > 0 && (
                            <div className={`rounds-stage-connector ${isCompleted ? 'completed' : ''}`} />
                          )}
                          <div className="rounds-stage-node">
                            {isCompleted ? '✓' : rnd.typeEmoji || (idx + 1)}
                          </div>
                          <div className="rounds-stage-title">
                            {rnd.title}
                          </div>
                          <div className="rounds-stage-timing">
                            {rnd.endDate ? new Date(rnd.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA'}
                          </div>
                          <div className={`rounds-stage-pill ${rnd.status}`}>
                            {rnd.status === 'live' ? '🔥 Live' : rnd.status === 'completed' ? 'Done' : rnd.status === 'upcoming' ? 'Next' : 'TBA'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Stage Expanded Guidelines */}
                {selectedRound && (() => {
                  const stageCountdown = getRoundCountdown(selectedRound.endDate, nowMs);
                  const stageDeadline = formatRoundDeadlineTime(selectedRound.endDate);

                  return (
                    <div className="rounds-stage-expanded-box">
                      <div className="rounds-expanded-header">
                        <div className="rounds-expanded-title">
                          <span>{selectedRound.typeEmoji || '🎯'}</span>
                          <span>{selectedRound.title}</span>
                        </div>
                        <div className="rounds-expanded-timing-badge">
                          {formatRoundDateRange(selectedRound.startDate, selectedRound.endDate)}
                        </div>
                      </div>

                      <div className="rounds-expanded-meta-chips">
                        {selectedRound.typeLabel && (
                          <span className="rounds-meta-chip">{selectedRound.typeLabel}</span>
                        )}
                        {selectedRound.duration && (
                          <span className="rounds-meta-chip">⏱️ Duration: {selectedRound.duration}</span>
                        )}
                        {selectedRound.totalQuestions && (
                          <span className="rounds-meta-chip">❓ {selectedRound.totalQuestions} Questions</span>
                        )}
                      </div>

                      {/* Emphasized Round Deadline & Live Ticking Countdown (NO descriptions) */}
                      {selectedRound.endDate && (
                        <div className="rounds-stage-deadline-hero">
                          <div className="rounds-stage-deadline-info">
                            <span className="rounds-stage-deadline-label">Round Deadline</span>
                            <span className="rounds-stage-deadline-val">{stageDeadline}</span>
                          </div>
                          <div className={`rounds-stage-countdown-banner ${stageCountdown.urgency}`}>
                            <span>⏱️</span>
                            <span>{stageCountdown.text}</span>
                          </div>
                        </div>
                      )}

                      <div className="rounds-expanded-actions">
                        <button
                          className="rounds-btn-text"
                          onClick={() => onOpenDetail && onOpenDetail(comp.id)}
                        >
                          View Full Details
                        </button>
                        {selectedRound.publicUrl && (
                          <a
                            href={selectedRound.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounds-btn-primary"
                          >
                            <span>Open Round on Unstop</span>
                            <ExternalLinkIcon size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
