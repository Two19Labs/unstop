// src/lib/presenceService.js
import { supabase, hasValidCredentials } from './supabaseClient';

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

const LOCAL_STORAGE_KEY = 'onestop_active_sessions_v1';

let tabSessionId = null;
export function getTabSessionId() {
  if (!tabSessionId) {
    try {
      tabSessionId = sessionStorage.getItem('onestop_tab_session_id');
      if (!tabSessionId) {
        tabSessionId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem('onestop_tab_session_id', tabSessionId);
      }
    } catch {
      tabSessionId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
  }
  return tabSessionId;
}

export function getDeviceType() {
  if (typeof window === 'undefined') return 'Desktop';
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
let isVisibilityListenerAttached = false;

let globalCurrentUser = null;
let globalCurrentProfile = null;
let globalCurrentScreen = 'home';

function buildPresencePayload() {
  const sid = getTabSessionId();
  const isAuth = Boolean(globalCurrentUser && globalCurrentUser.email);
  const userName =
    globalCurrentProfile?.full_name ||
    globalCurrentProfile?.name ||
    globalCurrentUser?.user_metadata?.full_name ||
    (globalCurrentUser?.email ? globalCurrentUser.email.split('@')[0] : 'Guest Visitor');

  const userCollege = globalCurrentProfile?.college || (isAuth ? 'College Setup Pending' : 'Visiting OneStop');
  const userCourse = globalCurrentProfile?.course || '';
  const userYear = globalCurrentProfile?.year || globalCurrentProfile?.batch || 'UG 2nd Year';
  const userPhone = globalCurrentProfile?.phone || '';

  return {
    sessionId: sid,
    userId: globalCurrentUser?.id || sid,
    email: globalCurrentUser?.email || 'guest@onestop.internal',
    name: userName,
    college: userCollege,
    course: userCourse,
    year: userYear,
    phone: userPhone,
    currentScreen: globalCurrentScreen || 'home',
    device: getDeviceType(),
    lastPing: Date.now(),
    isRegistered: isAuth,
    skills: globalCurrentProfile?.skills || []
  };
}

function updateLocalSessions(payload) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let map = raw ? JSON.parse(raw) : {};
    if (typeof map !== 'object' || !map) map = {};

    const now = Date.now();
    if (payload && payload.sessionId) {
      map[payload.sessionId] = payload;
    }

    // Retain sessions active in the last 60 seconds
    const cleanMap = {};
    Object.keys(map).forEach((k) => {
      const item = map[k];
      if (item && Math.abs(now - (item.lastPing || 0)) < 60000) {
        cleanMap[k] = item;
      }
    });

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanMap));
    return cleanMap;
  } catch {
    return {};
  }
}

function computeConsolidatedPresence() {
  const now = Date.now();
  const merged = {};

  // 1. Local storage active sessions
  const localMap = updateLocalSessions(null);
  Object.values(localMap).forEach((p) => {
    if (p && p.sessionId && Math.abs(now - (p.lastPing || 0)) < 60000) {
      merged[p.sessionId] = p;
    }
  });

  // 2. Realtime WebSocket channel presence
  if (activeChannel && typeof activeChannel.presenceState === 'function') {
    try {
      const state = activeChannel.presenceState();
      if (state) {
        Object.values(state).forEach((presences) => {
          if (Array.isArray(presences)) {
            presences.forEach((p) => {
              if (p && (p.sessionId || p.email)) {
                const key = p.sessionId || p.email;
                merged[key] = {
                  ...p,
                  lastPing: p.lastPing || now
                };
              }
            });
          }
        });
      }
    } catch (e) {}
  }

  // 3. Deduplicate: one card per unique student (keyed by email if registered, else sessionId)
  const uniqueUsers = {};
  Object.values(merged).forEach((p) => {
    if (!p) return;
    const isGuest = !p.isRegistered || p.email.endsWith('@onestop.internal');
    const key = isGuest ? p.sessionId : p.email.toLowerCase();

    const existing = uniqueUsers[key];
    if (!existing || (p.lastPing || 0) >= (existing.lastPing || 0)) {
      uniqueUsers[key] = p;
    }
  });

  latestPresenceMap = uniqueUsers;
  notifySubscribers();
}

function notifySubscribers() {
  const list = Object.values(latestPresenceMap);
  presenceSubscribers.forEach((cb) => {
    try {
      cb(list);
    } catch (e) {
      console.warn('Presence subscriber error:', e);
    }
  });
}

export function sendPresencePing(user = globalCurrentUser, profile = globalCurrentProfile, screen = globalCurrentScreen) {
  if (user) globalCurrentUser = user;
  if (profile) globalCurrentProfile = profile;
  if (screen) globalCurrentScreen = screen;

  const payload = buildPresencePayload();
  updateLocalSessions(payload);

  if (!hasValidCredentials) {
    computeConsolidatedPresence();
    return;
  }

  if (!activeChannel) {
    initGlobalPresence(user, profile, screen);
    return;
  }

  try {
    activeChannel.track(payload).catch(() => {});
  } catch (e) {}

  computeConsolidatedPresence();
}

export function initGlobalPresence(user, profile, screen) {
  if (user) globalCurrentUser = user;
  if (profile) globalCurrentProfile = profile;
  if (screen) globalCurrentScreen = screen;

  const initialPayload = buildPresencePayload();
  updateLocalSessions(initialPayload);

  if (!hasValidCredentials) {
    computeConsolidatedPresence();
    return;
  }

  if (activeChannel) {
    sendPresencePing();
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

    activeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        const payload = buildPresencePayload();
        activeChannel.track(payload).catch(() => {});
        computeConsolidatedPresence();
      }
    });

    if (!heartbeatTimer) {
      // Periodic ping every 30s for live freshness
      heartbeatTimer = setInterval(() => {
        sendPresencePing();
      }, 30000);
    }

    if (typeof document !== 'undefined' && !isVisibilityListenerAttached) {
      isVisibilityListenerAttached = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          sendPresencePing();
        }
      });
      window.addEventListener('focus', () => {
        sendPresencePing();
      });
    }
  } catch (err) {
    console.warn('Realtime presence init error:', err);
  }
}

/**
 * Subscribes a listener in AdminConsolePage to live online presence list.
 */
export function subscribeToPresence(user, profile, screen, onSync) {
  if (user) globalCurrentUser = user;
  if (profile) globalCurrentProfile = profile;
  if (screen) globalCurrentScreen = screen;

  if (onSync) {
    presenceSubscribers.add(onSync);
    try {
      onSync(Object.values(latestPresenceMap));
    } catch (e) {}
  }

  initGlobalPresence(user, profile, screen);
  sendPresencePing();

  return () => {
    if (onSync) {
      presenceSubscribers.delete(onSync);
    }
  };
}
