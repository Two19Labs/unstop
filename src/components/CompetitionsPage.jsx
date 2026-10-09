import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import InstitutionLogo from './InstitutionLogo';
import SectionLoadingWidget from './SectionLoadingWidget';
import { BROWSE_PUNS } from './FunLoadingScreen';
import Footer from './Footer';
import { safeExternalUrl } from '../lib/safeUrl';
import { trackEvent } from '../lib/posthog';
import {
  CIRCUIT_OPTIONS, TRACK_OPTIONS, PLATFORM_OPTIONS, SUBTRACK_MAP, SORT_OPTIONS, DEFAULT_PREFS,
  sanitizePrefs, loadPrefs, savePrefs, filterCompetitions, facetCounts, sortCompetitions,
  getCircuitKey, getPlatformKey, isFreeComp, isTeamOk,
} from '../utils/competitionFilters';
import './CompetitionsPage.css';

// Self-contained SVG Icons to guarantee zero bundler chunking collisions or export mismatches
const BackIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const BookmarkIcon = ({ size = 16, filled = false, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const SearchIcon = ({ size = 18, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
  </svg>
);

const ExternalLinkIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const TrophyIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const UsersIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const FlameIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
  </svg>
);

const ClockIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ArrowUpDownIcon = ({ size = 14, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 16-4 4-4-4" />
    <path d="M17 20V4" />
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
  </svg>
);

const ChevronDownIcon = ({ size = 12, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const RotateCcwIcon = ({ size = 12, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const CheckIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CopyIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const FilterIcon = ({ size = 15, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const XCloseIcon = ({ size = 13, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PAGE_SIZE = 24;
const MIN_LOADING_MS = 1500;
const SORT_LABEL = Object.fromEntries(SORT_OPTIONS.map(o => [o.id, o.label]));
const SOURCE_BADGE = { inside_campus: 'InsideKampus', devpost: 'Devpost', corporate: 'Corporate' };
const CARD_CIRCUIT_CLASS = { du: 'du', 'iim-iit-premier': 'iim-iit', 'corporate-global': 'corporate-global', others: 'others' };

// One shared formatter: creating Intl formatters per card is slow on big lists
const DEADLINE_FORMAT = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function getCountdownDetails(deadlineStr, fallbackRemainText, nowMs) {
  const deadlineMs = deadlineStr ? new Date(deadlineStr).getTime() : NaN;
  if (Number.isNaN(deadlineMs)) {
    return { text: fallbackRemainText || 'Deadline TBA', exactDateStr: 'TBA', urgencyClass: 'green' };
  }
  const exactDateStr = DEADLINE_FORMAT.format(deadlineMs);
  const diffMs = deadlineMs - nowMs;
  if (diffMs <= 0) return { text: 'Closed', exactDateStr, urgencyClass: 'red' };

  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  let text;
  if (days > 6) text = `${days}d left`;
  else if (days >= 1) text = `${days}d ${totalHours % 24}h left`;
  else if (totalHours >= 1) text = `${totalHours}h ${totalMinutes % 60}m left`;
  else text = `${totalMinutes}m left`;

  // Red: within 48h. Yellow: within 6 days. Green: a week or more.
  const urgencyClass = totalHours <= 48 ? 'red' : totalHours <= 144 ? 'yellow' : 'green';
  return { text, exactDateStr, urgencyClass };
}

const CompCard = memo(function CompCard({ comp, isBookmarked, isCopied, nowMs, onOpenDetail, onToggleBookmark, onFindTeammates, onShare, onApply }) {
  const circuitClass = CARD_CIRCUIT_CLASS[getCircuitKey(comp)] || 'others';
  const countdown = getCountdownDetails(comp.deadline, comp.remainDaysText, nowMs);
  const canTeamUp = isTeamOk(comp);
  const prizeText = (comp.prizes || comp.prize || 'Certificates & Recognition').replace(/Cash Pool/gi, 'Prize Pool');
  const free = isFreeComp(comp);
  const badge = SOURCE_BADGE[comp.sourcePlatform];
  const open = () => onOpenDetail && onOpenDetail(comp.id);

  return (
    <article
      className={`cc-card cc-card-${circuitClass} ${isBookmarked ? 'is-bookmarked' : ''}`}
      onClick={open}
      style={{ cursor: onOpenDetail ? 'pointer' : 'default' }}
    >
      <div className="cc-card-inner">
        <div className="cc-card-top-bar">
          <div className="cc-host-identity">
            <InstitutionLogo
              logo={comp.orgLogo || comp.logo || comp.bannerUrl}
              name={comp.orgName || comp.host}
              size={36}
              borderRadius={8}
              fontSize={12}
            />
            <div className="cc-host-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span className="cc-host-name" title={comp.orgName || 'Academic Host'}>
                  {comp.orgName || 'Academic Host'}
                </span>
                {badge && <span className="cc-source-badge">{badge}</span>}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`cc-card-bookmark-btn ${isBookmarked ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(comp.id); }}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this competition'}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this competition'}
          >
            <BookmarkIcon size={16} filled={isBookmarked} />
          </button>
        </div>

        <h2 className="cc-card-title" title={comp.title || 'Competition'}>
          <button
            type="button"
            className="cc-card-title-btn"
            onClick={(e) => { e.stopPropagation(); open(); }}
          >
            {comp.title || 'Competition'}
          </button>
        </h2>

        <div className="cc-prize-bar">
          <div className="cc-prize-left">
            <TrophyIcon size={14} />
            <span className="cc-prize-text" title={prizeText}>{prizeText}</span>
          </div>
          <span className={`cc-entry-tag ${free ? 'free' : 'paid'}`}>
            {free ? 'Free Entry' : 'Paid'}
          </span>
        </div>

        <div className="cc-specs-row">
          <div className="cc-spec-item" title={comp.teamSizeDisplay || 'Solo / Team'}>
            <UsersIcon size={13} />
            <span>{comp.teamSizeDisplay || 'Solo / Team'}</span>
          </div>
          <div className="cc-spec-dot" />
          <div className="cc-spec-item" title={`Registration closes: ${countdown.exactDateStr}`}>
            <CalendarIcon size={13} />
            <span>Ends {countdown.exactDateStr}</span>
          </div>
        </div>

        <div className="cc-card-footer-metric">
          <div className="cc-footer-metric-left">
            {Number(comp.registeredCount || 0) > 0 ? (
              <span className="cc-reg-count">
                <FlameIcon size={12} />
                <strong>{Number(comp.registeredCount).toLocaleString()}</strong> registrations
              </span>
            ) : (
              <span className="cc-meta-fresh">Recently Listed</span>
            )}
          </div>
          <span className={`cc-countdown-chip ${countdown.urgencyClass}`} title={`Registration closes: ${countdown.exactDateStr}`}>
            <span className="cc-status-dot" />
            <ClockIcon size={12} />
            <span>{countdown.text}</span>
          </span>
        </div>

        <div className="cc-card-actions">
          <a
            href={safeExternalUrl(comp.unstopUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="cc-action-btn cc-btn-apply"
            onClick={(e) => { e.stopPropagation(); onApply(comp); }}
          >
            <span>Apply</span>
            <ExternalLinkIcon size={12} />
          </a>

          {canTeamUp && (
            <button
              type="button"
              className="cc-action-btn cc-btn-team"
              onClick={(e) => { e.stopPropagation(); onFindTeammates(comp); }}
              title="Find batchmates on Team Finder"
            >
              <UsersIcon size={13} />
              <span>Find Teammates</span>
            </button>
          )}

          <button
            type="button"
            className={`cc-share-icon-btn ${isCopied ? 'copied' : ''}`}
            onClick={(e) => { e.stopPropagation(); onShare(comp); }}
            title={isCopied ? 'Details copied!' : 'Copy competition details & link'}
            aria-label="Copy competition details and link"
          >
            {isCopied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          </button>
        </div>
      </div>
    </article>
  );
});

function FilterCheckboxRow({ checked, label, count, onChange }) {
  return (
    <label className="cc-filter-checkbox-row">
      <input type="checkbox" className="cc-filter-checkbox-input" checked={checked} onChange={onChange} />
      <span className="cc-custom-checkbox">{checked && <CheckIcon size={10} />}</span>
      <span className="cc-checkbox-label-text">{label}</span>
      <span className="cc-filter-num">({count || 0})</span>
    </label>
  );
}

function AccordionHeader({ title, open, onToggle, activeCount, allSelected, onToggleAll, noun }) {
  return (
    <div className="cc-subgroup-header-row">
      <button type="button" className={`cc-accordion-header ${open ? 'open' : ''}`} onClick={onToggle} aria-expanded={open}>
        <div className="cc-accordion-header-left">
          <ChevronDownIcon size={13} className="cc-accordion-chevron" />
          <span className="cc-accordion-title">{title}</span>
        </div>
        {activeCount > 0 && <span className="cc-active-count-badge">{activeCount}</span>}
      </button>
      <button
        type="button"
        className="cc-mini-select-all"
        onClick={onToggleAll}
        title={allSelected ? `Deselect all ${noun}` : `Select all ${noun}`}
      >
        {allSelected ? 'Clear' : 'All'}
      </button>
    </div>
  );
}

export default function CompetitionsPage({
  onBack,
  onFindTeammates,
  showToast,
  bookmarks = [],
  onToggleBookmark,
  onOpenDetail,
  headerAction,
  competitions = [],
  loading = false,
  error = null,
  onRetry,
  isPostgraduate = false,
  onFilterPrefsChange,
}) {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showFetchingScreen, setShowFetchingScreen] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [openSections, setOpenSections] = useState({ circuits: true, tracks: true, platforms: true });
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const sentinelRef = useRef(null);
  const copiedTimerRef = useRef(null);

  const { selectedCircuits, selectedTracks, selectedSubTracks, selectedPlatforms, teamFilter, feeFilter, sortBy } = prefs;
  const updatePrefs = useCallback((patch) => {
    setPrefs(prev => sanitizePrefs({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  // Browse owns the saved filter: persist it and let App/Home mirror it
  const firstPrefsRun = useRef(true);
  useEffect(() => {
    savePrefs(prefs);
    if (onFilterPrefsChange) onFilterPrefsChange(prefs);
    if (firstPrefsRun.current) {
      firstPrefsRun.current = false;
      return;
    }
    trackEvent('browse_filters_changed', {
      circuits: prefs.selectedCircuits.join(','),
      tracks: prefs.selectedTracks.join(','),
      sub_tracks: prefs.selectedSubTracks.join(','),
      platforms: prefs.selectedPlatforms.join(','),
      team: prefs.teamFilter,
      fee: prefs.feeFilter,
      sort: prefs.sortBy,
    });
  }, [prefs, onFilterPrefsChange]);

  // Debounced search analytics
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    const timer = setTimeout(() => trackEvent('browse_search', { query: q, length: q.length }), 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Live countdowns
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => clearTimeout(copiedTimerRef.current), []);

  // Mobile filter drawer: lock the page behind it and close on Escape
  useEffect(() => {
    if (!isMobileFiltersOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setIsMobileFiltersOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [isMobileFiltersOpen]);

  const bookmarkedIds = useMemo(() => new Set((bookmarks || []).map(String)), [bookmarks]);

  // Platforms with nothing listed are hidden (unless already selected)
  const platformOptions = useMemo(() => {
    const present = new Set(competitions.map(getPlatformKey));
    return PLATFORM_OPTIONS.filter(opt => present.has(opt.id) || selectedPlatforms.includes(opt.id));
  }, [competitions, selectedPlatforms]);

  const filterOpts = useMemo(() => ({
    isPostgrad: isPostgraduate,
    search: searchQuery,
    now: nowMs,
    platformCount: platformOptions.length,
  }), [isPostgraduate, searchQuery, nowMs, platformOptions.length]);

  const filteredCompetitions = useMemo(
    () => sortCompetitions(filterCompetitions(competitions, prefs, filterOpts), sortBy),
    [competitions, prefs, filterOpts, sortBy]
  );
  // Option counts are fixed totals (all open listings), not affected by other filters or search;
  // the live result count sits under the search bar
  const counts = useMemo(
    () => facetCounts(competitions, DEFAULT_PREFS, { isPostgrad: isPostgraduate, now: nowMs, platformCount: platformOptions.length }),
    [competitions, isPostgraduate, nowMs, platformOptions.length]
  );

  // Back to the first batch whenever the result set changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [prefs, searchQuery]);

  const hasMore = visibleCount < filteredCompetitions.length;
  const visibleCompetitions = useMemo(() => filteredCompetitions.slice(0, visibleCount), [filteredCompetitions, visibleCount]);
  const showMore = useCallback(() => setVisibleCount(c => c + PAGE_SIZE), []);

  // Load the next batch as the bottom of the list scrolls into view
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) showMore();
    }, { rootMargin: '600px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, showMore, visibleCount]);

  const handleLoadingComplete = useCallback(() => setShowFetchingScreen(false), []);

  const handleShare = useCallback(async (comp) => {
    trackEvent('competition_shared', { competition_id: comp.id, title: comp.title });
    const details = [
      comp.title || 'Competition',
      comp.orgName ? `Organized by: ${comp.orgName}` : null,
      comp.prizes ? `Prizes: ${comp.prizes}` : null,
      comp.teamSizeDisplay ? `Format: ${comp.teamSizeDisplay}` : null,
      comp.remainDaysText ? `Deadline: ${comp.remainDaysText}` : null,
      `Apply: ${safeExternalUrl(comp.unstopUrl)}`,
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(details);
      setCopiedId(comp.id);
      if (latest.current.showToast) latest.current.showToast('Competition details copied to clipboard!');
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      if (latest.current.showToast) latest.current.showToast('Could not copy. Your browser blocked clipboard access.');
    }
  }, []);

  const handleApply = useCallback((comp) => {
    trackEvent('competition_outbound_clicked', { competition_id: comp.id, title: comp.title, source: 'browse_card' });
  }, []);

  // Parent callbacks change identity on every App render; cards get stable wrappers so memo() holds
  const latest = useRef({});
  latest.current = { onToggleBookmark, onFindTeammates, onOpenDetail, showToast };

  const handleToggleBookmark = useCallback((id) => {
    if (latest.current.onToggleBookmark) latest.current.onToggleBookmark(String(id));
  }, []);

  const handleFindTeammates = useCallback((comp) => {
    if (latest.current.onFindTeammates) latest.current.onFindTeammates(comp);
  }, []);

  const handleOpenDetail = useCallback((id) => {
    if (latest.current.onOpenDetail) latest.current.onOpenDetail(id);
  }, []);

  // ---------- filter actions ----------

  const toggleIn = (list, id) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleCircuit = (id) => updatePrefs(p => ({ selectedCircuits: toggleIn(p.selectedCircuits, id) }));
  const toggleTrack = (id) => updatePrefs(p => ({
    selectedTracks: toggleIn(p.selectedTracks, id),
    // unticking a category also drops its sub-tracks
    selectedSubTracks: p.selectedTracks.includes(id)
      ? p.selectedSubTracks.filter(st => !(SUBTRACK_MAP[id] || []).some(s => s.id === st))
      : p.selectedSubTracks,
  }));
  const toggleSubTrack = (id) => updatePrefs(p => ({ selectedSubTracks: toggleIn(p.selectedSubTracks, id) }));
  const togglePlatform = (id) => updatePrefs(p => ({ selectedPlatforms: toggleIn(p.selectedPlatforms, id) }));

  const isAllCircuitsSelected = selectedCircuits.length === CIRCUIT_OPTIONS.length;
  const isAllTracksSelected = selectedTracks.length === TRACK_OPTIONS.length;
  const isAllPlatformsSelected = platformOptions.length > 0 && platformOptions.every(p => selectedPlatforms.includes(p.id));

  const circuitsActive = selectedCircuits.length > 0 && !isAllCircuitsSelected;
  const tracksActive = selectedTracks.length > 0 && !isAllTracksSelected;
  const platformsActive = selectedPlatforms.length > 0 && !isAllPlatformsSelected;

  const activeFilterCount =
    (circuitsActive ? selectedCircuits.length : 0) +
    (tracksActive ? selectedTracks.length : 0) +
    (platformsActive ? selectedPlatforms.length : 0) +
    selectedSubTracks.length +
    (teamFilter !== 'all' ? 1 : 0) +
    (feeFilter !== 'all' ? 1 : 0);

  const sortChanged = sortBy !== DEFAULT_PREFS.sortBy;
  const hasActiveFilters = searchQuery.trim() !== '' || activeFilterCount > 0 || sortChanged;

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setPrefs({ ...DEFAULT_PREFS });
  }, []);

  const labelOf = (options, id) => options.find(o => o.id === id)?.label || id;
  const subTrackLabel = (id) => Object.values(SUBTRACK_MAP).flat().find(s => s.id === id)?.label || id;

  const isLoadingView = showFetchingScreen || loading;

  return (
    <div className="case-comps-standalone-page">
      <div className="case-comps-container">
        <header className="cc-header">
          <div className="cc-header-left">
            {onBack && (
              <button className="cc-back-btn" onClick={onBack} aria-label="Go back">
                <BackIcon size={18} />
              </button>
            )}
            <div className="cc-header-info">
              <div className="cc-title-row">
                <h1 className="cc-title">Competitions</h1>
                <div className="cc-unstop-pill-badge" title="Live synced across collegiate, corporate, and national competition portals.">
                  <span className="cc-unstop-pulse-dot" />
                  <span className="cc-unstop-pill-text">MULTI-SOURCE LIVE</span>
                </div>
              </div>
              <p className="cc-subtitle">
                Discover top competitions, hackathons, and challenges right here, synced live across collegiate, corporate, and national portals.
              </p>
            </div>
          </div>
          {headerAction && <div className="cc-header-right">{headerAction}</div>}
        </header>

        <div className="cc-unstop-notice-banner">
          <span className="cc-unstop-notice-tag">MULTI-PLATFORM</span>
          <span className="cc-unstop-notice-text">
            <strong>Direct Sourcing:</strong> Sourced live from Unstop, InsideKampus, Devpost and official corporate challenge pages.
          </span>
        </div>

        <div className="cc-layout-wrapper">
          <aside className={`cc-filter-sidebar ${isMobileFiltersOpen ? 'mobile-open' : ''}`} aria-label="Filters">
            <div className="cc-mobile-filter-header">
              <div className="cc-mobile-filter-title">
                <FilterIcon size={16} />
                <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
              </div>
              <div className="cc-mobile-filter-actions">
                {hasActiveFilters && (
                  <button type="button" className="cc-filter-reset-link" onClick={handleResetFilters}>Reset All</button>
                )}
                <button type="button" className="cc-mobile-filter-close" onClick={() => setIsMobileFiltersOpen(false)} aria-label="Close filters">
                  <XCloseIcon size={16} />
                </button>
              </div>
            </div>

            <div className="cc-filter-card cc-unified-filter-card">
              <div className="cc-filter-card-header">
                <div className="cc-card-heading-group">
                  <span className="cc-card-heading">Filters</span>
                  {activeFilterCount > 0 && <span className="cc-active-count-badge">{activeFilterCount}</span>}
                </div>
                {hasActiveFilters && (
                  <button type="button" className="cc-filter-reset-link" onClick={handleResetFilters} title="Reset all filters">Reset All</button>
                )}
              </div>

              {/* Circuits */}
              <div className="cc-filter-subgroup">
                <AccordionHeader
                  title="Circuits"
                  noun="circuits"
                  open={openSections.circuits}
                  onToggle={() => toggleSection('circuits')}
                  activeCount={circuitsActive ? selectedCircuits.length : 0}
                  allSelected={isAllCircuitsSelected}
                  onToggleAll={() => updatePrefs({ selectedCircuits: isAllCircuitsSelected ? [] : CIRCUIT_OPTIONS.map(c => c.id) })}
                />
                {openSections.circuits && (
                  <div className="cc-accordion-content">
                    <div className="cc-checkbox-list">
                      {CIRCUIT_OPTIONS.map(opt => (
                        <FilterCheckboxRow
                          key={opt.id}
                          checked={selectedCircuits.includes(opt.id)}
                          label={opt.label}
                          count={counts.circuits[opt.id]}
                          onChange={() => toggleCircuit(opt.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Categories + sub-tracks */}
              <div className="cc-filter-subgroup">
                <AccordionHeader
                  title="Categories"
                  noun="categories"
                  open={openSections.tracks}
                  onToggle={() => toggleSection('tracks')}
                  activeCount={tracksActive ? selectedTracks.length : 0}
                  allSelected={isAllTracksSelected}
                  onToggleAll={() => updatePrefs({ selectedTracks: isAllTracksSelected ? [] : TRACK_OPTIONS.map(t => t.id), selectedSubTracks: isAllTracksSelected ? [] : selectedSubTracks })}
                />
                {openSections.tracks && (
                  <div className="cc-accordion-content">
                    <div className="cc-checkbox-list">
                      {TRACK_OPTIONS.map(opt => {
                        const isChecked = selectedTracks.includes(opt.id);
                        const subs = (SUBTRACK_MAP[opt.id] || []).filter(s => (counts.subTracks[s.id] || 0) > 0 || selectedSubTracks.includes(s.id));
                        return (
                          <div key={opt.id} className="cc-filter-track-block">
                            <FilterCheckboxRow
                              checked={isChecked}
                              label={opt.label}
                              count={counts.tracks[opt.id]}
                              onChange={() => toggleTrack(opt.id)}
                            />
                            {isChecked && subs.length > 0 && (
                              <div className="cc-subtrack-pills-tray">
                                {subs.map(sub => {
                                  const isSubActive = selectedSubTracks.includes(sub.id);
                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      className={`cc-subtrack-pill ${isSubActive ? 'active' : ''}`}
                                      onClick={() => toggleSubTrack(sub.id)}
                                      aria-pressed={isSubActive}
                                    >
                                      <span>{sub.label}</span>
                                      <span className="cc-subtrack-count">{counts.subTracks[sub.id] || 0}</span>
                                      {isSubActive && <span className="cc-subtrack-check">✓</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Platforms */}
              <div className="cc-filter-subgroup">
                <AccordionHeader
                  title="Platforms"
                  noun="platforms"
                  open={openSections.platforms}
                  onToggle={() => toggleSection('platforms')}
                  activeCount={platformsActive ? selectedPlatforms.length : 0}
                  allSelected={isAllPlatformsSelected}
                  onToggleAll={() => updatePrefs({ selectedPlatforms: isAllPlatformsSelected ? [] : platformOptions.map(p => p.id) })}
                />
                {openSections.platforms && (
                  <div className="cc-accordion-content">
                    <div className="cc-checkbox-list">
                      {platformOptions.map(opt => (
                        <FilterCheckboxRow
                          key={opt.id}
                          checked={selectedPlatforms.includes(opt.id)}
                          label={opt.label}
                          count={counts.platforms[opt.id]}
                          onChange={() => togglePlatform(opt.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Participation */}
              <div className="cc-filter-subgroup cc-segmented-subgroup">
                <span className="cc-subgroup-label">Participation</span>
                <div className="cc-segmented-bar">
                  <button type="button" className={`cc-seg-btn ${teamFilter === 'all' ? 'active' : ''}`} onClick={() => updatePrefs({ teamFilter: 'all' })}>All</button>
                  <button
                    type="button"
                    className={`cc-seg-btn ${teamFilter === 'solo' ? 'active' : ''}`}
                    onClick={() => updatePrefs(p => ({ teamFilter: p.teamFilter === 'solo' ? 'all' : 'solo' }))}
                    title={`Competitions you can enter alone (${counts.team.solo})`}
                  >
                    Solo OK
                  </button>
                  <button
                    type="button"
                    className={`cc-seg-btn ${teamFilter === 'team' ? 'active' : ''}`}
                    onClick={() => updatePrefs(p => ({ teamFilter: p.teamFilter === 'team' ? 'all' : 'team' }))}
                    title={`Competitions that allow teams of 2+ (${counts.team.team})`}
                  >
                    Team
                  </button>
                </div>
              </div>

              {/* Entry fee */}
              <div className="cc-filter-subgroup cc-segmented-subgroup">
                <span className="cc-subgroup-label">Entry Fee</span>
                <div className="cc-segmented-bar">
                  <button type="button" className={`cc-seg-btn ${feeFilter === 'all' ? 'active' : ''}`} onClick={() => updatePrefs({ feeFilter: 'all' })}>All</button>
                  <button
                    type="button"
                    className={`cc-seg-btn ${feeFilter === 'free' ? 'active' : ''}`}
                    onClick={() => updatePrefs(p => ({ feeFilter: p.feeFilter === 'free' ? 'all' : 'free' }))}
                    title={`${counts.fee.free} free`}
                  >
                    Free
                  </button>
                  <button
                    type="button"
                    className={`cc-seg-btn ${feeFilter === 'paid' ? 'active' : ''}`}
                    onClick={() => updatePrefs(p => ({ feeFilter: p.feeFilter === 'paid' ? 'all' : 'paid' }))}
                    title={`${counts.fee.paid} paid`}
                  >
                    Paid
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {isMobileFiltersOpen && (
            <div className="cc-filter-backdrop" onClick={() => setIsMobileFiltersOpen(false)} aria-hidden="true" />
          )}

          <main className="cc-main-content">
            <div className="cc-content-top-bar">
              <div className="cc-search-wrapper">
                <SearchIcon size={16} className="cc-search-icon" />
                <input
                  type="text"
                  className="cc-search-input"
                  placeholder="Search competitions, colleges, prizes"
                  aria-label="Search competitions"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="cc-clear-search" onClick={() => setSearchQuery('')} aria-label="Clear search">✕</button>
                )}
              </div>

              <div className="cc-top-actions">
                <button
                  type="button"
                  className={`cc-mobile-filter-trigger ${activeFilterCount > 0 ? 'active' : ''}`}
                  onClick={() => setIsMobileFiltersOpen(true)}
                  aria-label="Filters"
                >
                  <FilterIcon size={17} />
                  <span className="cc-mobile-filter-text">Filters</span>
                  {activeFilterCount > 0 && <span className="cc-filter-badge-count">{activeFilterCount}</span>}
                </button>

                <div className="cc-sort-box cc-sort-box-desktop">
                  <ArrowUpDownIcon size={13} className="cc-sort-icon" />
                  <label htmlFor="cc-sort-select" className="cc-sort-label">Sort:</label>
                  <div className="cc-sort-select-wrapper">
                    <select id="cc-sort-select" className="cc-sort-select" value={sortBy} onChange={(e) => updatePrefs({ sortBy: e.target.value })}>
                      {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <ChevronDownIcon size={11} className="cc-sort-chevron" />
                  </div>
                </div>
              </div>
            </div>

            {!isLoadingView && !error && (
              <div className="cc-results-status-bar">
                <div className="cc-count-sort-row">
                  <div className="cc-inline-count">
                    <span className="cc-pulse-dot" title="Live sync active"></span>
                    <span>
                      <strong>{filteredCompetitions.length}</strong>{' '}
                      {filteredCompetitions.length === 1 ? 'competition' : 'competitions'}
                    </span>
                  </div>

                  <div className="cc-sort-box cc-sort-box-mobile">
                    <ArrowUpDownIcon size={13} className="cc-sort-icon" />
                    <div className="cc-sort-select-wrapper">
                      <select className="cc-sort-select" value={sortBy} aria-label="Sort competitions" onChange={(e) => updatePrefs({ sortBy: e.target.value })}>
                        {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                      <ChevronDownIcon size={11} className="cc-sort-chevron" />
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="cc-inline-active-filters">
                    <div className="cc-active-pills-list">
                      {searchQuery.trim() && (
                        <span className="cc-active-pill pill-search">
                          "{searchQuery.trim()}"
                          <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search query">✕</button>
                        </span>
                      )}
                      {circuitsActive && selectedCircuits.map(id => (
                        <span key={id} className="cc-active-pill pill-circuit">
                          {labelOf(CIRCUIT_OPTIONS, id)}
                          <button type="button" onClick={() => toggleCircuit(id)} aria-label={`Remove ${labelOf(CIRCUIT_OPTIONS, id)} filter`}>✕</button>
                        </span>
                      ))}
                      {tracksActive && selectedTracks.map(id => (
                        <span key={id} className="cc-active-pill pill-track">
                          {labelOf(TRACK_OPTIONS, id)}
                          <button type="button" onClick={() => toggleTrack(id)} aria-label={`Remove ${labelOf(TRACK_OPTIONS, id)} filter`}>✕</button>
                        </span>
                      ))}
                      {platformsActive && selectedPlatforms.map(id => (
                        <span key={id} className="cc-active-pill pill-platform">
                          {labelOf(PLATFORM_OPTIONS, id)}
                          <button type="button" onClick={() => togglePlatform(id)} aria-label={`Remove ${labelOf(PLATFORM_OPTIONS, id)} filter`}>✕</button>
                        </span>
                      ))}
                      {selectedSubTracks.map(id => (
                        <span key={id} className="cc-active-pill pill-subtrack">
                          {subTrackLabel(id)}
                          <button type="button" onClick={() => toggleSubTrack(id)} aria-label={`Remove ${subTrackLabel(id)} filter`}>✕</button>
                        </span>
                      ))}
                      {teamFilter !== 'all' && (
                        <span className="cc-active-pill pill-format">
                          {teamFilter === 'solo' ? 'Solo OK' : 'Team'}
                          <button type="button" onClick={() => updatePrefs({ teamFilter: 'all' })} aria-label="Remove participation filter">✕</button>
                        </span>
                      )}
                      {feeFilter !== 'all' && (
                        <span className="cc-active-pill pill-fee">
                          {feeFilter === 'free' ? 'Free entry' : 'Paid entry'}
                          <button type="button" onClick={() => updatePrefs({ feeFilter: 'all' })} aria-label="Remove fee filter">✕</button>
                        </span>
                      )}
                      {sortChanged && (
                        <span className="cc-active-pill pill-sort">
                          Sorted: {SORT_LABEL[sortBy]}
                          <button type="button" onClick={() => updatePrefs({ sortBy: DEFAULT_PREFS.sortBy })} aria-label="Reset sort order">✕</button>
                        </span>
                      )}
                      <button type="button" className="cc-clear-all-pill-btn" onClick={handleResetFilters} title="Clear all active filters">
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isLoadingView ? (
              <SectionLoadingWidget
                headline="Fetching live competitions..."
                subtitle="Pulling direct listings across DU, IIMs, IITs & premier colleges"
                customPuns={BROWSE_PUNS}
                minDurationMs={MIN_LOADING_MS}
                maxDurationMs={8000}
                isReady={!loading}
                onComplete={handleLoadingComplete}
              />
            ) : error && competitions.length === 0 ? (
              <div className="cc-empty-state error">
                <div className="cc-empty-icon"><TrophyIcon size={36} /></div>
                <h3 className="cc-empty-title">Could not load live competitions</h3>
                <p className="cc-empty-desc">{error}</p>
                {onRetry && <button className="cc-empty-btn" onClick={onRetry}>Retry Connection</button>}
              </div>
            ) : filteredCompetitions.length === 0 ? (
              <div className="cc-empty-state">
                <div className="cc-empty-icon"><TrophyIcon size={36} /></div>
                <h3 className="cc-empty-title">No competitions match your filter</h3>
                <p className="cc-empty-desc">Try searching a different keyword, selecting additional filters, or resetting criteria.</p>
                <button className="cc-empty-btn" onClick={handleResetFilters}>Clear All Filters</button>
              </div>
            ) : (
              <>
                <div className="cc-grid">
                  {visibleCompetitions.map(comp => (
                    <CompCard
                      key={comp.id}
                      comp={comp}
                      isBookmarked={bookmarkedIds.has(String(comp.id))}
                      isCopied={copiedId === comp.id}
                      nowMs={nowMs}
                      onOpenDetail={handleOpenDetail}
                      onToggleBookmark={handleToggleBookmark}
                      onFindTeammates={handleFindTeammates}
                      onShare={handleShare}
                      onApply={handleApply}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="cc-load-more" ref={sentinelRef}>
                    <button type="button" className="cc-empty-btn cc-show-more-btn" onClick={showMore}>
                      Show more ({filteredCompetitions.length - visibleCount} left)
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

