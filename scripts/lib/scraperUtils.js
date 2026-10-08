// Pure helpers for scripts/scrape_institutional.js (unit-tested in scripts/scraper_test.js)

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

function parseMonthDayYear(text) {
  const m = String(text || '').trim().match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s*(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase().slice(0, m[1].toLowerCase().startsWith('sept') ? 4 : 3)];
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (month === undefined || day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * Devpost "submission_period_dates" end date as an ISO string (end of that day, UTC), or null.
 * Handles "Sep 01 - Oct 14, 2026", "Oct 01 - 10, 2026", "Dec 15, 2026 - Jan 10, 2027", "Oct 14, 2026".
 */
export function parseDevpostDeadline(range) {
  if (typeof range !== 'string' || !range.trim()) return null;
  const parts = range.split(/\s+[-–]\s+/).map(p => p.trim()).filter(Boolean);
  let end = parts[parts.length - 1];
  if (/^\d{1,2},?\s*\d{4}$/.test(end) && parts.length > 1) {
    // "Oct 01 - 10, 2026": the month comes from the start of the range
    const startMonth = parts[0].match(/^([A-Za-z]{3,9})/);
    if (!startMonth) return null;
    end = `${startMonth[1]} ${end}`;
  }
  const d = parseMonthDayYear(end);
  if (!d) return null;
  const iso = new Date(Date.UTC(d.year, d.month, d.day, 23, 59, 59));
  if (iso.getUTCDate() !== d.day) return null; // e.g. "Feb 31"
  return iso.toISOString();
}

// Online, or in person in India: anything else is not reachable for our students
export function isOnlineOrIndia(location) {
  const loc = String(location || '').toLowerCase();
  if (!loc) return false;
  return /\bonline\b/.test(loc) || /\bindia\b/.test(loc);
}

const DEVPOST_THEME_TO_SUBTRACK = [
  [/machine learning|\bai\b|artificial intelligence|llm|generative/i, 'hack_ai'],
  [/blockchain|web3|crypto/i, 'hack_web3'],
  [/cyber|security/i, 'hack_cyber'],
  [/data|analytics|databases/i, 'hack_data'],
  [/\bweb\b|mobile|low\/no code|devops|ar\/vr|gaming|iot/i, 'hack_dev'],
];

export function devpostSubTracks(themes) {
  const names = (Array.isArray(themes) ? themes : []).map(t => (typeof t === 'string' ? t : t?.name || ''));
  const out = new Set();
  for (const name of names) {
    for (const [re, id] of DEVPOST_THEME_TO_SUBTRACK) if (re.test(name)) out.add(id);
  }
  return [...out];
}

export function plainPrize(prizeHtml) {
  const text = String(prizeHtml || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (!text || /^\$?0$/.test(text)) return null;
  return `${text} Prize Pool`;
}

// Database ids must not depend on how a title is worded on a given day
export function stableId(sourceKey, externalId) {
  const key = String(externalId || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
  return `${sourceKey}_${key}`;
}

// InsideKampus team size: { type: 'SOLO' | 'MAX' | 'FIXED' | ..., size }
export function insideKampusTeam(teamSize) {
  const size = Number(teamSize?.size) || null;
  const type = String(teamSize?.type || '').toUpperCase();
  if (type === 'SOLO') return { min: 1, max: 1 };
  if (type === 'MAX' && size) return { min: 1, max: size };
  if (size) return { min: size, max: size };
  return { min: 1, max: 1 };
}
