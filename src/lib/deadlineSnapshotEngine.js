// src/lib/deadlineSnapshotEngine.js
// Mathematical Snapshot Diffing Engine to detect registration & round deadline extensions from Unstop

import { formatRoundDeadlineTime } from '../utils/roundDeadlineUtils.js';

const SNAPSHOT_STORAGE_KEY = 'onestop_deadline_snapshots_v1';
const MIN_EXTENSION_MS = 10 * 60 * 1000; // 10 minutes threshold to filter out slight clock drifts

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

export function getDeadlineSnapshots() {
  try {
    const storage = getStorage();
    if (!storage) return {};
    const raw = storage.getItem(SNAPSHOT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('[SnapshotEngine] Error loading snapshots:', e);
    return {};
  }
}

export function saveDeadlineSnapshots(snapshots) {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots));
  } catch (e) {
    console.warn('[SnapshotEngine] Error saving snapshots:', e);
  }
}

/**
 * Formats a millisecond duration diff into a human readable extra time string.
 * e.g. "+2 days", "+5 hours", "+1 day 6 hours", "+45 mins"
 */
export function formatDurationDiff(diffMs) {
  if (!diffMs || diffMs <= 0) return '';
  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const totalHours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMins = totalMinutes % 60;

  if (days >= 2) {
    return remainingHours > 0 ? `+${days}d ${remainingHours}h` : `+${days} days`;
  }
  if (days === 1) {
    return remainingHours > 0 ? `+1d ${remainingHours}h` : `+1 day`;
  }
  if (totalHours >= 1) {
    return remainingMins > 10 ? `+${totalHours}h ${remainingMins}m` : `+${totalHours} hours`;
  }
  return `+${totalMinutes} mins`;
}

/**
 * Evaluates current incoming competitions & multi-round data against stored baseline snapshots.
 * Returns any detected extension alerts and updates the baseline snapshot.
 */
