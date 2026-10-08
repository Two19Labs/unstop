// Single source of truth for Browse filtering, facet counts and sorting.
// Used by CompetitionsPage (Browse) and HomeScreen (rails that follow the Browse filter).
import { isEligibleForUndergrad } from './eligibilityUtils.js';

export const FILTER_PREFS_KEY = 'onestop_user_filter_prefs';

export const CIRCUIT_OPTIONS = [
  { id: 'du', label: 'DU Circuit' },
  { id: 'iim-iit-premier', label: 'IIMs, IITs & Premier' },
  { id: 'corporate-global', label: 'Corporate & Global' },
  { id: 'others', label: 'Others' },
];

export const TRACK_OPTIONS = [
  { id: 'case', label: 'Case Comps' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'writing', label: 'Writing & Research' },
  { id: 'quiz', label: 'Quizzes' },
  { id: 'simulation', label: 'Simulations' },
  { id: 'debate', label: 'Debates' },
];

export const PLATFORM_OPTIONS = [
  { id: 'unstop', label: 'Unstop' },
  { id: 'inside_campus', label: 'InsideKampus / InsideIIM' },
  { id: 'devpost', label: 'Devpost' },
  { id: 'corporate', label: 'Corporate Direct' },
];

export const SUBTRACK_MAP = {
  case: [
    { id: 'finance', label: 'Finance & Valuation' },
    { id: 'strategy', label: 'Strategy & Consulting' },
    { id: 'marketing', label: 'Marketing & Brand' },
    { id: 'bplan', label: 'B-Plan & Pitch' },
    { id: 'product', label: 'Product & Tech' },
    { id: 'operations', label: 'Operations & SCM' },
  ],
  hackathon: [
    { id: 'hack_ai', label: 'AI & Machine Learning' },
    { id: 'hack_web3', label: 'Web3 & Blockchain' },
    { id: 'hack_dev', label: 'Full-Stack & Mobile' },
    { id: 'hack_data', label: 'Data Science & Analytics' },
    { id: 'hack_cyber', label: 'Cybersecurity & Cloud' },
  ],
  quiz: [
    { id: 'quiz_business', label: 'Business & Economy' },
    { id: 'quiz_tech', label: 'Tech & Science' },
    { id: 'quiz_finance', label: 'Finance & Markets' },
    { id: 'quiz_general', label: 'General & Trivia' },
  ],
  simulation: [
    { id: 'sim_stock', label: 'Stock & Trading' },
    { id: 'sim_auction', label: 'Auction & Bidding' },
    { id: 'sim_crisis', label: 'Crisis & Deal Room' },
  ],
  debate: [
    { id: 'debate_pd', label: 'Parliamentary Debate' },
    { id: 'debate_mun', label: 'Model UN & Youth Parl' },
    { id: 'debate_conventional', label: 'Conventional Debate' },
  ],
  writing: [
    { id: 'writing_paper', label: 'Research Paper Presentation' },
    { id: 'writing_article', label: 'Article & Essay' },
    { id: 'writing_case', label: 'Case Writing & Policy' },
  ],
};

const SUBTRACK_CATEGORY = Object.fromEntries(
  Object.entries(SUBTRACK_MAP).flatMap(([cat, subs]) => subs.map(s => [s.id, cat]))
);

export const SORT_OPTIONS = [
  { id: 'closing-soonest', label: 'Closing soonest' },
  { id: 'closing-latest', label: 'Closing latest' },
  { id: 'title-asc', label: 'Title: A → Z' },
  { id: 'title-desc', label: 'Title: Z → A' },
  { id: 'prize-highest', label: 'Highest prize pool' },
  { id: 'popular', label: 'Most registered' },
];

export const DEFAULT_PREFS = Object.freeze({
  selectedCircuits: [],
  selectedTracks: [],
  selectedSubTracks: [],
  selectedPlatforms: [],
  teamFilter: 'all',
  feeFilter: 'all',
  sortBy: 'closing-soonest',
});

