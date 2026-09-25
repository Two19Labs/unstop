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
 * Calculates live ticking countdown details down to exact hours, minutes, and seconds.
 */
export function getRoundCountdown(targetDateMs, nowMs = Date.now()) {
  if (!targetDateMs) {
    return {
      text: 'Dates TBA',
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
  let urgency = 'normal';

  if (days >= 2) {
    text = `${days} days left`;
    urgency = 'normal';
  } else if (days === 1) {
    text = `1d ${hours}h left`;
    urgency = 'normal';
  } else {
    // Under 24 hours: Countdown in hours, minutes, and seconds!
    urgency = totalHours < 2 ? 'critical' : 'urgent';
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
