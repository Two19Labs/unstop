// src/components/HomeScreen.jsx  -  OneStop Home Filter-Driven Rails
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initialsOf, matchListing, formatDeadlineDateTime, formatDeadlineCountdown, getUrgencyLevel } from '../data/initialData';
import InstitutionLogo from './InstitutionLogo';
import OneStopLogo from './OneStopLogo';
import { GENERAL_PUNS, BROWSE_PUNS, SQUAD_PUNS } from './FunLoadingScreen';
import {
  TrophyIcon,
  UsersIcon,
  CalendarIcon,
  FlameIcon,
  ClockIcon,
  ExternalLinkIcon
} from './icons';
import { useCompetitionRounds } from '../hooks/useCompetitionRounds';
import BookmarkRoundTrackerCard from './BookmarkRoundTrackerCard';
import './HomeScreen.css';
import './SectionLoadingWidget.css';

const CARDS_PER_RAIL = 3;

function parsePrizeAmount(prizesStr) {
  if (!prizesStr) return 0;
  const str = String(prizesStr).toLowerCase().replace(/,/g, '');
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

function getDeadlineTimestamp(comp) {
  if (!comp) return Infinity;
  if (comp.deadline) {
    const t = new Date(comp.deadline).getTime();
    if (!isNaN(t)) return t;
  }
  if (comp.days !== undefined && comp.days !== null) {
    return Date.now() + Number(comp.days) * 24 * 60 * 60 * 1000;
  }
  return Infinity;
}

export function sortCompetitions(list, sortBy = 'closing-soonest') {
  const arr = [...list];
  arr.sort((a, b) => {
    switch (sortBy) {
      case 'title-asc':
        return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
      case 'title-desc':
        return (b.title || '').localeCompare(a.title || '', undefined, { sensitivity: 'base' });
      case 'closing-soonest': {
        const timeA = getDeadlineTimestamp(a);
        const timeB = getDeadlineTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return (b.registeredCount || b.regs || 0) - (a.registeredCount || a.regs || 0);
      }
      case 'closing-latest': {
        const timeA = getDeadlineTimestamp(a);
        const timeB = getDeadlineTimestamp(b);
        if (timeA === Infinity && timeB === Infinity) return 0;
        if (timeA === Infinity) return 1;
        if (timeB === Infinity) return -1;
        if (timeA !== timeB) return timeB - timeA;
        return (b.registeredCount || b.regs || 0) - (a.registeredCount || a.regs || 0);
      }
      case 'prize-highest': {
        const prizeA = parsePrizeAmount(a.prize || a.prizes);
        const prizeB = parsePrizeAmount(b.prize || b.prizes);
        if (prizeA !== prizeB) return prizeB - prizeA;
        return (b.registeredCount || b.regs || 0) - (a.registeredCount || a.regs || 0);
      }
      case 'popular':
        return (b.registeredCount || b.regs || 0) - (a.registeredCount || a.regs || 0);
      default: {
        const timeA = getDeadlineTimestamp(a);
        const timeB = getDeadlineTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return (b.registeredCount || b.regs || 0) - (a.registeredCount || a.regs || 0);
      }
    }
  });
  return arr;
}

export const SORT_LABELS = {
  'closing-soonest': 'Closing soonest first',
  'closing-latest': 'Closing latest first',
  'prize-highest': 'Highest prize pool',
  'popular': 'Most registered (popular)',
  'title-asc': 'Title: A → Z',
  'title-desc': 'Title: Z → A',
};

const DU_KEYWORDS = [
  'delhi university', 'university of delhi', '(du)', 'sscbs', 'shaheed sukhdev',
  'srcc', 'shri ram college', 'stephen', 'hindu', 'hansraj', 'lsr', 'lady shri ram',
  'sggscc', 'ramjas', 'kirori mal', 'kmc', 'drc', 'daulat ram', 'gargi', 'venkateswara',
  'venky', 'sgtb khalsa', 'khalsa', 'keshav mahavidyalaya', 'deen dayal upadhyaya', 'ddu',
  'miranda', 'jesus and mary', 'jmc', 'atma ram', 'arsd', 'sbsc', 'shaheed bhagat singh',
  'motilal nehru', 'indraprastha college', 'ipcw', 'maharaja agrasen', 'ramanujan', 'kalindi', 'kamala nehru'
];

function isMatch(text, kw) {
  if (kw.length <= 4 && /^[a-z0-9]+$/i.test(kw)) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(text);
  }
  return text.includes(kw);
}

function getCompCircuitKey(comp) {
  if (!comp) return 'others';
  if (comp.isDU || comp.circuit === 'DU Circuit') return 'du';
  const combined = `${comp.orgName || comp.host || ''} ${comp.title || ''}`.toLowerCase();
  if (DU_KEYWORDS.some(kw => isMatch(combined, kw))) return 'du';
  if (comp.isIIMorIIT || comp.isPremier || comp.isIIMorIITorPremier || comp.isBschool || comp.circuit === 'IIM / IIT') return 'iim-iit-premier';
  if (comp.isCorporate || comp.isCorporateOrGlobal || comp.circuit === 'Corporate') return 'corporate-global';
  return 'others';
}