const ids = (opts) => opts.map(o => o.id);
const keepKnown = (arr, known) => (Array.isArray(arr) ? arr.filter(v => known.includes(v)) : []);

// Normalises prefs from any older format (and drops ids that no longer exist)
export function sanitizePrefs(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const circuits = p.selectedCircuits ?? p.circ;
  const tracks = p.selectedTracks ?? p.disc;
  const legacyCircuit = (c) => (c === 'iim-iit-bschool' ? 'iim-iit-premier' : c);
  const legacyPlatform = (pl) => (pl === 'inside_iim' ? 'inside_campus' : pl);
  const team = p.teamFilter ?? p.team;
  const fee = p.feeFilter ?? p.fee;
  const sort = p.sortBy ?? p.sort;
  const selectedTracks = keepKnown(tracks, ids(TRACK_OPTIONS));
  return {
    selectedCircuits: keepKnown((Array.isArray(circuits) ? circuits : []).map(legacyCircuit), ids(CIRCUIT_OPTIONS)),
    selectedTracks,
    // a sub-track only makes sense while its category is selected
    selectedSubTracks: keepKnown(p.selectedSubTracks, Object.keys(SUBTRACK_CATEGORY))
      .filter(st => selectedTracks.includes(SUBTRACK_CATEGORY[st])),
    selectedPlatforms: keepKnown((Array.isArray(p.selectedPlatforms) ? p.selectedPlatforms : []).map(legacyPlatform), ids(PLATFORM_OPTIONS)),
    teamFilter: ['solo', 'team'].includes(team) ? team : 'all',
    feeFilter: ['free', 'paid'].includes(fee) ? fee : 'all',
    sortBy: ids(SORT_OPTIONS).includes(sort) ? sort : 'closing-soonest',
  };
}

export function loadPrefs() {
  try {
    if (typeof window === 'undefined') return { ...DEFAULT_PREFS };
    const raw = localStorage.getItem(FILTER_PREFS_KEY);
    return sanitizePrefs(raw ? JSON.parse(raw) : null);
  } catch (e) {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(FILTER_PREFS_KEY, JSON.stringify(sanitizePrefs(prefs)));
  } catch (e) {}
}

// ---------- per-competition facts ----------

export function getCircuitKey(comp) {
  if (!comp) return 'others';
  if (comp.circuit === 'DU Circuit') return 'du';
  if (comp.circuit === 'IIM / IIT') return 'iim-iit-premier';
  if (comp.circuit === 'Corporate') return 'corporate-global';
  if (comp.circuit === 'Others') return 'others';
  if (comp.isDU) return 'du';
  if (comp.isIIMorIIT || comp.isPremier || comp.isIIMorIITorPremier) return 'iim-iit-premier';
  if (comp.isCorporate || comp.isCorporateOrGlobal) return 'corporate-global';
  return 'others';
}

export function getPlatformKey(comp) {
  const p = String(comp?.sourcePlatform || 'unstop').toLowerCase();
  if (p === 'inside_iim') return 'inside_campus';
  return p;
}

export function isFreeComp(comp) {
  if (typeof comp?.isFree === 'boolean') return comp.isFree;
  return String(comp?.fee || '').toLowerCase() === 'free';
}

// "Solo OK": you can enter alone. "Team": a team of 2+ is allowed.
export function isSoloOk(comp) {
  const min = Number(comp?.minTeam);
  if (Number.isFinite(min) && min > 0) return min <= 1;
  const max = Number(comp?.maxTeam);
  if (Number.isFinite(max) && max > 0) return max <= 1;
  return /solo|individual/i.test(comp?.teamSizeDisplay || comp?.team || '');
}

export function isTeamOk(comp) {
  const max = Number(comp?.maxTeam);
  if (Number.isFinite(max) && max > 0) return max >= 2;
  return !/^\s*(solo|individual)/i.test(comp?.teamSizeDisplay || comp?.team || '');
}

