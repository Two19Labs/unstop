// src/components/CompetitionChatModal.jsx
// Private real-time 1:1 chat between a squad host and one person (chat-mode squads).
// The database enforces who can send; this window mirrors those rules.
import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { renderLinkedText } from '../lib/linkify';
import './CompetitionChatModal.css';

const GROUP_GAP_MS = 5 * 60 * 1000;
const UNSEND_WINDOW_MS = 60 * 60 * 1000;
const REPORT_REASONS = [
  ['spam', 'Spam'],
  ['harassment', 'Harassment or bullying'],
  ['inappropriate', 'Inappropriate content'],
  ['other', 'Something else'],
];

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

function dayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });
}

const timeLabel = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function CompetitionChatModal({
  isOpen,
  onClose,
  conversation,
  post,
  currentUser,
  profile,
  isRemoved = false,
  summary = null,
  onMarkRead,
  onUnsend,
  onBlock,
  onUnblock,
  onReport,
  showToast,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [atBottom, setAtBottom] = useState(true);
  const [newBelow, setNewBelow] = useState(0);
  const [otherTyping, setOtherTyping] = useState(false);
  const [msgMenuId, setMsgMenuId] = useState(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportNote, setReportNote] = useState('');
  const [busy, setBusy] = useState(false);

  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const unreadDividerRef = useRef(null);
  const typingChannelRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const longPressRef = useRef(null);
  const initialScrollDoneRef = useRef(false);
  const lastMarkRef = useRef(0);
  // Where "unread" started when the chat was opened (frozen for this visit)
  const [unreadFrom, setUnreadFrom] = useState(null);

  const convId = conversation?.id;
  const myId = currentUser?.id || null;
  const isHost = Boolean(myId && conversation?.host_id === myId);
  const otherId = isHost ? conversation?.member_id : conversation?.host_id;
  const isAccepted = conversation?.status === 'accepted';
  const isChatMode = (post?.comm_method || 'chat') === 'chat';
  const isExpired = Boolean(post?.expires_at && new Date(post.expires_at).getTime() < Date.now());
  const isBlocked = Boolean(summary?.is_blocked);
  const blockedByMe = Boolean(summary?.blocked_by_me);
  const canSend = Boolean(currentUser) && isAccepted && isChatMode && !isRemoved && !isExpired && !isBlocked;

  const otherPersonName = isHost
    ? (conversation?.member_name || 'Student')
    : (conversation?.host_name || post?.created_by_name || post?.lead || 'Squad host');
  const otherFirst = otherPersonName.split(' ')[0];
  const otherPersonCollege = isHost ? (conversation?.member_college || '') : (post?.college || '');
  const compTitle = post?.competition_name || 'Competition squad';
  const otherLastReadAt = isHost ? conversation?.member_last_read_at : conversation?.host_last_read_at;
  const senderName = profile?.full_name || profile?.name || currentUser?.email?.split('@')[0] || 'You';

  const markRead = useCallback(() => {
    if (!convId || !onMarkRead) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    const now = Date.now();
    if (now - lastMarkRef.current < 1500) return;
    lastMarkRef.current = now;
    onMarkRead(convId);
  }, [convId, onMarkRead]);

  // ── Load + live updates (new messages and unsends) ──
  useEffect(() => {
    if (!isOpen || !convId || !supabase) return;
    let isMounted = true;
    setMessages([]);
    setSendError('');
    setLoading(true);
    setNewBelow(0);
    setAtBottom(true);
    initialScrollDoneRef.current = false;
    const myLastRead = isHost ? conversation?.host_last_read_at : conversation?.member_last_read_at;
    setUnreadFrom(myLastRead || null);

    supabase
      .from('squad_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (!error && Array.isArray(data)) {
          setMessages((prev) => {
            const ids = new Set(data.map((m) => m.id));
            return [...data, ...prev.filter((m) => !ids.has(m.id))];
          });
        } else if (error) {
          console.warn('Could not load chat messages:', error.message);
        }
        setLoading(false);
      });

    const channel = supabase
      .channel(`squad_conversation_${convId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'squad_messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const incoming = payload?.new;
          if (!incoming?.id || !isMounted) return;
          if (payload.eventType === 'UPDATE') {
            setMessages((prev) => prev.map((m) => (m.id === incoming.id ? { ...m, ...incoming } : m)));
            return;
          }
          if (payload.eventType !== 'INSERT') return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            const pendingIdx = prev.findIndex(
              (m) => m.localStatus === 'sending' && m.sender_id === incoming.sender_id && m.content === incoming.content
            );
            if (pendingIdx !== -1) {
              const next = [...prev];
              next[pendingIdx] = incoming;
              return next;
            }
            return [...prev, incoming];
          });
          if (incoming.sender_id !== myId) {
            setOtherTyping(false);
            markRead();
          }
        }
      )
      .subscribe();

    // "Typing…" goes over a live broadcast only; nothing is stored
    const typingChannel = supabase
      .channel(`squad_typing_${convId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!isMounted || !payload || payload.user_id === myId) return;
        setOtherTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setOtherTyping(false), 3500);
      })
      .subscribe();
    typingChannelRef.current = typingChannel;

    lastMarkRef.current = 0;
    markRead();

    const onVisible = () => {
      if (!document.hidden) markRead();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', onVisible);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setOtherTyping(false);
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [isOpen, convId]);

  // ── Browser back closes the chat (mobile) ──
  useEffect(() => {
    if (!isOpen || !convId || typeof window === 'undefined') return;
    let closedByBack = false;
    window.history.pushState({ ...(window.history.state || {}), onestopChat: convId }, '');
    const onPop = () => {
      closedByBack = true;
      onClose();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!closedByBack && window.history.state?.onestopChat === convId) window.history.back();
    };
  }, [isOpen, convId]);

  // ── Scrolling: stay put if the user scrolled up; show a "New messages" pill ──
  const scrollToBottom = (smooth = true) => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  const handleScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(bottom);
    if (bottom) setNewBelow(0);
  };

  const prevCountRef = useRef(0);
  useLayoutEffect(() => {
    if (!isOpen) return;
    const added = messages.length - prevCountRef.current;
    prevCountRef.current = messages.length;
    if (loading) return;
    if (!initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;
      if (unreadDividerRef.current && bodyRef.current) {
        bodyRef.current.scrollTop = Math.max(0, unreadDividerRef.current.offsetTop - 60);
        handleScroll();
      } else {
        scrollToBottom(false);
      }
      return;
    }
    if (added <= 0) return;
    const last = messages[messages.length - 1];
    if (atBottom || last?.sender_id === myId) {
      scrollToBottom(true);
    } else {
      setNewBelow((n) => n + added);
    }
  }, [messages, loading, isOpen]);

  // ── Sending ──
  const deliverMessage = async (tempId, content) => {
    const { data, error } = await supabase
      .from('squad_messages')
      .insert([{ conversation_id: convId, post_id: String(conversation?.post_id || post?.id || ''), sender_id: myId, sender_name: senderName, content }])
      .select()
      .single();

    setMessages((prev) => {
      if (error || !data) {
        return prev.map((m) => (m.id === tempId ? { ...m, localStatus: 'failed', errorText: error?.message || 'Not sent' } : m));
      }
      if (prev.some((m) => m.id === data.id)) return prev.filter((m) => m.id !== tempId);
      return prev.map((m) => (m.id === tempId ? data : m));
    });
    if (error) setSendError(error.message || 'Message not sent.');
  };

  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight + 2, 120)}px`;
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || !canSend || !supabase) return;
    setSendError('');
    const tempId = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, conversation_id: convId, sender_id: myId, sender_name: senderName, content: clean, created_at: new Date().toISOString(), localStatus: 'sending' },
    ]);
    setInputText('');
    requestAnimationFrame(resizeInput);
    inputRef.current?.focus();
    deliverMessage(tempId, clean);
  };

  const handleRetry = (msg) => {
    setSendError('');
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, localStatus: 'sending', errorText: '' } : m)));
    deliverMessage(msg.id, msg.content);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    resizeInput();
    const now = Date.now();
    if (typingChannelRef.current && e.target.value.trim() && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: myId } }).catch(() => {});
    }
  };

  // Enter sends, Shift+Enter is a new line. On phones Enter is a new line; use Send.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !isTouchDevice()) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── Message menu (copy / unsend) ──
  const canUnsend = (msg) =>
    msg.sender_id === myId && !msg.unsent_at && !msg.localStatus &&
    Date.now() - new Date(msg.created_at).getTime() < UNSEND_WINDOW_MS;

  const handleCopy = async (msg) => {
    setMsgMenuId(null);
    try {
      await navigator.clipboard.writeText(msg.content);
      if (showToast) showToast('Copied');
    } catch (e) {
      if (showToast) showToast('Could not copy');
    }
  };

  const handleUnsend = async (msg) => {
    setMsgMenuId(null);
    if (!onUnsend) return;
    try {
      const updated = await onUnsend(msg.id);
      if (updated?.id) setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not unsend.');
    }
  };

  const startLongPress = (msg) => {
    if (msg.unsent_at || msg.localStatus) return;
    longPressRef.current = setTimeout(() => setMsgMenuId(msg.id), 450);
  };
  const cancelLongPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  // ── Block / report ──
  const handleBlockToggle = async () => {
    setHeaderMenuOpen(false);
    if (!otherId) return;
    if (!blockedByMe && !window.confirm(`Block ${otherPersonName}? This chat becomes read-only for both of you, and their requests to your squads stop reaching you.`)) return;
    setBusy(true);
    try {
      if (blockedByMe) {
        await onUnblock(otherId);
        if (showToast) showToast(`${otherFirst} unblocked`);
      } else {
        await onBlock(otherId);
        if (showToast) showToast(`${otherFirst} blocked`);
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onReport(convId, reportReason, reportNote.trim());
      setReportOpen(false);
      setReportNote('');
      if (showToast) showToast('Report sent. Thanks for letting us know.');
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not send the report.');
    } finally {
      setBusy(false);
    }
  };

  // ── Build the thread: date separators, grouping, unread divider ──
  const myLastDeliveredId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.sender_id === myId && !m.localStatus && !m.unsent_at) return m.id;
    }
    return null;
  }, [messages, myId]);

  const thread = useMemo(() => {
    const items = [];
    let prevDay = null;
    let dividerPlaced = false;
    const unreadFromMs = unreadFrom ? new Date(unreadFrom).getTime() : null;

    // The chat request intro opens the thread
    if (conversation?.intro) {
      const at = conversation.created_at || new Date().toISOString();
      prevDay = new Date(at).toDateString();
      items.push({ type: 'day', key: `day_${prevDay}`, label: dayLabel(at) });
      items.push({ type: 'intro', key: 'intro', at });
    }

    messages.forEach((m, i) => {
      const at = m.created_at || new Date().toISOString();
      const day = new Date(at).toDateString();
      if (day !== prevDay) {
        items.push({ type: 'day', key: `day_${day}_${i}`, label: dayLabel(at) });
        prevDay = day;
      }
      const isMine = m.sender_id === myId;
      if (!dividerPlaced && !isMine && unreadFromMs !== null && !m.localStatus &&
          new Date(at).getTime() > unreadFromMs && !m.unsent_at) {
        items.push({ type: 'unread', key: 'unread' });
        dividerPlaced = true;
      }
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const sameAsPrev = prev && prev.sender_id === m.sender_id &&
        new Date(at) - new Date(prev.created_at) < GROUP_GAP_MS &&
        new Date(prev.created_at).toDateString() === day;
      const sameAsNext = next && next.sender_id === m.sender_id &&
        new Date(next.created_at) - new Date(at) < GROUP_GAP_MS &&
        new Date(next.created_at).toDateString() === day;
      items.push({ type: 'msg', key: m.id, msg: m, isMine, showName: !sameAsPrev, showTime: !sameAsNext });
    });
    return items;
  }, [messages, myId, conversation?.intro, conversation?.created_at, unreadFrom]);

  if (!isOpen || !conversation) return null;

  const readOnlyReason = isBlocked
    ? (blockedByMe ? `You blocked ${otherFirst}.` : 'This chat is closed.')
    : isRemoved
      ? (isHost ? 'You removed this member from the squad.' : 'You were removed from this squad.')
      : isExpired
        ? 'This squad listing has ended.'
        : !isChatMode
          ? 'The host switched this squad to WhatsApp.'
          : '';

  const lastIsMine = myLastDeliveredId && messages[messages.length - 1]?.id === myLastDeliveredId;
  const myLastMsg = myLastDeliveredId ? messages.find((m) => m.id === myLastDeliveredId) : null;
  const seen = Boolean(myLastMsg && otherLastReadAt && new Date(otherLastReadAt) >= new Date(myLastMsg.created_at));

  return (
    <div className="comp-chat-backdrop ph-no-capture" onClick={onClose}>
      <div
        className="comp-chat-dialog"
        onClick={(e) => {
          e.stopPropagation();
          if (msgMenuId) setMsgMenuId(null);
          if (headerMenuOpen) setHeaderMenuOpen(false);
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Chat with ${otherPersonName}`}
      >
        {/* Header */}
        <div className="comp-chat-header">
          <div className="comp-chat-header-main">
            <button onClick={onClose} className="comp-chat-back-btn" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="comp-chat-avatar">{otherPersonName.charAt(0).toUpperCase()}</div>
            <div className="comp-chat-info">
              <div className="comp-chat-name-row">
                <span className="comp-chat-person-name">{otherPersonName}</span>
                <span className={`comp-chat-role-badge ${isHost ? 'badge-applicant' : 'badge-lead'}`}>
                  {isHost ? 'Wants to join' : 'Squad host'}
                </span>
              </div>
              <div className="comp-chat-comp-row">
                {otherTyping && canSend ? (
                  <span className="comp-chat-typing">typing…</span>
                ) : (
                  <>
                    <span className="comp-chat-comp-title" title={compTitle}>{compTitle}</span>
                    {otherPersonCollege && (
                      <>
                        <span className="comp-chat-dot">·</span>
                        <span className="comp-chat-deadline">{otherPersonCollege}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="comp-chat-header-actions">
            <div className="comp-chat-menu-anchor">
              <button
                className="comp-chat-more-btn"
                aria-label="More options"
                onClick={(e) => {
                  e.stopPropagation();
                  setHeaderMenuOpen((v) => !v);
                }}
              >
                ⋯
              </button>
              {headerMenuOpen && (
                <div className="comp-chat-menu" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={handleBlockToggle} disabled={busy}>
                    {blockedByMe ? `Unblock ${otherFirst}` : `Block ${otherFirst}`}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setReportOpen(true);
                    }}
                  >
                    Report chat
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="comp-chat-close-btn" aria-label="Close chat">×</button>
          </div>
        </div>

        {readOnlyReason && (
          <div className="comp-chat-banner expired-banner">
            <span className="comp-chat-banner-icon">🔒</span>
            <div className="comp-chat-banner-text">
              <strong>Read-only:</strong> {readOnlyReason}
              {blockedByMe && (
                <button type="button" className="comp-chat-inline-link" onClick={handleBlockToggle} disabled={busy}>
                  Unblock
                </button>
              )}
            </div>
          </div>
        )}

        {/* Thread */}
        <div className="comp-chat-body" ref={bodyRef} onScroll={handleScroll}>
          <div className="comp-chat-thread-intro">
            <p className="comp-chat-thread-intro-title">
              Private chat about <strong>{compTitle}</strong>
            </p>
            <p className="comp-chat-thread-intro-sub">Only you and {otherFirst} can see these messages.</p>
          </div>

          {thread.map((item) => {
            if (item.type === 'day') {
              return (
                <div key={item.key} className="comp-chat-day">
                  <span>{item.label}</span>
                </div>
              );
            }
            if (item.type === 'unread') {
              return (
                <div key={item.key} ref={unreadDividerRef} className="comp-chat-unread-divider">
                  <span>Unread</span>
                </div>
              );
            }
            if (item.type === 'intro') {
              const introMine = !isHost;
              return (
                <div key="intro" className={`comp-chat-msg-row ${introMine ? 'msg-me' : 'msg-them'}`}>
                  <div className="comp-chat-msg-bubble">
                    <div className="comp-chat-msg-sender">
                      {introMine ? 'You' : (conversation.member_name || 'Student')} · chat request
                    </div>
                    <div className="comp-chat-msg-text">{renderLinkedText(conversation.intro)}</div>
                    <div className="comp-chat-msg-time">{timeLabel(item.at)}</div>
                  </div>
                </div>
              );
            }

            const { msg, isMine, showName, showTime } = item;
            const unsent = Boolean(msg.unsent_at);
            const menuOpen = msgMenuId === msg.id;
            return (
              <div
                key={item.key}
                className={`comp-chat-msg-row ${isMine ? 'msg-me' : 'msg-them'} ${showName ? '' : 'grouped'}`}
              >
                <div
                  className={`comp-chat-msg-bubble ${unsent ? 'unsent' : ''}`}
                  onContextMenu={(e) => {
                    if (unsent || msg.localStatus) return;
                    e.preventDefault();
                    setMsgMenuId(msg.id);
                  }}
                  onTouchStart={() => startLongPress(msg)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                >
                  {showName && <div className="comp-chat-msg-sender">{isMine ? 'You' : msg.sender_name}</div>}
                  <div className="comp-chat-msg-text">
                    {unsent ? 'This message was removed' : renderLinkedText(msg.content)}
                  </div>
                  {msg.localStatus === 'sending' && <div className="comp-chat-msg-time">Sending…</div>}
                  {msg.localStatus === 'failed' ? (
                    <button
                      type="button"
                      className="comp-chat-msg-time comp-chat-msg-retry"
                      onClick={() => handleRetry(msg)}
                      title={msg.errorText || 'Not sent'}
                    >
                      Not sent · Tap to retry
                    </button>
                  ) : (
                    !msg.localStatus && showTime && <div className="comp-chat-msg-time">{timeLabel(msg.created_at)}</div>
                  )}

                  {!unsent && !msg.localStatus && (
                    <button
                      type="button"
                      className="comp-chat-msg-more"
                      aria-label="Message options"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMsgMenuId(menuOpen ? null : msg.id);
                      }}
                    >
                      ⋯
                    </button>
                  )}
                  {menuOpen && (
                    <div className="comp-chat-menu comp-chat-msg-menu" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => handleCopy(msg)}>Copy text</button>
                      {canUnsend(msg) && (
                        <button type="button" className="danger" onClick={() => handleUnsend(msg)}>Unsend</button>
                      )}
                    </div>
                  )}
                </div>
                {msg.id === myLastDeliveredId && lastIsMine && (
                  <div className="comp-chat-seen">{seen ? 'Seen' : 'Sent'}</div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="comp-chat-loading">
              <span>Loading messages…</span>
            </div>
          )}
        </div>

        {newBelow > 0 && !atBottom && (
          <button
            type="button"
            className="comp-chat-new-pill"
            onClick={() => {
              scrollToBottom(true);
              setNewBelow(0);
            }}
          >
            {newBelow === 1 ? '1 new message' : `${newBelow} new messages`} ↓
          </button>
        )}

        {/* Input */}
        <div className="comp-chat-footer">
          {canSend ? (
            <>
              {sendError && <div className="comp-chat-send-error">{sendError}</div>}
              <form className="comp-chat-form" onSubmit={handleSendMessage}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  className="comp-chat-input"
                  placeholder={`Message ${otherFirst}…`}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  maxLength={2000}
                  autoFocus={!isTouchDevice()}
                />
                <button type="submit" className="comp-chat-send-btn" disabled={!inputText.trim()} aria-label="Send message">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="comp-chat-turn-wait">
              <span>This chat is read-only.</span>
            </div>
          )}
        </div>

        {/* Report */}
        {reportOpen && (
          <div className="comp-chat-report-wrap" onClick={() => setReportOpen(false)}>
            <form className="comp-chat-report" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmitReport}>
              <h3>Report this chat</h3>
              <p>Our team will review the recent messages. {otherFirst} won't be told who reported them.</p>
              <div className="comp-chat-report-reasons">
                {REPORT_REASONS.map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="report-reason"
                      value={value}
                      checked={reportReason === value}
                      onChange={() => setReportReason(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value.slice(0, 1000))}
                placeholder="Anything else we should know? (optional)"
                rows={3}
              />
              <div className="comp-chat-report-actions">
                <button type="button" className="secondary" onClick={() => setReportOpen(false)}>Cancel</button>
                <button type="submit" className="primary" disabled={busy}>{busy ? 'Sending…' : 'Send report'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
