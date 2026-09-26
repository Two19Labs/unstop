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

let tabSessionId = null;
function getTabSessionId() {
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

function getDeviceType() {
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

function notifySubscribers() {
  const presenceList = Object.values(latestPresenceMap);
  presenceSubscribers.forEach((cb) => {
    try {
      cb(presenceList);
    } catch (e) {
      console.warn('Presence subscriber callback error:', e);
    }
  });
}

export function sendPresencePing(user = globalCurrentUser, profile = globalCurrentProfile, screen = globalCurrentScreen) {
  if (user) globalCurrentUser = user;
  if (profile) globalCurrentProfile = profile;
  if (screen) globalCurrentScreen = screen;

  if (!hasValidCredentials || !activeChannel) return;

  const sessionId = getTabSessionId();
  const userName = globalCurrentProfile?.name || globalCurrentUser?.user_metadata?.full_name || globalCurrentUser?.email?.split('@')[0] || 'Student';
  const userCollege = globalCurrentProfile?.college || 'University';
  const userYear = globalCurrentProfile?.year || globalCurrentProfile?.batch || 'Undergraduate';

  const payload = {
    sessionId,
    userId: globalCurrentUser?.id || sessionId,
    email: globalCurrentUser?.email || 'Anonymous',
    name: userName,
    college: userCollege,
    year: userYear,
    currentScreen: globalCurrentScreen,
    device: getDeviceType(),
    lastPing: Date.now()
  };

  try {
    activeChannel.track(payload).catch(() => {});
  } catch (e) {
    // Non-blocking
  }
}

function initPresenceChannel() {
  if (!hasValidCredentials || activeChannel) return;

  try {
    const sid = getTabSessionId();
    activeChannel = supabase.channel('onestop-online-presence-v1', {
      config: { presence: { key: sid } }
    });

    const handleSync = () => {
      try {
        const state = activeChannel.presenceState();
        const nextMap = {};
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          if (Array.isArray(presences) && presences.length > 0) {
            // Pick most recent entry for this session
            const latest = presences[presences.length - 1];
            nextMap[key] = latest;
          }
        });
        latestPresenceMap = nextMap;
        notifySubscribers();
      } catch (err) {
        console.warn('Presence sync parsing error:', err);
      }
    };

    activeChannel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleSync)
      .on('presence', { event: 'leave' }, handleSync);

    activeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        sendPresencePing();
      }
    });

    if (!heartbeatTimer) {
      // Periodic ping every 75s
      heartbeatTimer = setInterval(() => {
        sendPresencePing();
      }, 75000);
    }

    if (typeof document !== 'undefined' && !isVisibilityListenerAttached) {
      isVisibilityListenerAttached = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          sendPresencePing();
        }
      });
    }
  } catch (err) {
    console.warn('Error setting up Supabase presence channel:', err);
  }
}

/**
 * Subscribes a listener to live online presence updates.
 *
 * @param {object} user - Current user object
 * @param {object} profile - Current user profile
 * @param {string} screen - Current screen name
 * @param {function} onSync - Callback receiving active presence list
 * @returns {function} Unsubscribe function
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

  initPresenceChannel();
  sendPresencePing();

  return () => {
    if (onSync) {
      presenceSubscribers.delete(onSync);
    }
  };
}
