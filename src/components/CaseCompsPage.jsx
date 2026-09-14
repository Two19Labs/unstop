import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './CaseCompsPage.css';

const LOCAL_STORAGE_KEY = 'bookmarked_case_comps';

// Self-contained SVGs: Zero external bundle collisions
const BackIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const BookmarkIcon = ({ size = 16, filled = false, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const SearchIcon = ({ size = 18, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
  </svg>
);

const ExternalLinkIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const TrophyIcon = ({ size = 18, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const UsersIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const FlameIcon = ({ size = 18, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
  </svg>
);

const ClockIcon = ({ size = 18, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ArrowUpDownIcon = ({ size = 14, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" />
  </svg>
);

const CheckIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CopyIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IIM_IIT_KEYWORDS = ['iim', 'iit', 'indian institute of management', 'indian institute of technology', 'doms', 'dms', 'sjmsom', 'vgsom'];
const OTHER_MBA_CORP_KEYWORDS = ['isb', 'xlri', 'mdi', 'fms', 'spjimr', 'sp jain', 'sibm', 'symbiosis', 'nmims', 'iift', 'great lakes', 'glim', 'tapmi', 'imt', 'gim', 'somaiya', 'fore', 'lbsim', 'bits', 'mica', 'irma', 'tiss', 'jbims', "l'oreal", 'loreal', 'brandstorm', 'tata', 'hul', 'unilever', 'itc', 'marico', 'mondelez', 'reckitt', 'nestle', 'p&g', 'pepsico', 'coca-cola', 'aditya birla', 'reliance', 'jio', 'mahindra', 'mckinsey', 'bain', 'bcg', 'kearney', 'ey', 'deloitte', 'pwc', 'kpmg', 'amazon', 'flipkart', 'google', 'microsoft', 'tvs', 'optum', 'accenture', 'corporate'];

function isMatch(text, kw) {
  if (kw.length <= 4 && /^[a-z0-9]+$/i.test(kw)) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(text);
  }
  return text.includes(kw);
}

function isIIMorIITComp(comp) {
  if (typeof comp.isIIMorIIT === 'boolean') return comp.isIIMorIIT;
  if (comp.isIIM || comp.isIIT) return true;
  const combined = `${comp.orgName || ''} ${comp.title || ''}`.toLowerCase();
  return IIM_IIT_KEYWORDS.some(kw => isMatch(combined, kw));
}

function isOtherMbaOrCorporateComp(comp) {
  if (typeof comp.isOtherMbaOrCorporate === 'boolean') return comp.isOtherMbaOrCorporate;
  if (comp.isCorporate || comp.isOtherMba) return true;
  if (comp.isDU || isIIMorIITComp(comp)) return false;
  const combined = `${comp.orgName || ''} ${comp.title || ''}`.toLowerCase();
  return OTHER_MBA_CORP_KEYWORDS.some(kw => isMatch(combined, kw));
}

function parsePrizeAmount(prizesStr) {
  if (!prizesStr) return 0;
  const cleaned = prizesStr.replace(/,/g, '');
  const match = cleaned.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function getCountdownDetails(deadlineStr, fallbackRemainText, nowMs) {
  if (!deadlineStr) return { text: fallbackRemainText || 'Ongoing', exactDateStr: 'Ongoing', urgencyClass: 'green' };
  try {
    const deadlineDate = new Date(deadlineStr);
    const deadlineMs = deadlineDate.getTime();
    if (isNaN(deadlineMs)) return { text: fallbackRemainText || 'Ongoing', exactDateStr: 'Ongoing', urgencyClass: 'green' };
    const diffMs = deadlineMs - nowMs;
    const exactDateStr = deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    if (diffMs <= 0) return { text: 'Ending Soon', exactDateStr, urgencyClass: 'red' };
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    let text = days > 6 ? `${days}d left` : days >= 1 ? `${days}d ${hours}h left` : totalHours >= 1 ? `${totalHours}h ${minutes}m left` : `${minutes}m left`;
    let urgencyClass = totalHours <= 48 ? 'red' : totalHours <= 144 ? 'yellow' : 'green';
    return { text, exactDateStr, urgencyClass };
  } catch {
    return { text: fallbackRemainText || 'Ongoing', exactDateStr: 'Ongoing', urgencyClass: 'green' };
  }
}

function getCardCircuit(comp) {
  if (comp.isDU) return { type: 'du', label: 'DU Circuit' };
  if (isIIMorIITComp(comp)) return { type: 'iim-iit', label: 'IIMs & IITs' };
  if (isOtherMbaOrCorporateComp(comp)) return { type: 'other-mba-corp', label: 'Colleges & Corporates' };
  return { type: 'general', label: 'National Circuit' };
}

export default function CaseCompsPage({ onBack }) {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [feeFilter, setFeeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('closing-soonest');
  const [copiedId, setCopiedId] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Bookmarks with local storage persistence
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = useCallback((id, e) => {
    if (e?.stopPropagation) e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/competitions?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach Unstop`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCompetitions(data.data);
      } else {
        throw new Error(data.error || 'Empty response received from Unstop');
      }
    } catch (err) {
      console.error('Error fetching live Unstop competitions:', err);
      setFetchError(err.message || 'Unable to load real-time competitions from Unstop.');
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleShare = (comp, e) => {
    e.stopPropagation();
    const details = [
      `🏆 ${comp.title || 'Case Competition'}`,
      comp.orgName ? `🏛️ Organized by: ${comp.orgName}` : null,
      comp.prizes ? `💰 Prizes: ${comp.prizes}` : null,
      comp.teamSizeDisplay ? `👥 Format: ${comp.teamSizeDisplay}` : null,
      comp.remainDaysText ? `⏰ Deadline: ${comp.remainDaysText}` : null,
      `🔗 Apply on Unstop: ${comp.unstopUrl}`,
    ].filter(Boolean).join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(details);
      setCopiedId(comp.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const metrics = useMemo(() => {
    const total = competitions.length;
    const du = competitions.filter((c) => c.isDU).length;
    const iimIit = competitions.filter((c) => isIIMorIITComp(c)).length;
    const otherMbaCorp = competitions.filter((c) => isOtherMbaOrCorporateComp(c)).length;
    const bookmarked = competitions.filter((c) => bookmarkedIds.includes(c.id)).length;
    return { total, du, iimIit, otherMbaCorp, bookmarked };
  }, [competitions, bookmarkedIds]);

  const hasActiveFilters = searchQuery.trim() !== '' || activeFilter !== 'all' || teamFilter !== 'all' || feeFilter !== 'all' || sortBy !== 'closing-soonest';

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setTeamFilter('all');
    setFeeFilter('all');
    setSortBy('closing-soonest');
  };

  const filteredCompetitions = useMemo(() => {
    const result = competitions.filter((comp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = comp.title?.toLowerCase().includes(q);
        const matchesOrg = comp.orgName?.toLowerCase().includes(q);
        const matchesPrize = comp.prizes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesOrg && !matchesPrize) return false;
      }
      if (activeFilter === 'bookmarked') {
        if (!bookmarkedIds.includes(comp.id)) return false;
      } else {
        if (activeFilter === 'du' && !comp.isDU) return false;
        if (activeFilter === 'iim-iit' && !isIIMorIITComp(comp)) return false;
        if (activeFilter === 'other-mba-corp' && !isOtherMbaOrCorporateComp(comp)) return false;
      }
      if (teamFilter === 'solo' && comp.maxTeam > 1) return false;
      if (teamFilter === 'team' && comp.maxTeam <= 1) return false;
      if (feeFilter === 'free' && !comp.isFree) return false;
      if (feeFilter === 'paid' && comp.isFree) return false;
      if (comp.isUndergradEligible === false) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '', undefined, { sensitivity: 'base' });
        case 'closing-soonest':
          if (a.daysRemainingNum !== b.daysRemainingNum) return a.daysRemainingNum - b.daysRemainingNum;
          return (b.registeredCount || 0) - (a.registeredCount || 0);
        case 'closing-latest':
          return b.daysRemainingNum - a.daysRemainingNum;
        case 'prize-highest': {
          const prizeA = parsePrizeAmount(a.prizes);
          const prizeB = parsePrizeAmount(b.prizes);
          if (prizeA !== prizeB) return prizeB - prizeA;
          return (b.registeredCount || 0) - (a.registeredCount || 0);
        }
        case 'popular':
          return (b.registeredCount || 0) - (a.registeredCount || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [competitions, searchQuery, activeFilter, teamFilter, feeFilter, sortBy, bookmarkedIds]);

  return (
    <div className="case-comps-container">
      <header className="cc-header">
        <div className="cc-header-left">
          {onBack && (
            <button className="cc-back-btn" onClick={onBack} aria-label="Go back">
              <BackIcon size={18} />
            </button>
          )}
          <div>
            <div className="cc-title-row">
              <h1 className="cc-title">Case Competitions Radar</h1>
            </div>
            <p className="cc-subtitle">
              Live, verified case competitions synced directly from Unstop. Tailored for undergraduate & national eligibility.
            </p>
          </div>
        </div>
      </header>

      <div className="cc-unstop-notice-banner">
        <span className="cc-unstop-notice-tag">UNSTOP DIRECT</span>
        <span className="cc-unstop-notice-text">
          <strong>Notice:</strong> 100% active competitions curated for <strong>Undergraduate eligibility</strong>. Expired & MBA-only listings are automatically filtered out.
        </span>
      </div>

      <div className="cc-filter-section">
        <div className="cc-search-wrapper">
          <SearchIcon size={16} className="cc-search-icon" />
          <input
            type="text"
            className="cc-search-input"
            placeholder="Search by name, IIM, IIT, XLRI, ISB, L'Oréal, prizes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="cc-clear-search" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="cc-tabs">
          <button className={`cc-tab-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
            All Circuits ({metrics.total})
          </button>
          <button className={`cc-tab-btn ${activeFilter === 'du' ? 'active' : ''}`} onClick={() => setActiveFilter('du')}>
            🎓 DU Circuit ({metrics.du})
          </button>
          <button className={`cc-tab-btn ${activeFilter === 'iim-iit' ? 'active' : ''}`} onClick={() => setActiveFilter('iim-iit')}>
            🏛️ IIMs & IITs ({metrics.iimIit})
          </button>
          <button className={`cc-tab-btn ${activeFilter === 'other-mba-corp' ? 'active' : ''}`} onClick={() => setActiveFilter('other-mba-corp')}>
            🏢 Colleges & Corporates ({metrics.otherMbaCorp})
          </button>
          <button className={`cc-tab-btn cc-tab-bookmarked ${activeFilter === 'bookmarked' ? 'active' : ''}`} onClick={() => setActiveFilter('bookmarked')}>
            🔖 Bookmarked ({metrics.bookmarked})
          </button>
        </div>

        <div className="cc-controls-bar">
          <div className="cc-controls-left">
            <div className="cc-filter-pill-group">
              <button className={`cc-filter-pill-btn ${teamFilter === 'all' ? 'active' : ''}`} onClick={() => setTeamFilter('all')}>All Formats</button>
              <button className={`cc-filter-pill-btn ${teamFilter === 'solo' ? 'active' : ''}`} onClick={() => setTeamFilter('solo')}>Solo</button>
              <button className={`cc-filter-pill-btn ${teamFilter === 'team' ? 'active' : ''}`} onClick={() => setTeamFilter('team')}>Teams (2+)</button>
            </div>
            <div className="cc-filter-pill-group">
              <button className={`cc-filter-pill-btn ${feeFilter === 'all' ? 'active' : ''}`} onClick={() => setFeeFilter('all')}>All Fees</button>
              <button className={`cc-filter-pill-btn ${feeFilter === 'free' ? 'active' : ''}`} onClick={() => setFeeFilter('free')}>Free Entry</button>
              <button className={`cc-filter-pill-btn ${feeFilter === 'paid' ? 'active' : ''}`} onClick={() => setFeeFilter('paid')}>Paid</button>
            </div>
          </div>
          <div className="cc-controls-right">
            <div className="cc-sort-box">
              <ArrowUpDownIcon size={14} />
              <label htmlFor="cc-sort-select" className="cc-sort-label">Sort:</label>
              <select
                id="cc-sort-select"
                className="cc-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="closing-soonest">⏳ Closing Soonest</option>
                <option value="closing-latest">📅 Closing Latest</option>
                <option value="title-asc">🔤 Title: A → Z</option>
                <option value="title-desc">🔤 Title: Z → A</option>
                <option value="prize-highest">🏆 Highest Prize Pool</option>
                <option value="popular">🔥 Most Applied</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button type="button" className="cc-reset-btn" onClick={handleResetFilters}>
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="cc-loading-state">
          <div className="cc-spinner"></div>
          <p className="cc-loading-title">Fetching live competitions from Unstop...</p>
          <p className="cc-loading-subtitle">Pulling direct listings across DU, IIMs, IITs & corporate circuits</p>
        </div>
      ) : fetchError ? (
        <div className="cc-empty-state error">
          <div className="cc-empty-icon"><TrophyIcon size={36} /></div>
          <h3 className="cc-empty-title">Could not load live competitions</h3>
          <p className="cc-empty-desc">{fetchError}</p>
          <button className="cc-empty-btn" onClick={fetchOpportunities}>Retry Connection</button>
        </div>
      ) : filteredCompetitions.length === 0 ? (
        <div className="cc-empty-state">
          <div className="cc-empty-icon">
            {activeFilter === 'bookmarked' ? <BookmarkIcon size={36} filled={false} /> : <TrophyIcon size={36} />}
          </div>
          <h3 className="cc-empty-title">
            {activeFilter === 'bookmarked' ? 'No bookmarked competitions yet' : 'No competitions match your filter'}
          </h3>
          <p className="cc-empty-desc">
            {activeFilter === 'bookmarked'
              ? 'Click the bookmark icon on any competition card to track it here!'
              : 'Try searching a different keyword or resetting your filter criteria.'}
          </p>
          <button className="cc-empty-btn" onClick={handleResetFilters}>
            {activeFilter === 'bookmarked' ? 'Explore All Competitions' : 'Clear All Filters'}
          </button>
        </div>
      ) : (
        <div className="cc-grid">
          {filteredCompetitions.map((comp) => {
            const circuit = getCardCircuit(comp);
            const countdown = getCountdownDetails(comp.deadline, comp.remainDaysText, nowMs);
            const isSolo = comp.maxTeam === 1 || (comp.teamSizeDisplay && comp.teamSizeDisplay.toLowerCase().startsWith('solo'));
            const isBookmarked = bookmarkedIds.includes(comp.id);

            return (
              <article key={comp.id} className={`cc-card cc-card-${circuit.type} ${isBookmarked ? 'is-bookmarked' : ''}`}>
                <div className="cc-card-inner">
                  <div className="cc-card-top-bar">
                    <div className="cc-host-identity">
                      {comp.orgLogo ? (
                        <img
                          src={comp.orgLogo}
                          alt=""
                          className="cc-host-logo"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className={`cc-host-avatar ${circuit.type}`}>
                          {(comp.orgName ? comp.orgName.charAt(0) : 'A').toUpperCase()}
                        </div>
                      )}
                      <div className="cc-host-meta">
                        <span className="cc-host-name" title={comp.orgName || 'Academic Host'}>
                          {comp.orgName || 'Academic Host'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`cc-card-bookmark-btn ${isBookmarked ? 'active' : ''}`}
                      onClick={(e) => toggleBookmark(comp.id, e)}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this case comp'}
                    >
                      <BookmarkIcon size={16} filled={isBookmarked} />
                    </button>
                  </div>

                  <h2 className="cc-card-title" title={comp.title || 'Case Competition'}>
                    {comp.title || 'Case Competition'}
                  </h2>

                  <div className="cc-prize-bar">
                    <div className="cc-prize-left">
                      <TrophyIcon size={14} className="cc-prize-trophy" />
                      <span className="cc-prize-text" title={comp.prizes || 'Certificates & Recognition'}>
                        {comp.prizes || 'Certificates & Recognition'}
                      </span>
                    </div>
                    <span className={`cc-entry-tag ${comp.isFree ? 'free' : 'paid'}`}>
                      {comp.isFree ? 'Free Entry' : 'Paid'}
                    </span>
                  </div>

                  <div className="cc-specs-row">
                    <div className="cc-spec-item" title={comp.teamSizeDisplay || 'Solo / Team'}>
                      <UsersIcon size={13} />
                      <span>{comp.teamSizeDisplay || 'Solo / Team'}</span>
                    </div>
                    <div className="cc-spec-dot" />
                    <div className="cc-spec-item" title={`Exact Deadline: ${countdown.exactDateStr}`}>
                      <CalendarIcon size={13} />
                      <span>Ends {countdown.exactDateStr}</span>
                    </div>
                  </div>

                  <div className="cc-card-footer-metric">
                    <div className="cc-footer-metric-left">
                      {Number(comp.registeredCount || 0) > 0 ? (
                        <span className="cc-reg-count">
                          <FlameIcon size={12} className="cc-reg-icon" />
                          <strong>{Number(comp.registeredCount).toLocaleString()}</strong> registrations
                        </span>
                      ) : (
                        <span className="cc-meta-fresh">⚡ Recently Listed</span>
                      )}
                    </div>
                    <span className={`cc-countdown-chip ${countdown.urgencyClass}`}>
                      <span className="cc-status-dot" />
                      <ClockIcon size={12} className="cc-timer-icon" />
                      <span>{countdown.text}</span>
                    </span>
                  </div>

                  <div className="cc-card-actions">
                    <a
                      href={comp.unstopUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cc-action-btn cc-btn-apply"
                    >
                      <span>Apply on Unstop</span>
                      <ExternalLinkIcon size={12} />
                    </a>

                    <button
                      type="button"
                      className={`cc-share-icon-btn ${copiedId === comp.id ? 'copied' : ''}`}
                      onClick={(e) => handleShare(comp, e)}
                      title={copiedId === comp.id ? 'Details copied!' : 'Copy competition details & link'}
                    >
                      {copiedId === comp.id ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
