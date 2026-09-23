import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BellIcon,
  CloseIcon,
  UsersIcon,
  ClockIcon,
  WhatsAppIcon,
  SparklesIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  TrophyIcon,
  CheckIcon
} from './icons';
import {
  generateNotifications,
  getReadNotificationIds,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getDismissedNotificationIds,
  dismissNotification,
  formatRelativeTime
} from '../lib/notificationService';
import './NotificationCenter.css';

export default function NotificationCenter({
  applications = [],
  competitions = [],
  bookmarks = [],
  posts = [],
  profile = {},
  onOpenWhatsApp = () => {},
  onOpenDetail = () => {},
  onNavigate = () => {},
  onToggleBookmark = () => {},
  className = ''
}) {
  const auth = useAuth();
  const user = auth?.user;
  const notificationStates = auth?.notificationStates;
  const authMarkRead = auth?.markNotificationRead;
  const authMarkAllRead = auth?.markAllNotificationsRead;
  const authDismiss = auth?.dismissNotification;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'squads'
  const [localReadIds, setLocalReadIds] = useState(getReadNotificationIds);
  const [localDismissedIds, setLocalDismissedIds] = useState(getDismissedNotificationIds);

  const wrapperRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Combined dismissed IDs (Supabase priority when signed in, localStorage fallback)
  const activeDismissedIds = useMemo(() => {
    if (user && notificationStates && typeof notificationStates === 'object') {
      const dbDismissed = Object.keys(notificationStates).filter(id => notificationStates[id]?.is_dismissed);
      return Array.from(new Set([...dbDismissed, ...localDismissedIds]));
    }
    return localDismissedIds;
  }, [user, notificationStates, localDismissedIds]);

  // Generate notifications list (strictly based on active bookmarks and real state)
  const allNotifications = useMemo(() => {
    return generateNotifications({
      applications,
      competitions,
      bookmarks,
      posts,
      profile
    }).filter(n => !activeDismissedIds.includes(n.id));
  }, [applications, competitions, bookmarks, posts, profile, activeDismissedIds]);

  // Helper to check if a specific notification is unread (Supabase priority, localStorage fallback)
  const checkIsUnread = useCallback((notifId) => {
    if (user && notificationStates && notificationStates[notifId] !== undefined) {
      return !notificationStates[notifId]?.is_read;
    }
    return !localReadIds.includes(notifId);
  }, [user, notificationStates, localReadIds]);

  // Unread count
  const unreadCount = useMemo(() => {
    return allNotifications.filter(n => checkIsUnread(n.id)).length;
  }, [allNotifications, checkIsUnread]);

  // Filtered by active tab (All or Squads)
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return allNotifications;
    return allNotifications.filter(n => n.category === activeTab);
  }, [allNotifications, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: allNotifications.length,
      squads: allNotifications.filter(n => n.category === 'squads').length,
    };
  }, [allNotifications]);

  // Handlers for Cloud + Local Sync
  const handleMarkAllRead = useCallback(() => {
    const ids = allNotifications.map(n => n.id);
    if (user && authMarkAllRead) {
      authMarkAllRead(ids);
    }
    markAllNotificationsAsRead(ids);
    setLocalReadIds(getReadNotificationIds());
  }, [allNotifications, user, authMarkAllRead]);

  const handleDismiss = useCallback((e, notifId, notif) => {
    e.stopPropagation();
    if (user && authDismiss) {
      authDismiss(notifId);
    }
    dismissNotification(notifId);
    setLocalDismissedIds(getDismissedNotificationIds());

    // If removing a bookmarked competition's alert with X, unbookmark it
    if (notif?.type === 'deadline_alert' && notif?.data?.compId) {
      const compIdStr = String(notif.data.compId);
      if (bookmarks.some(b => String(b) === compIdStr) && onToggleBookmark) {
        onToggleBookmark(notif.data.compId);
      }
    }
  }, [user, authDismiss, bookmarks, onToggleBookmark]);

  const handleActionClick = useCallback((e, notif, action) => {
    e.stopPropagation();
    // Mark as read in Supabase & locally
    if (user && authMarkRead) {
      authMarkRead(notif.id);
    }
    markNotificationAsRead(notif.id);
    setLocalReadIds(getReadNotificationIds());

    if (action.actionType === 'whatsapp') {
      const payload = notif.data?.application || notif.data?.post || notif.data;
      onOpenWhatsApp(payload);
    } else if (action.actionType === 'detail') {
      if (notif.data?.compId) {
        onOpenDetail(notif.data.compId);
        setIsOpen(false);
      }
    } else if (action.actionType === 'requests') {
      onNavigate('requests');
      setIsOpen(false);
    } else if (action.actionType === 'teams') {
      onNavigate('teams');
      setIsOpen(false);
    } else if (action.actionType === 'browse') {
      onNavigate('browse');
      setIsOpen(false);
    }
  }, [user, authMarkRead, onOpenWhatsApp, onOpenDetail, onNavigate]);

  const getNotificationIcon = (notif) => {
    if (notif.type === 'squad_accepted') {
      return <WhatsAppIcon size={16} />;
    }
    if (notif.category === 'squads') {
      return <UsersIcon size={16} />;
    }
    if (notif.type === 'deadline_imminent') {
      return <AlertCircleIcon size={16} />;
    }
    if (notif.category === 'deadlines') {
      return <ClockIcon size={16} />;
    }
    if (notif.type === 'smart_match') {
      return <SparklesIcon size={16} />;
    }
    return <TrophyIcon size={16} />;
  };

  return (
    <div className={`onestop-notif-wrapper ${className}`} ref={wrapperRef}>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="onestop-notif-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bell Trigger Button */}
      <button
        type="button"
        className={`onestop-notif-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title="Opportunity & Squad Notifications"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <BellIcon size={18} />
        {unreadCount > 0 && (
          <span className={`onestop-notif-badge ${unreadCount > 0 ? 'has-pulse' : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="onestop-notif-dropdown" role="dialog" aria-label="Notifications Panel">
          {/* Header */}
          <div className="onestop-notif-header">
            <div className="onestop-notif-title-row">
              <h3 className="onestop-notif-title">Notifications</h3>
              {unreadCount > 0 && (
                <span className="onestop-notif-count-pill">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="onestop-notif-mark-read-btn"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="onestop-notif-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`onestop-notif-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>All</span>
              {tabCounts.all > 0 && <span className="onestop-notif-tab-badge">{tabCounts.all}</span>}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'squads'}
              className={`onestop-notif-tab ${activeTab === 'squads' ? 'active' : ''}`}
              onClick={() => setActiveTab('squads')}
            >
              <span>Squads</span>
              {tabCounts.squads > 0 && <span className="onestop-notif-tab-badge">{tabCounts.squads}</span>}
            </button>
          </div>

          {/* Notification Items List */}
          <div className="onestop-notif-list">
            {filteredNotifications.length === 0 ? (
              <div className="onestop-notif-empty">
                <div className="onestop-notif-empty-icon">
                  <BellIcon size={22} />
                </div>
                <h4 className="onestop-notif-empty-title">All quiet on your radar</h4>
                <p className="onestop-notif-empty-desc">
                  {activeTab === 'squads'
                    ? 'No pending squad applications or handshakes right now.'
                    : 'You are all caught up! New squad requests and bookmarked competition deadlines will land here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = checkIsUnread(notif.id);
                return (
                  <div
                    key={notif.id}
                    className={`onestop-notif-item ${isUnread ? 'is-unread' : ''} urgency-${notif.urgency}`}
                    onClick={() => {
                      if (isUnread) {
                        if (user && authMarkRead) {
                          authMarkRead(notif.id);
                        }
                        markNotificationAsRead(notif.id);
                        setLocalReadIds(getReadNotificationIds());
                      }
                    }}
                  >
                    {/* Icon column */}
                    <div className={`onestop-notif-icon-col urgency-${notif.urgency}`}>
                      {getNotificationIcon(notif)}
                    </div>

                    {/* Content column */}
                    <div className="onestop-notif-content-col">
                      <div className="onestop-notif-item-header">
                        <span className="onestop-notif-item-title">{notif.title}</span>
                        <button
                          type="button"
                          className="onestop-notif-dismiss-btn"
                          onClick={(e) => handleDismiss(e, notif.id, notif)}
                          title={notif.type === 'deadline_alert' ? "Remove alert / unbookmark" : "Dismiss notification"}
                          aria-label="Remove"
                        >
                          <CloseIcon size={14} />
                        </button>
                      </div>

                      <p className="onestop-notif-item-subtitle">{notif.subtitle}</p>

                      <div className="onestop-notif-item-footer">
                        <div className="onestop-notif-pill-time">
                          <span className="onestop-notif-time-badge">
                            {formatRelativeTime(notif.timestamp)}
                          </span>
                          {notif.badgeText && (
                            <span className={`onestop-notif-tag ${notif.urgency}`}>
                              {notif.badgeText}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        {Array.isArray(notif.actions) && notif.actions.length > 0 && (
                          <div className="onestop-notif-actions">
                            {notif.actions.map((act, i) => (
                              <button
                                key={i}
                                type="button"
                                className={`onestop-notif-action-btn ${act.actionType === 'whatsapp' ? 'whatsapp' : (act.isPrimary ? 'primary' : 'secondary')}`}
                                onClick={(e) => handleActionClick(e, notif, act)}
                              >
                                {act.actionType === 'whatsapp' && <WhatsAppIcon size={13} />}
                                <span>{act.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="onestop-notif-footer">
            <button
              type="button"
              className="onestop-notif-footer-link"
              onClick={() => {
                onNavigate('requests');
                setIsOpen(false);
              }}
            >
              <span>View all squad requests in Inbox</span>
              <ExternalLinkIcon size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
