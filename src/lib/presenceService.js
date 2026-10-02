// src/lib/presenceService.js
import { supabase, hasValidCredentials } from './supabaseClient.js';

export const SCREEN_LABELS = {
  home: 'Home Dashboard',
  browse: 'Browse Competitions',
  teams: 'Squad Finder',
  requests: 'Inbox & Requests',
  profile: 'Profile & Settings',
  admin: 'Admin Console'
};

export const SCREEN_COLORS = {
  home: { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563EB', border: 'rgba(59, 130, 246, 0.3)' },
  browse: { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.3)' },
  teams: { bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: 'rgba(245, 158, 11, 0.3)' },
  requests: { bg: 'rgba(139, 92, 246, 0.12)', color: '#7C3AED', border: 'rgba(139, 92, 246, 0.3)' },
  profile: { bg: 'rgba(20, 184, 166, 0.12)', color: '#0D9488', border: 'rgba(20, 184, 166, 0.3)' },
  admin: { bg: 'rgba(220, 38, 38, 0.12)', color: '#DC2626', border: 'rgba(220, 38, 38, 0.3)' }
};

const PRESENCE_TTL_MS = 60000; // 60 seconds TTL before considering a session inactive
const HEARTBEAT_INTERVAL_MS = 15000; // 15 seconds heartbeat for real-time responsiveness

let tabSessionId = null;
export function getTabSessionId() {
  if (!tabSessionId) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        tabSessionId = sessionStorage.getItem('onestop_tab_session_id');
        if (!tabSessionId) {
          tabSessionId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          sessionStorage.setItem('onestop_tab_session_id', tabSessionId);
        }
      }
    } catch {
      // Fallback
    }
    if (!tabSessionId) {
      tabSessionId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
  }
  return tabSessionId;
}

export function getDeviceType() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'Desktop';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Desktop';
}

let activeChannel = null;
let presenceSubscribers = new Set();
let latestPresenceMap = {};
let heartbeatTimer = null;
let isListenersAttached = false;
let isReconnecting = false;

let globalCurrentUser = null;
let globalCurrentProfile = null;
let globalCurrentScreen = 'home';
let lastPresencePingAt = 0;

// The presence channel is readable by anyone holding the public anon key, so the
// payload carries no personal data. The admin console resolves userId -> profile
// through the database (admin-only RLS).
function buildPresencePayload() {
  const sid = getTabSessionId();
  const isAuth = Boolean(globalCurrentUser && globalCurrentUser.id);
  return {
    sessionId: sid,
    userId: isAuth ? globalCurrentUser.id : sid,
    currentScreen: (globalCurrentScreen || 'home').toLowerCase(),
    device: getDeviceType(),
    lastPing: Date.now(),
    isRegistered: isAuth,
  };
}

export function computeConsolidatedPresence() {
  const now = Date.now();
  const merged = {};

  // 1. Realtime WebSocket channel presence
  if (activeChannel && typeof activeChannel.presenceState === 'function') {
    try {
      const state = activeChannel.presenceState();
      if (state && typeof state === 'object') {
        Object.keys(state).forEach((stateKey) => {
          const presences = state[stateKey];
          if (Array.isArray(presences)) {
            presences.forEach((p) => {
              if (p && typeof p === 'object') {
                const sid = p.sessionId || stateKey;
                const pingTime = Number(p.lastPing) || now;
                // Only consider sessions active within PRESENCE_TTL_MS
                if (Math.abs(now - pingTime) <= PRESENCE_TTL_MS) {
                  merged[sid] = {
                    ...p,
                    sessionId: sid,
                    lastPing: pingTime
                  };
                }
              }
            });
          }
        });
      }
    } catch (e) {
      console.warn('[Presence] Error reading realtime presence state:', e);
    }
  }

  // 2. Always ensure the current client tab's own presence is included
  const currentTabPayload = buildPresencePayload();
  if (currentTabPayload && currentTabPayload.sessionId) {
    merged[currentTabPayload.sessionId] = currentTabPayload;
  }

  // 3. Deduplicate: one card per registered student (by user id) or per guest session
  const uniqueUsers = {};
  Object.values(merged).forEach((p) => {
    if (!p) return;
    const dedupeKey = p.isRegistered ? (p.userId || p.sessionId) : (p.sessionId || p.userId);

    const existing = uniqueUsers[dedupeKey];
    if (!existing || (Number(p.lastPing) || 0) >= (Number(existing.lastPing) || 0)) {
      uniqueUsers[dedupeKey] = p;
    }
  });

  latestPresenceMap = uniqueUsers;
  const list = Object.values(uniqueUsers);
  notifySubscribers(list);
  return list;
}

function notifySubscribers(list = Object.values(latestPresenceMap)) {
  presenceSubscribers.forEach((cb) => {
    try {
      cb(list);
    } catch (e) {
      console.warn('[Presence] Subscriber callback error:', e);
    }
  });
}

