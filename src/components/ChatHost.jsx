// src/components/ChatHost.jsx
// The one chat window for the whole app. Opened from the Inbox, Team Finder,
// the bell, or a browser alert (/?chat=<id>) through openChat().
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CompetitionChatModal from './CompetitionChatModal';

export default function ChatHost({ posts = [], applications = [], showToast }) {
  const {
    user,
    profile,
    squadConversations = [],
    chatSummaries = {},
    activeChatId,
    openChat,
    closeChat,
    markConversationRead,
    unsendMessage,
    blockUser,
    unblockUser,
    reportChat,
  } = useAuth();

  // Browser alert / shared link: /?chat=<conversation id>
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get('chat');
    if (!chatId) return;
    if (!squadConversations.some(c => c.id === chatId)) return; // wait until chats load
    params.delete('chat');
    const rest = params.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${rest ? `?${rest}` : ''}${window.location.hash}`);
    openChat(chatId);
  }, [user, squadConversations, openChat]);

  const conversation = activeChatId ? squadConversations.find(c => c.id === activeChatId) || null : null;
  if (!user || !conversation) return null;

  const post = posts.find(p => String(p.id) === String(conversation.post_id)) || null;
  const isRemoved = applications.some(a =>
    String(a.postId || a.post_id) === String(conversation.post_id) &&
    a.applicant_id === conversation.member_id &&
    a.status === 'removed'
  );

  return (
    <CompetitionChatModal
      isOpen
      onClose={closeChat}
      conversation={conversation}
      post={post}
      currentUser={user}
      profile={profile}
      isRemoved={isRemoved}
      summary={chatSummaries[conversation.id] || null}
      onMarkRead={markConversationRead}
      onUnsend={unsendMessage}
      onBlock={blockUser}
      onUnblock={unblockUser}
      onReport={reportChat}
      showToast={showToast}
    />
  );
}