export function matchCompetition(comp, f = {}) {
  if (!comp) return false;

  // 1. Circuit filter
  const selectedCircuits = Array.isArray(f.selectedCircuits)
    ? f.selectedCircuits
    : (Array.isArray(f.circ) ? f.circ : []);

  if (selectedCircuits.length > 0 && selectedCircuits.length < 4) {
    const compCircuitKey = getCompCircuitKey(comp);
    const matchesCircuit = selectedCircuits.some(cId => {
      if (cId === 'du' || cId === 'DU Circuit') {
        return compCircuitKey === 'du' || comp.circuit === 'DU Circuit' || comp.isDU;
      }
      if (cId === 'iim-iit-premier' || cId === 'iim-iit-bschool' || cId === 'IIM / IIT') {
        return compCircuitKey === 'iim-iit-premier' || comp.circuit === 'IIM / IIT' || comp.isIIMorIIT || comp.isPremier;
      }
      if (cId === 'corporate-global' || cId === 'Corporate') {
        return compCircuitKey === 'corporate-global' || comp.circuit === 'Corporate' || comp.isCorporate || comp.isCorporateOrGlobal;
      }
      if (cId === 'others') return compCircuitKey === 'others';
      return comp.circuit === cId;
    });
    if (!matchesCircuit) return false;
  }

  // 2. Discipline / Track filter
  const selectedTracks = Array.isArray(f.selectedTracks)
    ? f.selectedTracks
    : (Array.isArray(f.disc) ? f.disc : []);

  if (selectedTracks.length > 0 && selectedTracks.length < 6) {
    const compCategory = (comp.category || '').toLowerCase();
    const compDisc = (comp.discipline || '').toLowerCase();
    const matchesTrack = selectedTracks.some(tId => {
      const lower = tId.toLowerCase();
      if (lower === 'case' || lower === 'case comps') return compCategory === 'case' || compDisc.includes('case');
      if (lower === 'hackathon' || lower === 'hackathons') return compCategory === 'hackathon' || compDisc.includes('hackathon') || compDisc.includes('tech');
      if (lower === 'writing' || lower === 'writing & research') return compCategory === 'writing' || compDisc.includes('writ') || compDisc.includes('research') || compDisc.includes('paper');
      if (lower === 'quiz' || lower === 'quizzes') return compCategory === 'quiz' || compDisc.includes('quiz');
      if (lower === 'simulation' || lower === 'simulations') return compCategory === 'simulation' || compDisc.includes('simul');
      if (lower === 'debate' || lower === 'debates') return compCategory === 'debate' || compDisc.includes('debate') || compDisc.includes('mun');
      return compCategory === lower || compDisc.includes(lower);
    });
    if (!matchesTrack) return false;
  }

  // 3. Team format filter
  const team = f.teamFilter || f.team;
  const isSolo = comp.maxTeam === 1 || (comp.team && (String(comp.team).trim().startsWith('1') || String(comp.team).toLowerCase().includes('solo')));
  if (team === 'solo' && !isSolo) return false;
  if (team === 'team' && isSolo) return false;

  // 4. Fee filter
  const fee = f.feeFilter || f.fee;
  const isFree = comp.fee === 'Free' || comp.isFree;
  if (fee === 'free' && !isFree) return false;
  if (fee === 'paid' && isFree) return false;

  // 5. Query filter (if any)
  const q = f.searchQuery || f.q;
  if (typeof q === 'string' && q.trim()) {
    const hay = `${comp.title || ''} ${comp.host || ''} ${comp.orgName || ''} ${comp.discipline || ''} ${comp.circuit || ''}`.toLowerCase();
    if (!hay.includes(q.trim().toLowerCase())) return false;
  }

  return true;
}

