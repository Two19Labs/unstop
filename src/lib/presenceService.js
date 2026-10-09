// src/lib/presenceService.js
import { supabase, hasValidCredentials } from './supabaseClient.js';

export const SCREEN_LABELS = {
  home: 'Home Dashboard',
  browse: 'Browse Competitions',
  teams: 'Squad Finder',
  requests: 'Inbox & Requests',
  profile: 'Profile & Settings',
  about: 'About',
  contact: 'Contact & Support',
  admin: 'Admin Console'
};

export const SCREEN_COLORS = {
  home: { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563EB', border: 'rgba(59, 130, 246, 0.3)' },
  browse: { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.3)' },
  teams: { bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: 'rgba(245, 158, 11, 0.3)' },
  requests: { bg: 'rgba(139, 92, 246, 0.12)', color: '#7C3AED', border: 'rgba(139, 92, 246, 0.3)' },
  profile: { bg: 'rgba(20, 184, 166, 0.12)', color: '#0D9488', border: 'rgba(20, 184, 166, 0.3)' },
  about: { bg: 'rgba(100, 116, 139, 0.12)', color: '#475569', border: 'rgba(100, 116, 139, 0.3)' },
  contact: { bg: 'rgba(100, 116, 139, 0.12)', color: '#475569', border: 'rgba(100, 116, 139, 0.3)' },
  admin: { bg: 'rgba(220, 38, 38, 0.12)', color: '#DC2626', border: 'rgba(220, 38, 38, 0.3)' }
};

// Supabase drops a session from the channel as soon as its connection closes, so the
// channel itself is the list of who is online. No client timestamps are compared:
// a visitor's device clock can be minutes off, which used to hide them entirely.
// This timer only re-tracks a session the channel lost (e.g. after a reconnect);
// it sends nothing while the session is listed.
const ENSURE_TRACKED_INTERVAL_MS = 30000;

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
// sessionId -> { signature, seenAt }: when this tab last saw each session change,
// measured on this device's own clock
const sessionActivity = new Map();

function isTabVisible() {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden';
}

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
    visible: isTabVisible(),
    isRegistered: isAuth,
  };
}

export function computeConsolidatedPresence() {
  const now = Date.now();
  const merged = {};

  // 1. Everyone connected to the presence channel
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
                // Tabs still running an older build send no `visible`: treat them as active
                merged[sid] = { ...p, sessionId: sid, visible: p.visible !== false };
              }
            });
          }
        });
      }
    } catch (e) {
      console.warn('[Presence] Error reading realtime presence state:', e);
    }
  }

  // 2. Always include this tab, even before its own join has synced
  const currentTabPayload = buildPresencePayload();
  if (currentTabPayload && currentTabPayload.sessionId) {
    merged[currentTabPayload.sessionId] = { ...currentTabPayload, isSelf: true };
  }

  // 3. When did each session last change (screen, visibility, sign-in)? Local clock only.
  Object.values(merged).forEach((p) => {
    const signature = `${p.currentScreen}|${p.visible}|${p.userId}`;
    const prev = sessionActivity.get(p.sessionId);
    if (!prev || prev.signature !== signature) sessionActivity.set(p.sessionId, { signature, seenAt: now });
    p.lastActiveAt = sessionActivity.get(p.sessionId).seenAt;
  });
  [...sessionActivity.keys()].forEach((sid) => { if (!merged[sid]) sessionActivity.delete(sid); });

  // 4. Deduplicate: one row per signed-in person (several tabs or devices) or per guest tab,
  //    preferring a tab in the foreground, then the most recently active one
  const rank = (p) => (p.visible ? 1 : 0) * 1e15 + (p.lastActiveAt || 0);
  const uniqueUsers = {};
  Object.values(merged).forEach((p) => {
    if (!p) return;
    const dedupeKey = p.isRegistered ? (p.userId || p.sessionId) : (p.sessionId || p.userId);

    const existing = uniqueUsers[dedupeKey];
    const isSelf = Boolean(p.isSelf || existing?.isSelf);
    if (!existing || rank(p) >= rank(existing)) {
      uniqueUsers[dedupeKey] = { ...p, isSelf };
    } else if (isSelf) {
      existing.isSelf = true;
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

    const channel = activeChannel;
    channel.subscribe((status, err) => {
      if (channel !== activeChannel) return; // a replaced channel
      if (status === 'SUBSCRIBED') {
        isReconnecting = false;
        const payload = buildPresencePayload();
        channel.track(payload).then(() => {
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
            // Rejoin as the same person: no arguments here would report a signed-in user as a guest
            initGlobalPresence(globalCurrentUser, globalCurrentProfile, globalCurrentScreen);
          }, 3500);
        }
      }
    });

    // Re-track only if the channel no longer lists this tab (e.g. its connection dropped and came back)
    if (!heartbeatTimer) {
      heartbeatTimer = setInterval(() => {
        if (!activeChannel || typeof activeChannel.presenceState !== 'function') return;
        if (activeChannel.state !== 'joined') return;
        const state = activeChannel.presenceState() || {};
        if (!state[getTabSessionId()]) sendPresencePing(null, null, null, true);
      }, ENSURE_TRACKED_INTERVAL_MS);
    }

    if (typeof window !== 'undefined' && !isListenersAttached) {
      isListenersAttached = true;

      // Report foreground / background so the admin console can tell active from idle tabs
      document.addEventListener('visibilitychange', () => {
        sendPresencePing(null, null, null, true);
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