export function sendPresencePing(user = globalCurrentUser, profile = globalCurrentProfile, screen = globalCurrentScreen, force = false) {
  let hasContextChanged = false;
  if (user && user !== globalCurrentUser) {
    globalCurrentUser = user;
    hasContextChanged = true;
  }
  if (profile && profile !== globalCurrentProfile) {
    globalCurrentProfile = profile;
    hasContextChanged = true;
  }
  if (screen && screen !== globalCurrentScreen) {
    globalCurrentScreen = screen;
    hasContextChanged = true;
  }

  const now = Date.now();
  // Allow immediate ping if screen/user changed or forced; otherwise throttle background pings to 10s
  if (!force && !hasContextChanged && (now - lastPresencePingAt < 10000)) {
    return;
  }
  lastPresencePingAt = now;

  const payload = buildPresencePayload();

  if (activeChannel && typeof activeChannel.track === 'function') {
    try {
      activeChannel.track(payload).catch((err) => {
        console.warn('[Presence] Track error:', err);
      });
    } catch (e) {}
  }

  computeConsolidatedPresence();
}

export function initGlobalPresence(user, profile, screen) {
  // A signed-out tab must stop reporting the previous user's id
  globalCurrentUser = user || null;
  if (profile) globalCurrentProfile = profile;
  if (screen) globalCurrentScreen = screen;

  if (!hasValidCredentials || !supabase) {
    computeConsolidatedPresence();
    return;
  }

  // If channel is already joined and healthy, send a ping to refresh context
  if (activeChannel) {
    sendPresencePing(user, profile, screen, true);
    return;
  }

  try {
    const sid = getTabSessionId();
    activeChannel = supabase.channel('onestop-online-presence-v1', {
      config: { presence: { key: sid } }
    });

    const handleSync = () => {
      computeConsolidatedPresence();
    };

    activeChannel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleSync)
      .on('presence', { event: 'leave' }, handleSync);

    activeChannel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        isReconnecting = false;
        const payload = buildPresencePayload();
        activeChannel.track(payload).then(() => {
          computeConsolidatedPresence();
        }).catch(() => {});
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[Presence] Channel error (${status}), will attempt reconnect:`, err);
        if (!isReconnecting) {
          isReconnecting = true;
          setTimeout(() => {
            if (activeChannel) {
              try { supabase.removeChannel(activeChannel); } catch (e) {}
              activeChannel = null;
            }
            initGlobalPresence();
          }, 3500);
        }
      }
    });

    // Start 15-second heartbeat for continuous live sync
    if (!heartbeatTimer) {
      heartbeatTimer = setInterval(() => {
        sendPresencePing(null, null, null, true);
      }, HEARTBEAT_INTERVAL_MS);
    }

    if (typeof window !== 'undefined' && !isListenersAttached) {
      isListenersAttached = true;

      // On tab focus or visibility change, ping immediately
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          sendPresencePing(null, null, null, true);
        }
      });
      window.addEventListener('focus', () => {
        sendPresencePing(null, null, null, true);
      });

      // Untrack presence cleanly on tab close or page navigation
      window.addEventListener('beforeunload', () => {
        try {
          if (activeChannel && typeof activeChannel.untrack === 'function') {
            activeChannel.untrack();
          }
        } catch (e) {}
      });

      window.addEventListener('pagehide', () => {
        try {
          if (activeChannel && typeof activeChannel.untrack === 'function') {
            activeChannel.untrack();
          }
        } catch (e) {}
      });
    }
  } catch (err) {
    console.warn('[Presence] Realtime presence init error:', err);
  }
}

/**
 * Subscribes a listener (e.g. in AdminConsolePage) to the live online presence list.
 * Returns an unsubscribe function.
 */
export function subscribeToPresence(user, profile, screen, onSync) {
  if (user) globalCurrentUser = user;
  if (profile) globalCurrentProfile = profile;
  if (screen) globalCurrentScreen = screen;

  if (typeof onSync === 'function') {
    presenceSubscribers.add(onSync);
  }

  // Ensure global presence channel is active
  initGlobalPresence(user, profile, screen);

  // Send an immediate forced ping so admin's presence is registered as 'admin'
  sendPresencePing(user, profile, screen, true);

  // Immediately compute and pass the current consolidated presence to the subscriber
  const immediateList = computeConsolidatedPresence();
  if (typeof onSync === 'function') {
    try {
      onSync(immediateList);
    } catch (e) {}
  }

  return () => {
    if (typeof onSync === 'function') {
      presenceSubscribers.delete(onSync);
    }
  };
}

/**
 * Manually force a presence refresh and return the latest list.
 */
export function refreshPresence() {
  sendPresencePing(null, null, null, true);
  return computeConsolidatedPresence();
}
