// src/components/RequestsScreen.jsx
import React, { useState } from 'react';
import { isMockApp, isMockPost } from '../data/initialData';
import CompetitionChatModal from './CompetitionChatModal';
import './RequestsScreen.css';

export default function RequestsScreen({
  applications = [],
  posts = [],
  competitions = [],
  user = null,
  profile = null,
  onAccept,
  onDecline,
  onRemove,
  onWithdraw,
  onOpenWhatsApp
}) {
  const [reqTab, setReqTab] = useState('in'); // 'in' | 'out'
  const [activeChatApp, setActiveChatApp] = useState(null);

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

  const activePost = activeChatApp ? postMap.get(activeChatApp.postId || activeChatApp.post_id) : null;
  const activeComp = activeChatApp
    ? (competitions.find(c =>
        String(c.id) === String(activeChatApp.compId) ||
        c.title === activeChatApp.meta ||
        (activePost?.competition_name && c.title === activePost.competition_name) ||
        (activePost?.compId && String(c.id) === String(activePost.compId))
      ) || null)
    : null;

  return (
    <div className="requests-screen-container">
      {/* Header (desktop only, hidden on mobile) */}
      <div className="requests-desktop-header">
        <h1 className="requests-header-title">
          Inbox
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
                      onClick={() => setActiveChatApp(app)}
                      className="requests-btn-chat"
                      title="Turn-based chat vetting"
                      aria-label="Turn-based chat vetting"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span className="requests-btn-chat-label">Chat</span>
                    </button>
                    <button
                      onClick={() => onDecline(app.id)}
                      className="requests-btn-secondary"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => onAccept(app.id)}
                      className="requests-btn-primary"
                    >
                      Accept
                    </button>
                  </>
                )}

                {app.status === 'accepted' && (
                  <>
                    <button
                      onClick={() => setActiveChatApp(app)}
                      className="requests-btn-chat"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span className="requests-btn-chat-label">Chat</span>
                    </button>
                    {(post?.phone_number || post?.leadPhone || app.phone || app.applicant_phone) && (
                      <button
                        onClick={() => {
                          if (app.dir === 'out') {
                            onOpenWhatsApp({
                              phone: post?.phone_number || post?.leadPhone,
                              lead: post?.created_by_name || post?.lead,
                              displayTitle: compTitle
                            });
                          } else {
                            onOpenWhatsApp({
                              ...app,
                              displayTitle: compTitle
                            });
                          }
                        }}
                        className="requests-btn-whatsapp"
                      >
                        WhatsApp
                      </button>
                    )}
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
                  <>
                    <button
                      onClick={() => setActiveChatApp(app)}
                      className="requests-btn-chat"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span className="requests-btn-chat-label">Chat</span>
                    </button>
                    <button
                      onClick={() => onWithdraw(app.id)}
                      className="requests-btn-secondary"
                    >
                      Withdraw
                    </button>
                  </>
                )}

                {/* If declined/rejected, no action buttons rendered per spec */}
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

      {/* Competition-Scoped Chat Modal */}
      {activeChatApp && (
        <CompetitionChatModal
          isOpen={Boolean(activeChatApp)}
          onClose={() => setActiveChatApp(null)}
          application={activeChatApp}
          post={activePost}
          competition={activeComp}
          currentUser={user}
          profile={profile}
          onAcceptApp={onAccept}
          onDeclineApp={onDecline}
        />
      )}
    </div>
  );
}
