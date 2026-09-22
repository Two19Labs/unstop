// src/lib/posthog.js
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let isInitialized = false;

/**
 * Initializes the PostHog SDK client.
 * If VITE_POSTHOG_KEY is not configured or is a placeholder,
 * the SDK gracefully degrades and remains inactive without crashing.
 */
export function initPostHog() {
  if (isInitialized) return posthog;

  if (!POSTHOG_KEY || POSTHOG_KEY.includes('your-') || POSTHOG_KEY === 'undefined') {
    if (import.meta.env.DEV) {
      console.info(
        '%c[PostHog]%c No valid VITE_POSTHOG_KEY found. Analytics running in dry-run mode (disabled). Add key to .env.local to activate.',
        'color: #0F3FFE; font-weight: bold;',
        'color: #666;'
      );
    }
    return posthog;
  }

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: true,
      capture_pageview: false, // OneStop uses screen-based navigation; we send custom screen views
      capture_pageleave: true,
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: {
          password: true,
          tel: true, // Mask phone inputs for user privacy
        },
      },
      persistence: 'localStorage+cookie',
      loaded: (ph) => {
        if (import.meta.env.DEV) {
          console.info(
            '%c[PostHog]%c Initialized successfully with host: ' + POSTHOG_HOST,
            'color: #0F3FFE; font-weight: bold;',
            'color: #10B981;'
          );
        }
      },
      enable_recording_console_log: true,
    });
    isInitialized = true;
  } catch (err) {
    console.warn('[PostHog] Initialization error:', err);
  }

  return posthog;
}

/**
 * Capture a custom product event with arbitrary properties.
 * @param {string} eventName - e.g. 'squad_post_created'
 * @param {Record<string, any>} [properties] - event payload
 */
export function trackEvent(eventName, properties = {}) {
  try {
    if (isInitialized) {
      posthog.capture(eventName, {
        timestamp: new Date().toISOString(),
        ...properties,
      });
    } else if (import.meta.env.DEV) {
      console.debug(`[PostHog DRY-RUN] ${eventName}:`, properties);
    }
  } catch (err) {
    console.warn(`[PostHog] Error capturing event "${eventName}":`, err);
  }
}

/**
 * Capture a virtual screen/pageview for state-based single-page navigation.
 * Emits both standard PostHog `$pageview` and custom `screen_view`.
 * @param {string} screenName - e.g. 'home', 'browse', 'teams', 'requests', 'profile'
 * @param {Record<string, any>} [properties]
 */
export function trackScreenView(screenName, properties = {}) {
  try {
    const virtualPath = screenName === 'home' ? '/' : `/${screenName}`;
    const payload = {
      $current_url: `${window.location.origin}${virtualPath}`,
      screen_name: screenName,
      ...properties,
    };

    if (isInitialized) {
      posthog.capture('$pageview', payload);
      posthog.capture('screen_view', payload);
    } else if (import.meta.env.DEV) {
      console.debug(`[PostHog DRY-RUN] screen_view: ${screenName}`, payload);
    }
  } catch (err) {
    console.warn(`[PostHog] Error tracking screen view "${screenName}":`, err);
  }
}

/**
 * Identify an authenticated user and register super properties.
 * @param {string} userId - Supabase UUID
 * @param {Record<string, any>} [traits] - { email, full_name, college, year, education_level }
 */
export function identifyUser(userId, traits = {}) {
  try {
    if (!userId) return;

    if (isInitialized) {
      posthog.identify(userId, traits);
    } else if (import.meta.env.DEV) {
      console.debug(`[PostHog DRY-RUN] identify (${userId}):`, traits);
    }
  } catch (err) {
    console.warn('[PostHog] Error identifying user:', err);
  }
}

/**
 * Update person properties (e.g. after profile edit).
 * @param {Record<string, any>} traits
 */
export function setPersonProperties(traits = {}) {
  try {
    if (isInitialized) {
      posthog.setPersonProperties(traits);
    } else if (import.meta.env.DEV) {
      console.debug('[PostHog DRY-RUN] setPersonProperties:', traits);
    }
  } catch (err) {
    console.warn('[PostHog] Error setting person properties:', err);
  }
}

/**
 * Reset PostHog identity on user logout.
 */
export function resetUser() {
  try {
    if (isInitialized) {
      posthog.reset();
    } else if (import.meta.env.DEV) {
      console.debug('[PostHog DRY-RUN] resetUser');
    }
  } catch (err) {
    console.warn('[PostHog] Error resetting user:', err);
  }
}

/**
 * Capture an unhandled JavaScript error or React boundary error.
 * @param {Error|any} error
 * @param {Record<string, any>} [extra]
 */
export function captureException(error, extra = {}) {
  try {
    if (isInitialized) {
      posthog.captureException(error, { extra });
    } else if (import.meta.env.DEV) {
      console.error('[PostHog DRY-RUN] captureException:', error, extra);
    }
  } catch (err) {
    console.warn('[PostHog] Error capturing exception:', err);
  }
}

export { posthog };
export default posthog;
