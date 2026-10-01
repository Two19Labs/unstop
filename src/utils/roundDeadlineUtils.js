// src/utils/roundDeadlineUtils.js
// Precision round deadline formatting and real-time live ticking countdowns

import { useState, useEffect } from 'react';

/**
 * Formats a deadline timestamp into a crystal-clear, human-friendly IST date & time.
 * e.g. "Today, 10:00 PM IST", "Tomorrow, 9:00 AM IST", "28 Sep, 11:59 PM IST"
 */
export function formatRoundDeadlineTime(dateStrOrMs) {
  if (!dateStrOrMs) return 'TBA';
  const d = new Date(dateStrOrMs);
  if (isNaN(d.getTime())) return 'TBA';

  const istOptions = { timeZone: 'Asia/Kolkata' };
  const dIST = new Date(d.toLocaleString('en-US', istOptions));
  const nowIST = new Date(new Date().toLocaleString('en-US', istOptions));

  const isToday = dIST.toDateString() === nowIST.toDateString();
  const tomorrowIST = new Date(nowIST);
  tomorrowIST.setDate(tomorrowIST.getDate() + 1);
  const isTomorrow = dIST.toDateString() === tomorrowIST.toDateString();

  const timePart = d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (isToday) return `Today, ${timePart} IST`;
  if (isTomorrow) return `Tomorrow, ${timePart} IST`;

  const datePart = d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric'
  });
  return `${datePart}, ${timePart} IST`;
}

/**
 * Formats a deadline date into the sleek "Due 26 Sep, 2:52 PM" format without the IST suffix.
 */
export function formatRoundDeadlineDue(dateStrOrMs) {
  if (!dateStrOrMs) return 'Date TBA';
  const d = new Date(dateStrOrMs);
  if (isNaN(d.getTime())) return 'Date TBA';

  const datePart = d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric'
  });

  const minutes = d.getMinutes();
  const timePart = d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: minutes === 0 ? undefined : '2-digit',
    hour12: true
  });

  return `Due ${datePart}, ${timePart}`;
}

/**
 * Formats next round date cleanly, e.g. "Oct 4", "Oct 9", "Oct 14"
 */
