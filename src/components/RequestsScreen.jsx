// src/components/RequestsScreen.jsx
import React, { useState } from 'react';
import { isMockApp, isMockPost } from '../data/initialData';
import './RequestsScreen.css';

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
    <div className="requests-screen-container">
      {/* Header */}
      <div>
        <h1 className="requests-header-title">
          Requests
        </h1>
        <p className="requests-header-sub">
          Applications to your squads, and the ones you have sent out.
        </p>
      </div>

      {/* Pill Tabs */}
      <div className="requests-pill-tabs">
        {[
          { id: 'in', label: `To my squads (${inCount})` },
          { id: 'out', label: `Sent by me (${outCount})` }
        ].map((t) => {
          const on = reqTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setReqTab(t.id)}
              className={`requests-tab-btn ${on ? 'active' : ''}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Requests Card Container */}
      <div className="requests-card-container">
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
            <div key={app.id} className="requests-row">
              <div className="requests-row-left">
                <div className="requests-row-title-row">
                  <span className="requests-row-who">{whoTitle}</span>
                  <span
                    className="requests-status-badge"
                    style={{
                      background: look.bg,
                      color: look.color,
                      border: `1px solid ${look.border}`,
                    }}
                  >
                    {look.label}
                  </span>
                </div>

                <p className="requests-row-subline">{subline}</p>

                {pitch && (
                  <p className="requests-row-pitch">
                    {pitch}
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="requests-skills-list">
                    {skills.map((s, idx) => (
                      <span key={idx} className="requests-skill-chip">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="requests-row-actions">
                {app.dir === 'in' && app.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onAccept(app.id)}
                      className="requests-btn-primary"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onDecline(app.id)}
                      className="requests-btn-secondary"
                    >
                      Decline
                    </button>
                  </>
                )}

                {app.status === 'accepted' && (
                  <>
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
                      className="requests-btn-whatsapp"
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
                        className="requests-btn-remove"
                      >
                        Remove
                      </button>
                    )}
                  </>
                )}

                {app.dir === 'out' && app.status === 'pending' && (
                  <button
                    onClick={() => onWithdraw(app.id)}
                    className="requests-btn-secondary"
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
          <div className="requests-empty-state">
            <p className="requests-empty-title">Nothing here</p>
            <p className="requests-empty-desc">
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
