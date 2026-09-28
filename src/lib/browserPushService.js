// src/lib/browserPushService.js
// Native Web Browser Push Notification Service for Mobile Phones & Desktop

const PUSH_ENABLED_KEY = 'onestop_push_notifications_enabled';
const DISPATCHED_PUSHES_KEY = 'onestop_dispatched_pushes_v1';

let swRegistrationPromise = null;

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isIOS() {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

/**
 * Register Service Worker for mobile notification handling and offline capabilities.
 */
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (swRegistrationPromise) {
    return swRegistrationPromise;
  }

  swRegistrationPromise = (async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      if (reg.installing) {
        await new Promise((resolve) => {
          reg.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') resolve();
          });
          setTimeout(resolve, 2000); // safety fallback
        });
      }
      return reg;
    } catch (err) {
      console.warn('[PushService] ServiceWorker registration warning:', err);
      return null;
    }
  })();

  return swRegistrationPromise;
}

export function isPushSupported() {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window || (typeof navigator !== 'undefined' && 'serviceWorker' in navigator);
}

export function getPushPermission() {
  if (!isPushSupported()) return 'unsupported';
  if (typeof Notification !== 'undefined') {
    return Notification.permission; // 'granted' | 'denied' | 'default'
  }
  return 'default';
}

export function isPushEnabled() {
  if (!isPushSupported()) return false;
  const perm = getPushPermission();
  if (perm !== 'granted') return false;
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
    let result = 'default';
    if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
      result = await Notification.requestPermission();
    }
    if (result === 'granted') {
      setPushEnabled(true);
      // Ensure Service Worker is registered and active
      await registerServiceWorker();
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
 * Dispatches an OS-level notification on Mobile Phones (Android, iOS PWA) & Desktop.
 * Uses ServiceWorkerRegistration.showNotification() as primary for mobile compatibility,
 * falling back to new Notification() for legacy desktop browsers.
 */
export async function dispatchBrowserNotification({
  title,
  body,
  tag,
  icon = '/onestop-icon.png',
  url = null,
  onClick = null
}) {
  if (!isPushSupported()) return false;
  if (!isPushEnabled()) return false;
  if (tag && hasDispatchedPush(tag)) return false;

  const targetUrl = url || '/';

  // 1. Primary Dispatch for Mobile (Android, iOS PWA) & Modern Browsers: ServiceWorker.showNotification
  // On mobile browsers (Android Chrome/Opera), calling `new Notification()` throws an Illegal constructor TypeError.
  // ServiceWorkerRegistration.showNotification is the official, required standard.
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await registerServiceWorker();
      }

      if (reg) {
        const readyReg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(() => resolve(reg), 1200))
        ]);

        const activeReg = readyReg || reg;
        if (activeReg && typeof activeReg.showNotification === 'function') {
          await activeReg.showNotification(title, {
            body,
            icon,
            badge: '/favicon.png',
            tag: tag || undefined,
            data: { url: targetUrl },
            silent: false,
            vibrate: [200, 100, 200] // Haptic vibration on mobile phones
          });

          if (tag) recordDispatched(tag);
          return true;
        }
      }
    } catch (swErr) {
      console.warn('[PushService] SW showNotification error, trying window fallback:', swErr);
    }
  }

  // 2. Desktop Fallback: window.Notification
  if (typeof Notification !== 'undefined') {
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
      console.warn('[PushService] Error dispatching desktop notification:', err);
      return false;
    }
  }

  return false;
}
