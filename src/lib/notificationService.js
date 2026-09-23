// src/lib/notificationService.js — OneStop Dynamic Notification Radar Engine
import { formatDeadlineCountdown, getUrgencyLevel } from '../data/initialData';

const READ_STORAGE_KEY = 'onestop_notifications_read';
const DISMISSED_STORAGE_KEY = 'onestop_notifications_dismissed';

export function getReadNotificationIds() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markNotificationAsRead(id) {
  try {
    const read = new Set(getReadNotificationIds());
    read.add(id);
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...read]));
  } catch (e) {
    console.warn('Failed to save read notification:', e);
  }
}

export function markAllNotificationsAsRead(notificationIds = []) {
  try {
    const read = new Set(getReadNotificationIds());
    notificationIds.forEach(id => read.add(id));
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...read]));
  } catch (e) {
    console.warn('Failed to mark all notifications read:', e);
  }
}

export function getDismissedNotificationIds() {
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function dismissNotification(id) {
  try {
    const dismissed = new Set(getDismissedNotificationIds());
    dismissed.add(id);
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...dismissed]));
  } catch (e) {
    console.warn('Failed to dismiss notification:', e);
  }
}

/**
 * Format relative time (e.g., 'Just now', '10m ago', '2h ago', '1d ago')
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Recent';
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Aggregates all real-time events into a single sorted list of notifications.
 */
