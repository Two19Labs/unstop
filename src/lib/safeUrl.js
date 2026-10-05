// src/lib/safeUrl.js
// Competition links come from third-party sources (Unstop's API and the
// institutional scraper). React 18 still renders `javascript:` hrefs, so every
// external link goes through here: only http(s) URLs survive, anything else
// falls back to a known-safe URL.

export function safeExternalUrl(raw, fallback = 'https://unstop.com') {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim();
  if (!value) return fallback;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : fallback;
  } catch (e) {
    return fallback;
  }
}
