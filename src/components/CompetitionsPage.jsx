// src/components/CompetitionsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  SearchIcon,
  TrophyIcon,
  UsersIcon,
  BookmarkIcon,
  ClockIcon,
  CalendarIcon,
  FlameIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  ArrowLeftIcon,
  BellIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  ArrowUpDownIcon
} from './icons';
import { INITIAL_COMPETITIONS } from '../data/competitionsData';
import './CompetitionsPage.css';

export default function CompetitionsPage({ onFindTeammates, showToast, bookmarkedOnly, setBookmarkedOnly, onCountUpdate }) {
  const { bookmarks, toggleBookmark, isBookmarked } = useAuth();

  // Initialize with curated real opportunities instantly so there is ZERO delay or empty state
  const [competitions, setCompetitions] = useState(INITIAL_COMPETITIONS || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters State - default to screenshot reference view (DU + Premier, Case Comps, Free Entry), fully toggleable & reset-able
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCircuits, setSelectedCircuits] = useState(['du', 'iim-iit-premier']);
  const [selectedTracks, setSelectedTracks] = useState(['case']);
  const [teamFilter, setTeamFilter] = useState('all'); // all | solo | team
  const [feeFilter, setFeeFilter] = useState('free'); // all | free | paid
  const [sortBy, setSortBy] = useState('closing-soonest');
  const [copiedId, setCopiedId] = useState(null);

  // Accordion states
  const [circuitsOpen, setCircuitsOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [participationOpen, setParticipationOpen] = useState(true);
  const [feeOpen, setFeeOpen] = useState(true);

  // Background fetch for live updates with resilient fallback
  const loadCompetitions = async () => {
    try {
      const res = await fetch('/api/competitions');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setCompetitions(json.data);
          if (onCountUpdate) onCountUpdate(json.data.length);
          return;
        }
      }
      // Try static fallback if dev server proxy is not available
      const staticRes = await fetch('/data/competitions.json');
      if (staticRes.ok) {
        const json = await staticRes.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setCompetitions(json.data);
          if (onCountUpdate) onCountUpdate(json.data.length);
          return;
        }
      }
    } catch (err) {
      console.warn('Live API fetch deferred, using cached opportunities:', err.message);
    }
  };

  useEffect(() => {
    if (onCountUpdate && INITIAL_COMPETITIONS?.length) {
      onCountUpdate(INITIAL_COMPETITIONS.length);
    }
    loadCompetitions();
  }, []);

  // Compute live metrics across circuits and tracks
  const metrics = useMemo(() => {
    return {
      total: competitions.length,
      du: competitions.filter(c => c.isDU).length,
      iimIitPremier: competitions.filter(c => c.isPremier).length,
      corporateGlobal: competitions.filter(c => c.isCorporate).length,
      others: competitions.filter(c => !c.isDU && !c.isPremier && !c.isCorporate).length,
      cases: competitions.filter(c => c.category === 'case').length,
      hackathons: competitions.filter(c => c.category === 'hackathon').length,
      simulations: competitions.filter(c => c.category === 'simulation').length,
      writing: competitions.filter(c => c.category === 'writing').length,
      quizzes: competitions.filter(c => c.category === 'quiz').length,
      debates: competitions.filter(c => c.category === 'debate').length,
    };
  }, [competitions]);

  // Circuit toggling
  const toggleCircuit = (circuitId) => {
    setSelectedCircuits(prev =>
      prev.includes(circuitId) ? prev.filter(c => c !== circuitId) : [...prev, circuitId]
    );
  };

  const toggleAllCircuits = () => {
    const all = ['du', 'iim-iit-premier', 'corporate-global', 'others'];
    if (selectedCircuits.length === all.length) {
      setSelectedCircuits([]);
    } else {
      setSelectedCircuits(all);
    }
  };

  // Track toggling
  const toggleTrack = (trackId) => {
    setSelectedTracks(prev =>
      prev.includes(trackId) ? prev.filter(t => t !== trackId) : [...prev, trackId]
    );
  };

  const toggleAllTracks = () => {
    const all = ['case', 'hackathon', 'writing', 'quiz', 'simulation', 'debate'];
    if (selectedTracks.length === all.length) {
      setSelectedTracks([]);
    } else {
      setSelectedTracks(all);
    }
  };

  const toggleBookmarkedOnly = () => {
    setBookmarkedOnly(!bookmarkedOnly);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCircuits([]);
    setSelectedTracks([]);
    setTeamFilter('all');
    setFeeFilter('all');
    setSortBy('closing-soonest');
    setBookmarkedOnly(false);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedCircuits.length > 0 ||
    selectedTracks.length > 0 ||
    teamFilter !== 'all' ||
    feeFilter !== 'all' ||
    bookmarkedOnly
  );

  // 1-Click Share functionality
  const handleShare = async (comp, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const deadlineFormatted = comp.deadline
      ? new Date(comp.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Ongoing';

    const shareText = `🏆 ${comp.title}\n🏛️ Organized by: ${comp.orgName}\n💰 Prizes: ${comp.prizes}\n👥 Format: ${comp.teamSizeDisplay}\n⏰ Deadline: Ends ${deadlineFormatted}\n🔗 Apply: ${comp.unstopUrl}\n\nVia OneStop (SSCBS Collegiate Hub)`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(comp.id);
      if (showToast) showToast('Competition details copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.warn('Share copy failed:', err);
    }
  };

  // Pre-fill Squad Finder Handshake
  const handleFindTeammates = (comp, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const prefill = {
      competition_name: comp.title,
      organizer: comp.orgName,
      competition_link: comp.unstopUrl,
      total_members: comp.maxTeam || 4,
    };
    sessionStorage.setItem('comp_team_prefill', JSON.stringify(prefill));
    if (onFindTeammates) onFindTeammates(prefill);
  };

  // Filter and Sort Pipeline
  const filteredCompetitions = useMemo(() => {
    return competitions.filter((item) => {
      if (bookmarkedOnly && !isBookmarked(item.id)) return false;

      // Circuit Filter
      if (selectedCircuits.length > 0) {
        const matchesCircuit =
          (selectedCircuits.includes('du') && item.isDU) ||
          (selectedCircuits.includes('iim-iit-premier') && item.isPremier) ||
          (selectedCircuits.includes('corporate-global') && item.isCorporate) ||
          (selectedCircuits.includes('others') && !item.isDU && !item.isPremier && !item.isCorporate);
        if (!matchesCircuit) return false;
      }

      // Track Filter
      if (selectedTracks.length > 0) {
        if (!selectedTracks.includes(item.category)) return false;
      }

      // Team Format Filter
      if (teamFilter === 'solo' && item.maxTeam > 1) return false;
      if (teamFilter === 'team' && item.maxTeam <= 1) return false;

      // Fee Filter
      if (feeFilter === 'free' && !item.isFree) return false;
      if (feeFilter === 'paid' && item.isFree) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const orgMatch = (item.orgName || '').toLowerCase().includes(q);
        const prizeMatch = (item.prizes || '').toLowerCase().includes(q);
        const catMatch = (item.categoryLabel || '').toLowerCase().includes(q);
        if (!titleMatch && !orgMatch && !prizeMatch && !catMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'closing-soonest') {
        const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return (isNaN(timeA) ? Infinity : timeA) - (isNaN(timeB) ? Infinity : timeB);
      }
      if (sortBy === 'closing-latest') {
        const timeA = a.deadline ? new Date(a.deadline).getTime() : -Infinity;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : -Infinity;
        return (isNaN(timeB) ? -Infinity : timeB) - (isNaN(timeA) ? -Infinity : timeA);
      }
      if (sortBy === 'popular') {
        return (b.registeredCount || 0) - (a.registeredCount || 0);
      }
      if (sortBy === 'prize-highest') {
        const extractNum = (str) => {
          if (!str) return 0;
          const match = str.replace(/,/g, '').match(/₹(\d+)/);
          return match ? Number(match[1]) : 0;
        };
        return extractNum(b.prizes) - extractNum(a.prizes);
      }
      if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [competitions, bookmarkedOnly, selectedCircuits, selectedTracks, teamFilter, feeFilter, searchQuery, sortBy, bookmarks]);

  // Formatter for deadline with time: "Ends 17 Sept, 12:00 am"
  const formatDeadline = (deadline) => {
    if (!deadline) return 'Ongoing';
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return deadline;
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `Ends ${day} ${month}, ${hours}:${minutes} ${ampm}`;
  };

  // Urgency pill helper (e.g. 10h 18m left, 1d 2h left)
  const getUrgencyData = (deadline, remainDaysText) => {
    if (!deadline) return { label: remainDaysText || 'Active', type: 'green' };
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { label: 'Closing soon', type: 'red' };
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;

    if (days === 0) {
      return {
        label: `${remHours}h ${mins}m left`,
        type: 'red'
      };
    } else if (days < 3) {
      return {
        label: `${days}d ${remHours}h left`,
        type: 'yellow'
      };
    } else {
      return {
        label: `${days}d left`,
        type: 'green'
      };
    }
  };

  return (
    <div className="cbs-competitions-page">
      {/* ── Top Header Row ── */}
      <header className="cbs-top-header">
        <div className="cbs-header-left">
          <button
            type="button"
            className="cbs-back-btn"
            onClick={() => window.history.back()}
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeftIcon size={16} />
          </button>
          <div className="cbs-header-titles">
            <h1 className="cbs-page-title">Competitions</h1>
            <p className="cbs-page-sub">
              It's competitions season! Find opportunities relevant to CBS folks right here, synced with and pulled from Unstop, all filterable! :)
            </p>
          </div>
        </div>

        <div className="cbs-header-right">
          <button type="button" className="cbs-bell-btn" title="Notifications" aria-label="Notifications">
            <BellIcon size={18} />
            <span className="cbs-bell-badge">4</span>
          </button>
        </div>
      </header>

      {/* ── Unstop Notice Banner ── */}
      <div className="cbs-notice-banner">
        <span className="cbs-notice-badge">UNSTOP ONLY</span>
        <span className="cbs-notice-text">
          Notice: Curated for <strong>Undergraduate eligibility</strong>, synced directly from <strong>Unstop</strong>. External opportunities are not shown.
        </span>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="cbs-layout-body">
        {/* ── Left Sidebar (Filters) ── */}
        <aside className="cbs-sidebar">
          {/* Card 1: Circuits */}
          <div className="cbs-card cbs-circuits-card">
            <div
              className="cbs-card-header"
              onClick={() => setCircuitsOpen(!circuitsOpen)}
              role="button"
              tabIndex={0}
            >
              <div className="cbs-card-header-left">
                <ChevronDownIcon size={14} className={`cbs-chevron ${circuitsOpen ? 'open' : ''}`} />
                <span className="cbs-card-heading">Circuits</span>
              </div>
              {selectedCircuits.length > 0 && (
                <span className="cbs-filter-count-pill">{selectedCircuits.length}</span>
              )}
            </div>

            {circuitsOpen && (
              <div className="cbs-card-content">
                <label className="cbs-check-row">
                  <input
                    type="checkbox"
                    checked={selectedCircuits.length === 4}
                    onChange={toggleAllCircuits}
                  />
                  <span className="cbs-custom-checkbox" />
                  <span className="cbs-check-label">Select All</span>
                </label>

                <label className="cbs-check-row">
                  <input
                    type="checkbox"
                    checked={selectedCircuits.includes('du')}
                    onChange={() => toggleCircuit('du')}
                  />
                  <span className="cbs-custom-checkbox" />
                  <span className="cbs-check-label">DU Circuit</span>
                  <span className="cbs-check-count">({metrics.du})</span>
                </label>

                <label className="cbs-check-row">
                  <input
                    type="checkbox"
                    checked={selectedCircuits.includes('iim-iit-premier')}
                    onChange={() => toggleCircuit('iim-iit-premier')}
                  />
                  <span className="cbs-custom-checkbox" />
                  <span className="cbs-check-label">IIMs, IITs & Premier</span>
                  <span className="cbs-check-count">({metrics.iimIitPremier})</span>
                </label>

                <label className="cbs-check-row">
                  <input
                    type="checkbox"
                    checked={selectedCircuits.includes('corporate-global')}
                    onChange={() => toggleCircuit('corporate-global')}
                  />
                  <span className="cbs-custom-checkbox" />
                  <span className="cbs-check-label">Corporate & Global</span>
                  <span className="cbs-check-count">({metrics.corporateGlobal})</span>
                </label>

                <label className="cbs-check-row">
                  <input
                    type="checkbox"
                    checked={selectedCircuits.includes('others')}
                    onChange={() => toggleCircuit('others')}
                  />
                  <span className="cbs-custom-checkbox" />
                  <span className="cbs-check-label">Others</span>
                  <span className="cbs-check-count">({metrics.others})</span>
                </label>
              </div>
            )}
          </div>

          {/* Card 2: Filters */}
          <div className="cbs-card cbs-filters-card">
            <div className="cbs-filters-top-bar">
              <span className="cbs-card-heading bold">Filters</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="cbs-reset-all-btn"
                  onClick={handleResetFilters}
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Subgroup: Categories */}
            <div className="cbs-subgroup">
              <div
                className="cbs-subgroup-header"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                role="button"
                tabIndex={0}
              >
                <div className="cbs-card-header-left">
                  <ChevronDownIcon size={14} className={`cbs-chevron ${categoriesOpen ? 'open' : ''}`} />
                  <span className="cbs-subgroup-title">Categories</span>
                </div>
                {selectedTracks.length > 0 && (
                  <span className="cbs-filter-count-pill">{selectedTracks.length}</span>
                )}
              </div>

              {categoriesOpen && (
                <div className="cbs-card-content">
                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={selectedTracks.length === 6}
                      onChange={toggleAllTracks}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Select All</span>
                  </label>

                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={selectedTracks.includes('case')}
                      onChange={() => toggleTrack('case')}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Case Comps</span>
                    <span className="cbs-check-count">({metrics.cases})</span>
                  </label>

                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={selectedTracks.includes('hackathon')}
                      onChange={() => toggleTrack('hackathon')}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Hackathons</span>
                    <span className="cbs-check-count">({metrics.hackathons})</span>
                  </label>

                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={selectedTracks.includes('writing')}
                      onChange={() => toggleTrack('writing')}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Writing & Research</span>
                    <span className="cbs-check-count">({metrics.writing})</span>
                  </label>

                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={selectedTracks.includes('quiz')}
                      onChange={() => toggleTrack('quiz')}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Quizzes</span>
                    <span className="cbs-check-count">({metrics.quizzes})</span>
                  </label>

                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={selectedTracks.includes('simulation')}
                      onChange={() => toggleTrack('simulation')}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Simulations</span>
                    <span className="cbs-check-count">({metrics.simulations})</span>
                  </label>

                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={selectedTracks.includes('debate')}
                      onChange={() => toggleTrack('debate')}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Debates</span>
                    <span className="cbs-check-count">({metrics.debates})</span>
                  </label>
                </div>
              )}
            </div>

            {/* Subgroup: Participation */}
            <div className="cbs-subgroup">
              <div
                className="cbs-subgroup-header"
                onClick={() => setParticipationOpen(!participationOpen)}
                role="button"
                tabIndex={0}
              >
                <div className="cbs-card-header-left">
                  <ChevronDownIcon size={14} className={`cbs-chevron ${participationOpen ? 'open' : ''}`} />
                  <span className="cbs-subgroup-title">Participation</span>
                </div>
                {teamFilter !== 'all' && (
                  <span className="cbs-filter-count-pill">1</span>
                )}
              </div>

              {participationOpen && (
                <div className="cbs-card-content">
                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={teamFilter === 'solo'}
                      onChange={() => setTeamFilter(teamFilter === 'solo' ? 'all' : 'solo')}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Solo Participation</span>
                  </label>

                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={teamFilter === 'team'}
                      onChange={() => setTeamFilter(teamFilter === 'team' ? 'all' : 'team')}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Teams (2+)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Subgroup: Entry Fee */}
            <div className="cbs-subgroup">
              <div
                className="cbs-subgroup-header"
                onClick={() => setFeeOpen(!feeOpen)}
                role="button"
                tabIndex={0}
              >
                <div className="cbs-card-header-left">
                  <ChevronDownIcon size={14} className={`cbs-chevron ${feeOpen ? 'open' : ''}`} />
                  <span className="cbs-subgroup-title">Entry Fee</span>
                </div>
                {feeFilter !== 'all' && (
                  <span className="cbs-filter-count-pill">1</span>
                )}
              </div>

              {feeOpen && (
                <div className="cbs-card-content">
                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={feeFilter === 'free'}
                      onChange={() => setFeeFilter(feeFilter === 'free' ? 'all' : 'free')}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Free Entry</span>
                  </label>

                  <label className="cbs-check-row">
                    <input
                      type="checkbox"
                      checked={feeFilter === 'paid'}
                      onChange={() => setFeeFilter(feeFilter === 'paid' ? 'all' : 'paid')}
                    />
                    <span className="cbs-custom-checkbox" />
                    <span className="cbs-check-label">Paid</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Right Content Area ── */}
        <main className="cbs-main-content">
          {/* Top Search & Filter Bar */}
          <div className="cbs-search-controls-bar">
            <div className="cbs-search-wrapper">
              <SearchIcon size={15} className="cbs-search-icon" />
              <input
                type="text"
                className="cbs-search-input"
                placeholder="Search competitions, IIM, IIT, XLRI, ISB, prizes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="cbs-clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="cbs-view-tabs">
              <button
                type="button"
                className={`cbs-tab-item ${!bookmarkedOnly ? 'active' : ''}`}
                onClick={() => setBookmarkedOnly(false)}
              >
                <span>All</span>
                <span className="cbs-tab-pill">{competitions.length}</span>
              </button>

              <button
                type="button"
                className={`cbs-tab-item ${bookmarkedOnly ? 'active' : ''}`}
                onClick={() => setBookmarkedOnly(true)}
              >
                <BookmarkIcon size={13} filled={bookmarkedOnly} />
                <span>Bookmarked</span>
                <span className="cbs-tab-pill highlight">{bookmarks.length}</span>
              </button>
            </div>

            <div className="cbs-sort-dropdown-box">
              <ArrowUpDownIcon size={13} className="cbs-sort-icon" />
              <span className="cbs-sort-prefix">Sort:</span>
              <select
                className="cbs-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="closing-soonest">Closing Soonest</option>
                <option value="closing-latest">Closing Latest</option>
                <option value="prize-highest">Highest Prize Pool</option>
                <option value="popular">Most Popular</option>
                <option value="title-asc">Title (A → Z)</option>
              </select>
              <ChevronDownIcon size={12} className="cbs-dropdown-chevron" />
            </div>
          </div>

          {/* Active Filter Tags Row */}
          <div className="cbs-active-filters-row">
            <div className="cbs-status-indicator">
              <span className="cbs-live-dot" />
              <span className="cbs-opportunities-count">
                Showing <strong>{filteredCompetitions.length}</strong> opportunities
              </span>
            </div>

            <div className="cbs-tag-chips-list">
              {/* Circuit Chips */}
              {selectedCircuits.includes('du') && (
                <span className="cbs-filter-chip chip-purple">
                  DU Circuit
                  <button type="button" onClick={() => toggleCircuit('du')}>✕</button>
                </span>
              )}
              {selectedCircuits.includes('iim-iit-premier') && (
                <span className="cbs-filter-chip chip-purple">
                  IIMs, IITs & Premier
                  <button type="button" onClick={() => toggleCircuit('iim-iit-premier')}>✕</button>
                </span>
              )}
              {selectedCircuits.includes('corporate-global') && (
                <span className="cbs-filter-chip chip-purple">
                  Corporate & Global
                  <button type="button" onClick={() => toggleCircuit('corporate-global')}>✕</button>
                </span>
              )}
              {selectedCircuits.includes('others') && (
                <span className="cbs-filter-chip chip-purple">
                  Others
                  <button type="button" onClick={() => toggleCircuit('others')}>✕</button>
                </span>
              )}

              {/* Track Chips */}
              {selectedTracks.includes('case') && (
                <span className="cbs-filter-chip chip-cyan">
                  Case Comps
                  <button type="button" onClick={() => toggleTrack('case')}>✕</button>
                </span>
              )}
              {selectedTracks.includes('hackathon') && (
                <span className="cbs-filter-chip chip-cyan">
                  Hackathons
                  <button type="button" onClick={() => toggleTrack('hackathon')}>✕</button>
                </span>
              )}
              {selectedTracks.includes('writing') && (
                <span className="cbs-filter-chip chip-cyan">
                  Writing & Research
                  <button type="button" onClick={() => toggleTrack('writing')}>✕</button>
                </span>
              )}
              {selectedTracks.includes('quiz') && (
                <span className="cbs-filter-chip chip-cyan">
                  Quizzes
                  <button type="button" onClick={() => toggleTrack('quiz')}>✕</button>
                </span>
              )}
              {selectedTracks.includes('simulation') && (
                <span className="cbs-filter-chip chip-cyan">
                  Simulations
                  <button type="button" onClick={() => toggleTrack('simulation')}>✕</button>
                </span>
              )}
              {selectedTracks.includes('debate') && (
                <span className="cbs-filter-chip chip-cyan">
                  Debates
                  <button type="button" onClick={() => toggleTrack('debate')}>✕</button>
                </span>
              )}

              {/* Fee Chips */}
              {feeFilter === 'free' && (
                <span className="cbs-filter-chip chip-green">
                  Free Entry
                  <button type="button" onClick={() => setFeeFilter('all')}>✕</button>
                </span>
              )}
              {feeFilter === 'paid' && (
                <span className="cbs-filter-chip chip-green">
                  Paid
                  <button type="button" onClick={() => setFeeFilter('all')}>✕</button>
                </span>
              )}

              {/* Participation Chips */}
              {teamFilter === 'solo' && (
                <span className="cbs-filter-chip chip-slate">
                  Solo Participation
                  <button type="button" onClick={() => setTeamFilter('all')}>✕</button>
                </span>
              )}
              {teamFilter === 'team' && (
                <span className="cbs-filter-chip chip-slate">
                  Teams (2+)
                  <button type="button" onClick={() => setTeamFilter('all')}>✕</button>
                </span>
              )}

              {/* Bookmarked Chip */}
              {bookmarkedOnly && (
                <span className="cbs-filter-chip chip-amber">
                  Bookmarked
                  <button type="button" onClick={() => setBookmarkedOnly(false)}>✕</button>
                </span>
              )}

              {/* Search Query Chip */}
              {searchQuery && (
                <span className="cbs-filter-chip chip-slate">
                  "{searchQuery}"
                  <button type="button" onClick={() => setSearchQuery('')}>✕</button>
                </span>
              )}

              {/* Reset Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  className="cbs-chip-reset-btn"
                  onClick={handleResetFilters}
                >
                  <RotateCcwIcon size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Competitions Grid */}
          {loading ? (
            <div className="cbs-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="cbs-card-skeleton">
                  <div className="cbs-skel-header" />
                  <div className="cbs-skel-title" />
                  <div className="cbs-skel-prize" />
                  <div className="cbs-skel-meta" />
                  <div className="cbs-skel-actions" />
                </div>
              ))}
            </div>
          ) : error && competitions.length === 0 ? (
            <div className="cbs-empty-state">
              <div className="cbs-empty-icon">⚠️</div>
              <h3>Unable to fetch live listings</h3>
              <p>{error}</p>
              <button
                type="button"
                className="cbs-btn-apply"
                onClick={loadCompetitions}
              >
                Retry Ingestion
              </button>
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className="cbs-empty-state">
              <div className="cbs-empty-icon">🔍</div>
              <h3>No matching opportunities found</h3>
              <p>Try clearing active filters or adjusting your search term.</p>
              <button
                type="button"
                className="cbs-btn-team"
                onClick={handleResetFilters}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="cbs-grid">
              {filteredCompetitions.map((comp) => {
                const bookmarked = isBookmarked(comp.id);
                const urgency = getUrgencyData(comp.deadline, comp.remainDaysText);

                return (
                  <article
                    key={comp.id}
                    className="cbs-comp-card"
                    onClick={() => {
                      if (comp.unstopUrl) {
                        window.open(comp.unstopUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    {/* Top Identity Row */}
                    <div className="cbs-card-top-row">
                      <div className="cbs-card-host-block">
                        {comp.orgLogo ? (
                          <img
                            src={comp.orgLogo}
                            alt=""
                            className="cbs-card-host-logo"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="cbs-card-host-avatar"
                          style={{ display: comp.orgLogo ? 'none' : 'flex' }}
                        >
                          {(comp.orgName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <span className="cbs-card-host-name" title={comp.orgName}>
                          {comp.orgName || 'Academic Institution'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`cbs-card-bookmark-btn ${bookmarked ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(comp.id);
                        }}
                        title={bookmarked ? 'Remove Bookmark' : 'Save Opportunity'}
                        aria-label="Bookmark competition"
                      >
                        <BookmarkIcon size={16} filled={bookmarked} />
                      </button>
                    </div>

                    {/* Competition Title */}
                    <h2 className="cbs-card-title" title={comp.title}>
                      <a
                        href={comp.unstopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {comp.title}
                      </a>
                    </h2>

                    {/* Mint Green Prize Banner */}
                    <div className="cbs-prize-banner">
                      <div className="cbs-prize-left">
                        <TrophyIcon size={13} className="cbs-prize-icon" />
                        <span className="cbs-prize-text">
                          {comp.prizes || 'Certificates & Recognition'}
                        </span>
                      </div>
                      <span className={`cbs-entry-pill ${comp.isFree ? 'free' : 'paid'}`}>
                        {comp.isFree ? 'Free Entry' : 'Paid'}
                      </span>
                    </div>

                    {/* Specs Row: Team Size + Deadline */}
                    <div className="cbs-card-specs-row">
                      <div className="cbs-spec-col">
                        <UsersIcon size={12} className="cbs-spec-icon" />
                        <span>{comp.teamSizeDisplay || 'Solo / Team'}</span>
                      </div>
                      <span className="cbs-spec-bullet">•</span>
                      <div className="cbs-spec-col">
                        <CalendarIcon size={12} className="cbs-spec-icon" />
                        <span>{formatDeadline(comp.deadline)}</span>
                      </div>
                    </div>

                    {/* Social Proof + Urgency Countdown */}
                    <div className="cbs-card-metrics-row">
                      <div className="cbs-registrations-count">
                        <UsersIcon size={12} className="cbs-reg-icon" />
                        <span>
                          <strong>{Number(comp.registeredCount || 0).toLocaleString('en-IN')}</strong> registrations
                        </span>
                      </div>

                      <span className={`cbs-urgency-chip ${urgency.type}`}>
                        <span className="cbs-urgency-dot" />
                        <span>{urgency.label}</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="cbs-card-actions-row">
                      <a
                        href={comp.unstopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cbs-btn-apply"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Apply on Unstop</span>
                        <ExternalLinkIcon size={12} />
                      </a>

                      <button
                        type="button"
                        className="cbs-btn-team"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFindTeammates(comp, e);
                        }}
                      >
                        <UsersIcon size={12} />
                        <span>Find Teammates</span>
                      </button>

                      <button
                        type="button"
                        className={`cbs-btn-share ${copiedId === comp.id ? 'copied' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(comp, e);
                        }}
                        aria-label="Copy competition details"
                      >
                        {copiedId === comp.id ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