export function evaluateExtensions({
  competitions = [],
  bookmarks = [],
  roundsMap = {},
  dismissedSet = new Set()
}) {
  const snapshots = getDeadlineSnapshots();
  let hasChanges = false;
  const now = Date.now();

  const compMap = new Map();
  competitions.forEach(c => compMap.set(String(c.id), c));

  const bookmarkSet = new Set(bookmarks.map(String));

  bookmarkSet.forEach(compId => {
    const comp = compMap.get(compId);
    if (!comp) return;

    if (!snapshots[compId]) {
      snapshots[compId] = {
        title: comp.title,
        regDeadline: comp.deadline || null,
        rounds: {},
        activeExtensions: [],
        firstSeen: now,
        lastChecked: now
      };
      hasChanges = true;
    }

    const compSnapshot = snapshots[compId];
    compSnapshot.title = comp.title;
    compSnapshot.lastChecked = now;
    if (!Array.isArray(compSnapshot.activeExtensions)) {
      compSnapshot.activeExtensions = [];
    }

    // 1. Evaluate Registration Deadline Extension
    if (comp.deadline && compSnapshot.regDeadline) {
      const incomingRegMs = new Date(comp.deadline).getTime();
      const storedRegMs = new Date(compSnapshot.regDeadline).getTime();

      if (!isNaN(incomingRegMs) && !isNaN(storedRegMs)) {
        const diffMs = incomingRegMs - storedRegMs;
        if (diffMs >= MIN_EXTENSION_MS) {
          const notifId = `ext_reg_${compId}_${incomingRegMs}`;
          const oldStr = formatRoundDeadlineTime(storedRegMs);
          const newStr = formatRoundDeadlineTime(incomingRegMs);
          const extraStr = formatDurationDiff(diffMs);

          const extItem = {
            id: notifId,
            type: 'deadline_extended',
            category: 'deadlines',
            urgency: 'extension',
            title: `🎉 Registration Extended: ${comp.title}`,
            subtitle: `Initially set to close at ${oldStr}, now extended to ${newStr} (${extraStr} extra!).`,
            timestamp: now,
            badgeText: `Extended ${extraStr}`,
            data: {
              compId: comp.id,
              competition: comp,
              oldDeadline: compSnapshot.regDeadline,
              newDeadline: comp.deadline,
              diffMs
            },
            actions: [
              { label: 'View Opportunity', actionType: 'detail', isPrimary: true }
            ]
          };

          // Deduplicate if already recorded in activeExtensions
          if (!compSnapshot.activeExtensions.some(e => e.id === notifId)) {
            compSnapshot.activeExtensions.push(extItem);
          }

          // Update baseline snapshot to the extended deadline
          compSnapshot.regDeadline = comp.deadline;
          hasChanges = true;
        }
      }
    } else if (comp.deadline && !compSnapshot.regDeadline) {
      compSnapshot.regDeadline = comp.deadline;
      hasChanges = true;
    }

    // 2. Evaluate Multi-Round Deadline Extensions
    const roundsData = roundsMap[compId];
    if (roundsData && Array.isArray(roundsData.rounds)) {
      if (!compSnapshot.rounds) {
        compSnapshot.rounds = {};
        hasChanges = true;
      }

      roundsData.rounds.forEach(round => {
        // Exclude Stage 0 registration
        if (round.type === 'registration' || round.order === 0) return;
        const roundId = String(round.id);
        const storedRound = compSnapshot.rounds[roundId];

        if (round.endDate && storedRound && storedRound.endDate) {
          const incomingEndMs = new Date(round.endDate).getTime();
          const storedEndMs = new Date(storedRound.endDate).getTime();

          if (!isNaN(incomingEndMs) && !isNaN(storedEndMs)) {
            const diffMs = incomingEndMs - storedEndMs;
            if (diffMs >= MIN_EXTENSION_MS) {
              const notifId = `ext_round_${compId}_${roundId}_${incomingEndMs}`;
              const oldStr = formatRoundDeadlineTime(storedEndMs);
              const newStr = formatRoundDeadlineTime(incomingEndMs);
              const extraStr = formatDurationDiff(diffMs);

              const roundExtItem = {
                id: notifId,
                type: 'round_extended',
                category: 'deadlines',
                urgency: 'extension',
                title: `⏳ Round Extended: ${round.title}`,
                subtitle: `Organizers extended cutoff from ${oldStr} to ${newStr} (${extraStr} extra!).`,
                timestamp: now,
                badgeText: `Round Extended`,
                data: {
                  compId: comp.id,
                  roundId: round.id,
                  round,
                  publicUrl: round.publicUrl,
                  oldDeadline: storedRound.endDate,
                  newDeadline: round.endDate,
                  diffMs
                },
                actions: [
                  { label: 'Enter Round Portal', actionType: 'portal', isPrimary: true, url: round.publicUrl }
                ]
              };

              if (!compSnapshot.activeExtensions.some(e => e.id === notifId)) {
                compSnapshot.activeExtensions.push(roundExtItem);
              }

              // Update round snapshot to extended deadline
              storedRound.endDate = round.endDate;
              storedRound.title = round.title;
              hasChanges = true;
            }
          }
        } else if (round.endDate && (!storedRound || !storedRound.endDate)) {
          compSnapshot.rounds[roundId] = {
            title: round.title,
            endDate: round.endDate,
            startDate: round.startDate || null
          };
          hasChanges = true;
        }
      });
    }
  });

  // Collect all active non-dismissed extensions across bookmarked competitions
  const allExtensions = [];
  bookmarkSet.forEach(compId => {
    const compSnapshot = snapshots[compId];
    if (compSnapshot && Array.isArray(compSnapshot.activeExtensions)) {
      compSnapshot.activeExtensions.forEach(ext => {
        if (!dismissedSet.has(ext.id)) {
          // Check if newDeadline hasn't expired by more than 24 hours
          const deadlineStr = ext.data?.newDeadline;
          if (deadlineStr) {
            const dTime = new Date(deadlineStr).getTime();
            if (!isNaN(dTime) && (now - dTime > 24 * 60 * 60 * 1000)) {
              return; // Ignore ancient extensions
            }
          }
          allExtensions.push(ext);
        }
      });
    }
  });

  if (hasChanges) {
    saveDeadlineSnapshots(snapshots);
  }

  return allExtensions;
}
