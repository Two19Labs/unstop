// src/lib/storage.js
// Browser storage policy: OneStop never keeps personal data (profile, applications,
// squad contacts, chats, bookmarks, presence) in localStorage. Everything the app
// stores is wiped on sign-out; only device-level UI flags below survive.

const APP_KEY_PREFIXES = ['onestop_', 'arena_', 'sscbs_', 'comp_'];

const KEEP_ON_SIGN_OUT = new Set([
  'onestop_walkthrough_seen',
  'onestop_shortcut_installed',
  'onestop_shortcut_prompt_dismissed_at',
  'onestop_push_notifications_enabled',
  'onestop_dispatched_pushes_v1',
]);

// Personal caches written by older builds. Removed on every boot.
const LEGACY_PRIVATE_KEYS = [
  'onestop_user_profile',
  'onestop_applications',
  'onestop_posts',
  'onestop_bookmarks',
  'onestop_saved_alerts',
  'onestop_user_notification_states',
  'onestop_active_sessions_v1',
  'onestop_bookmarked_comps',
];
const LEGACY_PRIVATE_PREFIXES = [
  'onestop_squad_chat_',
  'onestop_profile_last_updated_',
  'onestop_user_notification_states_',
  'onestop_bookmarked_comps_',
];

function keysOf(store) {
  const keys = [];
  try {
    for (let i = 0; i < store.length; i += 1) {
      const k = store.key(i);
      if (k) keys.push(k);
    }
  } catch (e) {}
  return keys;
}

function safeRemove(store, key) {
  try {
    store.removeItem(key);
  } catch (e) {}
}

export function purgeLegacyPrivateStorage() {
  if (typeof window === 'undefined') return;
  const store = window.localStorage;
  LEGACY_PRIVATE_KEYS.forEach((k) => safeRemove(store, k));
  keysOf(store)
    .filter((k) => LEGACY_PRIVATE_PREFIXES.some((p) => k.startsWith(p)))
    .forEach((k) => safeRemove(store, k));
}

export function purgeUserStorage() {
  if (typeof window === 'undefined') return;
  [window.localStorage, window.sessionStorage].forEach((store) => {
    keysOf(store)
      .filter((k) => APP_KEY_PREFIXES.some((p) => k.startsWith(p)) && !KEEP_ON_SIGN_OUT.has(k))
      .forEach((k) => safeRemove(store, k));
  });
}