function getUrgencyConfig(urgencyLevel) {
  if (urgencyLevel === 'red') {
    return {
      border: '1px solid rgba(239, 68, 68, 0.40)',
      background: 'rgba(239, 68, 68, 0.12)',
      color: 'var(--urgency-red, #EF4444)',
      dotColor: '#EF4444'
    };
  }
  if (urgencyLevel === 'yellow') {
    return {
      border: '1px solid rgba(245, 158, 11, 0.40)',
      background: 'rgba(245, 158, 11, 0.14)',
      color: 'var(--urgency-yellow, #F59E0B)',
      dotColor: '#F59E0B'
    };
  }
  return {
    border: '1px solid var(--primary-tint-35, rgba(15, 63, 254, 0.35))',
    background: 'var(--primary-tint-8, rgba(15, 63, 254, 0.08))',
    color: 'var(--primary, #0F3FFE)',
    dotColor: 'var(--primary, #0F3FFE)'
  };
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'recently';
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function RailCardSkeleton() {
  return (
    <div
      className="home-rail-card home-rail-card-skeleton"
      style={{
        flex: '0 0 302px',
        width: '302px',
        padding: '16px 17px 17px',
        gap: '12px',
        boxSizing: 'border-box'
      }}
      aria-hidden="true"
    >
      {/* Top Bar: Logo + Host name + Bookmark button placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) 28px', alignItems: 'start', gap: '10px' }}>
        <div className="skeleton-box" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '2px' }}>
          <div className="skeleton-box" style={{ height: '12px', width: '75%', borderRadius: '4px' }} />
          <div className="skeleton-box" style={{ height: '10px', width: '45%', borderRadius: '4px' }} />
        </div>
        <div className="skeleton-box" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
      </div>

      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '2px 0' }}>
        <div className="skeleton-box" style={{ height: '16px', width: '90%', borderRadius: '4px' }} />
        <div className="skeleton-box" style={{ height: '16px', width: '60%', borderRadius: '4px' }} />
      </div>

      {/* Prize Bar */}
      <div className="skeleton-box" style={{ height: '28px', width: '100%', borderRadius: '8px' }} />

      {/* Specs Chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <div className="skeleton-box" style={{ height: '22px', width: '68px', borderRadius: '20px' }} />
        <div className="skeleton-box" style={{ height: '22px', width: '76px', borderRadius: '20px' }} />
        <div className="skeleton-box" style={{ height: '22px', width: '84px', borderRadius: '20px' }} />
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '22px' }}>
        <div className="skeleton-box" style={{ height: '14px', width: '110px', borderRadius: '4px' }} />
        <div className="skeleton-box" style={{ height: '20px', width: '74px', borderRadius: '20px' }} />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
        <div className="skeleton-box" style={{ height: '36px', borderRadius: '9px' }} />
        <div className="skeleton-box" style={{ height: '36px', borderRadius: '9px' }} />
      </div>
    </div>
  );
}

function CompactBookmarkSkeleton() {
  return (
    <div
      className="home-rail-card home-rail-card--compact home-rail-card-skeleton"
      aria-hidden="true"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr) 24px', alignItems: 'center', gap: '9px' }}>
        <div className="skeleton-box" style={{ width: '30px', height: '30px', borderRadius: '7px' }} />
        <div className="skeleton-box" style={{ height: '11px', width: '70%', borderRadius: '4px' }} />
        <div className="skeleton-box" style={{ width: '24px', height: '24px', borderRadius: '7px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', margin: '2px 0' }}>
        <div className="skeleton-box" style={{ height: '14px', width: '90%', borderRadius: '4px' }} />
        <div className="skeleton-box" style={{ height: '14px', width: '60%', borderRadius: '4px' }} />
      </div>
      <div className="skeleton-box" style={{ height: '26px', width: '100%', borderRadius: '8px' }} />
      <div style={{ display: 'flex', gap: '6px' }}>
        <div className="skeleton-box" style={{ height: '16px', width: '65px', borderRadius: '4px' }} />
        <div className="skeleton-box" style={{ height: '16px', width: '80px', borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '20px' }}>
        <div className="skeleton-box" style={{ height: '12px', width: '95px', borderRadius: '4px' }} />
        <div className="skeleton-box" style={{ height: '18px', width: '65px', borderRadius: '20px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginTop: 'auto', paddingTop: '2px' }}>
        <div className="skeleton-box" style={{ height: '32px', borderRadius: '8px' }} />
        <div className="skeleton-box" style={{ height: '32px', borderRadius: '8px' }} />
      </div>
    </div>
  );
}

function RailSquadCardSkeleton() {
  return (
    <div
      className="home-rail-card home-rail-card-skeleton"
      style={{
        flex: '0 0 302px',
        width: '302px',
        padding: '16px 17px 17px',
        gap: '12px',
        boxSizing: 'border-box'
      }}
      aria-hidden="true"
    >
      {/* Top Bar: Spots badge placeholder + time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton-box" style={{ height: '20px', width: '85px', borderRadius: '20px' }} />
        <div className="skeleton-box" style={{ height: '12px', width: '50px', borderRadius: '4px' }} />
      </div>

      {/* Host & Title */}
      <div style={{ display: 'grid', gridTemplateColumns: '32px minmax(0, 1fr)', alignItems: 'center', gap: '10px' }}>
        <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div className="skeleton-box" style={{ height: '14px', width: '90%', borderRadius: '4px' }} />
          <div className="skeleton-box" style={{ height: '10px', width: '50%', borderRadius: '4px' }} />
        </div>
      </div>

      {/* Lead info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="skeleton-box" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
        <div className="skeleton-box" style={{ height: '11px', width: '120px', borderRadius: '4px' }} />
      </div>

      {/* Skills chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <div className="skeleton-box" style={{ height: '22px', width: '70px', borderRadius: '20px' }} />
        <div className="skeleton-box" style={{ height: '22px', width: '85px', borderRadius: '20px' }} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
        <div className="skeleton-box" style={{ height: '36px', borderRadius: '9px' }} />
        <div className="skeleton-box" style={{ height: '36px', borderRadius: '9px' }} />
      </div>
    </div>
  );
}

// Module-level memory to prevent consecutive duplicate quotes on home rails
let lastRailQuote = '';

function RailPunLoadingCard({
  category = "bookmarks",
  headline,
  customPuns = null
}) {
  // Exactly one quote per full loading card, shuffled at random
  const quote = useMemo(() => {
    let pool = GENERAL_PUNS;
    if (category === 'bookmarks' || category === 'comps') pool = BROWSE_PUNS;
    else if (category === 'squads') pool = SQUAD_PUNS;
    if (customPuns && customPuns.length > 0) pool = customPuns;
    if (!pool || pool.length === 0) return '';
    let candidate = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && candidate === lastRailQuote) {
      const filtered = pool.filter(q => q !== lastRailQuote);
      candidate = filtered[Math.floor(Math.random() * filtered.length)] || candidate;
    }
    lastRailQuote = candidate;
    return candidate;
  }, [category, customPuns]);

  const defaultHeadline = category === 'bookmarks'
    ? 'Syncing saved competitions...'
    : category === 'squads'
    ? 'Scouting collegiate squads...'
    : 'Fetching live competitions...';

  const cardTitle = headline || defaultHeadline;

  return (
    <div
      className="home-rail-card home-rail-pun-card"
      style={{
        flex: '0 0 302px',
        width: '302px',
        padding: '32px 20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px'
      }}
      role="status"
      aria-live="polite"
    >
      <div className="section-loading-ring-wrap" style={{ width: '42px', height: '42px', marginBottom: '12px' }}>
        <div className="section-loading-ring" aria-hidden="true" />
        <OneStopLogo variant="icon" height={19} />
      </div>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: 'var(--ink)' }}>
        {cardTitle}
      </h3>
      <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.45, color: 'var(--ink-dim)', maxWidth: '260px', textWrap: 'pretty' }}>
        {quote}
      </p>
    </div>
  );
}

export default function HomeScreen({
  profile,
  competitions = [],
  competitionsLoading = false,
  savedFilter = null,
  browseSort = null,
  onUpdateSort,
  onResetFilter,
  applications = [],
  posts = [],
  onGoBrowse,
  onOpenDetail,
  onFindTeammates,
  onSquadUp,
  bookmarks = [],
  onToggleBookmark,
  user,
  onNavigate,
  onRequestJoin,
  onOpenWhatsApp,
  headerAction = null,
}) {
  const rawFirst = typeof profile?.name === 'string' && profile.name.trim()
    ? profile.name.trim().split(/\s+/)[0]
    : (profile?.full_name?.trim() ? profile.full_name.trim().split(/\s+/)[0] : (user?.email ? user.email.split('@')[0] : 'there'));
  const firstName = rawFirst ? (rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase()) : 'there';

  const isPostgraduate =
    (profile?.education_level || '').toLowerCase() === 'postgraduate' ||
    (profile?.year || '').toUpperCase().startsWith('PG') ||
    (profile?.batch || '').toUpperCase().startsWith('PG');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Working late';
  }, []);

  const hasUserCollege = Boolean(user && profile?.college?.trim());
  const collegeName = profile?.college?.trim() || '';
  const batchStatus = profile?.batch?.trim() || profile?.year?.trim() || (isPostgraduate ? 'Postgraduate Track' : 'UG 2nd Year');

  const [isHomeLoading, setIsHomeLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHomeLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const showRailLoading = isHomeLoading || competitionsLoading;

  // KPI 1: Competitions matching Browse filter listed in the last 24h
  const [firstSeenMap, setFirstSeenMap] = useState(() => {
    try {
      const raw = localStorage.getItem('onestop_comp_first_seen');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!Array.isArray(competitions) || competitions.length === 0) return;
    const now = Date.now();
    let updated = false;
    let nextMap = { ...(firstSeenMap || {}) };

    if (!firstSeenMap) {
      // First visit: seed silently with past timestamps so existing competitions don't all show as "new today"
      const seededPast = now - 25 * 60 * 60 * 1000;
      competitions.forEach(c => {
        nextMap[String(c.id)] = seededPast;
      });
      updated = true;
    } else {
      competitions.forEach(c => {
        const sId = String(c.id);
        if (!nextMap[sId]) {
          nextMap[sId] = now;
          updated = true;
        }
      });
    }

    if (updated) {
      setFirstSeenMap(nextMap);
      try {
        localStorage.setItem('onestop_comp_first_seen', JSON.stringify(nextMap));
      } catch {}
    }
  }, [competitions, firstSeenMap]);

  // Last chosen Browse filter preferences (from props or localStorage fallback)
  const effectiveFilter = savedFilter || (() => {
    try {
      const userKey = user?.email ? `onestop_user_filter_prefs_${user.email.toLowerCase()}` : null;
      const raw = (userKey && localStorage.getItem(userKey)) || localStorage.getItem('onestop_user_filter_prefs');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  })();

  const newForYouCount = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return competitions.filter(c => {
      if (!matchCompetition(c, effectiveFilter || {})) return false;
      const startTimestamp = c.startDate ? new Date(c.startDate).getTime() : 0;
      const isNewByStartDate = startTimestamp > 0 && (now - startTimestamp <= oneDayMs);
      const seenAt = firstSeenMap ? firstSeenMap[String(c.id)] : null;
      const isNewByFirstSeen = seenAt && (now - seenAt <= oneDayMs);
      return isNewByStartDate || isNewByFirstSeen;
    }).length;
  }, [competitions, firstSeenMap, effectiveFilter]);

  // KPI 2: Open squads looking for skills on user profile
  const userSkills = useMemo(() => {
    const raw = Array.isArray(profile?.skills) ? profile.skills : [];
    return raw.map(s => String(s).toLowerCase().trim()).filter(Boolean);
  }, [profile?.skills]);

  const kpi2Tooltip = userSkills.length === 0
    ? 'Add skills to your profile to see matches'
    : 'Open squads looking for skills on your profile';

  const squadsNeedSkillsCount = useMemo(() => {
    if (userSkills.length === 0) return 0;
    return posts.filter(post => {
      const spotsLeft = post.spots_left !== undefined
        ? Number(post.spots_left)
        : (post.spots !== undefined ? Number(post.spots) : 1);
      const isOpen = post.is_open !== false && post.status !== 'closed' && spotsLeft > 0;
      if (!isOpen) return false;

      // Do not count user's own squads
      const isMine = (user?.id && post.user_id === user.id) || (user?.email && post.created_by_email === user.email);
      if (isMine) return false;

      const lookingFor = [
        ...(Array.isArray(post.skills_looking_for) ? post.skills_looking_for : []),
        ...(Array.isArray(post.skills) ? post.skills : [])
      ].map(s => String(s).toLowerCase().trim()).filter(Boolean);

      return lookingFor.some(sk => 
        userSkills.some(userSk => sk.includes(userSk) || userSk.includes(sk))
      );
    }).length;
  }, [posts, userSkills, user?.id, user?.email]);

  // KPI 3: Incoming join requests on user's squads
  const requestsToReviewCount = useMemo(() => {
    return applications.filter(a => a.dir === 'in' && a.status === 'pending').length;
  }, [applications]);

  // Active sort order (defaults to last chosen sort filter in Browse tab)
  const effectiveSort = browseSort || effectiveFilter?.sortBy || (() => {
    try {
      const userKey = user?.email ? `onestop_user_filter_prefs_${user.email.toLowerCase()}` : null;
      const raw = (userKey && localStorage.getItem(userKey)) || localStorage.getItem('onestop_user_filter_prefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.sortBy === 'string') return parsed.sortBy;
      }
    } catch (e) {}
    return 'closing-soonest';
  })();

  const containerRef = useRef(null);

  // Ensure carousel rails always start at the beginning (scrollLeft = 0) upon opening and loading
  useEffect(() => {
    const resetScroll = () => {
      if (containerRef.current) {
        const rails = containerRef.current.querySelectorAll('.rail');
        rails.forEach((rail) => {
          rail.scrollLeft = 0;
        });
      }
    };
    resetScroll();
    const t1 = setTimeout(resetScroll, 50);
    const t2 = setTimeout(resetScroll, 250);
    const rafId = requestAnimationFrame(resetScroll);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      cancelAnimationFrame(rafId);
    };
  }, [showRailLoading, effectiveSort, effectiveFilter, bookmarkTotal]);

  // Navigation helpers
  const handleNavigate = (targetScreen) => {
    if (onNavigate) {
      onNavigate(targetScreen);
    } else if (targetScreen === 'browse' && onGoBrowse) {
      onGoBrowse();
    }
  };

  // Derive active filter chips for filter strip, header, and subline
  const filterChips = useMemo(() => {
    if (!effectiveFilter) return [];
    const chips = [];

    // Tracks / Disciplines
    const tracks = Array.isArray(effectiveFilter.selectedTracks)
      ? effectiveFilter.selectedTracks
      : (Array.isArray(effectiveFilter.disc) ? effectiveFilter.disc : []);
    if (tracks.length > 0 && tracks.length < 6) {
      const trackLabels = {
        case: 'Case Comps',
        hackathon: 'Hackathons',
        writing: 'Writing & Research',
        quiz: 'Quizzes',
        simulation: 'Simulations',
        debate: 'Debates'
      };
      tracks.forEach(t => {
        const lower = String(t).toLowerCase();
        chips.push(trackLabels[lower] || t);
      });
    }

    // Circuits
    const circuits = Array.isArray(effectiveFilter.selectedCircuits)
      ? effectiveFilter.selectedCircuits
      : (Array.isArray(effectiveFilter.circ) ? effectiveFilter.circ : []);
    if (circuits.length > 0 && circuits.length < 4) {
      const circuitLabels = {
        'du': 'DU Circuit',
        'iim-iit-premier': 'IIMs, IITs & Premier',
        'corporate-global': 'Corporate & Global',
        'others': 'Others'
      };
      circuits.forEach(c => {
        chips.push(circuitLabels[c] || c);
      });
    }

    // Team Format
    const team = effectiveFilter.teamFilter || effectiveFilter.team;
    if (team === 'solo') {
      chips.push('Solo');
    } else if (team === 'team') {
      chips.push('Teams (2+)');
    }

    // Fee
    const fee = effectiveFilter.feeFilter || effectiveFilter.fee;
    if (fee === 'free') {
      chips.push('Free entry');
    } else if (fee === 'paid') {
      chips.push('Paid entry');
    }

    // Search query
    const q = effectiveFilter.searchQuery || effectiveFilter.q;
    if (typeof q === 'string' && q.trim()) {
      chips.push(`"${q.trim()}"`);
    }

    return chips;
  }, [effectiveFilter]);

  const hasFilter = filterChips.length > 0;

  // 1. Bookmarks Rail: Unified single line, multi-round deadline tracker
  const bookmarkIds = useMemo(() => (Array.isArray(bookmarks) ? bookmarks.map(String) : []), [bookmarks]);
  const { roundsMap, getRoundsForComp } = useCompetitionRounds(bookmarkIds);

  const allBookmarkComps = useMemo(() => {
    const now = Date.now();
    const map = new Map();

    // 1. Add from active competitions list
    competitions.forEach(c => {
      if (bookmarkIds.includes(String(c.id))) {
        map.set(String(c.id), { ...c });
      }
    });

    // 2. For any bookmark ID not in competitions list (e.g. registration closed and dropped from search), reconstruct from roundsMap
    bookmarkIds.forEach(id => {
      const sId = String(id);
      if (!map.has(sId) && roundsMap && roundsMap[sId]) {
        const r = roundsMap[sId];
        map.set(sId, {
          id: r.id,
          title: r.title,
          host: r.host || 'Host Institution',
          orgName: r.orgName || r.host || 'Host Institution',
          logo: r.logo,
          orgLogo: r.orgLogo,
          unstopUrl: r.unstopUrl || 'https://unstop.com',
          deadline: r.deadline,
          fee: r.fee || 'Free',
          isFree: r.isFree ?? true,
          days: r.daysRemaining ?? 0,
          remainDaysText: r.daysRemaining !== null ? `${r.daysRemaining} days left` : 'Registration closed',
          team: r.teamSizeDisplay || 'Solo / Team',
          minTeam: r.minTeam || 1,
          maxTeam: r.maxTeam || 4,
          teamSizeDisplay: r.teamSizeDisplay || 'Solo / Team',
          prizes: 'Certificates & Recognition',
          regs: 0
        });
      }
    });

    // 3. Filter out concluded competitions (State 3: Auto-removal when all rounds have completed)
    const activeList = Array.from(map.values()).filter(c => {
      const rData = roundsMap ? roundsMap[String(c.id)] : null;
      if (rData?.isConcluded) return false;
      if (rData?.rounds && rData.rounds.length > 0) {
        const allEnded = rData.rounds.every(rnd => rnd.endDate && new Date(rnd.endDate).getTime() < now);
        if (allEnded) return false;
      }
      return true;
    });

    return activeList.sort((a, b) => {
      const timeA = a.deadline ? new Date(a.deadline).getTime() : 9999999999999;
      const timeB = b.deadline ? new Date(b.deadline).getTime() : 9999999999999;
      return timeA - timeB;
    });
  }, [competitions, bookmarkIds, roundsMap]);

  const bookmarkTotal = allBookmarkComps.length;
  const displayedBookmarks = allBookmarkComps.slice(0, CARDS_PER_RAIL);

  // 2. Top Competitions Rail (Matches saved Browse filter, sorted according to last chosen Browse sort)
  const allFilteredComps = useMemo(() => {
    const filtered = competitions.filter(c => matchCompetition(c, effectiveFilter || {}));
    return sortCompetitions(filtered, effectiveSort);
  }, [competitions, effectiveFilter, effectiveSort]);

  const compTotal = allFilteredComps.length;
  const displayedComps = allFilteredComps.slice(0, CARDS_PER_RAIL);

  // 3. Top Squads Rail (Open teams recruiting for filtered competitions)
  const allFilteredSquads = useMemo(() => {
    return posts.filter(post => {
      const spotsLeft = post.spots_left !== undefined
        ? Number(post.spots_left)
        : (post.spots !== undefined ? Number(post.spots) : 1);
      const isOpen = post.is_open !== false && post.status !== 'closed' && spotsLeft > 0;
      if (!isOpen) return false;

      if (!hasFilter) return true;

      // Find linked competition to evaluate filter
      const comp = competitions.find(c =>
        String(c.id) === String(post.compId) ||
        (post.competition_name && c.title && c.title.toLowerCase() === post.competition_name.toLowerCase())
      );

      if (comp) {
        return matchCompetition(comp, effectiveFilter);
      }

      // Fallback evaluation if competition isn't in current list
      const fallbackComp = {
        title: post.competition_name || post.title || '',
        host: post.organizer || '',
        discipline: post.category || 'Case',
        category: post.category ? String(post.category).toLowerCase() : 'case',
        circuit: 'DU Circuit',
        days: 7,
        fee: 'Free',
        isFree: true
      };
      return matchCompetition(fallbackComp, effectiveFilter);
    });
  }, [posts, competitions, effectiveFilter, hasFilter]);

  const squadTotal = allFilteredSquads.length;
  const displayedSquads = allFilteredSquads.slice(0, CARDS_PER_RAIL);

  // Subline calculation
  const subline = showRailLoading
    ? 'Syncing live competitions from premier campuses…'
    : hasFilter
    ? `${compTotal} competitions and ${squadTotal} squads match your Browse filter  -  ${filterChips.map(c => c.toLowerCase()).join(' · ')}.`
    : `${compTotal} competitions and ${squadTotal} squads open right now.`;

  return (
    <div className="home-container" ref={containerRef}>
      {/* ── 1. Home v2 Header: Single Row Identity + 3 KPIs + Actions ── */}
      <div className="home-header">
        <div className="home-header-identity">
          <h1 className="home-header-greeting">
            {greeting}, {firstName}
          </h1>
          <div
            className="home-header-meta"
            onClick={() => handleNavigate('profile')}
            title="Click to view or edit profile details"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0F3FFE"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="home-header-meta-icon"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <span className="home-header-college">
              {hasUserCollege ? collegeName : (user ? 'Choose your college' : 'Sign up to choose your college')}
            </span>
            <span className="home-header-dot">·</span>
            <span className="home-header-batch">
              {hasUserCollege ? batchStatus : ''}
            </span>
          </div>
        </div>

        {/* 3 KPI Buttons */}
        <div className="home-header-kpis">
          {/* KPI 1: New for you today */}
          <button
            type="button"
            className="home-kpi-item"
            title="Competitions matching your Browse filter, listed in the last 24 hours"
            onClick={() => handleNavigate('browse')}
          >
            <span
              className="home-kpi-number"
              style={{ color: showRailLoading || newForYouCount === 0 ? 'var(--ink-muted)' : 'var(--ink)' }}
            >
              {showRailLoading ? '–' : newForYouCount}
            </span>
            <span className="home-kpi-label">
              <span className="home-kpi-label-mobile">new today</span>
              <span className="home-kpi-label-desktop">New for you today</span>
            </span>
          </button>

          <span className="home-kpi-dot">·</span>

          {/* KPI 2: Squads need your skills */}
          <button
            type="button"
            className="home-kpi-item"
            title={kpi2Tooltip}
            onClick={() => handleNavigate('teams')}
          >
            <span
              className="home-kpi-number"
              style={{ color: showRailLoading || squadsNeedSkillsCount === 0 ? 'var(--ink-muted)' : 'var(--ink)' }}
            >
              {showRailLoading ? '–' : squadsNeedSkillsCount}
            </span>
            <span className="home-kpi-label">
              <span className="home-kpi-label-mobile">squads for you</span>
              <span className="home-kpi-label-desktop">Squads need your skills</span>
            </span>
          </button>

          <span className="home-kpi-dot">·</span>

          {/* KPI 3: Requests to review */}
          <button
            type="button"
            className="home-kpi-item"
            title="Incoming join requests on your squads"
            onClick={() => handleNavigate('requests')}
          >
            <span
              className="home-kpi-number"
              style={{
                color: showRailLoading
                  ? 'var(--ink-muted)'
                  : (requestsToReviewCount > 0 ? '#0F3FFE' : 'var(--ink)')
              }}
            >
              {showRailLoading ? '–' : requestsToReviewCount}
            </span>
            <span className="home-kpi-label">
              <span className="home-kpi-label-mobile">requests</span>
              <span className="home-kpi-label-desktop">Requests to review</span>
            </span>
          </button>
        </div>

        {/* Action Cluster (Theme Toggle + Bell) */}
        {headerAction && (
          <div className="home-header-actions-wrap">
            {headerAction}
          </div>
        )}
      </div>

      {/* ── 2. Bookmarks Rail: Compact Carousel of ALL Bookmarks ── */}
      <section className="home-section">
        <div className="home-section-header">
          <div className="home-section-title-row">
            <h2 className="home-section-title">Bookmarks</h2>
            <span className="home-section-count-pill home-section-count-pill--muted">
              {showRailLoading ? '...' : bookmarkTotal}
            </span>
          </div>
          <div className="home-section-subline">
            soonest deadlines first
          </div>
        </div>

        <div className="rail">
          {showRailLoading ? (
            <>
              <RailPunLoadingCard category="bookmarks" headline="Syncing saved competitions..." />
              <CompactBookmarkSkeleton />
              <CompactBookmarkSkeleton />
            </>
          ) : allBookmarkComps.length === 0 ? (
            <div
              className="home-rail-empty"
              style={{
                flex: '1 1 100%',
                background: 'var(--surface)',
                border: '1px dashed var(--line)',
                borderRadius: '12px',
                padding: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
                Nothing saved yet. Bookmark a competition and it shows up here.
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('browse')}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: 'var(--primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Browse competitions →
              </button>
            </div>
          ) : (
            allBookmarkComps.map((b) => {
              const rData = getRoundsForComp(b.id);
              const regDeadlineTime = b.deadline ? new Date(b.deadline).getTime() : 0;
              const isRegClosed = rData?.isRegistrationClosed !== undefined
                ? rData.isRegistrationClosed
                : (regDeadlineTime > 0 && regDeadlineTime <= Date.now());

              const isSolo = b.isSolo || b.maxTeam === 1 ||
                (b.teamSizeDisplay && b.teamSizeDisplay.toLowerCase().startsWith('solo')) ||
                (b.team && (String(b.team).trim() === '1' || String(b.team).toLowerCase().startsWith('solo') || String(b.team).toLowerCase().includes('individual')));

              const countdownText = formatDeadlineCountdown(b.deadline, b.remainDaysText, b.days);
              const urgencyLevel = getUrgencyLevel(b.deadline, b.remainDaysText, b.days);
              const deadlineFormatted = formatDeadlineDateTime(b.deadline);
              const isFree = b.isFree ?? (typeof b.fee === 'string' ? b.fee.toLowerCase().includes('free') : true);
              const registeredCount = Number(b.regs || b.registeredCount || 0);
              const feeText = isFree ? 'Free Entry' : (b.fee ? (b.fee.toLowerCase().includes('entry') ? b.fee : `${b.fee} Entry`) : 'Paid Entry');
              const teamText = b.team || b.teamSizeDisplay || 'Solo / Team';
              const prizeText = (b.prize || b.prizes || 'Certificates & Recognition').replace(/Cash Pool/gi, 'Prize Pool');

              // ── State 2: Post-Registration Deadline Rounds Tracker Mode ──
              if (isRegClosed) {
                return (
                  <BookmarkRoundTrackerCard
                    key={b.id}
                    competition={b}
                    roundsData={rData}
                    onOpenDetail={onOpenDetail}
                    onToggleBookmark={onToggleBookmark}
                  />
                );
              }

              // ── State 1: Pre-Registration Deadline Formation & Apply Mode ──
              return (
                <div
                  key={b.id}
                  className={`home-rail-card home-rail-card--compact card-urgency-${urgencyLevel}`}
                  onClick={() => onOpenDetail && onOpenDetail(b.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Top row: Logo, Host, Remove button */}
                  <div className="home-compact-top-row">
                    <InstitutionLogo
                      logo={b.logo || b.orgLogo}
                      name={b.host || b.orgName}
                      size={30}
                      borderRadius={7}
                      fontSize={10.5}
                    />
                    <span className="home-compact-host" title={b.host || b.orgName}>
                      {b.host || b.orgName}
                    </span>
                    <button
                      type="button"
                      className="home-compact-remove-btn"
                      title="Remove bookmark"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleBookmark) onToggleBookmark(b.id);
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="home-compact-title" title={b.title}>
                    {b.title}
                  </h3>

                  {/* Prize Strip */}
                  <div className="home-compact-prize-strip">
                    <div className="home-compact-prize-left">
                      <TrophyIcon size={12} color="#059669" />
                      <span className="home-compact-prize-text" title={prizeText}>
                        {prizeText}
                      </span>
                    </div>
                    <span className={`home-compact-fee-badge ${isFree ? 'free' : 'paid'}`}>
                      {feeText}
                    </span>
                  </div>

                  {/* Specs Row */}
                  <div className="home-compact-specs-row">
                    <span className="home-compact-specs-item" title={teamText}>
                      <UsersIcon size={12} />
                      <span>{teamText}</span>
                    </span>
                    <span className="home-compact-dot" />
                    <span className="home-compact-specs-item" title={deadlineFormatted ? `Exact Deadline: ${deadlineFormatted}` : undefined}>
                      <CalendarIcon size={12} />
                      <span>Ends {deadlineFormatted || (b.mode || 'Online')}</span>
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="home-compact-metrics-row">
                    <span className="home-compact-metrics-regs">
                      <FlameIcon size={12} />
                      {registeredCount > 0 ? (
                        <span><strong>{registeredCount.toLocaleString()}</strong> registrations</span>
                      ) : (
                        <span>Recently Listed</span>
                      )}
                    </span>
                    <span className={`home-compact-pill pill-${urgencyLevel}`}>
                      <ClockIcon size={10} />
                      <span>{countdownText}</span>
                    </span>
                  </div>

                  {/* Actions Grid */}
                  <div className={`home-compact-actions ${isSolo ? 'home-compact-actions--solo' : ''}`}>
                    <a
                      href={b.unstopUrl || 'https://unstop.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="home-compact-btn-apply"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Apply</span>
                      <ExternalLinkIcon size={11} color="#FFFFFF" />
                    </a>
                    {!isSolo && (
                      <button
                        type="button"
                        className="home-compact-btn-squad"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSquadUp) onSquadUp(b);
                          else if (onFindTeammates) onFindTeammates(b);
                        }}
                      >
                        <UsersIcon size={12} />
                        <span>Squad up</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── 3. Top Competitions Rail ── */}
      <section className="home-section">
        <div className="home-section-header">
          <div className="home-section-title-row">
            <h2 className="home-section-title">
              Top competitions
            </h2>
            <span className="home-section-count-pill home-section-count-pill--primary">
              {showRailLoading ? '...' : compTotal}
            </span>
            <button
              type="button"
              onClick={() => handleNavigate('browse')}
              className="home-see-all-btn"
            >
              <span>See all</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </div>

          <div className="home-section-subline home-comps-subline-scroll">
            <span style={{ flex: 'none' }}>closing soonest</span>
            {filterChips.length > 0 && (
              <>
                <span style={{ flex: 'none', color: '#C9C7C1' }}>·</span>
                {filterChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="home-subline-chip"
                  >
                    {chip}
                  </span>
                ))}
                <button
                  type="button"
                  title="Edit filters in Browse"
                  onClick={() => handleNavigate('browse')}
                  className="home-subline-edit-btn"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        <div className="rail">
          {showRailLoading ? (
            <>
              <RailPunLoadingCard badge="FETCHING COMPS" category="comps" />
              <RailCardSkeleton />
              <RailCardSkeleton />
            </>
          ) : displayedComps.length === 0 ? (
            <div
              style={{
                flex: '1 1 100%',
                background: 'var(--surface)',
                border: '1px dashed var(--line)',
                borderRadius: '12px',
                padding: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
                No competitions match your filter.
              </span>
              <button
                onClick={() => handleNavigate('browse')}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: 'var(--primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Edit in Browse →
              </button>
            </div>
          ) : (
            <>
              {displayedComps.map(c => {
              const isFree = c.fee === 'Free' || c.isFree;
              const deadlineFormatted = formatDeadlineDateTime(c.deadline);
              const countdownText = formatDeadlineCountdown(c.deadline, c.remainDaysText, c.days);
              const urgencyLevel = getUrgencyLevel(c.deadline, c.remainDaysText, c.days);
              const urgencyConfig = getUrgencyConfig(urgencyLevel);
              const registeredCount = Number(c.regs || c.registeredCount || 0);
              const feeText = isFree ? 'Free Entry' : (c.fee ? (c.fee.toLowerCase().includes('entry') ? c.fee : `${c.fee} Entry`) : 'Paid');
              const teamText = c.team || c.teamSizeDisplay || 'Solo / Team';
              const prizeText = (c.prize || c.prizes || 'Certificates & Recognition').replace(/Cash Pool/gi, 'Prize Pool');

              return (
                <div
                  key={c.id}
                  className={`home-rail-card card-urgency-${urgencyLevel}`}
                  onClick={() => onOpenDetail && onOpenDetail(c.id)}
                  style={{
                    flex: '0 0 302px',
                    width: '302px',
                    padding: '16px 17px 17px',
                    gap: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {/* Top Bar: Host Profile */}
                  <div style={{ display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr)', alignItems: 'start', gap: '11px' }}>
                    <InstitutionLogo
                      logo={c.logo || c.orgLogo}
                      name={c.host}
                      size={40}
                      borderRadius={9}
                      fontSize={12}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-secondary)', lineHeight: 1.35, paddingTop: '2px', textWrap: 'pretty' }}>
                      {c.host}
                    </span>
                  </div>

                  {/* Competition Title */}
                  <h3
                    title={c.title}
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 700,
                      lineHeight: 1.35,
                      letterSpacing: '-0.01em',
                      color: 'var(--ink)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '42px',
                      textWrap: 'pretty'
                    }}
                  >
                    {c.title}
                  </h3>

                  {/* Featured Prize & Entry Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.22)',
                      borderRadius: '10px',
                      padding: '8px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
                      <TrophyIcon size={14} color="#059669" />
                      <span
                        title={prizeText}
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#047857',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {prizeText}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '5px',
                        letterSpacing: '0.2px',
                        flexShrink: 0,
                        background: isFree ? 'var(--surface)' : 'var(--surface-muted)',
                        color: isFree ? '#10B981' : 'var(--ink-secondary)',
                        border: isFree ? '1px solid rgba(16, 185, 129, 0.32)' : '1px solid var(--line)'
                      }}
                    >
                      {feeText}
                    </span>
                  </div>

                  {/* Metadata: Format & Exact Deadline (Specs Row) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: 'var(--ink-secondary)',
                      fontWeight: 600,
                      minHeight: '20px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }} title={teamText}>
                      <UsersIcon size={13} color="var(--ink-secondary)" />
                      <span>{teamText}</span>
                    </div>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--line)', flexShrink: 0 }} />
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={deadlineFormatted ? `Exact Deadline: ${deadlineFormatted}` : undefined}
                    >
                      <CalendarIcon size={13} color="var(--ink-secondary)" />
                      <span>{deadlineFormatted ? `Ends ${deadlineFormatted}` : (c.mode || 'Online')}</span>
                    </div>
                  </div>

                  {/* Social Proof & Deadline Status (Metrics Row) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minHeight: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--ink-muted)' }}>
                      {registeredCount > 0 ? (
                        <>
                          <FlameIcon size={13} color="#f97316" />
                          <span>
                            <strong style={{ color: 'var(--ink)' }}>{registeredCount.toLocaleString()}</strong> registrations
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '11px' }}>Recently Listed</span>
                      )}
                    </div>

                    <span
                      title={deadlineFormatted ? `Exact Deadline: ${deadlineFormatted}` : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: urgencyConfig.border,
                        borderRadius: '20px',
                        background: urgencyConfig.background,
                        color: urgencyConfig.color,
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: urgencyConfig.dotColor,
                          display: 'inline-block'
                        }}
                      />
                      <ClockIcon size={11} color={urgencyConfig.color} />
                      <span>{countdownText}</span>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                    <a
                      href={c.unstopUrl || 'https://unstop.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="home-btn-primary-hover"
                      style={{
                        border: '1px solid #0F3FFE',
                        borderRadius: '9px',
                        background: '#0F3FFE',
                        color: '#FFFFFF',
                        padding: '9px 10px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        textDecoration: 'none'
                      }}
                    >
                      <span>Apply</span>
                      <ExternalLinkIcon size={12} color="#FFFFFF" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSquadUp) onSquadUp(c);
                        else if (onFindTeammates) onFindTeammates(c);
                      }}
                      className="home-btn-hover"
                      style={{
                        border: '1px solid var(--line)',
                        borderRadius: '9px',
                        background: 'var(--surface)',
                        color: 'var(--ink)',
                        padding: '9px 10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <UsersIcon size={13} color="var(--ink)" />
                      <span>Squad up</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 4th Card: More Competitions */}
            {(compTotal > displayedComps.length || compTotal >= 3) && (
              <div
                className="home-rail-card home-more-card"
                onClick={() => handleNavigate('browse')}
                style={{
                  flex: '0 0 302px',
                  width: '302px',
                  padding: '16px 17px 17px',
                  gap: '12px',
                  cursor: 'pointer',
                  background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-sunken) 100%)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9px',
                      background: 'rgba(15, 63, 254, 0.08)',
                      border: '1px solid rgba(15, 63, 254, 0.20)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none'
                    }}
                  >
                    <TrophyIcon size={18} color="var(--primary)" />
                  </div>
                  <span
                    style={{
                      background: 'rgba(15, 63, 254, 0.08)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(15, 63, 254, 0.25)',
                      borderRadius: '20px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {compTotal > displayedComps.length
                      ? `+${compTotal - displayedComps.length} more`
                      : `${compTotal} competitions`}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', margin: 'auto 0' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary)' }}>
                    {hasFilter ? 'Filtered Directory' : 'All Competitions'}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35, letterSpacing: '-0.01em' }}>
                    More Competitions
                  </h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-muted)', lineHeight: 1.45 }}>
                    {hasFilter
                      ? `Explore all ${compTotal} competitions matching your filters, check eligibility, and submit your entries.`
                      : `Explore all ${compTotal} live campus competitions, filter by track, and find your next challenge.`}
                  </p>
                </div>

                <div
                  className="home-more-btn"
                  style={{
                    marginTop: 'auto',
                    border: '1px solid var(--primary)',
                    borderRadius: '9px',
                    background: 'rgba(15, 63, 254, 0.06)',
                    color: 'var(--primary)',
                    padding: '9px 12px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Explore all ({compTotal})</span>
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>→</span>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </section>

      {/* 5. Top Squads Rail */}
      <section className="home-section">
        <div className="home-section-header">
          <div className="home-section-title-row">
            <h2 className="home-section-title">
              Top squads
            </h2>
            <span className="home-section-count-pill home-section-count-pill--primary">
              {showRailLoading ? '...' : squadTotal}
            </span>
            <button
              type="button"
              onClick={() => handleNavigate('teams')}
              className="home-see-all-btn"
            >
              <span>See all</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </div>
          <div className="home-section-subline">
            recruiting for competitions you follow
          </div>
        </div>

        <div className="rail">
          {showRailLoading ? (
            <>
              <RailPunLoadingCard badge="SCOUTING SQUADS" category="squads" />
              <RailSquadCardSkeleton />
              <RailSquadCardSkeleton />
            </>
          ) : displayedSquads.length === 0 ? (
            <div
              style={{
                flex: '1 1 100%',
                background: 'var(--surface)',
                border: '1px dashed var(--line)',
                borderRadius: '12px',
                padding: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
                No squads recruiting for these competitions yet.
              </span>
              <button
                onClick={() => handleNavigate('teams')}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: 'var(--primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Post a squad →
              </button>
            </div>
          ) : (
            displayedSquads.map(s => {
              const spots = s.spots_left !== undefined
                ? Number(s.spots_left)
                : (s.spots !== undefined ? Number(s.spots) : 1);
              const isUrgent = spots <= 1;
              const spotsText = spots === 1 ? '1 spot left' : `${spots} spots left`;
              const postedText = s.posted || formatRelativeTime(s.created_at);
              const leadName = s.created_by_name || s.lead || 'Student Lead';
              const leadInitial = leadName ? leadName.charAt(0).toUpperCase() : 'S';
              const leadCollege = (s.college || profile?.college || 'University').trim();
              const leadYear = s.year || profile?.batch || 'Undergrad';
              const compTitle = s.competition_name || s.comp || s.title || 'Competition Challenge';
              const compHost = s.organizer || s.compHost || 'Host Institution';
              const linkedComp = competitions.find(c =>
                String(c.id) === String(s.compId || s.comp_id) ||
                (s.competition_name && c.title && c.title.toLowerCase() === s.competition_name.toLowerCase())
              );
              const compLogo = s.compLogo || s.logo || (linkedComp ? (linkedComp.logo || linkedComp.orgLogo) : null);
              const skills = Array.isArray(s.skills_looking_for)
                ? s.skills_looking_for
                : (Array.isArray(s.want) ? s.want : (Array.isArray(s.skills) ? s.skills : []));

              // User's relationship to post
              const isMine = Boolean(
                s.mine ||
                (user && s.user_id && s.user_id === user.id) ||
                (user && s.created_by_email && s.created_by_email.toLowerCase() === (user.email || '').toLowerCase()) ||
                (profile?.name && leadName.toLowerCase() === profile.name.toLowerCase())
              );

              const userApp = applications.find(a =>
                String(a.postId || a.post_id) === String(s.id) &&
                (a.dir === 'out' || (user && a.applicant_id === user.id) || (user && a.applicant_email === user.email))
              );

              const isAccepted = userApp && userApp.status === 'accepted';
              const isRequested = userApp && (userApp.status === 'pending' || s.state === 'requested');

              return (
                <div
                  key={s.id}
                  className="home-rail-card"
                  style={{
                    flex: '0 0 302px',
                    width: '302px',
                    padding: '16px 17px 17px',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span
                      style={
                        isUrgent
                          ? {
                              background: 'rgba(15,63,254,0.08)',
                              color: '#0F3FFE',
                              border: '1px solid rgba(15,63,254,0.35)',
                              borderRadius: '20px',
                              padding: '2px 9px',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap'
                            }
                          : {
                              background: 'rgba(15,63,254,0.07)',
                              color: '#0F3FFE',
                              border: '1px solid rgba(15,63,254,0.20)',
                              borderRadius: '20px',
                              padding: '2px 9px',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap'
                            }
                      }
                    >
                      {spotsText}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                      {postedText}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        flex: 'none'
                      }}
                    >
                      {leadInitial}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                          {leadName}
                        </span>
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#16A34A',
                            display: 'inline-block'
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {leadCollege} · {leadYear}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                      Competing in
                    </span>
                    <h3 style={{ margin: '3px 0 0', fontSize: '15px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35, textWrap: 'pretty' }}>
                      {compTitle}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <InstitutionLogo
                        logo={compLogo}
                        name={compHost}
                        size={20}
                        borderRadius={5}
                        fontSize={9}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {compHost}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-muted)' }}>
                      Teammates needed with:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                      {skills.length > 0 ? (
                        skills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              background: 'rgba(15,63,254,0.08)',
                              color: 'var(--primary)',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>All roles welcome</span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                    {isMine ? (
                      <button
                        onClick={() => handleNavigate('requests')}
                        className="home-btn-hover"
                        style={{
                          width: '100%',
                          border: '1px solid var(--line)',
                          borderRadius: '9px',
                          background: 'var(--surface)',
                          color: 'var(--ink)',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Manage squad
                      </button>
                    ) : isAccepted ? (
                      <button
                        onClick={() => onOpenWhatsApp && onOpenWhatsApp(s)}
                        className="home-btn-primary-hover"
                        style={{
                          width: '100%',
                          border: '1px solid #16A34A',
                          borderRadius: '9px',
                          background: '#16A34A',
                          color: '#FFFFFF',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Open WhatsApp
                      </button>
                    ) : isRequested ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          border: '1px solid var(--line)',
                          borderRadius: '9px',
                          background: 'var(--surface-muted)',
                          color: 'var(--ink-muted)',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'default'
                        }}
                      >
                        Requested  -  pending
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (onRequestJoin) onRequestJoin(s);
                          else handleNavigate('teams');
                        }}
                        className="home-btn-primary-hover"
                        style={{
                          width: '100%',
                          border: '1px solid #0F3FFE',
                          borderRadius: '9px',
                          background: '#0F3FFE',
                          color: '#FFFFFF',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Request to join
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
