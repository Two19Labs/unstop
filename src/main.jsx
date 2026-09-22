// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { isMockPost, isMockApp, isMockAlert, isMockBookmark } from './data/initialData';
import { initPostHog, posthog } from './lib/posthog';
import { PostHogProvider } from 'posthog-js/react';
import './index.css';

// Unconditional Strict Purge of any sandbox/demo/mock data from localStorage
try {
  const deadKeys = [
    'arena_squad_posts',
    'arena_squad_apps',
    'arena_bookmarks',
    'arena_saved_alerts',
    'arena_theme',
    'onestop_demo_seen',
    'onestop_mock_seeded'
  ];
  deadKeys.forEach(k => localStorage.removeItem(k));

  // Purge any stored posts containing mock objects
  const rawPosts = localStorage.getItem('onestop_posts');
  if (rawPosts) {
    try {
      const posts = JSON.parse(rawPosts);
      if (Array.isArray(posts)) {
        const cleaned = posts.filter(p => !isMockPost(p));
        if (cleaned.length === 0) {
          localStorage.removeItem('onestop_posts');
        } else if (cleaned.length !== posts.length) {
          localStorage.setItem('onestop_posts', JSON.stringify(cleaned));
        }
      }
    } catch {
      localStorage.removeItem('onestop_posts');
    }
  }

  // Purge any stored applications containing mock objects
  const rawApps = localStorage.getItem('onestop_applications');
  if (rawApps) {
    try {
      const apps = JSON.parse(rawApps);
      if (Array.isArray(apps)) {
        const cleaned = apps.filter(a => !isMockApp(a));
        if (cleaned.length === 0) {
          localStorage.removeItem('onestop_applications');
        } else if (cleaned.length !== apps.length) {
          localStorage.setItem('onestop_applications', JSON.stringify(cleaned));
        }
      }
    } catch {
      localStorage.removeItem('onestop_applications');
    }
  }

  // Purge any mock bookmarks (e.g. legacy numeric IDs [1, 6])
  const rawBm = localStorage.getItem('onestop_bookmarks');
  if (rawBm) {
    try {
      const bm = JSON.parse(rawBm);
      if (Array.isArray(bm)) {
        const cleaned = bm.filter(b => !isMockBookmark(b));
        if (cleaned.length === 0) {
          localStorage.removeItem('onestop_bookmarks');
        } else if (cleaned.length !== bm.length) {
          localStorage.setItem('onestop_bookmarks', JSON.stringify(cleaned));
        }
      }
    } catch {
      localStorage.removeItem('onestop_bookmarks');
    }
  }

  // Purge any mock alerts (a1, a2)
  const rawAlerts = localStorage.getItem('onestop_saved_alerts');
  if (rawAlerts) {
    try {
      const alerts = JSON.parse(rawAlerts);
      if (Array.isArray(alerts)) {
        const cleaned = alerts.filter(al => !isMockAlert(al));
        if (cleaned.length === 0) {
          localStorage.removeItem('onestop_saved_alerts');
        } else if (cleaned.length !== alerts.length) {
          localStorage.setItem('onestop_saved_alerts', JSON.stringify(cleaned));
        }
      }
    } catch {
      localStorage.removeItem('onestop_saved_alerts');
    }
  }

  // Purge mock user profile
  const rawProfile = localStorage.getItem('onestop_user_profile');
  if (rawProfile && (rawProfile.includes('Arjun') || rawProfile.includes('98111 00210'))) {
    localStorage.removeItem('onestop_user_profile');
  }

  // Record active clean version stamp
  localStorage.setItem('onestop_strict_clean_v1', 'true');
} catch (e) {
  console.warn('Storage sanitization warning:', e);
}

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
