// src/components/CompetitionChatModal.jsx
// Private real-time 1:1 chat between a squad host and one person (chat-mode squads).
// Opens only for accepted conversations; the database enforces the same rules.
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import './CompetitionChatModal.css';

export default function CompetitionChatModal({
  isOpen,
  onClose,
  conversation,
  post,
  competition,
  currentUser,
  profile,
  isRemoved = false,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const convId = conversation?.id;
  const isHost = Boolean(currentUser?.id && conversation?.host_id === currentUser.id);
  const isAccepted = conversation?.status === 'accepted';
  const isChatMode = (post?.comm_method || 'chat') === 'chat';

  const otherPersonName = isHost
    ? (conversation?.member_name || 'Student')
    : (conversation?.host_name || post?.created_by_name || post?.lead || 'Squad host');
  const otherPersonCollege = isHost ? (conversation?.member_college || '') : (post?.college || '');
  const compTitle = post?.competition_name || competition?.title || 'Competition squad';

  const isExpired = Boolean(post?.expires_at && new Date(post.expires_at).getTime() < Date.now());
  const canSend = Boolean(currentUser) && isAccepted && isChatMode && !isRemoved && !isExpired;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages (never cached in the browser) + live updates for this conversation
  useEffect(() => {
    if (!isOpen || !convId || !supabase) return;

    let isMounted = true;
    setMessages([]);
    setSendError('');
    setLoading(true);

    supabase
      .from('squad_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (!error && Array.isArray(data)) {
          // Keep anything that arrived over realtime while this was loading
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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'squad_messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const incoming = payload?.new;
          if (!incoming || !isMounted) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            // Our own message arrives here too: swap the pending copy instead of duplicating it
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
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isOpen, convId]);

  useEffect(() => {
    if (isOpen) setTimeout(scrollToBottom, 80);
  }, [messages, isOpen]);

  const senderName = profile?.full_name || profile?.name || currentUser?.email?.split('@')[0] || 'You';

  const deliverMessage = async (tempId, content) => {
    const { data, error } = await supabase
      .from('squad_messages')
      .insert([
        {
          conversation_id: convId,
          post_id: String(conversation?.post_id || post?.id || ''),
          sender_id: currentUser.id,
          sender_name: senderName,
          content,
        },
      ])
      .select()
      .single();

    setMessages((prev) => {
      if (error || !data) {
        return prev.map((m) => (m.id === tempId ? { ...m, localStatus: 'failed', errorText: error?.message || 'Not sent' } : m));
      }
      // Realtime may have delivered it already
      if (prev.some((m) => m.id === data.id)) return prev.filter((m) => m.id !== tempId);
      return prev.map((m) => (m.id === tempId ? data : m));
    });
    if (error) setSendError(error.message || 'Message not sent.');
  };

  // No turn-taking: every message is sent straight away
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || !canSend || !supabase) return;

    setSendError('');
    const tempId = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversation_id: convId,
        sender_id: currentUser.id,
        sender_name: senderName,
        content: clean,
        created_at: new Date().toISOString(),
        localStatus: 'sending',
      },
    ]);
    setInputText('');
    inputRef.current?.focus();
    deliverMessage(tempId, clean);
  };

  const handleRetry = (msg) => {
    setSendError('');
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, localStatus: 'sending', errorText: '' } : m)));
    deliverMessage(msg.id, msg.content);
  };

  if (!isOpen || !conversation) return null;

  const introTime = conversation.created_at
    ? new Date(conversation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const introIsMine = !isHost;

  return (
    <div className="comp-chat-backdrop" onClick={onClose}>
      <div
        className="comp-chat-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Chat with ${otherPersonName}`}
      >
        {/* Header */}
        <div className="comp-chat-header">
          <div className="comp-chat-header-main">
            <div className="comp-chat-avatar">
              {otherPersonName.charAt(0).toUpperCase()}
            </div>
            <div className="comp-chat-info">
              <div className="comp-chat-name-row">
                <span className="comp-chat-person-name">{otherPersonName}</span>
                <span className={`comp-chat-role-badge ${isHost ? 'badge-applicant' : 'badge-lead'}`}>
                  {isHost ? 'Wants to join' : 'Squad host'}
                </span>
              </div>
              <div className="comp-chat-comp-row">
                <span className="comp-chat-comp-title" title={compTitle}>
                  {compTitle}
                </span>
                {otherPersonCollege && (
                  <>
                    <span className="comp-chat-dot">·</span>
                    <span className="comp-chat-deadline">{otherPersonCollege}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="comp-chat-header-actions">
            <button onClick={onClose} className="comp-chat-close-btn" aria-label="Close chat">
              ×
            </button>
          </div>
        </div>

        {(isRemoved || isExpired || !isChatMode) && (
          <div className="comp-chat-banner expired-banner">
            <span className="comp-chat-banner-icon">🔒</span>
            <div className="comp-chat-banner-text">
              {isRemoved
                ? <><strong>Read-only:</strong> {isHost ? 'You removed this member from the squad.' : 'You were removed from this squad.'}</>
                : isExpired
                  ? <><strong>Read-only:</strong> This squad listing has ended.</>
                  : <><strong>Read-only:</strong> The host switched this squad to WhatsApp.</>}
            </div>
          </div>
        )}

        {/* Thread */}
        <div className="comp-chat-body">
          <div className="comp-chat-thread-intro">
            <p className="comp-chat-thread-intro-title">
              Private chat about <strong>{compTitle}</strong>
            </p>
            <p className="comp-chat-thread-intro-sub">
              Only you and {otherPersonName.split(' ')[0]} can see these messages.
            </p>
          </div>

          {conversation.intro && (
            <div className={`comp-chat-msg-row ${introIsMine ? 'msg-me' : 'msg-them'}`}>
              <div className="comp-chat-msg-bubble">
                <div className="comp-chat-msg-sender">
                  {introIsMine ? 'You' : (conversation.member_name || 'Student')} · chat request
                </div>
                <div className="comp-chat-msg-text">{conversation.intro}</div>
                {introTime && <div className="comp-chat-msg-time">{introTime}</div>}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = Boolean(currentUser?.id) && msg.sender_id === currentUser.id;
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div key={msg.id} className={`comp-chat-msg-row ${isMe ? 'msg-me' : 'msg-them'}`}>
                <div className="comp-chat-msg-bubble">
                  <div className="comp-chat-msg-sender">{isMe ? 'You' : msg.sender_name}</div>
                  <div className="comp-chat-msg-text">{msg.content}</div>
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
                    !msg.localStatus && timeStr && <div className="comp-chat-msg-time">{timeStr}</div>
                  )}
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

        {/* Input */}
        <div className="comp-chat-footer">
          {canSend ? (
            <>
              {sendError && <div className="comp-chat-send-error">{sendError}</div>}
              <form className="comp-chat-form" onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  type="text"
                  className="comp-chat-input"
                  placeholder={`Message ${otherPersonName.split(' ')[0]}…`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={2000}
                  autoFocus
                />
                <button
                  type="submit"
                  className="comp-chat-send-btn"
                  disabled={!inputText.trim()}
                  aria-label="Send message"
                >
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
      </div>
    </div>
  );
}
