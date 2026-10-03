import React, { useState } from 'react';
import { isMockApp, isMockPost } from '../data/initialData';
import { useAuth, formatWhatsAppUrl } from '../context/AuthContext';
import './RequestsScreen.css';

// "3:48 pm" today, "Yesterday", or "12 Oct"
function formatPreviewTime(at) {
  const d = new Date(at);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

// Inbox: join requests and chat requests, to my squads and sent by me.
// Contact rules: WhatsApp-mode squads never have in-app chat; chat-mode squads
// never show a phone number.
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
  onOpenWhatsApp,
  showToast
}) {
  const [reqTab, setReqTab] = useState('in'); // 'in' | 'out'
  const [reaskConvId, setReaskConvId] = useState(null);
  const [reaskIntro, setReaskIntro] = useState('');
  const [busyId, setBusyId] = useState(null);

  const {
    openAuthModal,
    squadConversations = [],
    requestSquadChat,
    respondToChatRequest,
    cancelChatRequest,
    openChat,
    chatSummaries = {},
  } = useAuth();

  const unreadFor = (convId) => Number(chatSummaries[convId]?.unread) || 0;
  const chatLabel = (convId, base) => (unreadFor(convId) > 0 ? `${base} (${unreadFor(convId)})` : base);

  const notify = (msg) => {
    if (showToast) showToast(msg);
  };

  const cleanApps = applications.filter(a => !isMockApp(a));
  const cleanPosts = posts.filter(p => !isMockPost(p));

  const postMap = new Map();
  cleanPosts.forEach(p => postMap.set(String(p.id), p));

  const convs = squadConversations.filter(c => c.status !== 'cancelled');

  // One list per tab, join requests and chat requests together, newest first
  const rowsFor = (dir) => {
    const joinRows = cleanApps
      .filter(a => a.dir === dir)
      .map(a => ({ kind: 'join', id: `join_${a.id}`, app: a, at: a.updated_at || a.created_at }));
    const chatRows = convs
      .filter(c => (dir === 'in' ? c.role === 'host' : c.role === 'member'))
      .map(c => ({ kind: 'chat', id: `chat_${c.id}`, conv: c, at: chatSummaries[c.id]?.last_message_at || c.last_message_at || c.updated_at || c.created_at }));
    return [...joinRows, ...chatRows].sort((x, y) => {
      const ux = x.kind === 'chat' && unreadFor(x.conv.id) > 0 ? 1 : 0;
      const uy = y.kind === 'chat' && unreadFor(y.conv.id) > 0 ? 1 : 0;
      if (ux !== uy) return uy - ux;
      return new Date(y.at || 0) - new Date(x.at || 0);
    });
  };

  const inRows = rowsFor('in');
  const outRows = rowsFor('out');
  const currentRows = reqTab === 'in' ? inRows : outRows;


  const acceptedConvFor = (postId, memberId) =>
    squadConversations.find(c => String(c.post_id) === String(postId) && c.member_id === memberId && c.status === 'accepted');

  const getStatusLook = (status) => {
    switch (status) {
      case 'accepted':
        return { label: 'Accepted', bg: 'rgba(22,163,74,0.15)', color: '#16A34A', border: 'rgba(22,163,74,0.35)' };
      case 'rejected':
      case 'declined':
        return { label: 'Declined', bg: 'var(--surface-muted)', color: 'var(--ink-secondary)', border: 'var(--line)' };
      case 'removed':
        return { label: 'Removed', bg: 'var(--surface-muted)', color: 'var(--ink-secondary)', border: 'var(--line)' };
      case 'pending':
      case 'requested':
      default:
        return { label: 'Pending', bg: 'var(--surface-sunken)', color: 'var(--ink-muted)', border: 'var(--line)' };
    }
  };

  const runChatAction = async (id, fn, successMsg) => {
    setBusyId(id);
    try {
      await fn();
      if (successMsg) notify(successMsg);
    } catch (err) {
      notify(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReask = async (conv) => {
    const intro = reaskIntro.trim();
    if (!intro) {
      notify('Add a short intro so the host knows who you are.');
      return;
    }
    await runChatAction(conv.id, () => requestSquadChat(conv.post_id, intro), 'Chat request sent again');
    setReaskConvId(null);
    setReaskIntro('');
  };

  const openApplicantWhatsApp = (app, compTitle) => {
    const url = formatWhatsAppUrl(
      app.applicant_phone,
      `Hey ${(app.applicant_name || '').split(' ')[0]}! Reaching out about your request to join our squad for "${compTitle}" on OneStop.`
    );
    if (url && url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
    else notify('This applicant has no valid WhatsApp number yet.');
  };

  if (!user) {
    return (
      <div className="requests-screen-container">
        <div className="requests-desktop-header">
          <h1 className="requests-header-title">Inbox</h1>
          <p className="requests-header-sub">
            Requests to your squads, and the ones you have sent out.
          </p>
        </div>
        <div className="requests-empty-state" style={{ padding: '64px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p className="requests-empty-title" style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#0F172A' }}>
            Sign in to view your requests
          </p>
          <p className="requests-empty-desc" style={{ maxWidth: '380px', margin: '0 0 20px 0', color: '#64748B', fontSize: '13.5px', lineHeight: 1.45 }}>
            Track join and chat requests for your squads and follow up on squads you've reached out to.
          </p>
          <button
            type="button"
            className="onestop-auth-submit-btn"
            style={{ width: 'auto', padding: '10px 24px' }}
            onClick={() => {
              if (openAuthModal) {
                openAuthModal({
                  title: 'Sign In to View Requests',
                  subtitle: 'Bookmark competitions, track every round, and find a squad.',
                  initialTab: 'signin'
                });
              }
            }}
          >
            Sign in / Sign up
          </button>
        </div>
      </div>
    );
  }

  const renderJoinRow = (app) => {
    const post = postMap.get(String(app.postId || app.post_id));
    const isWhatsApp = (post?.comm_method || 'whatsapp') === 'whatsapp';
    const look = getStatusLook(app.status);
    const applicantName = app.applicant_name || app.who || 'Applicant';
    const applicantCollege = app.applicant_college || app.meta || '';
    const compTitle = post?.competition_name || post?.title || app.meta || 'Competition';
    const leadName = post?.created_by_name || post?.lead || 'Squad host';
    const whoTitle = app.dir === 'in' ? applicantName : compTitle;
    const subline = app.dir === 'in'
      ? [applicantCollege, `wants to join your ${compTitle} squad`].filter(Boolean).join(' · ')
      : `Squad hosted by ${leadName}`;
    const pitch = app.pitch || app.pitch_note;
    const skills = app.highlighted_skills || app.skills || [];
    const showApplicantPhone = app.dir === 'in' && isWhatsApp && app.applicant_phone && (app.status === 'pending' || app.status === 'accepted');
    const memberConv = post ? acceptedConvFor(post.id, app.dir === 'in' ? app.applicant_id : user.id) : null;

    return (
      <div key={`join_${app.id}`} className="requests-row">
        <div className="requests-row-left">
          <div className="requests-row-title-row">
            <span className="requests-row-who">{whoTitle}</span>
            <span className="requests-kind-tag">Join request</span>
            <span className="requests-status-badge" style={{ background: look.bg, color: look.color, border: `1px solid ${look.border}` }}>
              {look.label}
            </span>
          </div>
          <p className="requests-row-subline">{subline}</p>
          {pitch && <p className="requests-row-pitch">{pitch}</p>}
          {skills.length > 0 && (
            <div className="requests-skills-list">
              {skills.map((s, idx) => (
                <span key={idx} className="requests-skill-chip">{s}</span>
              ))}
            </div>
          )}
          {showApplicantPhone && (
            <p className="requests-row-phone">WhatsApp: {app.applicant_phone}</p>
          )}
        </div>

        <div className="requests-row-actions">
          {showApplicantPhone && (
            <button onClick={() => openApplicantWhatsApp(app, compTitle)} className="requests-btn-whatsapp">
              WhatsApp
            </button>
          )}

          {app.dir === 'in' && app.status === 'pending' && (
            <>
              <button onClick={() => onDecline(app.id)} className="requests-btn-secondary">Decline</button>
              <button onClick={() => onAccept(app.id)} className="requests-btn-primary">Accept</button>
            </>
          )}

          {app.status === 'accepted' && (
            <>
              {app.dir === 'out' && isWhatsApp && post && (
                <button onClick={() => onOpenWhatsApp(post)} className="requests-btn-whatsapp">
                  WhatsApp host
                </button>
              )}
              {!isWhatsApp && memberConv && (
                <button onClick={() => openChat(memberConv.id)} className="requests-btn-chat">
                  <ChatIcon />
                  <span className="requests-btn-chat-label">{chatLabel(memberConv.id, 'Chat')}</span>
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
              {isWhatsApp && post && (
                <button onClick={() => onOpenWhatsApp(post)} className="requests-btn-whatsapp">
                  WhatsApp host
                </button>
              )}
              <button onClick={() => onWithdraw(app.id)} className="requests-btn-secondary">Withdraw</button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderChatRow = (conv) => {
    const post = postMap.get(String(conv.post_id));
    const isHost = conv.role === 'host';
    const look = getStatusLook(conv.status);
    const compTitle = post?.competition_name || post?.title || 'Competition';
    const whoTitle = isHost ? (conv.member_name || 'Student') : compTitle;
    const subline = isHost
      ? [conv.member_college, `wants to chat about your ${compTitle} squad`].filter(Boolean).join(' · ')
      : `Squad hosted by ${conv.host_name || post?.created_by_name || 'the host'}`;
    const busy = busyId === conv.id;
    const chatClosed = post && post.comm_method !== 'chat';
    const unread = unreadFor(conv.id);
    const summary = chatSummaries[conv.id];
    const otherFirst = (isHost ? (conv.member_name || 'Student') : (conv.host_name || 'Host')).split(' ')[0];
    const preview = summary?.last_message_at
      ? {
          who: summary.last_sender_id === user.id ? 'You' : otherFirst,
          text: summary.last_unsent ? 'Message removed' : summary.last_message,
          when: formatPreviewTime(summary.last_message_at),
        }
      : null;

    return (
      <div key={`chat_${conv.id}`} className={`requests-row ${unread > 0 ? 'requests-row-unread' : ''}`}>
        <div className="requests-row-left">
          <div className="requests-row-title-row">
            <span className="requests-row-who">{whoTitle}</span>
            <span className="requests-kind-tag chat">Chat request</span>
            <span className="requests-status-badge" style={{ background: look.bg, color: look.color, border: `1px solid ${look.border}` }}>
              {conv.status === 'accepted' ? 'Chatting' : look.label}
            </span>
            {unread > 0 && <span className="requests-unread-badge">{unread}</span>}
          </div>
          <p className="requests-row-subline">{subline}</p>
          {conv.status === 'accepted' && preview ? (
            <p className="requests-row-preview">
              <span className="requests-row-preview-text">{preview.who}: {preview.text}</span>
              <span className="requests-row-preview-time"> · {preview.when}</span>
            </p>
          ) : (
            conv.intro && <p className="requests-row-pitch">{conv.intro}</p>
          )}

          {!isHost && reaskConvId === conv.id && (
            <div className="requests-reask">
              <textarea
                value={reaskIntro}
                onChange={(e) => setReaskIntro(e.target.value.slice(0, 300))}
                placeholder="Add a short intro for the host"
                rows={3}
                autoFocus
              />
              <div className="requests-reask-actions">
                <button onClick={() => setReaskConvId(null)} className="requests-btn-secondary">Cancel</button>
                <button onClick={() => handleReask(conv)} className="requests-btn-primary" disabled={busy || !reaskIntro.trim()}>
                  {busy ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="requests-row-actions">
          {isHost && conv.status === 'requested' && (
            <>
              <button
                onClick={() => runChatAction(conv.id, () => respondToChatRequest(conv.id, false), 'Chat request declined')}
                className="requests-btn-secondary"
                disabled={busy}
              >
                Decline
              </button>
              <button
                onClick={() => runChatAction(conv.id, () => respondToChatRequest(conv.id, true), `Chat with ${conv.member_name || 'them'} is open`)}
                className="requests-btn-primary"
                disabled={busy}
              >
                Accept chat
              </button>
            </>
          )}

          {conv.status === 'accepted' && (
            <button onClick={() => openChat(conv.id)} className="requests-btn-chat">
              <ChatIcon />
              <span className="requests-btn-chat-label">{chatLabel(conv.id, chatClosed ? 'View chat' : 'Open chat')}</span>
            </button>
          )}

          {!isHost && conv.status === 'requested' && (
            <button
              onClick={() => runChatAction(conv.id, () => cancelChatRequest(conv.id), 'Chat request cancelled')}
              className="requests-btn-secondary"
              disabled={busy}
            >
              Cancel request
            </button>
          )}

          {!isHost && conv.status === 'declined' && !chatClosed && reaskConvId !== conv.id && (
            <button
              onClick={() => {
                setReaskIntro('');
                setReaskConvId(conv.id);
              }}
              className="requests-btn-secondary"
            >
              Request again
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="requests-screen-container">
      <div className="requests-desktop-header">
        <h1 className="requests-header-title">Inbox</h1>
        <p className="requests-header-sub">
          Join and chat requests to your squads, and the ones you have sent out.
        </p>
      </div>

      <div className="requests-pill-tabs">
        {[
          { id: 'in', label: `To my squads (${inRows.length})` },
          { id: 'out', label: `Sent by me (${outRows.length})` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReqTab(t.id)}
            className={`requests-tab-btn ${reqTab === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="requests-card-container">
        {currentRows.map(row => (row.kind === 'join' ? renderJoinRow(row.app) : renderChatRow(row.conv)))}

        {currentRows.length === 0 && (
          <div className="requests-empty-state">
            <p className="requests-empty-title">Nothing here</p>
            <p className="requests-empty-desc">
              {reqTab === 'in'
                ? 'No one has asked to join or chat with your squads yet.'
                : 'You have not requested to join or chat with any squad yet.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
