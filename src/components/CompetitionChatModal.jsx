// src/components/CompetitionChatModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatWhatsAppUrl } from '../context/AuthContext';
import './CompetitionChatModal.css';

export default function CompetitionChatModal({
  isOpen,
  onClose,
  application,
  post,
  competition,
  currentUser,
  profile,
  onAcceptApp,
  onDeclineApp,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const appId = application?.id;
  const isLead = application?.dir === 'in'; // 'in' = applicant applied to my squad, so I am the lead
  const isAccepted = application?.status === 'accepted';
  const isDeclined = application?.status === 'rejected' || application?.status === 'declined';
  const isPending = !isAccepted && !isDeclined;

  const otherPersonName = isLead
    ? (application?.applicant_name || application?.who || 'Applicant')
    : (post?.created_by_name || post?.lead || 'Squad Lead');

  const otherPersonCollege = isLead
    ? (application?.applicant_college || application?.meta || '')
    : (post?.college || '');

  const otherPersonPhone = isLead
    ? (application?.applicant_phone || application?.phone || '')
    : (post?.phone_number || post?.leadPhone || '');

  const compTitle = post?.competition_name || competition?.title || application?.meta || 'Competition Squad';
  const deadlineText = competition?.remainDaysText || (competition?.days ? `${competition.days}d left` : 'Active');

  // Check if competition is expired
  const isExpired = competition?.daysRemainingNum !== undefined && competition.daysRemainingNum <= 0;

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Local storage cache key
  const storageKey = appId ? `onestop_squad_chat_${appId}` : null;

  // Load messages from Supabase or LocalStorage
  useEffect(() => {
    if (!isOpen || !appId) return;

    let isMounted = true;
    setLoading(true);

    const loadLocal = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
      return [];
    };

    const initialLocal = loadLocal();
    if (initialLocal.length > 0) {
      setMessages(initialLocal);
      setLoading(false);
    }

    async function fetchRemote() {
      if (supabase && appId) {
        try {
          const { data, error } = await supabase
            .from('squad_messages')
            .select('*')
            .eq('application_id', appId)
            .order('created_at', { ascending: true });

          if (!error && Array.isArray(data) && isMounted) {
            // Merge with local if needed
            if (data.length > 0) {
              setMessages(data);
              try {
                localStorage.setItem(storageKey, JSON.stringify(data));
              } catch (e) {}
            }
          }
        } catch (err) {
          console.warn('Could not load squad messages from Supabase:', err.message);
        }
      }
      if (isMounted) setLoading(false);
    }

    fetchRemote();

    // Subscribe to real-time messages if Supabase connected
    let subscription = null;
    if (supabase && appId) {
      try {
        subscription = supabase
          .channel(`squad_chat_${appId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'squad_messages',
              filter: `application_id=eq.${appId}`,
            },
            (payload) => {
              if (payload?.new && isMounted) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === payload.new.id)) return prev;
                  const next = [...prev, payload.new];
                  try {
                    localStorage.setItem(storageKey, JSON.stringify(next));
                  } catch (e) {}
                  return next;
                });
              }
            }
          )
          .subscribe();
      } catch (e) {}
    }

    return () => {
      isMounted = false;
      if (subscription && supabase) {
        supabase.removeChannel(subscription);
      }
    };
  }, [isOpen, appId, storageKey]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  // Turn-based vetting check for PENDING status
  // Lead asks 1 question, applicant answers with 1 reply, strictly 1 turn at a time
  const mySenderId = currentUser?.id || 'local_user';
  const myRole = isLead ? 'lead' : 'applicant';

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isMyTurn = !lastMessage || (lastMessage.sender_role !== myRole && lastMessage.sender_id !== mySenderId);

  // Can user send?
  const canSend = !isExpired && (isAccepted || (isPending && isMyTurn));

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || !canSend || sending) return;

    setSending(true);

    const senderName = profile?.full_name || profile?.name || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || (isLead ? 'Squad Lead' : 'Applicant');

    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      application_id: appId,
      post_id: post?.id || application?.post_id,
      competition_id: String(competition?.id || post?.compId || ''),
      sender_id: currentUser?.id || 'local_user',
      sender_name: senderName,
      sender_role: myRole,
      content: clean,
      created_at: new Date().toISOString(),
    };

    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    setInputText('');

    try {
      localStorage.setItem(storageKey, JSON.stringify(nextMessages));
    } catch (err) {}

    // Persist to Supabase if connected
    if (supabase && currentUser) {
      try {
        await supabase.from('squad_messages').insert([
          {
            application_id: appId,
            post_id: post?.id || application?.post_id,
            competition_id: String(competition?.id || post?.compId || ''),
            sender_id: currentUser.id,
            sender_name: senderName,
            sender_role: myRole,
            content: clean,
          },
        ]);
      } catch (err) {
        console.warn('Could not save squad message to Supabase:', err.message);
      }
    }

    setSending(false);
    setTimeout(() => {
      scrollToBottom();
      inputRef.current?.focus();
    }, 50);
  };

  if (!isOpen || !application) return null;

  return (
    <div className="comp-chat-backdrop" onClick={onClose}>
      <div
        className="comp-chat-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Squad Chat"
      >
        {/* Chat Header */}
        <div className="comp-chat-header">
          <div className="comp-chat-header-main">
            <div className="comp-chat-avatar">
              {otherPersonName.charAt(0).toUpperCase()}
            </div>
            <div className="comp-chat-info">
              <div className="comp-chat-name-row">
                <span className="comp-chat-person-name">{otherPersonName}</span>
                <span className={`comp-chat-role-badge ${isLead ? 'badge-applicant' : 'badge-lead'}`}>
                  {isLead ? 'Applicant' : 'Squad Lead'}
                </span>
                {isAccepted && (
                  <span className="comp-chat-status-badge accepted">
                    Accepted
                  </span>
                )}
                {isPending && (
                  <span className="comp-chat-status-badge pending">
                    Vetting
                  </span>
                )}
              </div>
              <div className="comp-chat-comp-row">
                <span className="comp-chat-comp-title" title={compTitle}>
                  {compTitle}
                </span>
                <span className="comp-chat-dot">·</span>
                <span className="comp-chat-deadline">{deadlineText}</span>
              </div>
            </div>
          </div>

          <div className="comp-chat-header-actions">
            {/* WhatsApp direct link if phone number is available */}
            {otherPersonPhone && (
              <a
                href={formatWhatsAppUrl(otherPersonPhone, `Hi ${otherPersonName}, connecting regarding ${compTitle} squad on OneStop!`)}
                target="_blank"
                rel="noopener noreferrer"
                className="comp-chat-wa-btn"
                title="Connect on WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.98-.276-.1-.476-.15-.676.15-.2.301-.776.98-.952 1.18-.175.2-.351.225-.652.075-.301-.15-1.272-.469-2.424-1.496-.895-.798-1.5-1.784-1.675-2.085-.176-.301-.019-.464.132-.614.135-.135.301-.351.451-.527.151-.175.2-.301.301-.501.101-.2.051-.376-.025-.526-.075-.15-.676-1.63-.927-2.232-.244-.586-.492-.507-.676-.516l-.576-.01c-.2 0-.526.075-.802.376-.276.301-1.052 1.028-1.052 2.508 0 1.48 1.077 2.909 1.228 3.11.15.2 2.12 3.238 5.137 4.542.717.311 1.277.496 1.714.635.72.229 1.375.197 1.893.119.578-.087 1.782-.728 2.033-1.43.25-.702.25-1.303.175-1.43-.075-.126-.276-.201-.577-.351zM12.042 21.802h-.002a9.78 9.78 0 0 1-4.98-1.365l-.358-.212-3.705.972.989-3.612-.233-.371a9.79 9.79 0 0 1-1.503-5.214C2.25 6.602 6.642 2.21 12.046 2.21c2.615 0 5.074 1.019 6.924 2.869a9.75 9.75 0 0 1 2.87 6.924c0 5.394-4.394 9.799-9.798 9.799z"/>
                </svg>
                <span className="comp-chat-wa-text">WhatsApp</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="comp-chat-close-btn"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {isPending && (
          <div className="comp-chat-banner pending-banner">
            <span className="comp-chat-banner-icon">💬</span>
            <div className="comp-chat-banner-text">
              <strong>Turn-Based Vetting:</strong> You can send 1 message at a time to clarify fit and requirements before making a decision.
            </div>
          </div>
        )}

        {isAccepted && (
          <div className="comp-chat-banner accepted-banner">
            <span className="comp-chat-banner-icon">🎉</span>
            <div className="comp-chat-banner-text">
              <strong>Squad Confirmed:</strong> You are teamed up! Feel free to chat openly, share WhatsApp numbers, Google Meet links, or docs.
            </div>
          </div>
        )}

        {isExpired && (
          <div className="comp-chat-banner expired-banner">
            <span className="comp-chat-banner-icon">⏳</span>
            <div className="comp-chat-banner-text">
              <strong>Competition Concluded:</strong> This squad listing has ended. Thread is now read-only.
            </div>
          </div>
        )}

        {/* Lead Quick Decision Bar (if Lead & Pending) */}
        {isLead && isPending && (
          <div className="comp-chat-lead-bar">
            <span className="comp-chat-lead-label">Make a decision on {otherPersonName}:</span>
            <div className="comp-chat-lead-btns">
              <button
                type="button"
                className="comp-chat-decline-btn"
                onClick={() => {
                  if (onDeclineApp) onDeclineApp(appId);
                  onClose();
                }}
              >
                Decline
              </button>
              <button
                type="button"
                className="comp-chat-accept-btn"
                onClick={() => {
                  if (onAcceptApp) onAcceptApp(appId);
                }}
              >
                Accept Teammate
              </button>
            </div>
          </div>
        )}

        {/* Message Thread Body */}
        <div className="comp-chat-body">
          {/* Competition Context Header Tile */}
          <div className="comp-chat-thread-intro">
            <p className="comp-chat-thread-intro-title">
              Squad communication for <strong>{compTitle}</strong>
            </p>
            <p className="comp-chat-thread-intro-sub">
              Thread is competition-scoped and active for the duration of this listing.
            </p>
          </div>

          {/* Initial Pitch Note Card */}
          {(application?.pitch || application?.pitch_note) && (
            <div className="comp-chat-pitch-bubble">
              <div className="comp-chat-pitch-header">
                <span className="comp-chat-pitch-tag">Application Pitch</span>
                <span className="comp-chat-pitch-who">{application.applicant_name || 'Applicant'}</span>
              </div>
              <p className="comp-chat-pitch-content">
                "{application.pitch || application.pitch_note}"
              </p>
              {Array.isArray(application.highlighted_skills || application.skills) && (
                <div className="comp-chat-pitch-skills">
                  {(application.highlighted_skills || application.skills).map((skill, idx) => (
                    <span key={idx} className="comp-chat-skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => {
            const isMe = msg.sender_role === myRole || msg.sender_id === mySenderId;
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={msg.id}
                className={`comp-chat-msg-row ${isMe ? 'msg-me' : 'msg-them'}`}
              >
                <div className="comp-chat-msg-bubble">
                  <div className="comp-chat-msg-sender">
                    {isMe ? 'You' : msg.sender_name}
                  </div>
                  <div className="comp-chat-msg-text">{msg.content}</div>
                  {timeStr && <div className="comp-chat-msg-time">{timeStr}</div>}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="comp-chat-loading">
              <span>Loading messages…</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="comp-chat-footer">
          {canSend ? (
            <form className="comp-chat-form" onSubmit={handleSendMessage}>
              <input
                ref={inputRef}
                type="text"
                className="comp-chat-input"
                placeholder={
                  isPending
                    ? (isLead ? 'Ask 1 question to verify fit…' : 'Reply with your answer…')
                    : 'Type a message, coordinate, or share links…'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={500}
                autoFocus
              />
              <button
                type="submit"
                className="comp-chat-send-btn"
                disabled={!inputText.trim() || sending}
                aria-label="Send message"
              >
                {sending ? '…' : 'Send'}
              </button>
            </form>
          ) : (
            <div className="comp-chat-turn-wait">
              {isExpired ? (
                <span>This competition listing has concluded.</span>
              ) : isDeclined ? (
                <span>This application has been declined.</span>
              ) : (
                <span>
                  ⏳ <strong>Waiting for reply:</strong> Turn-based vetting allows 1 message each before acceptance.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
