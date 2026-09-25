// src/lib/browserPushService.js
// Native Web Browser Push Notification Service for Deadlines & Extensions

const PUSH_ENABLED_KEY = 'onestop_push_notifications_enabled';
const DISPATCHED_PUSHES_KEY = 'onestop_dispatched_pushes_v1';

export function isPushSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPushPermission() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

export function isPushEnabled() {
  if (!isPushSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    const val = localStorage.getItem(PUSH_ENABLED_KEY);
    return val !== 'false'; // default true if permission granted
  } catch {
    return false;
  }
}

export function setPushEnabled(enabled) {
  try {
    localStorage.setItem(PUSH_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('[PushService] Could not save push preference:', e);
  }
}

export async function requestPushPermission() {
  if (!isPushSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setPushEnabled(true);
    }
    return result;
  } catch (err) {
    console.warn('[PushService] Permission request error:', err);
    return 'denied';
  }
}

function getDispatchedMap() {
  try {
    const raw = localStorage.getItem(DISPATCHED_PUSHES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function recordDispatched(tag) {
  try {
    const map = getDispatchedMap();
    map[tag] = Date.now();
    // Prune entries older than 7 days
    const now = Date.now();
    for (const [k, ts] of Object.entries(map)) {
      if (now - ts > 7 * 24 * 60 * 60 * 1000) {
        delete map[k];
      }
    }
    localStorage.setItem(DISPATCHED_PUSHES_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('[PushService] Could not record dispatched push:', e);
  }
}

export function hasDispatchedPush(tag) {
  if (!tag) return false;
  const map = getDispatchedMap();
  return Boolean(map[tag]);
}

/**
 * Dispatches an OS-level desktop notification if permission is granted and push is enabled.
 * Automatically deduplicates using the unique tag.
 */
export function dispatchBrowserNotification({
  title,
  body,
  tag,
  icon = '/onestop-icon.png',
  url = null,
  onClick = null
}) {
  if (!isPushSupported()) return false;
  if (Notification.permission !== 'granted' || !isPushEnabled()) return false;
  if (tag && hasDispatchedPush(tag)) return false;

  try {
    const notification = new Notification(title, {
      body,
      icon,
      badge: '/favicon.png',
      tag: tag || undefined,
      silent: false
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch (e) {}

      if (typeof onClick === 'function') {
        onClick();
      } else if (url) {
        window.open(url, '_blank');
      }
      notification.close();
    };

    if (tag) {
      recordDispatched(tag);
    }
    return true;
  } catch (err) {
    console.warn('[PushService] Error dispatching push notification:', err);
    return false;
  }
}
