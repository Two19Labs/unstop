// src/components/HomeScreen.jsx
import React from 'react';
import { initialsOf, describeFilter, filterName, matchListing } from '../data/initialData';

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
  onGoBrowse
}) {
  const firstName = typeof profile?.name === 'string' && profile.name.trim() ? profile.name.trim().split(/\s+/)[0] : 'there';
  const activeFilter = savedFilter || { disc: [], circ: [], team: 'any', fee: 'any', q: '' };
  const hasFilterActive = (activeFilter.disc && activeFilter.disc.length > 0) ||
    (activeFilter.circ && activeFilter.circ.length > 0) ||
    (activeFilter.team && activeFilter.team !== 'any') ||
    (activeFilter.fee && activeFilter.fee !== 'any') ||
    Boolean(activeFilter.q && activeFilter.q.trim());

  const matchedComps = competitions
    .filter(i => matchListing(i, activeFilter))
    .sort((x, y) => (x.days || 999) - (y.days || 999));
  const soonest = matchedComps[0];
  const closingIn72h = competitions.filter(c => (c.days || 999) <= 3).length;

  const inboxAll = applications.filter(a => a.dir === 'in' && a.status === 'pending');
  const outPending = applications.filter(a => a.dir === 'out' && a.status === 'pending').length;

  const tiles = [
    {
      label: hasFilterActive ? 'Matches for you' : 'Open opportunities',
      value: String(hasFilterActive ? matchedComps.length : competitions.length),
      color: '#0F3FFE'
    },
    { label: 'Closing in 72h', value: String(closingIn72h), color: '#1A1A19' },
    { label: 'Applicants waiting', value: String(inboxAll.length), color: inboxAll.length > 0 ? '#0F3FFE' : '#1A1A19' },
    { label: 'Your requests out', value: String(outPending), color: '#1A1A19' }
  ];

  const subline = hasFilterActive
    ? `${matchedComps.length} competition${matchedComps.length === 1 ? '' : 's'} match your auto-saved filter (${describeFilter(activeFilter)}).`
    : 'Showing all live collegiate opportunities. Filters selected in Browse auto-save here.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A19' }}>
          Hi {firstName}
        </h1>
        <p style={{ margin: '7px 0 0', fontSize: '14px', color: '#75736C' }}>
          {subline}
        </p>
      </div>

      {/* Stat Tiles */}
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

      {/* Needs Your Response Card */}
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
                fontWeight: 500
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
            const who = [app.applicant_name || app.who, app.applicant_college || app.meta].filter(Boolean).join(' · ');
            const compTitle = comp?.title || post?.competition_name || post?.title || 'Your squad';
            const sub = `${compTitle}${(app.highlighted_skills || app.skills)?.length ? ` · ${(app.highlighted_skills || app.skills).join(', ')}` : ''}`;

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
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#75736C' }}>{sub}</p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onAcceptApp(app.id)}
                    style={{
                      border: '1px solid #0F3FFE',
                      borderRadius: '8px',
                      background: '#0F3FFE',
                      color: '#FFFFFF',
                      padding: '8px 13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onRejectApp(app.id)}
                    style={{
                      border: '1px solid #E7E6E2',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      color: '#55534D',
                      padding: '8px 13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: '13px',
                      fontWeight: 500
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

      {/* Saved Filter Card */}
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
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1A19' }}>Your saved filter</h2>
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
            {hasFilterActive && onResetFilter && (
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

        {hasFilterActive ? (
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '10px' }}>
              {soonest && (
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    border: '1px solid #EFEEEA',
                    backgroundColor: soonest.logo ? '#FFFFFF' : '#F2F1ED',
                    backgroundImage: soonest.logo ? `url("${soonest.logo}")` : 'none',
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
                  {!soonest.logo && <span>{initialsOf(soonest.host)}</span>}
                </span>
              )}
              <p style={{ margin: 0, fontSize: '13px', color: '#1A1A19' }}>
                {soonest
                  ? `Closing soonest: ${soonest.title} — ${soonest.days} ${soonest.days === 1 ? 'day' : 'days'}`
                  : 'Nothing open against this filter right now.'}
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={onGoBrowse}
            style={{
              padding: '28px 18px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>
              Showing all competitions
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#75736C' }}>
              Any filters you select in Browse will automatically save here. Click to customize.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