export function generateNotifications({
  applications = [],
  competitions = [],
  bookmarks = [],
  posts = [],
  profile = {}
}) {
  const notifs = [];
  const dismissedSet = new Set(getDismissedNotificationIds());
  const now = Date.now();

  const compMap = new Map();
  competitions.forEach(c => compMap.set(String(c.id), c));

  const postMap = new Map();
  posts.forEach(p => postMap.set(String(p.id), p));

  // ─────────────────────────────────────────────────────────────
  // 1. SQUAD ACTIVITY NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────
  applications.forEach(app => {
    const rawId = String(app.id || '');
    const postId = String(app.postId || app.post_id || '');
    const targetPost = postMap.get(postId);
    const compTitle = app.meta || app.competition_name || targetPost?.competition_name || targetPost?.title || 'Competition Squad';

    // A. Incoming Applicant for user's squad
    if (app.dir === 'in' && app.status === 'pending') {
      const notifId = `squad_in_${rawId}`;
      if (!dismissedSet.has(notifId)) {
        const applicantName = app.applicant_name || app.who || 'A student';
        const applicantCollege = app.applicant_college || app.college || '';
        const skillsSnippet = Array.isArray(app.skills || app.highlighted_skills)
          ? (app.skills || app.highlighted_skills).slice(0, 2).join(', ')
          : '';

        notifs.push({
          id: notifId,
          type: 'squad_incoming',
          category: 'squads',
          urgency: 'info',
          title: `New Applicant: ${applicantName}`,
          subtitle: `Applied to join your squad for "${compTitle}"${skillsSnippet ? ` with skills in ${skillsSnippet}` : ''}.`,
          timestamp: app.created_at ? new Date(app.created_at).getTime() : (now - 1000 * 60 * 30),
          data: {
            appId: app.id,
            postId,
            application: app
          },
          actions: [
            { label: 'Review Application', actionType: 'requests', isPrimary: true }
          ]
        });
      }
    }

    // B. Accepted into Squad (WhatsApp Handshake Ready!)
    if (app.dir === 'out' && app.status === 'accepted') {
      const notifId = `squad_acc_${rawId}`;
      if (!dismissedSet.has(notifId)) {
        const leadName = targetPost?.created_by_name || targetPost?.lead || 'Squad Lead';
        notifs.push({
          id: notifId,
          type: 'squad_accepted',
          category: 'squads',
          urgency: 'success',
          title: `🎉 Squad Request Accepted!`,
          subtitle: `You've joined ${leadName}'s squad for "${compTitle}". Connect now to plan your submission.`,
          timestamp: app.updated_at ? new Date(app.updated_at).getTime() : now,
          data: {
            appId: app.id,
            postId,
            application: app,
            post: targetPost
          },
          actions: [
            { label: 'Chat on WhatsApp', actionType: 'whatsapp', isPrimary: true }
          ]
        });
      }
    }

    // C. Declined from Squad
    if (app.dir === 'out' && (app.status === 'rejected' || app.status === 'declined')) {
      const notifId = `squad_dec_${rawId}`;
      if (!dismissedSet.has(notifId)) {
        notifs.push({
          id: notifId,
          type: 'squad_declined',
          category: 'squads',
          urgency: 'neutral',
          title: `Squad Application Update`,
          subtitle: `Your application for "${compTitle}" wasn't selected this time. Browse other open squads!`,
          timestamp: app.updated_at ? new Date(app.updated_at).getTime() : now,
          data: {
            appId: app.id
          },
          actions: [
            { label: 'Find Other Squads', actionType: 'teams', isPrimary: false }
          ]
        });
      }
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 2. DEADLINE RADAR NOTIFICATIONS (From Bookmarked Competitions)
  // ─────────────────────────────────────────────────────────────
  bookmarks.forEach(compId => {
    const sId = String(compId);
    const comp = compMap.get(sId);
    if (!comp) return;

    let deadlineMs = null;
    if (comp.deadline) {
      const t = new Date(comp.deadline).getTime();
      if (!isNaN(t)) deadlineMs = t;
    } else if (comp.days !== undefined && comp.days !== null) {
      deadlineMs = now + Number(comp.days) * 24 * 60 * 60 * 1000;
    }

    if (!deadlineMs) return;

    const diffMs = deadlineMs - now;
    // If ended in the past, don't show active deadline alert
    if (diffMs <= 0) return;

    const hoursLeft = diffMs / (1000 * 60 * 60);

    // Urgent: Closing in less than 6 hours
    if (hoursLeft <= 6) {
      const notifId = `deadline_6h_${sId}`;
      if (!dismissedSet.has(notifId)) {
        const countdownStr = formatDeadlineCountdown(comp.deadline, comp.remain, comp.days);
        notifs.push({
          id: notifId,
          type: 'deadline_imminent',
          category: 'deadlines',
          urgency: 'critical',
          title: `🚨 Final Call: ${comp.title}`,
          subtitle: `Only ${countdownStr} remaining before registration closes! Confirm your team submission.`,
          timestamp: deadlineMs,
          badgeText: countdownStr,
          data: {
            compId: comp.id,
            competition: comp
          },
          actions: [
            { label: 'View Opportunity', actionType: 'detail', isPrimary: true }
          ]
        });
      }
    }
    // Warning: Closing in less than 24 hours
    else if (hoursLeft <= 24) {
      const notifId = `deadline_24h_${sId}`;
      if (!dismissedSet.has(notifId)) {
        const countdownStr = formatDeadlineCountdown(comp.deadline, comp.remain, comp.days);
        notifs.push({
          id: notifId,
          type: 'deadline_warning',
          category: 'deadlines',
          urgency: 'warning',
          title: `⏳ Closing Tomorrow: ${comp.title}`,
          subtitle: `${countdownStr} left to register (${comp.host || comp.orgName || 'Host'}). Complete requirements today.`,
          timestamp: deadlineMs,
          badgeText: countdownStr,
          data: {
            compId: comp.id,
            competition: comp
          },
          actions: [
            { label: 'View Opportunity', actionType: 'detail', isPrimary: true }
          ]
        });
      }
    }
    // Notice: Closing in less than 72 hours
    else if (hoursLeft <= 72) {
      const notifId = `deadline_72h_${sId}`;
      if (!dismissedSet.has(notifId)) {
        const daysLeft = Math.ceil(hoursLeft / 24);
        notifs.push({
          id: notifId,
          type: 'deadline_notice',
          category: 'deadlines',
          urgency: 'info',
          title: `📅 Closing in ${daysLeft} days: ${comp.title}`,
          subtitle: `You saved this opportunity. Check if you need more teammates before the deadline.`,
          timestamp: deadlineMs,
          badgeText: `${daysLeft} days left`,
          data: {
            compId: comp.id,
            competition: comp
          },
          actions: [
            { label: 'View Opportunity', actionType: 'detail', isPrimary: false }
          ]
        });
      }
    }
    // Active bookmarked competition with upcoming deadline (> 72 hours)
    else {
      const notifId = `deadline_saved_${sId}`;
      if (!dismissedSet.has(notifId)) {
        const countdownStr = formatDeadlineCountdown(comp.deadline, comp.remain, comp.days);
        const daysLeft = Math.ceil(hoursLeft / 24);
        notifs.push({
          id: notifId,
          type: 'deadline_saved',
          category: 'deadlines',
          urgency: 'info',
          title: `📌 Bookmarked: ${comp.title}`,
          subtitle: `Deadline: ${countdownStr} (${comp.host || comp.orgName || 'Host'}). Keep this on your radar.`,
          timestamp: deadlineMs,
          badgeText: `${daysLeft}d left`,
          data: {
            compId: comp.id,
            competition: comp
          },
          actions: [
            { label: 'View Opportunity', actionType: 'detail', isPrimary: false }
          ]
        });
      }
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 3. SMART OPPORTUNITY MATCHES (Curated for User's Circuit / Skills)
  // ─────────────────────────────────────────────────────────────
  const userSkills = Array.isArray(profile?.skills) ? profile.skills : [];
  const userCollege = (profile?.college || '').toLowerCase();
  const isDuUser = userCollege.includes('delhi') || userCollege.includes('srcc') || userCollege.includes('stephen') || userCollege.includes('hindu') || userCollege.includes('sscbs') || userCollege.includes('hansraj');

  if (competitions.length > 0) {
    // Find top relevant match
    const featuredMatch = competitions.find(c => {
      if (bookmarks.map(String).includes(String(c.id))) return false;
      if (isDuUser && c.circuit === 'DU Circuit') return true;
      if (userSkills.some(skill => (c.discipline || '').toLowerCase().includes(skill.toLowerCase()) || (c.title || '').toLowerCase().includes(skill.toLowerCase()))) {
        return true;
      }
      return false;
    });

    if (featuredMatch) {
      const matchNotifId = `match_${featuredMatch.id}`;
      if (!dismissedSet.has(matchNotifId)) {
        notifs.push({
          id: matchNotifId,
          type: 'smart_match',
          category: 'updates',
          urgency: 'accent',
          title: `⚡ Curated for You: ${featuredMatch.title}`,
          subtitle: `Matches your profile interests in ${featuredMatch.discipline || 'Case Competitions'} (${featuredMatch.host || featuredMatch.orgName || 'Campus'}).`,
          timestamp: now - (1000 * 60 * 60 * 4), // 4h ago
          badgeText: featuredMatch.discipline || 'Match',
          data: {
            compId: featuredMatch.id,
            competition: featuredMatch
          },
          actions: [
            { label: 'Explore Competition', actionType: 'detail', isPrimary: true }
          ]
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. LIVE INGESTION PULSE (System Alert)
  // ─────────────────────────────────────────────────────────────
  if (competitions.length >= 10) {
    const liveNotifId = 'system_live_sync_pulse';
    if (!dismissedSet.has(liveNotifId)) {
      notifs.push({
        id: liveNotifId,
        type: 'system',
        category: 'updates',
        urgency: 'info',
        title: `⚡ Live Opportunities Ingested`,
        subtitle: `${competitions.length} verified competitions are active and accepting registrations right now.`,
        timestamp: now - (1000 * 60 * 60 * 12),
        data: {},
        actions: [
          { label: 'Browse All', actionType: 'browse', isPrimary: false }
        ]
      });
    }
  }

  // Sort by priority/urgency and recency
  const urgencyWeight = {
    critical: 4,
    success: 3,
    warning: 2,
    accent: 2,
    info: 1,
    neutral: 0
  };

  notifs.sort((a, b) => {
    const weightDiff = (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
    if (weightDiff !== 0) return weightDiff;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  return notifs;
}
