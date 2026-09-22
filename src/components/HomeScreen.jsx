// src/components/HomeScreen.jsx
// Two19 Labs — OneStop Competitor Alert Desk (Option 1 Design Spec)
import React, { useState, useEffect, useMemo } from 'react';
import { initialsOf, describeFilter, filterName, matchListing } from '../data/initialData';
import { ClockIcon, ExternalLinkIcon, TrophyIcon, UsersIcon, BookmarkIcon, ZapIcon } from './icons';

const SAVED_ALERTS_KEY = 'onestop_saved_alerts';

const INITIAL_ALERTS = [
  {
    id: 'al_du',
    name: 'DU Circuit Case Comps',
    disc: ['Case'],
    circ: ['DU Circuit'],
    win: 'any',
    team: 'any',
    fee: 'any',
    fresh: 0
  },
  {
    id: 'al_hack',
    name: 'Tier-1 Tech & Hackathons',
    disc: ['Hackathon'],
    circ: ['IIM / IIT'],
    win: 'any',
    team: 'any',
    fee: 'any',
    fresh: 0
  },
  {
    id: 'al_corp',
    name: 'Corporate Flagships',
    disc: ['Case'],
    circ: ['Corporate'],
    win: 'any',
    team: 'any',
    fee: 'free',
    fresh: 0
  }
];

