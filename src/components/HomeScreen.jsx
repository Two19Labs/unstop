// src/components/HomeScreen.jsx
import React from 'react';
import { initialsOf, describeFilter, filterName, matchListing } from '../data/initialData';

export default function HomeScreen({
  profile,
  competitions = [],
  alerts = [],
  onOpenAlert,
  onDeleteAlert,
  onAddAlert,
  applications = [],
  posts = [],
  onAcceptApp,
  onRejectApp,
  onGoRequests,
  onGoBrowse
}) {
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'there';
  const totalNew = alerts.reduce((acc, a) => acc + (a.fresh || 0), 0);
  const closingIn72h = competitions.filter(c => c.days <= 3).length;

  const inboxAll = applications.filter(a => a.dir === 'in' && a.status === 'pending');
  const outPending = applications.filter(a => a.dir === 'out' && a.status === 'pending').length;

  const tiles = [
    { label: 'New for you', value: String(totalNew), color: totalNew > 0 ? '#0F3FFE' : '#1A1A19' },
    { label: 'Closing in 72h', value: String(closingIn72h), color: '#1A1A19' },
    { label: 'Applicants waiting', value: String(inboxAll.length), color: inboxAll.length > 0 ? '#0F3FFE' : '#1A1A19' },
    { label: 'Your requests out', value: String(outPending), color: '#1A1A19' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A19' }}>
          Hi {firstName}
        </h1>
        <p style={{ margin: '7px 0 0', fontSize: '14px', color: '#75736C' }}>
          {totalNew > 0
            ? `${totalNew} new competition${totalNew === 1 ? '' : 's'} matched your saved filters since you last looked.`
            : 'Nothing new against your saved filters today.'}
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

      {/* Saved Filters Card */}
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
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1A19' }}>Saved filters</h2>
          <button
            onClick={onAddAlert || onGoBrowse}
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
            Add new
          </button>
        </div>

        {alerts.length === 0 ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>No saved filters yet</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#75736C' }}>
              Set filters in Browse and save them — new matches show up here.
            </p>
          </div>
        ) : (
          alerts.map((al) => {
            const hits = competitions
              .filter(i => matchListing(i, { ...al, q: '' }))
              .sort((x, y) => x.days - y.days);
            const soonest = hits[0];
            const name = filterName(al);
            const rule = `${describeFilter(al)} · ${hits.length} open`;
            const hasFresh = (al.fresh || 0) > 0;
            const soonestText = soonest
              ? `Closing soonest: ${soonest.title} — ${soonest.days} ${soonest.days === 1 ? 'day' : 'days'}`
              : 'Nothing open against this filter right now.';
            const initials = soonest ? initialsOf(soonest.host) : '··';

            return (
              <div
                key={al.id}
                onClick={() => onOpenAlert(al)}
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
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>{name}</span>
                    <span
                      style={{
                        background: hasFresh ? '#0F3FFE' : '#FFFFFF',
                        color: hasFresh ? '#FFFFFF' : '#75736C',
                        border: `1px solid ${hasFresh ? '#0F3FFE' : '#E7E6E2'}`,
                        borderRadius: '20px',
                        padding: '2px 9px',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {hasFresh ? `${al.fresh} new` : 'No change'}
                    </span>
                  </div>

                  <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#75736C' }}>{rule}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '7px' }}>
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
                        {!soonest.logo && <span>{initials}</span>}
                      </span>
                    )}
                    <p style={{ margin: 0, fontSize: '13px', color: '#1A1A19' }}>{soonestText}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAlert(al.id);
                  }}
                  title="Stop alerting"
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
            );
          })
        )}
      </div>
    </div>
  );
}
