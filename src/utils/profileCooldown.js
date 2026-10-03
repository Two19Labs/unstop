// Pure helpers shared by the app and scripts/*_test.js
export const PROFILE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// The database owns profile_last_updated_at (see PROFILE_COOLDOWN_AND_PRIVACY_MIGRATION.sql).
export function getProfileCooldown(profile, user) {
  const lastUpdated = profile?.profile_last_updated_at || null;

  if (!lastUpdated) {
    return { isLocked: false, remainingMs: 0, hours: 0, minutes: 0, seconds: 0, remainingFormatted: '' };
  }

  const lastTime = new Date(lastUpdated).getTime();
  if (isNaN(lastTime)) {
    return { isLocked: false, remainingMs: 0, hours: 0, minutes: 0, seconds: 0, remainingFormatted: '' };
  }

  const now = Date.now();
  const elapsed = now - lastTime;
  if (elapsed >= PROFILE_COOLDOWN_MS) {
    return { isLocked: false, remainingMs: 0, hours: 0, minutes: 0, seconds: 0, remainingFormatted: '' };
  }

  const remainingMs = PROFILE_COOLDOWN_MS - elapsed;
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
  const remainingFormatted = `${hours}h ${minutes}m ${seconds}s`;

  return {
    isLocked: true,
    remainingMs,
    hours,
    minutes,
    seconds,
    remainingFormatted,
    unlockDate: new Date(lastTime + PROFILE_COOLDOWN_MS),
  };
}
