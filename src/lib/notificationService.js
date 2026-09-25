// src/lib/notificationService.js  -  OneStop Dynamic Notification Radar Engine
import { formatDeadlineCountdown } from '../data/initialData.js';
import { formatRoundDeadlineTime } from '../utils/roundDeadlineUtils.js';
import { evaluateExtensions } from './deadlineSnapshotEngine.js';
import { dispatchBrowserNotification } from './browserPushService.js';

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
  profile = {},
  roundsMap = {}
}) {
  const notifs = [];
  const dismissedSet = new Set(getDismissedNotificationIds());
  const now = Date.now();

  const compMap = new Map();
  competitions.forEach(c => compMap.set(String(c.id), c));

  const postMap = new Map();
  posts.forEach(p => postMap.set(String(p.id), p));

  // ─────────────────────────────────────────────────────────────
  // 1. DEADLINE & ROUND EXTENSION ALERTS (Snapshot Diffing Engine)
  // ─────────────────────────────────────────────────────────────
  try {
    const extensionAlerts = evaluateExtensions({
      competitions,
      bookmarks,
      roundsMap,
      dismissedSet
    });

    extensionAlerts.forEach(ext => {
      notifs.push(ext);
      // Dispatch browser push notification if enabled
      dispatchBrowserNotification({
        title: ext.title,
        body: ext.subtitle,
        tag: ext.id,
        url: ext.data?.competition?.unstopUrl || ext.data?.publicUrl || null
      });
    });
  } catch (err) {
    console.warn('[notificationService] Extension diffing error:', err);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SQUAD ACTIVITY NOTIFICATIONS
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
  // 3. REGISTRATION DEADLINE REMINDERS (From Bookmarked Competitions)
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
    if (diffMs <= 0) return; // Ended

    const notifId = `reg_dead_${sId}`;
    if (dismissedSet.has(notifId)) return;

    const totalMinutes = Math.ceil(diffMs / 60000);
    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const daysLeft = Math.ceil(totalHours / 24);
    const countdownStr = formatDeadlineCountdown(comp.deadline, comp.remain, comp.days);

    let urgency = 'info';
    let title = `📌 Bookmarked: ${comp.title}`;
    let subtitle = `Deadline: ${countdownStr} (${comp.host || comp.orgName || 'Host'}). Keep this on your radar.`;
    let badgeText = `${daysLeft}d left`;
    let isUrgentPush = false;

    if (diffMs <= 60 * 60 * 1000) {
      // Final 1 Hour Critical Alert!
      urgency = 'critical';
      title = `🚨 Final 60 Minutes: ${comp.title}`;
      subtitle = `Only ${totalMinutes}m remaining before registration closes! Confirm your team registration immediately.`;
      badgeText = `${totalMinutes}m left`;
      isUrgentPush = true;
    } else if (diffMs <= 6 * 60 * 60 * 1000) {
      // 6 Hours Warning
      urgency = 'critical';
      title = `⚠️ Closing in ${totalHours}h: ${comp.title}`;
      subtitle = `Registration cutoff is today (${formatRoundDeadlineTime(deadlineMs)}). Complete requirements now.`;
      badgeText = `${totalHours}h left`;
    } else if (diffMs <= 24 * 60 * 60 * 1000) {
      // 24 Hours Warning
      urgency = 'warning';
      title = `⏳ Closing Tomorrow: ${comp.title}`;
      subtitle = `${countdownStr} left to register (${comp.host || comp.orgName || 'Host'}). Finalize your teammates today.`;
      badgeText = countdownStr;
    } else if (diffMs <= 72 * 60 * 60 * 1000) {
      // 2-3 Days Warning
      urgency = 'info';
      title = `📅 Closing in ${daysLeft} days: ${comp.title}`;
      subtitle = `You saved this opportunity. Check if you need more teammates before the deadline.`;
      badgeText = `${daysLeft} days left`;
    }

    notifs.push({
      id: notifId,
      type: 'deadline_alert',
      category: 'deadlines',
      urgency,
      title,
      subtitle,
      timestamp: deadlineMs,
      badgeText,
      data: {
        compId: comp.id,
        competition: comp
      },
      actions: [
        { label: 'Register on Unstop ↗', actionType: 'portal', url: comp.unstopUrl, isPrimary: urgency === 'critical' },
        { label: 'View Details', actionType: 'detail', isPrimary: urgency !== 'critical' }
      ]
    });

    if (isUrgentPush) {
      dispatchBrowserNotification({
        title,
        body: subtitle,
        tag: `push_reg_1h_${sId}`,
        url: comp.unstopUrl
      });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 4. MULTI-ROUND TIMELINE & COUNTDOWN REMINDERS
  // ─────────────────────────────────────────────────────────────
  bookmarks.forEach(compId => {
    const sId = String(compId);
    const comp = compMap.get(sId);
    const roundsData = roundsMap[sId];
    if (!roundsData || !Array.isArray(roundsData.rounds)) return;

    roundsData.rounds.forEach(round => {
      // Exclude Stage 0 (Registration already handled above)
      if (round.type === 'registration' || round.order === 0) return;
      const roundId = String(round.id);

      const startMs = round.startDate ? new Date(round.startDate).getTime() : 0;
      const endMs = round.endDate ? new Date(round.endDate).getTime() : 0;

      // A. Round Starting Soon Alert (Within next 30 minutes)
      if (startMs > now && (startMs - now) <= 30 * 60 * 1000) {
        const notifId = `rnd_start_${sId}_${roundId}`;
        if (!dismissedSet.has(notifId)) {
          const minsToStart = Math.ceil((startMs - now) / 60000);
          notifs.push({
            id: notifId,
            type: 'round_starting',
            category: 'deadlines',
            urgency: 'warning',
            title: `⏳ Round Starts in ${minsToStart}m: ${round.title}`,
            subtitle: `${comp?.title || 'Competition'} · Round begins at ${formatRoundDeadlineTime(startMs)}. Get ready!`,
            timestamp: startMs,
            badgeText: `In ${minsToStart}m`,
            data: { compId: sId, roundId, round, url: round.publicUrl || comp?.unstopUrl },
            actions: [
              { label: 'Open Round Info', actionType: 'portal', url: round.publicUrl || comp?.unstopUrl, isPrimary: true }
            ]
          });
        }
      }

      // B. Round is LIVE NOW! (Transitions to critical cutoff alert when within final 1 hour)
      const isLiveNow = (startMs > 0 && startMs <= now && endMs > now) || round.status === 'live';
      const isCriticalEndingSoon = endMs > now && (endMs - now <= 60 * 60 * 1000);

      if (isLiveNow && !isCriticalEndingSoon) {
        const notifId = `rnd_live_${sId}_${roundId}`;
        if (!dismissedSet.has(notifId)) {
          notifs.push({
            id: notifId,
            type: 'round_live',
            category: 'deadlines',
            urgency: 'live',
            title: `🚀 Round is Live: ${round.title}`,
            subtitle: `${comp?.title || 'Competition'} · Portal is open. Closes at ${formatRoundDeadlineTime(endMs)}.`,
            timestamp: startMs || now,
            badgeText: 'Live Now',
            data: { compId: sId, roundId, round, url: round.publicUrl || comp?.unstopUrl },
            actions: [
              { label: 'Enter Round Portal ↗', actionType: 'portal', url: round.publicUrl || comp?.unstopUrl, isPrimary: true }
            ]
          });

          // Dispatch native desktop notification for live round
          dispatchBrowserNotification({
            title: `🚀 Round is Live: ${round.title}`,
            body: `${comp?.title || 'Competition'} round is now live. Enter portal to submit.`,
            tag: `push_rnd_live_${roundId}`,
            url: round.publicUrl || comp?.unstopUrl
          });
        }
      }

      // C. Round Ending Soon Ladder (15m, 30m, 1h, 6h, 24h)
      if (endMs > now) {
        const endDiffMs = endMs - now;
        const totalMinutes = Math.ceil(endDiffMs / 60000);
        const totalHours = Math.ceil(endDiffMs / (1000 * 60 * 60));

        let shouldEmit = false;
        let urgency = 'info';
        let title = '';
        let subtitle = '';
        let badgeText = '';
        let pushTag = null;

        if (endDiffMs <= 15 * 60 * 1000) {
          // Emergency 15 mins
          shouldEmit = true;
          urgency = 'critical';
          title = `🚨 Final 15 Minutes: ${round.title}`;
          subtitle = `Emergency submission window for ${comp?.title || 'competition'}! Upload your response immediately.`;
          badgeText = `${totalMinutes}m left`;
          pushTag = `push_rnd_15m_${roundId}`;
        } else if (endDiffMs <= 30 * 60 * 1000) {
          // Hard Cutoff 30 mins
          shouldEmit = true;
          urgency = 'critical';
          title = `⚠️ 30 Minutes Left: ${round.title}`;
          subtitle = `${comp?.title || 'Competition'} cutoff in under 30 minutes! Submit now to avoid server lock.`;
          badgeText = `${totalMinutes}m left`;
          pushTag = `push_rnd_30m_${roundId}`;
        } else if (endDiffMs <= 60 * 60 * 1000) {
          // 1 Hour Left
          shouldEmit = true;
          urgency = 'critical';
          title = `⏳ 1 Hour Remaining: ${round.title}`;
          subtitle = `Final 60 minutes for ${comp?.title || 'competition'}. Verify all file attachments.`;
          badgeText = '1h left';
          pushTag = `push_rnd_1h_${roundId}`;
        } else if (!isLiveNow && endDiffMs <= 6 * 60 * 60 * 1000) {
          // 6 Hours Left (only when not live)
          shouldEmit = true;
          urgency = 'warning';
          title = `⚠️ 6 Hours Left: ${round.title}`;
          subtitle = `${comp?.title || 'Competition'} closes today at ${formatRoundDeadlineTime(endMs)}.`;
          badgeText = `${totalHours}h left`;
        } else if (!isLiveNow && endDiffMs <= 24 * 60 * 60 * 1000) {
          // 24 Hours Left (only when not live)
          shouldEmit = true;
          urgency = 'info';
          title = `📅 Closes Tomorrow: ${round.title}`;
          subtitle = `${comp?.title || 'Competition'} submission deadline is tomorrow at ${formatRoundDeadlineTime(endMs)}.`;
          badgeText = 'Tomorrow';
        }

        if (shouldEmit) {
          const notifId = `rnd_end_${sId}_${roundId}`;
          if (!dismissedSet.has(notifId)) {
            notifs.push({
              id: notifId,
              type: 'round_deadline',
              category: 'deadlines',
              urgency,
              title,
              subtitle,
              timestamp: endMs,
              badgeText,
              data: { compId: sId, roundId, round, url: round.publicUrl || comp?.unstopUrl },
              actions: [
                { label: 'Enter Submission Portal ↗', actionType: 'portal', url: round.publicUrl || comp?.unstopUrl, isPrimary: true }
              ]
            });

            if (pushTag && (urgency === 'critical')) {
              dispatchBrowserNotification({
                title,
                body: subtitle,
                tag: pushTag,
                url: round.publicUrl || comp?.unstopUrl
              });
            }
          }
        }
      }
    });
  });

  // Sort by priority/urgency and recency
  const urgencyWeight = {
    critical: 5,
    extension: 5,
    live: 4,
    success: 3,
    warning: 2,
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
