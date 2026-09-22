// src/components/HomeScreen.jsx — OneStop Home Filter-Driven Rails
import React, { useMemo } from 'react';
import { initialsOf, matchListing, formatDeadlineDateTime, formatDeadlineCountdown, getUrgencyLevel } from '../data/initialData';
import InstitutionLogo from './InstitutionLogo';
import {
  TrophyIcon,
  UsersIcon,
  CalendarIcon,
  FlameIcon,
  ClockIcon,
  ExternalLinkIcon
} from './icons';
import './HomeScreen.css';

const CARDS_PER_RAIL = 3;

function getUrgencyConfig(urgencyLevel) {
  if (urgencyLevel === 'red') {
    return {
      border: '1px solid rgba(239, 68, 68, 0.40)',
      background: 'rgba(239, 68, 68, 0.10)',
      color: '#DC2626',
      dotColor: '#EF4444'
    };
  }
  if (urgencyLevel === 'yellow') {
    return {
      border: '1px solid rgba(245, 158, 11, 0.40)',
      background: 'rgba(245, 158, 11, 0.12)',
      color: '#B45309',
      dotColor: '#F59E0B'
    };
  }
  return {
    border: '1px solid rgba(15, 63, 254, 0.35)',
    background: 'rgba(15, 63, 254, 0.08)',
    color: '#0F3FFE',
    dotColor: '#0F3FFE'
  };
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'recently';
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function HomeScreen({
  profile,
  competitions = [],
  savedFilter = null,
  onResetFilter,
  applications = [],
  posts = [],
  onGoBrowse,
  onOpenDetail,
  onFindTeammates,
  onSquadUp,
  bookmarks = [],
  onToggleBookmark,
  user,
  onNavigate,
  onRequestJoin,
  onOpenWhatsApp
}) {
  const firstName = typeof profile?.name === 'string' && profile.name.trim()
    ? profile.name.trim().split(/\s+/)[0]
    : (user?.email ? user.email.split('@')[0] : 'there');

  // Navigation helpers
  const handleNavigate = (targetScreen) => {
    if (onNavigate) {
      onNavigate(targetScreen);
    } else if (targetScreen === 'browse' && onGoBrowse) {
      onGoBrowse();
    }
  };

  // Derive active filter chips for filter strip and subline
  const filterChips = useMemo(() => {
    if (!savedFilter) return [];
    const chips = [];
    if (Array.isArray(savedFilter.disc) && savedFilter.disc.length > 0) {
      chips.push(...savedFilter.disc);
    }
    if (Array.isArray(savedFilter.circ) && savedFilter.circ.length > 0) {
      chips.push(...savedFilter.circ);
    }
    if (savedFilter.team === 'solo') {
      chips.push('Solo');
    } else if (savedFilter.team === 'team') {
      chips.push('Teams (2+)');
    }
    if (savedFilter.fee === 'free') {
      chips.push('Free entry');
    } else if (savedFilter.fee === 'paid') {
      chips.push('Paid entry');
    }
    if (typeof savedFilter.q === 'string' && savedFilter.q.trim()) {
      chips.push(`"${savedFilter.q.trim()}"`);
    }
    return chips;
  }, [savedFilter]);

  const hasFilter = filterChips.length > 0;

  // 1. Bookmarks Rail (Filters do NOT apply here; sorted by soonest deadline)
  const bookmarkIds = useMemo(() => (Array.isArray(bookmarks) ? bookmarks.map(String) : []), [bookmarks]);

  const allBookmarkComps = useMemo(() => {
    return competitions
      .filter(c => bookmarkIds.includes(String(c.id)))
      .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));
  }, [competitions, bookmarkIds]);

  const bookmarkTotal = allBookmarkComps.length;
  const displayedBookmarks = allBookmarkComps.slice(0, CARDS_PER_RAIL);

  // 2. Top Competitions Rail (Matches saved Browse filter, closing soonest first)
  const allFilteredComps = useMemo(() => {
    return competitions
      .filter(c => matchListing(c, savedFilter || {}))
      .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));
  }, [competitions, savedFilter]);

  const compTotal = allFilteredComps.length;
  const displayedComps = allFilteredComps.slice(0, CARDS_PER_RAIL);

  // 3. Top Squads Rail (Open teams recruiting for filtered competitions)
  const allFilteredSquads = useMemo(() => {
    return posts.filter(post => {
      const spotsLeft = post.spots_left !== undefined
        ? Number(post.spots_left)
        : (post.spots !== undefined ? Number(post.spots) : 1);
      const isOpen = post.is_open !== false && post.status !== 'closed' && spotsLeft > 0;
      if (!isOpen) return false;

      if (!hasFilter) return true;

      // Find linked competition to evaluate filter
      const comp = competitions.find(c =>
        String(c.id) === String(post.compId) ||
        (post.competition_name && c.title && c.title.toLowerCase() === post.competition_name.toLowerCase())
      );

      if (comp) {
        return matchListing(comp, savedFilter);
      }

      // Fallback evaluation if competition isn't in current list
      const fallbackComp = {
        title: post.competition_name || post.title || '',
        host: post.organizer || '',
        discipline: post.category || 'Case',
        circuit: 'DU Circuit',
        days: 7,
        fee: 'Free'
      };
      return matchListing(fallbackComp, savedFilter);
    });
  }, [posts, competitions, savedFilter, hasFilter]);

  const squadTotal = allFilteredSquads.length;
  const displayedSquads = allFilteredSquads.slice(0, CARDS_PER_RAIL);

  // Subline calculation
  const subline = hasFilter
    ? `${compTotal} competitions and ${squadTotal} squads match your Browse filter — ${filterChips.map(c => c.toLowerCase()).join(' · ')}.`
    : `${compTotal} competitions and ${squadTotal} squads open right now.`;

  return (
    <div className="home-container">
      {/* 1. Greeting Section */}
      <div className="home-greeting-block">
        <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A19' }}>
          Hi {firstName}
        </h1>
        <p style={{ margin: '7px 0 0', fontSize: '14px', color: '#75736C', textWrap: 'pretty' }}>
          {subline}
        </p>
      </div>

      {/* 2. Filter Strip (Visible only when filter is saved) */}
      {hasFilter && (
        <div className="home-filter-strip">
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#75736C', whiteSpace: 'nowrap' }}>
            Your Browse filter
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {filterChips.map((chip, idx) => (
              <span
                key={idx}
                style={{
                  background: '#0F3FFE',
                  color: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap'
                }}
              >
                {chip}
              </span>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: '#75736C', whiteSpace: 'nowrap' }}>
            Every row below follows it
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => handleNavigate('browse')}
              className="home-btn-hover"
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#1A1A19',
                padding: '7px 12px',
                fontSize: '13px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              Edit in Browse
            </button>
            <button
              onClick={onResetFilter}
              className="home-clear-btn"
              style={{
                border: 0,
                background: 'transparent',
                color: '#75736C',
                padding: '7px 4px',
                fontSize: '13px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 3. Bookmarks Rail */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em', color: '#1A1A19' }}>
            Bookmarks
          </h2>
          <span
            style={{
              background: '#E7E6E2',
              color: '#55534D',
              borderRadius: '20px',
              padding: '2px 9px',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            {bookmarkTotal}
          </span>
          <span style={{ fontSize: '12px', color: '#75736C', whiteSpace: 'nowrap' }}>
            Soonest deadline first · filters don't apply
          </span>
          <button
            onClick={() => handleNavigate('saved')}
            className="home-btn-hover"
            style={{
              marginLeft: 'auto',
              border: '1px solid #E7E6E2',
              borderRadius: '9px',
              background: '#FFFFFF',
              color: '#1A1A19',
              padding: '8px 13px',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            More →
          </button>
        </div>

        <div className="rail">
          {displayedBookmarks.length === 0 ? (
            <div
              style={{
                flex: '1 1 100%',
                background: '#FFFFFF',
                border: '1px dashed #D6D4CE',
                borderRadius: '12px',
                padding: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <span style={{ fontSize: '13px', color: '#75736C' }}>
                Nothing saved yet. Bookmark a competition and it shows up here.
              </span>
              <button
                onClick={() => handleNavigate('browse')}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#0F3FFE',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Browse competitions →
              </button>
            </div>
          ) : (
            <>
              {displayedBookmarks.map(b => {
                const countdownText = formatDeadlineCountdown(b.deadline, b.remainDaysText, b.days);
                const urgencyLevel = getUrgencyLevel(b.deadline, b.remainDaysText, b.days);
                const urgencyConfig = getUrgencyConfig(urgencyLevel);
                const deadlineFormatted = formatDeadlineDateTime(b.deadline);
                const isFree = b.isFree ?? (typeof b.fee === 'string' ? b.fee.toLowerCase().includes('free') : true);
                const registeredCount = Number(b.regs || b.registeredCount || 0);
                const feeText = isFree ? 'Free Entry' : (b.fee ? (b.fee.toLowerCase().includes('entry') ? b.fee : `${b.fee} Entry`) : 'Paid');
                const teamText = b.team || b.teamSizeDisplay || 'Solo / Team';
                const prizeText = (b.prize || b.prizes || 'Certificates & Recognition').replace(/Cash Pool/gi, 'Prize Pool');

                return (
                  <div
                    key={b.id}
                    className={`home-rail-card card-urgency-${urgencyLevel}`}
                    onClick={() => onOpenDetail && onOpenDetail(b.id)}
                    style={{
                      flex: '0 0 302px',
                      width: '302px',
                      padding: '16px 17px 17px',
                      gap: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Top Bar: Host Profile & Remove Bookmark Button */}
                    <div style={{ display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) auto', alignItems: 'start', gap: '10px' }}>
                      <InstitutionLogo
                        logo={b.logo || b.orgLogo}
                        name={b.host}
                        size={36}
                        borderRadius={8}
                        fontSize={12}
                      />
                      <div style={{ minWidth: 0 }}>
                        <span
                          title={b.host}
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#55534D',
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textWrap: 'pretty'
                          }}
                        >
                          {b.host}
                        </span>
                      </div>
                      <button
                        title="Remove bookmark"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(b.id);
                        }}
                        className="home-btn-remove"
                        style={{
                          border: '1px solid #E7E6E2',
                          borderRadius: '8px',
                          background: '#F2F1ED',
                          color: '#55534D',
                          width: '28px',
                          height: '28px',
                          flex: 'none',
                          fontSize: '14px',
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Competition Title */}
                    <h3
                      title={b.title}
                      style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: 700,
                        lineHeight: 1.35,
                        letterSpacing: '-0.01em',
                        color: '#1A1A19',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '42px',
                        textWrap: 'pretty'
                      }}
                    >
                      {b.title}
                    </h3>

                    {/* Featured Prize & Entry Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.22)',
                        borderRadius: '10px',
                        padding: '8px 12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
                        <TrophyIcon size={14} color="#059669" />
                        <span
                          title={prizeText}
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#047857',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {prizeText}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '5px',
                          letterSpacing: '0.2px',
                          flexShrink: 0,
                          background: isFree ? '#FFFFFF' : '#F2F1ED',
                          color: isFree ? '#059669' : '#55534D',
                          border: isFree ? '1px solid rgba(16, 185, 129, 0.32)' : '1px solid #E7E6E2'
                        }}
                      >
                        {feeText}
                      </span>
                    </div>

                    {/* Metadata: Format & Exact Deadline (Specs Row) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#55534D',
                        fontWeight: 600,
                        minHeight: '20px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }} title={teamText}>
                        <UsersIcon size={13} color="#55534D" />
                        <span>{teamText}</span>
                      </div>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#C9C7C1', flexShrink: 0 }} />
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={deadlineFormatted ? `Exact Deadline: ${deadlineFormatted}` : undefined}
                      >
                        <CalendarIcon size={13} color="#55534D" />
                        <span>{deadlineFormatted ? `Ends ${deadlineFormatted}` : (b.mode || 'Online')}</span>
                      </div>
                    </div>

                    {/* Social Proof & Deadline Status (Metrics Row) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minHeight: '22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#75736C' }}>
                        {registeredCount > 0 ? (
                          <>
                            <FlameIcon size={13} color="#f97316" />
                            <span>
                              <strong style={{ color: '#1A1A19' }}>{registeredCount.toLocaleString()}</strong> registrations
                            </span>
                          </>
                        ) : (
                          <span style={{ color: '#0F3FFE', fontWeight: 600, fontSize: '11px' }}>Recently Listed</span>
                        )}
                      </div>

                      <span
                        title={deadlineFormatted ? `Exact Deadline: ${deadlineFormatted}` : undefined}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          border: urgencyConfig.border,
                          borderRadius: '20px',
                          background: urgencyConfig.background,
                          color: urgencyConfig.color,
                          padding: '3px 9px',
                          fontSize: '11px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: urgencyConfig.dotColor,
                            display: 'inline-block'
                          }}
                        />
                        <ClockIcon size={11} color={urgencyConfig.color} />
                        <span>{countdownText}</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                      <a
                        href={b.unstopUrl || 'https://unstop.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="home-btn-primary-hover"
                        style={{
                          border: '1px solid #0F3FFE',
                          borderRadius: '9px',
                          background: '#0F3FFE',
                          color: '#FFFFFF',
                          padding: '9px 10px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          textDecoration: 'none'
                        }}
                      >
                        <span>Apply</span>
                        <ExternalLinkIcon size={12} color="#FFFFFF" />
                      </a>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSquadUp) onSquadUp(b);
                          else if (onFindTeammates) onFindTeammates(b);
                        }}
                        className="home-btn-hover"
                        style={{
                          border: '1px solid #E7E6E2',
                          borderRadius: '9px',
                          background: '#FFFFFF',
                          color: '#1A1A19',
                          padding: '9px 10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        <UsersIcon size={13} color="#1A1A19" />
                        <span>Squad up</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 4th Card: More Bookmarks */}
              {(bookmarkTotal > displayedBookmarks.length || bookmarkTotal >= 3) && (
                <div
                  className="home-rail-card home-more-card"
                  onClick={() => handleNavigate('saved')}
                  style={{
                    flex: '0 0 302px',
                    width: '302px',
                  padding: '16px 17px 17px',
                  gap: '12px',
                  cursor: 'pointer',
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF9F6 100%)',
                  border: '1px solid #E7E6E2',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9px',
                      background: 'rgba(15, 63, 254, 0.08)',
                      border: '1px solid rgba(15, 63, 254, 0.20)',
                      color: '#0F3FFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                    </svg>
                  </div>
                  <span
                    style={{
                      background: 'rgba(15, 63, 254, 0.08)',
                      color: '#0F3FFE',
                      border: '1px solid rgba(15, 63, 254, 0.25)',
                      borderRadius: '20px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {bookmarkTotal > displayedBookmarks.length
                      ? `+${bookmarkTotal - displayedBookmarks.length} more`
                      : `${bookmarkTotal} saved`}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', margin: 'auto 0' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0F3FFE' }}>
                    Saved List
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A1A19', lineHeight: 1.35, letterSpacing: '-0.01em' }}>
                    More Bookmarks
                  </h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#75736C', lineHeight: 1.45 }}>
                    Explore all your bookmarked competitions, review upcoming deadlines, and organize your squad entries.
                  </p>
                </div>

                <div
                  className="home-more-btn"
                  style={{
                    marginTop: 'auto',
                    border: '1px solid #0F3FFE',
                    borderRadius: '9px',
                    background: 'rgba(15, 63, 254, 0.06)',
                    color: '#0F3FFE',
                    padding: '9px 12px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Explore all ({bookmarkTotal})</span>
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>→</span>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </section>

      {/* 4. Top Competitions Rail */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em', color: '#1A1A19' }}>
            Top competitions
          </h2>
          <span
            style={{
              background: '#0F3FFE',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '2px 9px',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            {compTotal} match
          </span>
          <span style={{ fontSize: '12px', color: '#75736C', whiteSpace: 'nowrap' }}>
            Closing soonest first
          </span>
          <button
            onClick={() => handleNavigate('browse')}
            className="home-btn-hover"
            style={{
              marginLeft: 'auto',
              border: '1px solid #E7E6E2',
              borderRadius: '9px',
              background: '#FFFFFF',
              color: '#1A1A19',
              padding: '8px 13px',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            More →
          </button>
        </div>

        <div className="rail">
          {displayedComps.length === 0 ? (
            <div
              style={{
                flex: '1 1 100%',
                background: '#FFFFFF',
                border: '1px dashed #D6D4CE',
                borderRadius: '12px',
                padding: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <span style={{ fontSize: '13px', color: '#75736C' }}>
                No competitions match your filter.
              </span>
              <button
                onClick={() => handleNavigate('browse')}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#0F3FFE',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Edit in Browse →
              </button>
            </div>
          ) : (
            displayedComps.map(c => {
              const isFree = c.fee === 'Free' || c.isFree;
              const deadlineFormatted = formatDeadlineDateTime(c.deadline);
              const countdownText = formatDeadlineCountdown(c.deadline, c.remainDaysText, c.days);
              const urgencyLevel = getUrgencyLevel(c.deadline, c.remainDaysText, c.days);
              const urgencyConfig = getUrgencyConfig(urgencyLevel);
              const registeredCount = Number(c.regs || c.registeredCount || 0);
              const feeText = isFree ? 'Free Entry' : (c.fee ? (c.fee.toLowerCase().includes('entry') ? c.fee : `${c.fee} Entry`) : 'Paid');
              const teamText = c.team || c.teamSizeDisplay || 'Solo / Team';
              const prizeText = (c.prize || c.prizes || 'Certificates & Recognition').replace(/Cash Pool/gi, 'Prize Pool');

              return (
                <div
                  key={c.id}
                  className={`home-rail-card card-urgency-${urgencyLevel}`}
                  onClick={() => onOpenDetail && onOpenDetail(c.id)}
                  style={{
                    flex: '0 0 302px',
                    width: '302px',
                    padding: '16px 17px 17px',
                    gap: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {/* Top Bar: Host Profile */}
                  <div style={{ display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr)', alignItems: 'start', gap: '11px' }}>
                    <InstitutionLogo
                      logo={c.logo || c.orgLogo}
                      name={c.host}
                      size={40}
                      borderRadius={9}
                      fontSize={12}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#55534D', lineHeight: 1.35, paddingTop: '2px', textWrap: 'pretty' }}>
                      {c.host}
                    </span>
                  </div>

                  {/* Competition Title */}
                  <h3
                    title={c.title}
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 700,
                      lineHeight: 1.35,
                      letterSpacing: '-0.01em',
                      color: '#1A1A19',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '42px',
                      textWrap: 'pretty'
                    }}
                  >
                    {c.title}
                  </h3>

                  {/* Featured Prize & Entry Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.22)',
                      borderRadius: '10px',
                      padding: '8px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
                      <TrophyIcon size={14} color="#059669" />
                      <span
                        title={prizeText}
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#047857',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {prizeText}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '5px',
                        letterSpacing: '0.2px',
                        flexShrink: 0,
                        background: isFree ? '#FFFFFF' : '#F2F1ED',
                        color: isFree ? '#059669' : '#55534D',
                        border: isFree ? '1px solid rgba(16, 185, 129, 0.32)' : '1px solid #E7E6E2'
                      }}
                    >
                      {feeText}
                    </span>
                  </div>

                  {/* Metadata: Format & Exact Deadline (Specs Row) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#55534D',
                      fontWeight: 600,
                      minHeight: '20px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }} title={teamText}>
                      <UsersIcon size={13} color="#55534D" />
                      <span>{teamText}</span>
                    </div>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#C9C7C1', flexShrink: 0 }} />
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={deadlineFormatted ? `Exact Deadline: ${deadlineFormatted}` : undefined}
                    >
                      <CalendarIcon size={13} color="#55534D" />
                      <span>{deadlineFormatted ? `Ends ${deadlineFormatted}` : (c.mode || 'Online')}</span>
                    </div>
                  </div>

                  {/* Social Proof & Deadline Status (Metrics Row) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minHeight: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#75736C' }}>
                      {registeredCount > 0 ? (
                        <>
                          <FlameIcon size={13} color="#f97316" />
                          <span>
                            <strong style={{ color: '#1A1A19' }}>{registeredCount.toLocaleString()}</strong> registrations
                          </span>
                        </>
                      ) : (
                        <span style={{ color: '#0F3FFE', fontWeight: 600, fontSize: '11px' }}>Recently Listed</span>
                      )}
                    </div>

                    <span
                      title={deadlineFormatted ? `Exact Deadline: ${deadlineFormatted}` : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: urgencyConfig.border,
                        borderRadius: '20px',
                        background: urgencyConfig.background,
                        color: urgencyConfig.color,
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: urgencyConfig.dotColor,
                          display: 'inline-block'
                        }}
                      />
                      <ClockIcon size={11} color={urgencyConfig.color} />
                      <span>{countdownText}</span>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                    <a
                      href={c.unstopUrl || 'https://unstop.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="home-btn-primary-hover"
                      style={{
                        border: '1px solid #0F3FFE',
                        borderRadius: '9px',
                        background: '#0F3FFE',
                        color: '#FFFFFF',
                        padding: '9px 10px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        textDecoration: 'none'
                      }}
                    >
                      <span>Apply</span>
                      <ExternalLinkIcon size={12} color="#FFFFFF" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSquadUp) onSquadUp(c);
                        else if (onFindTeammates) onFindTeammates(c);
                      }}
                      className="home-btn-hover"
                      style={{
                        border: '1px solid #E7E6E2',
                        borderRadius: '9px',
                        background: '#FFFFFF',
                        color: '#1A1A19',
                        padding: '9px 10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <UsersIcon size={13} color="#1A1A19" />
                      <span>Squad up</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 5. Top Squads Rail */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em', color: '#1A1A19' }}>
            Top squads
          </h2>
          <span
            style={{
              background: '#0F3FFE',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '2px 9px',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            {squadTotal} match
          </span>
          <span style={{ fontSize: '12px', color: '#75736C', whiteSpace: 'nowrap' }}>
            Recruiting now
          </span>
          <button
            onClick={() => handleNavigate('teams')}
            className="home-btn-hover"
            style={{
              marginLeft: 'auto',
              border: '1px solid #E7E6E2',
              borderRadius: '9px',
              background: '#FFFFFF',
              color: '#1A1A19',
              padding: '8px 13px',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            More →
          </button>
        </div>

        <div className="rail">
          {displayedSquads.length === 0 ? (
            <div
              style={{
                flex: '1 1 100%',
                background: '#FFFFFF',
                border: '1px dashed #D6D4CE',
                borderRadius: '12px',
                padding: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <span style={{ fontSize: '13px', color: '#75736C' }}>
                No squads recruiting for these competitions yet.
              </span>
              <button
                onClick={() => handleNavigate('teams')}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#0F3FFE',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Post a squad →
              </button>
            </div>
          ) : (
            displayedSquads.map(s => {
              const spots = s.spots_left !== undefined
                ? Number(s.spots_left)
                : (s.spots !== undefined ? Number(s.spots) : 1);
              const isUrgent = spots <= 1;
              const spotsText = spots === 1 ? '1 spot left' : `${spots} spots left`;
              const postedText = s.posted || formatRelativeTime(s.created_at);
              const leadName = s.created_by_name || s.lead || 'Student Lead';
              const leadInitial = leadName ? leadName.charAt(0).toUpperCase() : 'S';
              const leadCollege = (s.college || profile?.college || 'University').trim();
              const leadYear = s.year || profile?.batch || 'Undergrad';
              const compTitle = s.competition_name || s.comp || s.title || 'Competition Challenge';
              const compHost = s.organizer || s.compHost || 'Host Institution';
              const linkedComp = competitions.find(c =>
                String(c.id) === String(s.compId || s.comp_id) ||
                (s.competition_name && c.title && c.title.toLowerCase() === s.competition_name.toLowerCase())
              );
              const compLogo = s.compLogo || s.logo || (linkedComp ? (linkedComp.logo || linkedComp.orgLogo) : null);
              const skills = Array.isArray(s.skills_looking_for)
                ? s.skills_looking_for
                : (Array.isArray(s.want) ? s.want : (Array.isArray(s.skills) ? s.skills : []));

              // User's relationship to post
              const isMine = Boolean(
                s.mine ||
                (user && s.user_id && s.user_id === user.id) ||
                (user && s.created_by_email && s.created_by_email.toLowerCase() === (user.email || '').toLowerCase()) ||
                (profile?.name && leadName.toLowerCase() === profile.name.toLowerCase())
              );

              const userApp = applications.find(a =>
                String(a.postId || a.post_id) === String(s.id) &&
                (a.dir === 'out' || (user && a.applicant_id === user.id) || (user && a.applicant_email === user.email))
              );

              const isAccepted = userApp && userApp.status === 'accepted';
              const isRequested = userApp && (userApp.status === 'pending' || s.state === 'requested');

              return (
                <div
                  key={s.id}
                  className="home-rail-card"
                  style={{
                    flex: '0 0 302px',
                    width: '302px',
                    padding: '16px 17px 17px',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span
                      style={
                        isUrgent
                          ? {
                              background: 'rgba(15,63,254,0.08)',
                              color: '#0F3FFE',
                              border: '1px solid rgba(15,63,254,0.35)',
                              borderRadius: '20px',
                              padding: '2px 9px',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap'
                            }
                          : {
                              background: 'rgba(15,63,254,0.07)',
                              color: '#0F3FFE',
                              border: '1px solid rgba(15,63,254,0.20)',
                              borderRadius: '20px',
                              padding: '2px 9px',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap'
                            }
                      }
                    >
                      {spotsText}
                    </span>
                    <span style={{ fontSize: '12px', color: '#75736C', whiteSpace: 'nowrap' }}>
                      {postedText}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#0F3FFE',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        flex: 'none'
                      }}
                    >
                      {leadInitial}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A19' }}>
                          {leadName}
                        </span>
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#16A34A',
                            display: 'inline-block'
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '12px', color: '#75736C', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {leadCollege} · {leadYear}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #F0EFEB', paddingTop: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#75736C', textTransform: 'uppercase' }}>
                      Competing in
                    </span>
                    <h3 style={{ margin: '3px 0 0', fontSize: '15px', fontWeight: 700, color: '#1A1A19', lineHeight: 1.35, textWrap: 'pretty' }}>
                      {compTitle}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <InstitutionLogo
                        logo={compLogo}
                        name={compHost}
                        size={20}
                        borderRadius={5}
                        fontSize={9}
                      />
                      <span style={{ fontSize: '12px', color: '#55534D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {compHost}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#75736C' }}>
                      Teammates needed with:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                      {skills.length > 0 ? (
                        skills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              background: 'rgba(15,63,254,0.08)',
                              color: '#0F3FFE',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: '#75736C' }}>All roles welcome</span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #F0EFEB' }}>
                    {isMine ? (
                      <button
                        onClick={() => handleNavigate('requests')}
                        className="home-btn-hover"
                        style={{
                          width: '100%',
                          border: '1px solid #E7E6E2',
                          borderRadius: '9px',
                          background: '#FFFFFF',
                          color: '#1A1A19',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Manage squad
                      </button>
                    ) : isAccepted ? (
                      <button
                        onClick={() => onOpenWhatsApp && onOpenWhatsApp(s)}
                        className="home-btn-primary-hover"
                        style={{
                          width: '100%',
                          border: '1px solid #1A1A19',
                          borderRadius: '9px',
                          background: '#1A1A19',
                          color: '#FFFFFF',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Open WhatsApp
                      </button>
                    ) : isRequested ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          border: '1px solid #E7E6E2',
                          borderRadius: '9px',
                          background: '#F9F9F7',
                          color: '#75736C',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'default'
                        }}
                      >
                        Requested — pending
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (onRequestJoin) onRequestJoin(s);
                          else handleNavigate('teams');
                        }}
                        className="home-btn-primary-hover"
                        style={{
                          width: '100%',
                          border: '1px solid #0F3FFE',
                          borderRadius: '9px',
                          background: '#0F3FFE',
                          color: '#FFFFFF',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Request to join
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
