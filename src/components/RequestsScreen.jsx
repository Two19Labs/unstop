// src/components/RequestsScreen.jsx
import React, { useState } from 'react';

export default function RequestsScreen({
  applications = [],
  posts = [],
  competitions = [],
  onAccept,
  onDecline,
  onWithdraw,
  onOpenWhatsApp
}) {
  const [reqTab, setReqTab] = useState('in'); // 'in' | 'out'

  const compMap = new Map();
  competitions.forEach(c => compMap.set(c.id, c));

  const postMap = new Map();
  posts.forEach(p => postMap.set(p.id, p));

  const inCount = applications.filter(a => a.dir === 'in').length;
  const outCount = applications.filter(a => a.dir === 'out').length;

  const currentRows = applications.filter(a => a.dir === reqTab);

  const getStatusLook = (status) => {
    switch (status) {
      case 'accepted':
        return {
          label: 'Accepted',
          bg: 'rgba(23,163,74,0.09)',
          color: '#15803D',
          border: 'rgba(23,163,74,0.35)'
        };
      case 'rejected':
      case 'declined':
        return {
          label: 'Declined',
          bg: '#F2F1ED',
          color: '#55534D',
          border: '#E7E6E2'
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          bg: '#FFFFFF',
          color: '#75736C',
          border: '#E7E6E2'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '17px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A19' }}>
          Requests
        </h1>
        <p style={{ margin: '7px 0 0', fontSize: '14px', color: '#75736C' }}>
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
                border: `1px solid ${on ? '#0F3FFE' : '#E7E6E2'}`,
                borderRadius: '20px',
                background: on ? '#0F3FFE' : '#FFFFFF',
                color: on ? '#FFFFFF' : '#1A1A19',
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
      <div style={{ background: '#FFFFFF', border: '1px solid #E7E6E2', borderRadius: '12px', overflow: 'hidden' }}>
        {currentRows.map((app) => {
          const post = postMap.get(app.postId);
          const comp = post ? compMap.get(post.compId) : null;
          const look = getStatusLook(app.status);

          const whoTitle = app.dir === 'in' ? app.who : (comp ? comp.title : app.meta);
          const subline = app.dir === 'in'
            ? `${app.meta || ''}${comp ? ` · applied to ${comp.title}` : ''}`
            : (post ? `Squad led by ${post.lead}` : app.meta);

          return (
            <div
              key={app.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                alignItems: 'start',
                gap: '16px',
                padding: '15px 18px',
                borderBottom: '1px solid #F0EFEB'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>{whoTitle}</span>
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

                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#75736C' }}>{subline}</p>

                {app.pitch && (
                  <p
                    style={{
                      margin: '9px 0 0',
                      fontSize: '13px',
                      color: '#55534D',
                      lineHeight: 1.5,
                      borderLeft: '2px solid #E7E6E2',
                      paddingLeft: '11px'
                    }}
                  >
                    {app.pitch}
                  </p>
                )}

                {app.skills && app.skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '9px' }}>
                    {app.skills.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#F2F1ED',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: '#55534D',
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
                      onClick={() => onDecline(app.id)}
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
                  </>
                )}

                {app.status === 'accepted' && (
                  <button
                    onClick={() => onOpenWhatsApp(app)}
                    style={{
                      border: '1px solid #1A1A19',
                      borderRadius: '8px',
                      background: '#1A1A19',
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
                )}

                {app.dir === 'out' && app.status === 'pending' && (
                  <button
                    onClick={() => onWithdraw(app.id)}
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
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>Nothing here</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#75736C' }}>
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