export function formatRoundNextDate(dateStrOrMs) {
  if (!dateStrOrMs) return '';
  const d = new Date(dateStrOrMs);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Calculates live ticking countdown details down to exact hours, minutes, and seconds.
 */
export function getRoundCountdown(targetDateMs, nowMs = Date.now()) {
  if (!targetDateMs) {
    return {
      text: 'Dates TBA',
      timerText: 'Dates TBA',
      isExpired: false,
      isUrgent: false,
      isCritical: false,
      urgency: 'normal',
      padHours: '00',
      padMinutes: '00',
      padSeconds: '00',
      days: 0,
      totalHours: 0
    };
  }

  const targetMs = typeof targetDateMs === 'number' ? targetDateMs : new Date(targetDateMs).getTime();
  if (isNaN(targetMs)) {
    return {
      text: 'Dates TBA',
      timerText: 'Dates TBA',
      isExpired: false,
      isUrgent: false,
      isCritical: false,
      urgency: 'normal',
      padHours: '00',
      padMinutes: '00',
      padSeconds: '00',
      days: 0,
      totalHours: 0
    };
  }

  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    return {
      text: 'Round Ended',
      timerText: 'Round Ended',
      isExpired: true,
      isUrgent: false,
      isCritical: false,
      urgency: 'expired',
      padHours: '00',
      padMinutes: '00',
      padSeconds: '00',
      days: 0,
      totalHours: 0
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  const pad = (n) => String(n).padStart(2, '0');

  let text = '';
  let timerText = '';
  let urgency = 'normal';

  if (days >= 2) {
    text = `${days} days left`;
    timerText = `${days} days left`;
    urgency = 'normal';
  } else if (days === 1) {
    text = `1d ${hours}h left`;
    timerText = `1 day left`;
    urgency = 'normal';
  } else {
    // Under 24 hours: Countdown in hours, minutes, and seconds!
    urgency = totalHours < 2 ? 'critical' : 'urgent';
    timerText = `${pad(totalHours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    if (totalHours >= 1) {
      text = `${pad(totalHours)}h ${pad(minutes)}m ${pad(seconds)}s left`;
    } else if (totalMinutes >= 1) {
      text = `${pad(minutes)}m ${pad(seconds)}s left`;
    } else {
      text = `${seconds}s left`;
    }
  }

  return {
    text,
    timerText,
    isExpired: false,
    isUrgent: urgency === 'urgent' || urgency === 'critical',
    isCritical: urgency === 'critical',
    urgency,
    days,
    hours,
    minutes,
    seconds,
    totalHours,
    totalMinutes,
    totalSeconds,
    padHours: pad(totalHours),
    padMinutes: pad(minutes),
    padSeconds: pad(seconds)
  };
}

/**
 * Resolves the active / upcoming competition round from the multi-round schedule.
 */
export function getActiveOrNextRound(compRoundsData, nowMs = Date.now()) {
  if (!compRoundsData || !Array.isArray(compRoundsData.rounds)) {
    return { currentRound: null, currentRoundIndex: 0, totalRounds: 0, subsequentRound: null };
  }

  // Filter out Stage 0: Registration
  const competitionRounds = compRoundsData.rounds.filter(r => r.type !== 'registration');
  if (competitionRounds.length === 0) {
    return { currentRound: null, currentRoundIndex: 0, totalRounds: 0, subsequentRound: null };
  }

  // Find first round that hasn't concluded yet
  let activeIdx = competitionRounds.findIndex(r => {
    if (!r.endDate) return true;
    const endMs = new Date(r.endDate).getTime();
    return !isNaN(endMs) && endMs > nowMs;
  });

  // If all rounds concluded, point to the final round as completed
  if (activeIdx === -1) {
    return {
      currentRound: competitionRounds[competitionRounds.length - 1],
      currentRoundIndex: competitionRounds.length,
      totalRounds: competitionRounds.length,
      subsequentRound: null,
      isConcluded: true
    };
  }

  const currentRound = competitionRounds[activeIdx];
  const subsequentRound = activeIdx + 1 < competitionRounds.length ? competitionRounds[activeIdx + 1] : null;

  const startMs = currentRound.startDate ? new Date(currentRound.startDate).getTime() : 0;
  const endMs = currentRound.endDate ? new Date(currentRound.endDate).getTime() : 0;

  const isLive = (startMs > 0 && startMs <= nowMs && endMs > nowMs) || currentRound.status === 'live';
  const isStartingSoon = !isLive && startMs > 0 && startMs > nowMs && (startMs - nowMs) <= 24 * 60 * 60 * 1000;

  return {
    currentRound,
    currentRoundIndex: activeIdx + 1,
    totalRounds: competitionRounds.length,
    subsequentRound,
    isLive,
    isStartingSoon,
    isConcluded: false
  };
}

/**
 * Lightweight hook that emits current timestamp every 1,000ms (1s).
 * Used to drive real-time live ticking countdowns with zero performance overhead.
 */
export function useLiveSecondTicker() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

/**
 * Resolves the accurate next active deadline for any competition,
 * seamlessly bridging pre-registration (Apply Mode) and multi-round (Rounds Tracker Mode).
 * 
 * Returns: {
 *   timestamp: number (epoch ms, or Infinity if unknown),
 *   isPast: boolean (true if timestamp < nowMs),
 *   type: 'round' | 'registration' | 'fallback',
 *   label: string
 * }
 */
export function getEffectiveCompetitionDeadline(comp, roundsData = null, nowMs = Date.now()) {
  if (!comp) {
    return { timestamp: Infinity, isPast: false, type: 'fallback', label: 'TBA' };
  }

  // Determine registration deadline timestamp from comp or roundsData
  let regTime = 0;
  if (comp.deadline) {
    const t = new Date(comp.deadline).getTime();
    if (!isNaN(t)) regTime = t;
  }
  if (regTime === 0 && roundsData?.deadline) {
    const t = new Date(roundsData.deadline).getTime();
    if (!isNaN(t)) regTime = t;
  }
  if (regTime === 0 && Array.isArray(roundsData?.rounds)) {
    const regRound = roundsData.rounds.find(r => r.type === 'registration');
    if (regRound?.endDate) {
      const t = new Date(regRound.endDate).getTime();
      if (!isNaN(t)) regTime = t;
    }
  }
  if (regTime === 0 && comp.days !== undefined && comp.days !== null) {
    regTime = nowMs + Number(comp.days) * 24 * 60 * 60 * 1000;
  }

  // Determine if registration is closed
  const isRegClosed = roundsData?.isRegistrationClosed !== undefined
    ? roundsData.isRegistrationClosed
    : (regTime > 0 && regTime <= nowMs);

  // If registration is closed, the competition is in round tracking mode
  if (isRegClosed) {
    // 1. Check multi-round pipeline if available
    if (roundsData && Array.isArray(roundsData.rounds) && roundsData.rounds.length > 0) {
      const { currentRound } = getActiveOrNextRound(roundsData, nowMs);
      if (currentRound?.endDate) {
        const roundEnd = new Date(currentRound.endDate).getTime();
        if (!isNaN(roundEnd) && roundEnd > 0) {
          return {
            timestamp: roundEnd,
            isPast: roundEnd < nowMs,
            type: 'round',
            label: currentRound.title || 'Round'
          };
        }
      }
    }

    // 2. Fallbacks from roundsData if rounds array didn't resolve an active round
    if (roundsData?.nextDeadline) {
      const nextEnd = new Date(roundsData.nextDeadline).getTime();
      if (!isNaN(nextEnd) && nextEnd > 0) {
        return {
          timestamp: nextEnd,
          isPast: nextEnd < nowMs,
          type: 'round',
          label: roundsData.nextDeadlineLabel || 'Round'
        };
      }
    }

    if (roundsData?.finalDeadline) {
      const finalEnd = new Date(roundsData.finalDeadline).getTime();
      if (!isNaN(finalEnd) && finalEnd > 0) {
        return {
          timestamp: finalEnd,
          isPast: finalEnd < nowMs,
          type: 'round',
          label: 'Final Round'
        };
      }
    }
  } else {
    // Registration is currently OPEN (Apply Mode)
    if (regTime > 0) {
      return {
        timestamp: regTime,
        isPast: regTime < nowMs,
        type: 'registration',
        label: 'Registration'
      };
    }
  }

  // Fallback if neither resolved to a valid future timestamp
  if (regTime > 0) {
    return {
      timestamp: regTime,
      isPast: regTime < nowMs,
      type: 'registration',
      label: 'Registration'
    };
  }

  return { timestamp: Infinity, isPast: false, type: 'fallback', label: 'TBA' };
}

/**
 * Strict comparator to sort competitions by SOONEST upcoming deadlines first.
 * Works seamlessly whether the active deadline is a registration deadline or a round deadline.
 * 
 * Rules:
 * 1. Active upcoming deadlines (>= nowMs) always precede past / expired deadlines.
 * 2. Active upcoming deadlines are sorted ascending by timestamp (soonest first).
 * 3. Expired deadlines (< nowMs) are sorted after upcoming ones (most recently expired first).
 * 4. Competitions with no date (Infinity) are placed at the very end.
 * 5. Ties broken by registered count (popularity) descending, then alphabetical title.
 */
export function compareCompetitionDeadlines(a, b, roundsMap = null, nowMs = Date.now()) {
  const idA = a?.id != null ? String(a.id) : '';
  const idB = b?.id != null ? String(b.id) : '';
  const rDataA = roundsMap ? (roundsMap[idA] || (a?.id != null ? roundsMap[a.id] : null)) : (Array.isArray(a?.rounds) ? a : null);
  const rDataB = roundsMap ? (roundsMap[idB] || (b?.id != null ? roundsMap[b.id] : null)) : (Array.isArray(b?.rounds) ? b : null);

  const infoA = getEffectiveCompetitionDeadline(a, rDataA, nowMs);
  const infoB = getEffectiveCompetitionDeadline(b, rDataB, nowMs);

  // 1. Both upcoming (>= nowMs)
  if (!infoA.isPast && !infoB.isPast) {
    if (infoA.timestamp !== infoB.timestamp) {
      return infoA.timestamp - infoB.timestamp; // Smaller timestamp = sooner
    }
  }

  // 2. One upcoming, one expired
  if (!infoA.isPast && infoB.isPast) return -1;
  if (infoA.isPast && !infoB.isPast) return 1;

  // 3. Both expired (< nowMs)
  if (infoA.isPast && infoB.isPast) {
    if (infoA.timestamp !== infoB.timestamp) {
      return infoB.timestamp - infoA.timestamp; // Most recently expired first
    }
  }

  // 4. Handle Infinity (no deadline)
  if (infoA.timestamp === Infinity && infoB.timestamp !== Infinity) return 1;
  if (infoA.timestamp !== Infinity && infoB.timestamp === Infinity) return -1;

  // 5. Tiebreak by registrations count
  const regsA = Number(a.regs || a.registeredCount || 0);
  const regsB = Number(b.regs || b.registeredCount || 0);
  if (regsB !== regsA) return regsB - regsA;

  // 6. Tiebreak by title
  return (a.title || '').localeCompare(b.title || '');
}

