// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { purgeLegacyPrivateStorage } from './lib/storage';
import { initPostHog, posthog } from './lib/posthog';
import { PostHogProvider } from 'posthog-js/react';
import { registerServiceWorker } from './lib/browserPushService';
import './index.css';

// Register Service Worker on boot for mobile notifications & PWA offline cache
if (typeof window !== 'undefined') {
  registerServiceWorker();
}

// Remove personal data that older builds cached in the browser (profile, posts,
// applications, chats, bookmarks, presence) plus retired demo/mock keys.
purgeLegacyPrivateStorage();
['arena_squad_posts', 'arena_squad_apps', 'arena_bookmarks', 'arena_saved_alerts', 'arena_theme',
  'onestop_theme', 'onestop_demo_seen', 'onestop_mock_seeded', 'onestop_strict_clean_v2'].forEach((k) => {
  try {
    localStorage.removeItem(k);
  } catch (e) {}
});

// Initialize PostHog analytics (gracefully degrades if no API key present)
initPostHog();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PostHogProvider client={posthog}>
        <App />
      </PostHogProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
