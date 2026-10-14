// src/data/years.js
// Year-of-study options, kept apart from the college directory so the app shell doesn't load it

export const YEAR_OPTIONS = [
  'UG 1st Year',
  'UG 2nd Year',
  'UG 3rd Year',
  'UG 4th Year',
  'PG 1st Year',
  'PG 2nd Year',
];

export function normalizeYear(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';
  if (YEAR_OPTIONS.includes(str)) return str;
  const lower = str.toLowerCase();
  const isPg = lower.includes('pg') || lower.includes('mba') || lower.includes('master') || lower.includes('postgraduate') || lower.includes('phd');
  const prefix = isPg ? 'PG' : 'UG';

  if (lower.includes('1st') || lower.includes('1')) return `${prefix} 1st Year`;
  if (lower.includes('2nd') || lower.includes('2')) return `${prefix} 2nd Year`;
  if (lower.includes('3rd') || lower.includes('3')) return isPg ? 'PG 2nd Year' : 'UG 3rd Year';
  if (lower.includes('4th') || lower.includes('4')) return isPg ? 'PG 2nd Year' : 'UG 4th Year';
  if (isPg) return 'PG 1st Year';
  return '';
}
