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

export function dismissAllNotifications(notificationIds = []) {
  try {
    const dismissed = new Set(getDismissedNotificationIds());
    notificationIds.forEach(id => dismissed.add(id));
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...dismissed]));
  } catch (e) {
    console.warn('Failed to dismiss all notifications:', e);
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
  roundsMap = {},
  messageNotifications = [],
  conversations = []
}) {
  const notifs = [];
  const dismissedSet = new Set(getDismissedNotificationIds());
  const now = Date.now();

  const compMap = new Map();
  competitions.forEach(c => compMap.set(String(c.id), c));

  // Reconstruct missing bookmarked competitions from roundsMap cache
  if (roundsMap && typeof roundsMap === 'object') {
    Object.entries(roundsMap).forEach(([sId, r]) => {
      if (r && !compMap.has(String(sId))) {
        compMap.set(String(sId), {
          id: r.id || sId,
          title: r.title || 'Competition',
          host: r.host || r.orgName || 'Host Institution',
          orgName: r.orgName || r.host || 'Host Institution',
          logo: r.logo || r.orgLogo || null,
          orgLogo: r.orgLogo || r.logo || null,
          unstopUrl: r.unstopUrl || `https://unstop.com/competitions/${sId}`,
          deadline: r.deadline || null,
          fee: r.fee || 'Free',
          isFree: r.isFree ?? true,
          days: r.daysRemaining ?? null,
          team: r.teamSizeDisplay || 'Solo / Team',
          teamSizeDisplay: r.teamSizeDisplay || 'Solo / Team',
          rounds: r.rounds || []
        });
      }
    });
  }

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
    const compObj = compMap.get(String(app.competition_id || targetPost?.competition_id || targetPost?.competitionId || ''));
    const compTitle = app.meta || app.competition_name || targetPost?.competition_name || targetPost?.title || compObj?.title || 'Competition Squad';
    const compHost = compObj?.host || compObj?.orgName || targetPost?.host || '';
    const hostSuffix = compHost ? ` (${compHost})` : '';

    // A. Incoming Applicant for user's squad
    if (app.dir === 'in' && app.status === 'pending') {
      const notifId = `squad_in_${rawId}`;
      if (!dismissedSet.has(notifId)) {
        const applicantName = app.applicant_name || app.who || 'A student';
        const skillsSnippet = Array.isArray(app.skills || app.highlighted_skills) && (app.skills || app.highlighted_skills).length > 0
          ? ` · Skills: ${(app.skills || app.highlighted_skills).slice(0, 2).join(', ')}`
          : '';

        notifs.push({
          id: notifId,
          type: 'squad_incoming',
          category: 'squads',
          urgency: 'info',
          title: `👤 New Applicant: ${applicantName}`,
          subtitle: `${compHost ? `${compHost} · ` : ''}${compTitle} squad request received${skillsSnippet}. Tap to review.`,
          timestamp: app.created_at ? new Date(app.created_at).getTime() : (now - 1000 * 60 * 30),
          data: {
            appId: app.id,
            postId,
            application: app,
            competitionTitle: compTitle,
            host: compHost
          },
          actions: [
            { label: 'Review Application', actionType: 'requests', isPrimary: true }
          ]
        });

        dispatchBrowserNotification({
          title: `👤 ${applicantName} applied to your squad`,
          body: `${compTitle}${compHost ? ` (${compHost})` : ''}${skillsSnippet}. Review request on OneStop.`,
          tag: `push_squad_in_${rawId}`
        });
      }
    }

    // B. Accepted into Squad (contact follows the host's chosen mode)
    if (app.dir === 'out' && app.status === 'accepted') {
      const notifId = `squad_acc_${rawId}`;
      if (!dismissedSet.has(notifId)) {
        const leadName = targetPost?.created_by_name || targetPost?.lead || 'Squad Lead';
        const isChatMethod = targetPost?.comm_method === 'chat';
        notifs.push({
          id: notifId,
          type: 'squad_accepted',
          category: 'squads',
          urgency: 'success',
          title: `🎉 Accepted into Squad · ${compTitle}`,
          subtitle: isChatMethod
            ? `${compHost ? `${compHost} · ` : ''}${leadName} accepted your squad request. Chat with them from your inbox.`
            : `${compHost ? `${compHost} · ` : ''}${leadName} accepted your squad request. Tap to message them on WhatsApp.`,
          timestamp: app.updated_at ? new Date(app.updated_at).getTime() : now,
          data: {
            appId: app.id,
            postId,
            application: app,
            post: targetPost,
            competitionTitle: compTitle,
            host: compHost
          },
          actions: [
            isChatMethod
              ? { label: 'Open Inbox', actionType: 'requests', isPrimary: true }
              : { label: 'Message on WhatsApp', actionType: 'whatsapp', isPrimary: true }
          ]
        });

        dispatchBrowserNotification({
          title: `🎉 Squad Request Accepted!`,
          body: isChatMethod
            ? `You joined ${leadName}'s squad for ${compTitle}${compHost ? ` (${compHost})` : ''}. Chat inside OneStop.`
            : `You joined ${leadName}'s squad for ${compTitle}${compHost ? ` (${compHost})` : ''}. Message them on WhatsApp.`,
          tag: `push_squad_acc_${rawId}`
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
          title: `Squad Update · ${compTitle}`,
          subtitle: `${compHost ? `${compHost} · ` : ''}Application not selected for this squad. Explore other open squads.`,
          timestamp: app.updated_at ? new Date(app.updated_at).getTime() : now,
          data: {
            appId: app.id,
            competitionTitle: compTitle,
            host: compHost
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
    const roundsData = roundsMap[sId];
    if (!comp && !roundsData) return;

    const compName = (comp?.title && comp.title !== 'Competition')
      ? comp.title
      : (roundsData?.title && roundsData.title !== 'Competition')
        ? roundsData.title
        : (comp?.title || roundsData?.title || 'Competition');

    const compHost = comp?.host || comp?.orgName || roundsData?.host || roundsData?.orgName || '';
    const hostSuffix = compHost ? ` (${compHost})` : '';

    const platformName = comp?.sourceLabel || (
      comp?.sourcePlatform === 'campus_direct' || comp?.sourcePlatform === 'institutional'
        ? `${(comp?.host || comp?.orgName || 'Campus').split('(')[0].trim()} Portal`
        : (comp?.sourcePlatform === 'devpost'
          ? 'Devpost'
          : (comp?.sourcePlatform === 'inside_campus' ? 'InsideKampus' : 'Portal'))
    );
    const targetUrl = comp?.apply_url || comp?.applyUrl || comp?.sourceUrl || comp?.website_url || comp?.unstopUrl || roundsData?.unstopUrl || (sId.startsWith('inst_') ? (comp?.website_url || '#') : `https://unstop.com/competitions/${sId}`);

    let deadlineMs = null;
    const deadlineSource = comp?.deadline || roundsData?.deadline;
    if (deadlineSource) {
      const t = new Date(deadlineSource).getTime();
      if (!isNaN(t)) deadlineMs = t;
    } else if (comp?.days !== undefined && comp?.days !== null) {
      deadlineMs = now + Number(comp.days) * 24 * 60 * 60 * 1000;
    } else if (roundsData?.daysRemaining !== undefined && roundsData?.daysRemaining !== null) {
      deadlineMs = now + Number(roundsData.daysRemaining) * 24 * 60 * 60 * 1000;
    }

    if (!deadlineMs) return;

    const diffMs = deadlineMs - now;
    if (diffMs <= 0) return; // Ended

    const notifId = `reg_dead_${sId}`;
    if (dismissedSet.has(notifId)) return;

    const totalMinutes = Math.ceil(diffMs / 60000);
    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const daysLeft = Math.ceil(totalHours / 24);
    const countdownStr = formatDeadlineCountdown(deadlineSource, comp?.remain, comp?.days ?? roundsData?.daysRemaining);
    const deadlineTime = formatRoundDeadlineTime(deadlineMs);
    const compactComp = compName.length > 40 ? `${compName.slice(0, 38).trim()}…` : compName;
    const hostPrefix = compHost ? `${compHost} · ` : '';

    let urgency = 'info';
    let title = `📌 Tracking · ${compactComp}`;
    let subtitle = `${hostPrefix}Registration deadline: ${deadlineTime} (${countdownStr}).`;
    let pushTitle = '';
    let pushBody = '';
    let badgeText = `${daysLeft}d left`;
    let isUrgentPush = false;

    if (diffMs <= 60 * 60 * 1000) {
      // Final 1 Hour Critical Alert!
      urgency = 'critical';
      title = `🚨 Closes in ${totalMinutes}m · ${compactComp}`;
      subtitle = `${hostPrefix}Registration deadline: ${deadlineTime}. Finalize team & register now.`;
      pushTitle = `🚨 Closes in ${totalMinutes}m · ${compactComp}`;
      pushBody = `${hostPrefix}Registration deadline: ${deadlineTime}. Submit team entry on portal now.`;
      badgeText = `${totalMinutes}m left`;
      isUrgentPush = true;
    } else if (diffMs <= 6 * 60 * 60 * 1000) {
      // 6 Hours Warning
      urgency = 'critical';
      title = `⚠️ Closes in ${totalHours}h · ${compactComp}`;
      subtitle = `${hostPrefix}Registration deadline: ${deadlineTime}. Complete your team entry.`;
      pushTitle = `⚠️ Closes in ${totalHours}h · ${compactComp}`;
      pushBody = `${hostPrefix}Registration deadline: ${deadlineTime} on the portal.`;
      badgeText = `${totalHours}h left`;
      isUrgentPush = true;
    } else if (diffMs <= 24 * 60 * 60 * 1000) {
      // 24 Hours Warning
      urgency = 'warning';
      title = `⏳ Closes Tomorrow · ${compactComp}`;
      subtitle = `${hostPrefix}Registration deadline: ${deadlineTime}. Lock in your squad.`;
      badgeText = countdownStr;
    } else if (diffMs <= 72 * 60 * 60 * 1000) {
      // 2-3 Days Warning
      urgency = 'info';
      title = `📅 ${daysLeft} Days Left · ${compactComp}`;
      subtitle = `${hostPrefix}Registration deadline: ${deadlineTime}. Form your squad or register early.`;
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
        compId: sId,
        competition: comp || roundsData,
        competitionTitle: compName,
        host: compHost,
        deadlineTime,
        url: targetUrl
      },
      actions: [
        { label: 'Register on Portal ↗', actionType: 'portal', url: targetUrl, isPrimary: urgency === 'critical' },
        { label: 'View Details', actionType: 'detail', isPrimary: urgency !== 'critical' }
      ]
    });

    if (isUrgentPush) {
      const regPushTag = diffMs <= 60 * 60 * 1000 ? `push_reg_1h_${sId}` : `push_reg_6h_${sId}`;
      dispatchBrowserNotification({
        title: pushTitle || title,
        body: pushBody || subtitle,
        tag: regPushTag,
        url: targetUrl
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

    // Resolve accurate competition name and host institution
    const rawCompName = (comp?.title && comp.title !== 'Competition')
      ? comp.title
      : (roundsData?.title && roundsData.title !== 'Competition')
        ? roundsData.title
        : (comp?.title || roundsData?.title || 'Competition');

    const compHost = comp?.host || comp?.orgName || roundsData?.host || roundsData?.orgName || '';
    const hostSuffix = compHost ? ` (${compHost})` : '';
    const compactComp = rawCompName.length > 40 ? `${rawCompName.slice(0, 38).trim()}…` : rawCompName;

    const roundPlatformName = comp?.sourceLabel || (
      comp?.sourcePlatform === 'campus_direct' || comp?.sourcePlatform === 'institutional'
        ? `${(comp?.host || comp?.orgName || 'Campus').split('(')[0].trim()} Portal`
        : (comp?.sourcePlatform === 'devpost'
          ? 'Devpost'
          : (comp?.sourcePlatform === 'inside_campus' ? 'InsideKampus' : 'Portal'))
    );

    roundsData.rounds.forEach(round => {
      // Exclude Stage 0 (Registration already handled above)
      if (round.type === 'registration' || round.order === 0) return;
      const roundId = String(round.id);
      const roundTitle = round.title || `Round ${round.order || round.stageNumber || ''}`;

      const startMs = round.startDate ? new Date(round.startDate).getTime() : 0;
      const endMs = round.endDate ? new Date(round.endDate).getTime() : 0;
      const roundDeadlineTime = formatRoundDeadlineTime(endMs);
      const startTime = formatRoundDeadlineTime(startMs);
      const targetPortalUrl = round.publicUrl || comp?.apply_url || comp?.applyUrl || comp?.sourceUrl || comp?.website_url || comp?.unstopUrl || roundsData?.unstopUrl || (sId.startsWith('inst_') ? (comp?.website_url || '#') : `https://unstop.com/competitions/${sId}`);

      // A. Round Starting Soon Alert (Within next 30 minutes)
      if (startMs > now && (startMs - now) <= 30 * 60 * 1000) {
        const notifId = `rnd_start_${sId}_${roundId}`;
        if (!dismissedSet.has(notifId)) {
          const minsToStart = Math.ceil((startMs - now) / 60000);
          const startTitle = `⏳ Starts in ${minsToStart}m · ${compactComp}`;
          const startSubtitle = `${compHost ? `${compHost} · ` : ''}${roundTitle} begins at ${startTime}. Be ready on the portal.`;

          notifs.push({
            id: notifId,
            type: 'round_starting',
            category: 'deadlines',
            urgency: 'warning',
            title: startTitle,
            subtitle: startSubtitle,
            timestamp: startMs,
            badgeText: `In ${minsToStart}m`,
            data: {
              compId: sId,
              competition: comp || roundsData,
              competitionTitle: rawCompName,
              host: compHost,
              roundId,
              round,
              roundTitle,
              deadlineTime: startTime,
              url: targetPortalUrl
            },
            actions: [
              { label: 'Open Round Portal ↗', actionType: 'portal', url: targetPortalUrl, isPrimary: true }
            ]
          });

          dispatchBrowserNotification({
            title: startTitle,
            body: `${compHost ? `${compHost} · ` : ''}${roundTitle} starts at ${startTime}.`,
            tag: `push_rnd_start_${roundId}`,
            url: targetPortalUrl
          });
        }
      }

      // B. Round is LIVE NOW! (Transitions to critical deadline alert when within final 1 hour)
      const isLiveNow = (startMs > 0 && startMs <= now && endMs > now) || round.status === 'live';
      const isCriticalEndingSoon = endMs > now && (endMs - now <= 60 * 60 * 1000);

      if (isLiveNow && !isCriticalEndingSoon) {
        const notifId = `rnd_live_${sId}_${roundId}`;
        if (!dismissedSet.has(notifId)) {
          const liveTitle = `🚀 Live Now · ${compactComp}`;
          const liveSubtitle = `${compHost ? `${compHost} · ` : ''}${roundTitle} is live. Portal is open until ${roundDeadlineTime}.`;

          notifs.push({
            id: notifId,
            type: 'round_live',
            category: 'deadlines',
            urgency: 'live',
            title: liveTitle,
            subtitle: liveSubtitle,
            timestamp: startMs || now,
            badgeText: 'Live Now',
            data: {
              compId: sId,
              competition: comp || roundsData,
              competitionTitle: rawCompName,
              host: compHost,
              roundId,
              round,
              roundTitle,
              deadlineTime: roundDeadlineTime,
              url: targetPortalUrl
            },
            actions: [
              { label: 'Enter Round Portal ↗', actionType: 'portal', url: targetPortalUrl, isPrimary: true }
            ]
          });

          // Dispatch native desktop notification for live round
          dispatchBrowserNotification({
            title: liveTitle,
            body: `${compHost ? `${compHost} · ` : ''}${roundTitle} portal is open until ${roundDeadlineTime}. Enter portal now.`,
            tag: `push_rnd_live_${roundId}`,
            url: targetPortalUrl
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
        let pushTitle = '';
        let pushBody = '';
        let badgeText = '';
        let pushTag = null;

        if (endDiffMs <= 15 * 60 * 1000) {
          // Emergency 15 mins (Deadline Alert)
          shouldEmit = true;
          urgency = 'critical';
          title = `🚨 Final 15m · ${compactComp}`;
          subtitle = `${compHost ? `${compHost} · ` : ''}${roundTitle} deadline: ${roundDeadlineTime} (${totalMinutes}m left). Submit files before portal lock.`;
          pushTitle = `🚨 Final 15m · ${compactComp}`;
          pushBody = `${compHost ? `${compHost} · ` : ''}${roundTitle} closes at ${roundDeadlineTime}! Upload submission before portal lock.`;
          badgeText = `${totalMinutes}m left`;
          pushTag = `push_rnd_15m_${roundId}`;
        } else if (endDiffMs <= 30 * 60 * 1000) {
          // Hard Deadline 30 mins
          shouldEmit = true;
          urgency = 'critical';
          title = `⚠️ 30m Deadline · ${compactComp}`;
          subtitle = `${compHost ? `${compHost} · ` : ''}${roundTitle} closes at ${roundDeadlineTime}. Upload and verify your files.`;
          pushTitle = `⚠️ 30m Deadline · ${compactComp}`;
          pushBody = `${compHost ? `${compHost} · ` : ''}${roundTitle} closes in 30m (${roundDeadlineTime}). Upload files on portal.`;
          badgeText = `${totalMinutes}m left`;
          pushTag = `push_rnd_30m_${roundId}`;
        } else if (endDiffMs <= 60 * 60 * 1000) {
          // 1 Hour Left
          shouldEmit = true;
          urgency = 'critical';
          title = `⏳ 1h Left · ${compactComp}`;
          subtitle = `${compHost ? `${compHost} · ` : ''}${roundTitle} deadline: ${roundDeadlineTime}. Finalize and upload submission.`;
          pushTitle = `⏳ 1h Left · ${compactComp}`;
          pushBody = `${compHost ? `${compHost} · ` : ''}${roundTitle} closes in 1 hour (${roundDeadlineTime}).`;
          badgeText = '1h left';
          pushTag = `push_rnd_1h_${roundId}`;
        } else if (!isLiveNow && endDiffMs <= 6 * 60 * 60 * 1000) {
          // 6 Hours Left (only when not live)
          shouldEmit = true;
          urgency = 'warning';
          title = `⚠️ 6h Left · ${compactComp}`;
          subtitle = `${compHost ? `${compHost} · ` : ''}${roundTitle} closes at ${roundDeadlineTime}.`;
          badgeText = `${totalHours}h left`;
        } else if (!isLiveNow && endDiffMs <= 24 * 60 * 60 * 1000) {
          // 24 Hours Left (only when not live)
          shouldEmit = true;
          urgency = 'info';
          title = `📅 Closes Tomorrow · ${compactComp}`;
          subtitle = `${compHost ? `${compHost} · ` : ''}${roundTitle} submission deadline: ${roundDeadlineTime}.`;
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
              data: {
                compId: sId,
                competition: comp || roundsData,
                competitionTitle: rawCompName,
                host: compHost,
                roundId,
                round,
                roundTitle,
                deadlineTime: roundDeadlineTime,
                url: targetPortalUrl
              },
              actions: [
                { label: 'Enter Submission Portal ↗', actionType: 'portal', url: targetPortalUrl, isPrimary: true }
              ]
            });

            if (pushTag && (urgency === 'critical')) {
              dispatchBrowserNotification({
                title: pushTitle || title,
                body: pushBody || subtitle,
                tag: pushTag,
                url: targetPortalUrl
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

  // 4A. CHAT REQUESTS (chat-mode squads: request -> host accepts -> chat)
  conversations.forEach((conv) => {
    const post = postMap.get(String(conv.post_id));
    const compTitle = post?.competition_name || post?.title || 'your squad';
    const updatedAt = new Date(conv.responded_at || conv.updated_at || conv.created_at || now).getTime();

    let notif = null;
    if (conv.role === 'host' && conv.status === 'requested') {
      notif = {
        id: `chat_req_${conv.id}_${updatedAt}`,
        type: 'squad_chat_request',
        urgency: 'info',
        title: `💬 ${conv.member_name || 'Someone'} wants to chat`,
        subtitle: `${compTitle} · "${(conv.intro || '').slice(0, 80)}"`,
        actions: [{ label: 'Review', actionType: 'requests', isPrimary: true }],
      };
    } else if (conv.role === 'member' && conv.status === 'accepted' && conv.responded_at) {
      notif = {
        id: `chat_acc_${conv.id}_${updatedAt}`,
        type: 'squad_chat_accepted',
        urgency: 'success',
        title: `💬 ${conv.host_name || 'The host'} accepted your chat request`,
        subtitle: `${compTitle} · You can message each other now.`,
        actions: [{ label: 'Open Chat', actionType: 'open_chat', isPrimary: true }],
      };
    } else if (conv.role === 'member' && conv.status === 'declined') {
      notif = {
        id: `chat_dec_${conv.id}_${updatedAt}`,
        type: 'squad_chat_declined',
        urgency: 'neutral',
        title: `Chat request · ${compTitle}`,
        subtitle: `${conv.host_name || 'The host'} declined your chat request. You can ask again later.`,
        actions: [{ label: 'Open Inbox', actionType: 'requests', isPrimary: false }],
      };
    }

    if (notif && !dismissedSet.has(notif.id)) {
      notifs.push({
        ...notif,
        category: 'squads',
        timestamp: updatedAt,
        data: { postId: conv.post_id, conversationId: conv.id },
      });
    }
  });

  // 4. NEW CHAT MESSAGES (created server-side in user_notifications; one row per thread)
  messageNotifications.forEach((row) => {
    // Read once the chat is opened (on any device)
    if (row.is_read) return;
    // A newer message in the same thread gets a new id, so it shows as unread again
    const notifId = `msg_${row.id}_${new Date(row.created_at).getTime()}`;
    if (dismissedSet.has(notifId)) return;
    const count = Number(row.data?.count) || 1;
    const compName = row.data?.competition_name || 'your squad';
    notifs.push({
      id: notifId,
      type: 'squad_message',
      category: 'squads',
      urgency: 'info',
      title: `💬 ${row.title || 'New message'}${count > 1 ? ` (${count} new)` : ''}`,
      subtitle: `${compName} · ${row.message || ''}`,
      timestamp: row.created_at ? new Date(row.created_at).getTime() : now,
      data: {
        postId: row.data?.post_id || null,
        conversationId: row.data?.conversation_id || null,
      },
      actions: row.data?.conversation_id
        ? [{ label: 'Open Chat', actionType: 'open_chat', isPrimary: true }]
        : [{ label: 'Open Inbox', actionType: 'requests', isPrimary: true }]
    });
  });

  notifs.sort((a, b) => {
    const weightDiff = (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
    if (weightDiff !== 0) return weightDiff;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  return notifs;
}