export default function HomeScreen({
  profile,
  competitions = [],
  savedFilter = null,
  onResetFilter,
  applications = [],
  posts = [],
  onAcceptApp,
  onRejectApp,
  onGoRequests,
  onGoBrowse,
  onApplyFilterAndBrowse,
  onOpenDetail,
  onFindTeammates,
  bookmarks = [],
  onToggleBookmark,
  user
}) {
  const firstName = typeof profile?.name === 'string' && profile.name.trim()
    ? profile.name.trim().split(/\s+/)[0]
    : 'there';

  // 1. Saved Alerts Multi-Stream State
  const [alerts, setAlerts] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_ALERTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved alerts:', e);
    }
    return INITIAL_ALERTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_ALERTS_KEY, JSON.stringify(alerts));
    } catch (e) {}
  }, [alerts]);

  const handleDeleteAlert = (alertId, e) => {
    e.stopPropagation();
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // 2. Active filter evaluation
  const activeFilter = savedFilter || { disc: [], circ: [], team: 'any', fee: 'any', q: '' };
  const hasFilterActive = (activeFilter.disc && activeFilter.disc.length > 0) ||
    (activeFilter.circ && activeFilter.circ.length > 0) ||
    (activeFilter.team && activeFilter.team !== 'any') ||
    (activeFilter.fee && activeFilter.fee !== 'any') ||
    Boolean(activeFilter.q && activeFilter.q.trim());

  const matchedComps = useMemo(() => {
    return competitions
      .filter(i => matchListing(i, activeFilter))
      .sort((x, y) => (x.days || 999) - (y.days || 999));
  }, [competitions, activeFilter]);

  const closingIn72hComps = useMemo(() => {
    return competitions
      .filter(c => (c.days || 999) <= 3)
      .sort((x, y) => (x.days || 999) - (y.days || 999));
  }, [competitions]);

  const closingIn72h = closingIn72hComps.length;

  const inboxAll = applications.filter(a => a.dir === 'in' && a.status === 'pending');
  const outPending = applications.filter(a => a.dir === 'out' && a.status === 'pending').length;

  const totalNew = alerts.reduce((acc, a) => acc + (a.fresh || 0), 0);

  // 3. Stat Tiles Data
  const tiles = [
    {
      label: totalNew > 0 ? 'New for you' : (hasFilterActive ? 'Matches for you' : 'Open opportunities'),
      value: String(totalNew > 0 ? totalNew : (hasFilterActive ? matchedComps.length : competitions.length)),
      color: (totalNew > 0 || hasFilterActive) ? '#0F3FFE' : '#1A1A19'
    },
    {
      label: 'Closing in 72h',
      value: String(closingIn72h),
      color: closingIn72h > 0 ? '#1A1A19' : '#75736C'
    },
    {
      label: 'Applicants waiting',
      value: String(inboxAll.length),
      color: inboxAll.length > 0 ? '#0F3FFE' : '#1A1A19'
    },
    {
      label: 'Your requests out',
      value: String(outPending),
      color: '#1A1A19'
    }
  ];

  // 4. Header subline text
  const subline = totalNew > 0
    ? `${totalNew} new competition${totalNew === 1 ? '' : 's'} matched your saved filters since you last looked.`
    : hasFilterActive
      ? `${matchedComps.length} competition${matchedComps.length === 1 ? '' : 's'} match your auto-saved filter (${describeFilter(activeFilter)}).`
      : 'Showing all live collegiate opportunities. Filters selected in Browse auto-save here.';

  const handleOpenAlert = (alert) => {
    if (onApplyFilterAndBrowse) {
      onApplyFilterAndBrowse({
        disc: alert.disc || [],
        circ: alert.circ || [],
        team: alert.team || 'any',
        fee: alert.fee || 'any',
        q: alert.q || '',
        win: alert.win || 'any'
      });
    } else if (onGoBrowse) {
      onGoBrowse();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── 01 // Header ── */}
      <div>
        <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A19' }}>
          Hi {firstName}
        </h1>
        <p style={{ margin: '7px 0 0', fontSize: '14px', color: '#75736C', textWrap: 'pretty' }}>
          {subline}
        </p>
      </div>

      {/* ── 02 // Stat Tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(146px, 1fr))', gap: '12px' }}>
        {tiles.map((tile, i) => (
          <div
            key={i}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E7E6E2',
              borderRadius: '12px',
              padding: '15px 17px'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>{tile.label}</div>
            <div
              style={{
                marginTop: '6px',
                fontSize: '25px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: tile.color
              }}
            >
              {tile.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── 03 // Needs Your Response Card (Only shown when pending applicants exist) ── */}
      {inboxAll.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E7E6E2', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              padding: '14px 18px',
              borderBottom: '1px solid #E7E6E2'
            }}
          >
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1A19' }}>Needs your response</h2>
            <button
              onClick={onGoRequests}
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#1A1A19',
                padding: '6px 11px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'background 120ms ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1ED')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              All requests
            </button>
          </div>

          {inboxAll.slice(0, 2).map((app) => {
            const post = posts.find(p => p.id === (app.postId || app.post_id));
            const comp = post ? competitions.find(c => c.id === post.compId || (post.competition_name && c.title === post.competition_name)) : null;
            const initials = initialsOf(comp?.host || post?.organizer || 'OneStop');
            const who = [app.applicant_name || app.who, app.applicant_college || app.meta, app.applicant_year].filter(Boolean).join(' · ');
            const compTitle = comp?.title || post?.competition_name || post?.title || 'Your squad';
            const skillsList = app.highlighted_skills || app.skills || [];
            const sub = `${compTitle}${skillsList.length ? ` · ${skillsList.join(', ')}` : ''}`;

            return (
              <div
                key={app.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '34px minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: '13px',
                  padding: '14px 18px',
                  borderBottom: '1px solid #F0EFEB'
                }}
              >
                <span
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: '1px solid #EFEEEA',
                    backgroundColor: comp?.logo ? '#FFFFFF' : '#F2F1ED',
                    backgroundImage: comp?.logo ? `url("${comp.logo}")` : 'none',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    color: '#55534D',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {!comp?.logo && <span>{initials}</span>}
                </span>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>{who}</div>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#75736C' }}>{sub}</p>
                  {app.pitch && (
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: '12px',
                        color: '#55534D',
                        fontStyle: 'italic',
                        borderLeft: '2px solid #E7E6E2',
                        paddingLeft: '8px',
                        lineHeight: 1.4
                      }}
                    >
                      "{app.pitch}"
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onAcceptApp && onAcceptApp(app.id)}
                    style={{
                      border: '1px solid #0F3FFE',
                      borderRadius: '8px',
                      background: '#0F3FFE',
                      color: '#FFFFFF',
                      padding: '8px 13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: '13px',
                      fontWeight: 600,
                      transition: 'background 120ms ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onRejectApp && onRejectApp(app.id)}
                    style={{
                      border: '1px solid #E7E6E2',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      color: '#55534D',
                      padding: '8px 13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'background 120ms ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1ED')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 04 // Saved Filters Alert Center ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E7E6E2', borderRadius: '12px', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            padding: '14px 18px',
            borderBottom: '1px solid #E7E6E2'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1A19' }}>Saved filters</h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#0F3FFE',
                background: 'rgba(15, 63, 254, 0.08)',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(15, 63, 254, 0.25)'
              }}
            >
              Alerts Active
            </span>
          </div>
          <button
            onClick={onGoBrowse}
            style={{
              border: '1px solid #E7E6E2',
              borderRadius: '8px',
              background: '#FFFFFF',
              color: '#1A1A19',
              padding: '6px 11px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1ED')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            Add new
          </button>
        </div>

        {alerts.length > 0 ? (
          alerts.map((al) => {
            const hits = competitions
              .filter(i => matchListing(i, {
                disc: al.disc || [],
                circ: al.circ || [],
                win: al.win || 'any',
                team: al.team || 'any',
                fee: al.fee || 'any',
                q: al.q || ''
              }))
              .sort((x, y) => (x.days || 999) - (y.days || 999));

            const soonest = hits[0];
            const hasNew = (al.fresh || 0) > 0;
            const logoUrl = soonest?.logo || null;
            const hostInitials = initialsOf(soonest?.host || 'OneStop');

            return (
              <div
                key={al.id}
                onClick={() => handleOpenAlert(al)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 18px',
                  borderBottom: '1px solid #F0EFEB',
                  cursor: 'pointer',
                  transition: 'background 120ms ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAF8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>
                      {al.name || filterName(al)}
                    </span>
                    <span
                      style={{
                        background: hasNew ? '#0F3FFE' : '#FFFFFF',
                        color: hasNew ? '#FFFFFF' : '#75736C',
                        border: `1px solid ${hasNew ? '#0F3FFE' : '#E7E6E2'}`,
                        borderRadius: '20px',
                        padding: '2px 9px',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {hasNew ? `${al.fresh} new` : `${hits.length} open`}
                    </span>
                  </div>

                  <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#75736C' }}>
                    {describeFilter(al)} · {hits.length} open
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '8px' }}>
                    {soonest && (
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '7px',
                          border: '1px solid #EFEEEA',
                          backgroundColor: logoUrl ? '#FFFFFF' : '#F2F1ED',
                          backgroundImage: logoUrl ? `url("${logoUrl}")` : 'none',
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          color: '#55534D',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: 'none',
                          fontSize: '10px',
                          fontWeight: 700
                        }}
                      >
                        {!logoUrl && <span>{hostInitials}</span>}
                      </span>
                    )}
                    <p style={{ margin: 0, fontSize: '13px', color: '#1A1A19' }}>
                      {soonest
                        ? `Closing soonest: ${soonest.title} — ${soonest.days} ${soonest.days === 1 ? 'day' : 'days'}`
                        : 'Nothing open against this filter right now.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteAlert(al.id, e)}
                  title="Stop alerting"
                  style={{
                    border: '1px solid #E7E6E2',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#75736C',
                    width: '30px',
                    height: '30px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    transition: 'all 120ms ease'
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
            );
          })
        ) : (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>
              No saved filters yet
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#75736C' }}>
              Set filters in Browse and save them — new matches show up here.
            </p>
            <button
              onClick={onGoBrowse}
              style={{
                marginTop: '14px',
                border: '1px solid #0F3FFE',
                borderRadius: '8px',
                background: '#0F3FFE',
                color: '#FFFFFF',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Browse opportunities
            </button>
          </div>
        )}
      </div>

      {/* ── 05 // Auto-Saved Active Filter Card (if active filter differs from alerts) ── */}
      {hasFilterActive && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E7E6E2', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              padding: '14px 18px',
              borderBottom: '1px solid #E7E6E2'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1A19' }}>Active Browse Filter</h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#0F3FFE',
                  background: '#EEF2FF',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #DBEAFE'
                }}
              >
                ✓ Auto-saved
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onResetFilter && (
                <button
                  onClick={onResetFilter}
                  style={{
                    border: '1px solid #E7E6E2',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#75736C',
                    padding: '6px 11px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F2F1ED'; e.currentTarget.style.color = '#1A1A19'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#75736C'; }}
                >
                  Clear filter
                </button>
              )}
              <button
                onClick={onGoBrowse}
                style={{
                  border: '1px solid #0F3FFE',
                  borderRadius: '8px',
                  background: '#0F3FFE',
                  color: '#FFFFFF',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
              >
                Open in Browse →
              </button>
            </div>
          </div>

          <div
            onClick={onGoBrowse}
            style={{
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAF8')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A19' }}>
                {filterName(activeFilter)}
              </span>
              <span
                style={{
                  background: matchedComps.length > 0 ? '#0F3FFE' : '#F2F1ED',
                  color: matchedComps.length > 0 ? '#FFFFFF' : '#75736C',
                  borderRadius: '20px',
                  padding: '2px 9px',
                  fontSize: '11px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                {matchedComps.length} matching
              </span>
            </div>

            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#75736C' }}>
              {describeFilter(activeFilter)}
              {activeFilter.q ? ` · Query: "${activeFilter.q}"` : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── 06 // Urgent Spotlight: Closing in 72h ── */}
      {closingIn72hComps.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E7E6E2', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              padding: '14px 18px',
              borderBottom: '1px solid #E7E6E2'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1A19' }}>
                Closing within 72 hours
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0F3FFE',
                  background: 'rgba(15, 63, 254, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15, 63, 254, 0.35)'
                }}
              >
                {closingIn72hComps.length} urgent
              </span>
            </div>
            <button
              onClick={onGoBrowse}
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#1A1A19',
                padding: '6px 11px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1ED')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              View all
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {closingIn72hComps.slice(0, 3).map((comp) => {
              const initial = initialsOf(comp.host || 'OS');
              const isBookmarked = bookmarks.includes(String(comp.id));
              const daysLeft = comp.days || 0;
              const deadlineText = daysLeft === 0 ? 'Closes today' : `${daysLeft}d left`;

              return (
                <div
                  key={comp.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px minmax(0, 1fr) auto',
                    alignItems: 'center',
                    gap: '13px',
                    padding: '14px 18px',
                    borderBottom: '1px solid #F0EFEB',
                    transition: 'background 120ms ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAF8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid #EFEEEA',
                      backgroundColor: comp.logo ? '#FFFFFF' : '#F2F1ED',
                      backgroundImage: comp.logo ? `url("${comp.logo}")` : 'none',
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      color: '#55534D',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    {!comp.logo && <span>{initial}</span>}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        onClick={() => onOpenDetail && onOpenDetail(comp.id)}
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1A1A19',
                          cursor: 'pointer'
                        }}
                      >
                        {comp.title}
                      </span>
                      <span
                        style={{
                          background: 'rgba(15, 63, 254, 0.08)',
                          color: '#0F3FFE',
                          border: '1px solid rgba(15, 63, 254, 0.35)',
                          borderRadius: '12px',
                          padding: '1px 7px',
                          fontSize: '11px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {deadlineText}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: '#75736C', flexWrap: 'wrap' }}>
                      <span>{comp.host || 'Collegiate Open'}</span>
                      <span>·</span>
                      <span>{comp.circuit || 'DU Circuit'}</span>
                      <span>·</span>
                      <span style={{ fontWeight: 600, color: '#1A1A19' }}>{comp.prize || 'Certificates'}</span>
                      <span>·</span>
                      <span>{comp.team || 'Solo / Team'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {onToggleBookmark && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(comp.id);
                        }}
                        style={{
                          border: '1px solid #E7E6E2',
                          borderRadius: '8px',
                          background: isBookmarked ? '#F2F1ED' : '#FFFFFF',
                          color: isBookmarked ? '#0F3FFE' : '#75736C',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title={isBookmarked ? 'Remove saved' : 'Save competition'}
                      >
                        <BookmarkIcon size={14} filled={isBookmarked} />
                      </button>
                    )}

                    {onFindTeammates && (
                      <button
                        type="button"
                        onClick={() => onFindTeammates(comp)}
                        style={{
                          border: '1px solid #E7E6E2',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          color: '#1A1A19',
                          padding: '7px 11px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1ED')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        <ZapIcon size={11} />
                        <span>Squad Up</span>
                      </button>
                    )}

                    <a
                      href={comp.unstopUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        border: '1px solid #0F3FFE',
                        borderRadius: '8px',
                        background: '#0F3FFE',
                        color: '#FFFFFF',
                        padding: '7px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                        transition: 'background 120ms ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
                    >
                      <span>Apply</span>
                      <ExternalLinkIcon size={11} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 07 // Two19 Labs Unstop Only Curation Banner ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap',
          background: '#FFFFFF',
          border: '1px solid #E7E6E2',
          borderRadius: '12px',
          padding: '14px 18px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#0F3FFE',
              color: '#FFFFFF',
              borderRadius: '5px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap'
            }}
          >
            UNSTOP ONLY
          </span>
          <span style={{ fontSize: '13px', color: '#55534D' }}>
            Curated strictly for undergraduate eligibility, synced directly from Unstop. External opportunities are not shown.
          </span>
        </div>

        <button
          onClick={onGoBrowse}
          style={{
            border: '1px solid #E7E6E2',
            borderRadius: '8px',
            background: '#FFFFFF',
            color: '#1A1A19',
            padding: '7px 13px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1ED')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
        >
          <span>Open Full Directory</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