export function getDeadlineMs(comp) {
  if (!comp?.deadline) return Infinity;
  const t = new Date(comp.deadline).getTime();
  return Number.isNaN(t) ? Infinity : t;
}

export function isExpired(comp, nowMs = Date.now()) {
  const t = getDeadlineMs(comp);
  return t !== Infinity && t < nowMs;
}

const CIRCUIT_LABEL = Object.fromEntries(CIRCUIT_OPTIONS.map(c => [c.id, c.label]));

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Every word of the query must start a word somewhere in the searchable fields
export function matchesSearch(comp, query) {
  const tokens = String(query || '').toLowerCase().split(/\s+/).map(t => t.trim()).filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = [
    comp.title, comp.orgName, comp.host, comp.prizes, comp.categoryLabel, comp.sourceLabel,
    CIRCUIT_LABEL[getCircuitKey(comp)],
  ].filter(Boolean).join(' • ').toLowerCase();
  return tokens.every(t => new RegExp(`(^|[^a-z0-9])${escapeRe(t)}`, 'i').test(hay));
}

// ---------- filtering ----------

const activeSet = (selected, all) => (selected.length > 0 && selected.length < all ? selected : null);

/**
 * opts: { isPostgrad, search, now, except, platformCount }
 *  except: one of 'circuits' | 'tracks' | 'subTracks' | 'platforms' | 'team' | 'fee'
 *          (that facet is ignored, which is how per-option counts are computed)
 */
export function matchesFilters(comp, rawPrefs, opts = {}) {
  if (!comp) return false;
  const prefs = rawPrefs && rawPrefs.__sanitized ? rawPrefs : sanitizePrefs(rawPrefs);
  const { isPostgrad = false, search = '', now = Date.now(), except = null, platformCount = PLATFORM_OPTIONS.length } = opts;

  if (!isPostgrad && !isEligibleForUndergrad(comp)) return false;
  if (isExpired(comp, now)) return false;
  if (search && !matchesSearch(comp, search)) return false;

  if (except !== 'circuits') {
    const sel = activeSet(prefs.selectedCircuits, CIRCUIT_OPTIONS.length);
    if (sel && !sel.includes(getCircuitKey(comp))) return false;
  }

  if (except !== 'tracks') {
    const sel = activeSet(prefs.selectedTracks, TRACK_OPTIONS.length);
    if (sel && !sel.includes(comp.category)) return false;
  }

  if (except !== 'subTracks' && prefs.selectedSubTracks.length > 0) {
    // Sub-tracks only narrow their own category: picking Case > Finance keeps every hackathon
    const own = (SUBTRACK_MAP[comp.category] || []).map(s => s.id);
    const relevant = prefs.selectedSubTracks.filter(st => own.includes(st));
    if (relevant.length > 0) {
      const compSubs = Array.isArray(comp.subTracks) ? comp.subTracks : [];
      if (!relevant.some(st => compSubs.includes(st))) return false;
    }
  }

  if (except !== 'platforms') {
    const sel = activeSet(prefs.selectedPlatforms, platformCount);
    if (sel && !sel.includes(getPlatformKey(comp))) return false;
  }

  if (except !== 'team') {
    if (prefs.teamFilter === 'solo' && !isSoloOk(comp)) return false;
    if (prefs.teamFilter === 'team' && !isTeamOk(comp)) return false;
  }

  if (except !== 'fee') {
    if (prefs.feeFilter === 'free' && !isFreeComp(comp)) return false;
    if (prefs.feeFilter === 'paid' && isFreeComp(comp)) return false;
  }

  return true;
}

export function filterCompetitions(list, prefs, opts = {}) {
  const p = { ...sanitizePrefs(prefs), __sanitized: true };
  return (Array.isArray(list) ? list : []).filter(c => matchesFilters(c, p, opts));
}

