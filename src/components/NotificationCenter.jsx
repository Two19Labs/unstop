import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BellIcon,
  BellOffIcon,
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
  dismissAllNotifications,
  formatRelativeTime
} from '../lib/notificationService';
import {
  isPushSupported,
  getPushPermission,
  isPushEnabled,
  setPushEnabled,
  requestPushPermission,
  isIOS,
  isStandalone,
  isMobileDevice
} from '../lib/browserPushService';
import './NotificationCenter.css';

export default function NotificationCenter({
  applications = [],
  competitions = [],
  bookmarks = [],
  posts = [],
  profile = {},
  roundsMap = {},
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
  const authDismissAll = auth?.dismissAllNotifications;
  const messageNotifications = auth?.messageNotifications || [];
  const squadConversations = auth?.squadConversations || [];

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'deadlines' | 'squads'
  const [localReadIds, setLocalReadIds] = useState(getReadNotificationIds);
  const [localDismissedIds, setLocalDismissedIds] = useState(getDismissedNotificationIds);

  // Browser Push State with cross-component sync
  const [pushPermission, setPushPermission] = useState(getPushPermission);
  const pushSupported = useMemo(() => isPushSupported(), []);
  const [pushEnabledState, setPushEnabledState] = useState(isPushEnabled);
  const [showDeniedTip, setShowDeniedTip] = useState(false);

  useEffect(() => {
    const handlePushSync = () => {
      setPushPermission(getPushPermission());
      setPushEnabledState(isPushEnabled());
    };
    window.addEventListener('onestop:push-enabled-changed', handlePushSync);
    window.addEventListener('storage', handlePushSync);
    return () => {
      window.removeEventListener('onestop:push-enabled-changed', handlePushSync);
      window.removeEventListener('storage', handlePushSync);
    };
  }, []);

  const isDeviceAlertsActive = useMemo(() => {
    return pushSupported && pushPermission === 'granted' && pushEnabledState;
  }, [pushSupported, pushPermission, pushEnabledState]);

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

  // Generate notifications list (strictly based on active bookmarks, real rounds, and snapshot diffing)
  const allNotifications = useMemo(() => {
    return generateNotifications({
      applications,
      competitions,
      bookmarks,
      posts,
      profile,
      roundsMap,
      messageNotifications,
      conversations: squadConversations
    }).filter(n => !activeDismissedIds.includes(n.id));
  }, [applications, competitions, bookmarks, posts, profile, roundsMap, messageNotifications, squadConversations, activeDismissedIds]);

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

  // Check if any critical deadline or extension is unread
  const hasCriticalAlert = useMemo(() => {
    return allNotifications.some(n => checkIsUnread(n.id) && (n.urgency === 'critical' || n.urgency === 'extension'));
  }, [allNotifications, checkIsUnread]);

  // Filtered by active tab (All, Deadlines & Rounds, Squads)
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return allNotifications;
    if (activeTab === 'deadlines') return allNotifications.filter(n => n.category === 'deadlines');
    if (activeTab === 'squads') return allNotifications.filter(n => n.category === 'squads');
    return allNotifications;
  }, [allNotifications, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: allNotifications.length,
      deadlines: allNotifications.filter(n => n.category === 'deadlines').length,
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

  const handleDismiss = useCallback((e, notifId) => {
    e.stopPropagation();
    if (user && authDismiss) {
      authDismiss(notifId);
    }
    dismissNotification(notifId);
    setLocalDismissedIds(getDismissedNotificationIds());
  }, [user, authDismiss]);

  const handleDismissAll = useCallback(() => {
    const ids = allNotifications.map(n => n.id);
    if (user && authDismissAll) {
      authDismissAll(ids);
    }
    dismissAllNotifications(ids);
    setLocalDismissedIds(getDismissedNotificationIds());
  }, [allNotifications, user, authDismissAll]);

  const handleActionClick = useCallback((e, notif, action) => {
    e.stopPropagation();
    // Mark as read in Supabase & locally
    if (user && authMarkRead) {
      authMarkRead(notif.id);
    }
    markNotificationAsRead(notif.id);
    setLocalReadIds(getReadNotificationIds());

    if (action.actionType === 'portal') {
      const url = action.url || notif.data?.url || notif.data?.publicUrl || notif.data?.competition?.unstopUrl;
      if (url) {
        window.open(url, '_blank');
      }
    } else if (action.actionType === 'whatsapp') {
      const payload = notif.data?.application || notif.data?.post || notif.data;
      onOpenWhatsApp(payload);
    } else if (action.actionType === 'detail') {
      if (notif.data?.compId) {
        onOpenDetail(notif.data.compId);
        setIsOpen(false);
      }
    } else if (action.actionType === 'open_chat') {
      if (notif.data?.conversationId && auth?.openChat) auth.openChat(notif.data.conversationId);
      else onNavigate('requests');
      setIsOpen(false);
    } else if (action.actionType === 'requests') {
      onNavigate('requests');
      setIsOpen(false);
    } else if (action.actionType === 'teams' || action.actionType === 'chat') {
      onNavigate('teams');
      setIsOpen(false);
    } else if (action.actionType === 'browse') {
      onNavigate('browse');
      setIsOpen(false);
    }
  }, [user, authMarkRead, onOpenWhatsApp, onOpenDetail, onNavigate, auth]);

  const handleToggleDeviceAlerts = async () => {
    if (!pushSupported) return;

    if (pushPermission === 'denied') {
      setShowDeniedTip(prev => !prev);
      return;
    }

    if (pushPermission === 'default') {
      setShowDeniedTip(false);
      const res = await requestPushPermission();
      setPushPermission(res);
      if (res === 'granted') {
        setPushEnabled(true);
        setPushEnabledState(true);
      } else {
        setPushEnabledState(false);
        if (res === 'denied') {
          setShowDeniedTip(true);
        }
      }
      return;
    }

    if (pushPermission === 'granted') {
      const next = !pushEnabledState;
      setPushEnabled(next);
      setPushEnabledState(next);
      setShowDeniedTip(false);
    }
  };

  const getNotificationIcon = (notif) => {
    if (notif.type === 'squad_accepted') {
      return <WhatsAppIcon size={16} />;
    }
    if (notif.category === 'squads') {
      return <UsersIcon size={16} />;
    }
    if (notif.type === 'deadline_extended' || notif.type === 'round_extended') {
      return <SparklesIcon size={16} />;
    }
    if (notif.type === 'round_live') {
      return <TrophyIcon size={16} />;
    }
    if (notif.urgency === 'critical') {
      return <AlertCircleIcon size={16} />;
    }
    if (notif.category === 'deadlines') {
      return <ClockIcon size={16} />;
    }
    return <BellIcon size={16} />;
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
        title="Reminders"
        aria-label={`Reminders, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <BellIcon size={18} />
        {unreadCount > 0 && (
          <span className={`onestop-notif-badge ${hasCriticalAlert ? 'has-pulse' : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="onestop-notif-dropdown" role="dialog" aria-label="Reminders Panel">
          {/* Header */}
          <div className="onestop-notif-header">
            <div className="onestop-notif-title-row">
              <h3 className="onestop-notif-title">Reminders</h3>
              {unreadCount > 0 && (
                <span className="onestop-notif-count-pill">{unreadCount} new</span>
              )}
            </div>
            <div className="onestop-notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="onestop-notif-mark-read-btn"
                  onClick={handleMarkAllRead}
                  title="Mark all notifications as read"
                >
                  Mark all as read
                </button>
              )}
              {allNotifications.length > 0 && (
                <button
                  type="button"
                  className="onestop-notif-clear-all-btn"
                  onClick={handleDismissAll}
                  title="Clear all reminders"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Device Notifications Toggle Row */}
          {pushSupported && (
            <div className={`onestop-notif-device-toggle-row ${isDeviceAlertsActive ? 'active' : 'inactive'}`}>
              <div className="onestop-notif-device-info">
                <div className="onestop-notif-device-title-line">
                  <span className="onestop-notif-device-icon">
                    {isDeviceAlertsActive ? (
                      <CheckIcon size={13} color="#059669" />
                    ) : pushPermission === 'denied' ? (
                      <AlertCircleIcon size={13} color="#DC2626" />
                    ) : (
                      <BellOffIcon size={13} color="var(--ink-muted)" />
                    )}
                  </span>
                  <span className="onestop-notif-device-title">Device notifications</span>
                  <span className={`onestop-notif-device-pill ${isDeviceAlertsActive ? 'pill-active' : pushPermission === 'denied' ? 'pill-denied' : 'pill-off'}`}>
                    {pushPermission === 'denied' ? 'Blocked' : isDeviceAlertsActive ? 'On' : 'Off'}
                  </span>
                </div>
                <p className="onestop-notif-device-desc">
                  {pushPermission === 'denied'
                    ? 'Blocked by browser. Allow notifications in site settings.'
                    : isDeviceAlertsActive
                    ? 'Phone & desktop alerts active for bookmarked deadlines'
                    : 'Get 1h & 30m deadline alerts on this device'}
                </p>
              </div>

              <div className="onestop-notif-device-action">
                <button
                  type="button"
                  className={`onestop-notif-toggle-switch ${isDeviceAlertsActive ? 'enabled' : ''} ${pushPermission === 'denied' ? 'is-denied' : ''}`}
                  onClick={handleToggleDeviceAlerts}
                  role="switch"
                  aria-checked={isDeviceAlertsActive}
                  aria-label="Toggle device notifications on or off"
                  title={
                    pushPermission === 'denied'
                      ? 'Notifications blocked by browser. Click to see instructions.'
                      : isDeviceAlertsActive
                      ? 'Turn off phone & desktop alerts'
                      : 'Turn on phone & desktop alerts'
                  }
                >
                  <span className="onestop-notif-toggle-knob" />
                </button>
              </div>
            </div>
          )}

          {/* Browser Permission Denied Tip */}
          {showDeniedTip && pushPermission === 'denied' && (
            <div className="onestop-notif-denied-tip">
              <span>⚠️ <strong>Notifications blocked:</strong> Click the lock or tune icon in your browser address bar next to the URL and set Notifications to <strong>Allow</strong>.</span>
            </div>
          )}

          {/* iOS Safari Home Screen Tip */}
          {isIOS() && !isStandalone() && (
            <div className="onestop-notif-ios-banner">
              <span>📲 <strong>For iPhone alerts:</strong> Tap <strong>Share</strong> ⎋ then <strong>"Add to Home Screen"</strong></span>
            </div>
          )}

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
              aria-selected={activeTab === 'deadlines'}
              className={`onestop-notif-tab ${activeTab === 'deadlines' ? 'active' : ''}`}
              onClick={() => setActiveTab('deadlines')}
            >
              <span>Deadlines & Rounds</span>
              {tabCounts.deadlines > 0 && <span className="onestop-notif-tab-badge">{tabCounts.deadlines}</span>}
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
                <h4 className="onestop-notif-empty-title">No reminders right now</h4>
                <p className="onestop-notif-empty-desc">
                  {activeTab === 'squads'
                    ? 'No pending squad applications or accepted handshakes right now.'
                    : activeTab === 'deadlines'
                    ? 'No urgent deadlines or extensions right now. Bookmark competitions to track their rounds.'
                    : 'You are all caught up! Bookmarked deadlines, round deadlines, and squad requests will appear here.'}
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
                          onClick={(e) => handleDismiss(e, notif.id)}
                          title="Dismiss notification"
                          aria-label="Dismiss notification"
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
                              {notif.urgency === 'live' && <span className="onestop-notif-live-dot" />}
                              {notif.badgeText}
                            </span>
                          )}
                          {notif.data?.host && (
                            <span className="onestop-notif-host-tag" title={notif.data.host}>
                              {notif.data.host}
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
                                className={`onestop-notif-action-btn ${act.actionType === 'portal' ? 'portal' : act.actionType === 'whatsapp' ? 'whatsapp' : (act.isPrimary ? 'primary' : 'secondary')}`}
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
              <span>View squad requests &amp; handshakes</span>
              <ExternalLinkIcon size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
