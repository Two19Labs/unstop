// src/components/RequestsScreen.jsx
import React, { useState } from 'react';
import { isMockApp, isMockPost } from '../data/initialData';

export default function RequestsScreen({
  applications = [],
  posts = [],
  competitions = [],
  onAccept,
  onDecline,
  onRemove,
  onWithdraw,
  onOpenWhatsApp
}) {
  const [reqTab, setReqTab] = useState('in'); // 'in' | 'out'

  const cleanApps = applications.filter(a => !isMockApp(a));
  const cleanPosts = posts.filter(p => !isMockPost(p));

  const compMap = new Map();
  competitions.forEach(c => compMap.set(c.id, c));

  const postMap = new Map();
  cleanPosts.forEach(p => postMap.set(p.id, p));

  const inCount = cleanApps.filter(a => a.dir === 'in').length;
  const outCount = cleanApps.filter(a => a.dir === 'out').length;

  const currentRows = cleanApps.filter(a => a.dir === reqTab);

  const getStatusLook = (status) => {
    switch (status) {
      case 'accepted':
        return {
          label: 'Accepted',
          bg: 'rgba(22,163,74,0.15)',
          color: '#16A34A',
          border: 'rgba(22,163,74,0.35)'
        };
      case 'rejected':
      case 'declined':
        return {
          label: 'Declined',
          bg: 'var(--surface-muted)',
          color: 'var(--ink-secondary)',
          border: 'var(--line)'
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          bg: 'var(--surface-sunken)',
          color: 'var(--ink-muted)',
          border: 'var(--line)'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '17px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          Requests
        </h1>
        <p style={{ margin: '7px 0 0', fontSize: '14px', color: 'var(--ink-muted)' }}>
          Applications to your squads, and the ones you have sent out.
        </p>
      </div>

      {/* Pill Tabs */}
      <div style={{ display: 'flex', gap: '7px' }}>
        {[
          { id: 'in', label: `To my squads (${inCount})` },
          { id: 'out', label: `Sent by me (${outCount})` }
        ].map((t) => {
          const on = reqTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setReqTab(t.id)}
              style={{
                border: `1px solid ${on ? 'var(--primary)' : 'var(--line)'}`,
                borderRadius: '20px',
                background: on ? 'var(--primary)' : 'var(--surface)',
                color: on ? '#FFFFFF' : 'var(--ink)',
                padding: '8px 15px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 120ms ease'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Requests Card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
        {currentRows.map((app) => {
          const post = postMap.get(app.postId || app.post_id);
          const comp = post ? (competitions.find(c => String(c.id) === String(post.compId) || (post.competition_name && c.title === post.competition_name)) || null) : null;
          const look = getStatusLook(app.status);

          const applicantName = app.applicant_name || app.who || 'Applicant';
          const applicantCollege = app.applicant_college || app.meta || '';
          const compTitle = post?.competition_name || comp?.title || post?.title || app.meta || 'Competition';
          const leadName = post?.created_by_name || post?.lead || 'Squad Lead';

          const whoTitle = app.dir === 'in' ? applicantName : compTitle;
          const subline = app.dir === 'in'
            ? [applicantCollege, compTitle ? `applied to ${compTitle}` : ''].filter(Boolean).join(' · ')
            : `Squad led by ${leadName}`;

          const pitch = app.pitch || app.pitch_note;
          const skills = app.highlighted_skills || app.skills || [];

          return (
            <div
              key={app.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                alignItems: 'start',
                gap: '16px',
                padding: '15px 18px',
                borderBottom: '1px solid var(--line)'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{whoTitle}</span>
                  <span
                    style={{
                      background: look.bg,
                      color: look.color,
                      border: `1px solid ${look.border}`,
                      borderRadius: '20px',
                      padding: '2px 9px',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {look.label}
                  </span>
                </div>

                <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'var(--ink-muted)' }}>{subline}</p>

                {pitch && (
                  <p
                    style={{
                      margin: '9px 0 0',
                      fontSize: '13px',
                      color: 'var(--ink)',
                      lineHeight: 1.5,
                      borderLeft: '2px solid var(--line)',
                      paddingLeft: '11px'
                    }}
                  >
                    {pitch}
                  </p>
                )}

                {skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '9px' }}>
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'var(--surface-muted)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--ink-secondary)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '2px' }}>
                {app.dir === 'in' && app.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onAccept(app.id)}
                      style={{
                        border: '1px solid var(--primary)',
                        borderRadius: '8px',
                        background: 'var(--primary)',
                        color: '#FFFFFF',
                        padding: '8px 13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary)')}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onDecline(app.id)}
                      style={{
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        background: 'var(--surface)',
                        color: 'var(--ink-secondary)',
                        padding: '8px 13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    >
                      Decline
                    </button>
                  </>
                )}

                {app.status === 'accepted' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        if (app.dir === 'out') {
                          onOpenWhatsApp({
                            phone: post?.phone_number || post?.leadPhone,
                            lead: post?.created_by_name || post?.lead
                          });
                        } else {
                          onOpenWhatsApp(app);
                        }
                      }}
                      style={{
                        border: '1px solid #16A34A',
                        borderRadius: '8px',
                        background: '#16A34A',
                        color: '#FFFFFF',
                        padding: '8px 13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      Open WhatsApp
                    </button>
                    {app.dir === 'in' && onRemove && (
                      <button
                        onClick={() => {
                          if (window.confirm('Remove this member from the squad? This will re-open a spot.')) {
                            onRemove(app.id);
                          }
                        }}
                        style={{
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#F87171',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontSize: '13px',
                          fontWeight: 500
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}

                {app.dir === 'out' && app.status === 'pending' && (
                  <button
                    onClick={() => onWithdraw(app.id)}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      background: 'var(--surface)',
                      color: 'var(--ink-secondary)',
                      padding: '8px 13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {currentRows.length === 0 && (
          <div style={{ padding: '38px 18px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Nothing here</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--ink-muted)' }}>
              {reqTab === 'in'
                ? 'No one has applied to your squads yet.'
                : 'You have not requested to join any squad yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