// Each option's count applies every *other* active filter, so the number is what you get by ticking it
export function facetCounts(list, prefs, opts = {}) {
  const p = { ...sanitizePrefs(prefs), __sanitized: true };
  const counts = { circuits: {}, tracks: {}, subTracks: {}, platforms: {}, team: { solo: 0, team: 0 }, fee: { free: 0, paid: 0 } };
  for (const c of Array.isArray(list) ? list : []) {
    if (matchesFilters(c, p, { ...opts, except: 'circuits' })) {
      const k = getCircuitKey(c);
      counts.circuits[k] = (counts.circuits[k] || 0) + 1;
    }
    if (matchesFilters(c, p, { ...opts, except: 'tracks' }) && c.category) {
      counts.tracks[c.category] = (counts.tracks[c.category] || 0) + 1;
    }
    if (matchesFilters(c, p, { ...opts, except: 'subTracks' })) {
      for (const st of Array.isArray(c.subTracks) ? c.subTracks : []) {
        if (SUBTRACK_CATEGORY[st] === c.category) counts.subTracks[st] = (counts.subTracks[st] || 0) + 1;
      }
    }
    if (matchesFilters(c, p, { ...opts, except: 'platforms' })) {
      const k = getPlatformKey(c);
      counts.platforms[k] = (counts.platforms[k] || 0) + 1;
    }
    if (matchesFilters(c, p, { ...opts, except: 'team' })) {
      if (isSoloOk(c)) counts.team.solo++;
      if (isTeamOk(c)) counts.team.team++;
    }
    if (matchesFilters(c, p, { ...opts, except: 'fee' })) {
      counts.fee[isFreeComp(c) ? 'free' : 'paid']++;
    }
  }
  return counts;
}

// ---------- sorting ----------

export function parsePrizeAmount(prizesStr) {
  if (!prizesStr) return 0;
  const str = String(prizesStr).toLowerCase().replace(/,/g, '');
  if (str.includes('$')) {
    const m = str.match(/\$\s*([\d.]+)/);
    if (m) return parseFloat(m[1]) * 85;
  }
  if (str.includes('lakh')) {
    const m = str.match(/([\d.]+)\s*lakh/);
    if (m) return parseFloat(m[1]) * 100000;
  }
  if (str.includes('crore')) {
    const m = str.match(/([\d.]+)\s*crore/);
    if (m) return parseFloat(m[1]) * 10000000;
  }
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

const regs = (c) => c.registeredCount || c.regs || 0;

export function sortCompetitions(list, sortBy = 'closing-soonest') {
  const arr = [...(Array.isArray(list) ? list : [])];
  arr.sort((a, b) => {
    switch (sortBy) {
      case 'title-asc':
        return (a.title || '').trim().localeCompare((b.title || '').trim(), undefined, { sensitivity: 'base' });
      case 'title-desc':
        return (b.title || '').trim().localeCompare((a.title || '').trim(), undefined, { sensitivity: 'base' });
      case 'closing-latest': {
        const ta = getDeadlineMs(a), tb = getDeadlineMs(b);
        if (ta === Infinity && tb === Infinity) return regs(b) - regs(a);
        if (ta === Infinity) return 1;
        if (tb === Infinity) return -1;
        return ta !== tb ? tb - ta : regs(b) - regs(a);
      }
      case 'prize-highest': {
        const pa = parsePrizeAmount(a.prizes || a.prize), pb = parsePrizeAmount(b.prizes || b.prize);
        return pa !== pb ? pb - pa : regs(b) - regs(a);
      }
      case 'popular':
        return regs(b) - regs(a);
      case 'closing-soonest':
      default: {
        const ta = getDeadlineMs(a), tb = getDeadlineMs(b);
        return ta !== tb ? ta - tb : regs(b) - regs(a);
      }
    }
  });
  return arr;
}
