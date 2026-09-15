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
  CheckIcon
} from './icons';
import './CompetitionsPage.css';

export default function CompetitionsPage({ onFindTeammates, showToast, bookmarkedOnly, setBookmarkedOnly, onCountUpdate }) {
  const { bookmarks, toggleBookmark, isBookmarked } = useAuth();

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCircuits, setSelectedCircuits] = useState([]); // [] means all
  const [selectedTracks, setSelectedTracks] = useState([]); // [] means all
  const [teamFilter, setTeamFilter] = useState('all'); // all | solo | team
  const [feeFilter, setFeeFilter] = useState('all'); // all | free | paid
  const [sortBy, setSortBy] = useState('closing-soonest');
  const [copiedId, setCopiedId] = useState(null);

  // Fetch real competitions from /api/competitions
  const loadCompetitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/competitions');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch competitions`);
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setCompetitions(json.data);
        if (onCountUpdate) onCountUpdate(json.data.length);
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (err) {
      console.error('Error loading competitions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompetitions();
  }, []);

  // Compute live metrics across circuits and tracks
  const metrics = useMemo(() => {
    return {
      total: competitions.length,
      du: competitions.filter(c => c.isDU).length,
      iimIitPremier: competitions.filter(c => c.isPremier).length,
      corporateGlobal: competitions.filter(c => c.isCorporate).length,
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
    if (circuitId === 'all') {
      setSelectedCircuits([]);
      if (bookmarkedOnly) setBookmarkedOnly(false);
      return;
    }
    if (bookmarkedOnly) setBookmarkedOnly(false);
    setSelectedCircuits(prev =>
      prev.includes(circuitId) ? prev.filter(c => c !== circuitId) : [...prev, circuitId]
    );
  };

  // Track toggling
  const toggleTrack = (trackId) => {
    if (trackId === 'all') {
      setSelectedTracks([]);
      return;
    }
    setSelectedTracks(prev =>
      prev.includes(trackId) ? prev.filter(t => t !== trackId) : [...prev, trackId]
    );
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
        const matchesAnyCircuit =
          (selectedCircuits.includes('du') && item.isDU) ||
          (selectedCircuits.includes('iim-iit-premier') && item.isPremier) ||
          (selectedCircuits.includes('corporate-global') && item.isCorporate);
        if (!matchesAnyCircuit) return false;
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

  return (
    <div className="case-comps-container">
      {/* Editorial Header */}
      <div className="cc-editorial-hero">
        <div className="cc-brand-badge">
          <span className="label-mono">TWO19 LABS // ONESTOP</span>
          <span className="cc-meta-stamp">UNDERGRAD OPPORTUNITY ENGINE</span>
        </div>
        <h1 className="cc-hero-headline">
          COLLEGIATE COMPETITIONS<span className="blue-dot">.</span>
        </h1>
        <p className="cc-hero-sub">
          Aggregating active undergraduate opportunities. MBA restrictions purged. Clean, engineered tracking across DU, IITs, IIMs, and Global circuits. <span className="serif-accent">ready to compete?</span>
        </p>
      </div>

      {/* ── Filter Bar & Search ── */}
      <div className="cc-filter-section">
        {/* Search Row */}
        <div className="cc-search-wrapper">
          <SearchIcon size={16} className="cc-search-icon" />
          <input
            type="text"
            className="cc-search-input"
            placeholder="Search by competition name, IIM, IIT, SRCC, L'Oréal, prize..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="cc-clear-search" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Row 1: Circuit Tabs + Right-Aligned Bookmarks */}
        <div className="cc-tabs">
          <div className="cc-circuit-tabs-group">
            <button
              type="button"
              className={`cc-tab-btn ${selectedCircuits.length === 0 && !bookmarkedOnly ? 'active' : ''}`}
              onClick={() => toggleCircuit('all')}
            >
              All Circuits ({metrics.total})
            </button>
            <button
              type="button"
              className={`cc-tab-btn ${selectedCircuits.includes('du') ? 'active' : ''}`}
              onClick={() => toggleCircuit('du')}
            >
              🎓 DU Circuit ({metrics.du})
            </button>
            <button
              type="button"
              className={`cc-tab-btn ${selectedCircuits.includes('iim-iit-premier') ? 'active' : ''}`}
              onClick={() => toggleCircuit('iim-iit-premier')}
            >
              🏛️ IIMs, IITs & Premier ({metrics.iimIitPremier})
            </button>
            <button
              type="button"
              className={`cc-tab-btn ${selectedCircuits.includes('corporate-global') ? 'active' : ''}`}
              onClick={() => toggleCircuit('corporate-global')}
            >
              🏢 Corporate & Global ({metrics.corporateGlobal})
            </button>
          </div>

          <button
            type="button"
            className={`cc-tab-btn cc-tab-bookmarked ${bookmarkedOnly ? 'active' : ''}`}
            onClick={toggleBookmarkedOnly}
          >
            🔖 Bookmarked ({bookmarks.length})
          </button>
        </div>

        {/* Row 2: Discipline Track Chips */}
        <div className="cc-category-bar">
          <button className={`cc-cat-pill ${selectedTracks.length === 0 ? 'active' : ''}`} onClick={() => toggleTrack('all')}>
            All Tracks ({metrics.total})
          </button>
          <button className={`cc-cat-pill ${selectedTracks.includes('case') ? 'active' : ''}`} onClick={() => toggleTrack('case')}>
            📊 Case Comps ({metrics.cases})
          </button>
          <button className={`cc-cat-pill ${selectedTracks.includes('hackathon') ? 'active' : ''}`} onClick={() => toggleTrack('hackathon')}>
            💻 Hackathons ({metrics.hackathons})
          </button>
          <button className={`cc-cat-pill ${selectedTracks.includes('simulation') ? 'active' : ''}`} onClick={() => toggleTrack('simulation')}>
            📈 Simulations ({metrics.simulations})
          </button>
          <button className={`cc-cat-pill ${selectedTracks.includes('writing') ? 'active' : ''}`} onClick={() => toggleTrack('writing')}>
            ✍️ Writing & Research ({metrics.writing})
          </button>
          <button className={`cc-cat-pill ${selectedTracks.includes('quiz') ? 'active' : ''}`} onClick={() => toggleTrack('quiz')}>
            🧠 Quizzes ({metrics.quizzes})
          </button>
          <button className={`cc-cat-pill ${selectedTracks.includes('debate') ? 'active' : ''}`} onClick={() => toggleTrack('debate')}>
            🗣️ Debates ({metrics.debates})
          </button>
        </div>

        {/* Row 3: Segmented Controls + Sort */}
        <div className="cc-controls-bar">
          <div className="cc-controls-left">
            <div className="cc-filter-pill-group">
              <button className={`cc-filter-pill-btn ${teamFilter === 'all' ? 'active' : ''}`} onClick={() => setTeamFilter('all')}>All Formats</button>
              <button className={`cc-filter-pill-btn ${teamFilter === 'solo' ? 'active' : ''}`} onClick={() => setTeamFilter('solo')}>Solo</button>
              <button className={`cc-filter-pill-btn ${teamFilter === 'team' ? 'active' : ''}`} onClick={() => setTeamFilter('team')}>Teams</button>
            </div>

            <div className="cc-filter-pill-group">
              <button className={`cc-filter-pill-btn ${feeFilter === 'all' ? 'active' : ''}`} onClick={() => setFeeFilter('all')}>All Fees</button>
              <button className={`cc-filter-pill-btn ${feeFilter === 'free' ? 'active' : ''}`} onClick={() => setFeeFilter('free')}>Free Entry</button>
              <button className={`cc-filter-pill-btn ${feeFilter === 'paid' ? 'active' : ''}`} onClick={() => setFeeFilter('paid')}>Paid</button>
            </div>

            {hasActiveFilters && (
              <button className="cc-reset-btn" onClick={handleResetFilters}>Reset Filters</button>
            )}
          </div>

          <div className="cc-controls-right">
            <span className="cc-results-count">Showing <strong>{filteredCompetitions.length}</strong> opportunities</span>
            <div className="cc-sort-box">
              <span className="cc-sort-label">Sort:</span>
              <select className="cc-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="closing-soonest">Closing Soonest ⏰</option>
                <option value="closing-latest">Closing Latest 📅</option>
                <option value="prize-highest">Highest Prize Pool 🏆</option>
                <option value="popular">Most Popular 🔥</option>
                <option value="title-asc">Title (A → Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Competitions Grid ── */}
      <main>
        {loading ? (
          <div className="cc-loading-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="cc-skeleton-card">
                <div className="cc-skeleton-bar" style={{ width: '40%' }}></div>
                <div className="cc-skeleton-bar title"></div>
                <div className="cc-skeleton-bar prize"></div>
                <div className="cc-skeleton-bar" style={{ width: '60%' }}></div>
                <div className="cc-skeleton-bar btn"></div>
              </div>
            ))}
          </div>
        ) : error && competitions.length === 0 ? (
          <div className="cc-empty-state">
            <div className="cc-empty-icon">⚠️</div>
            <h3>Unable to fetch live listings</h3>
            <p>{error}</p>
            <button className="cc-action-btn cc-btn-apply" style={{ margin: '0 auto' }} onClick={loadCompetitions}>
              Retry Ingestion
            </button>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className="cc-empty-state">
            <div className="cc-empty-icon">🔍</div>
            <h3>No matching opportunities found</h3>
            <p>Try clearing your active filters or searching for another keyword.</p>
            <button className="cc-action-btn cc-btn-team" style={{ margin: '0 auto' }} onClick={handleResetFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="cc-grid">
            {filteredCompetitions.map((comp) => {
              const bookmarked = isBookmarked(comp.id);

              return (
                <article key={comp.id} className="cc-card">
                  <div className="cc-card-inner">
                    {/* Host Identity + Bookmark */}
                    <div className="cc-card-top-bar">
                      <div className="cc-host-identity">
                        {comp.orgLogo ? (
                          <img
                            src={comp.orgLogo}
                            alt=""
                            className="cc-host-logo"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="cc-host-avatar" style={{ display: comp.orgLogo ? 'none' : 'flex' }}>
                          {(comp.orgName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="cc-host-meta">
                          <span className="cc-host-name" title={comp.orgName}>
                            {comp.orgName || 'Academic Host'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`cc-card-bookmark-btn ${bookmarked ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(comp.id);
                        }}
                        title={bookmarked ? "Remove Bookmark" : "Save Opportunity"}
                      >
                        <BookmarkIcon size={16} filled={bookmarked} />
                      </button>
                    </div>

                    {/* Clamped Title (Strict Vertical Alignment) */}
                    <h2 className="cc-card-title" title={comp.title}>
                      {comp.title}
                    </h2>

                    {/* Mint Green Prize Bar */}
                    <div className="cc-prize-bar">
                      <div className="cc-prize-left">
                        <TrophyIcon size={14} className="cc-prize-trophy" />
                        <span className="cc-prize-text">{comp.prizes || 'Certificates & Recognition'}</span>
                      </div>
                      <span className={`cc-entry-tag ${comp.isFree ? 'free' : 'paid'}`}>
                        {comp.isFree ? 'Free Entry' : 'Paid'}
                      </span>
                    </div>

                    {/* Specs Row */}
                    <div className="cc-specs-row">
                      <div className="cc-spec-item">
                        <UsersIcon size={13} />
                        <span>{comp.teamSizeDisplay || 'Solo / Team'}</span>
                      </div>
                      <div className="cc-spec-dot" />
                      <div className="cc-spec-item">
                        <CalendarIcon size={13} />
                        <span>
                          Ends {comp.deadline ? new Date(comp.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Metric: Social Proof + Live Urgency Countdown */}
                    <div className="cc-card-footer-metric">
                      <span className="cc-reg-count">
                        <FlameIcon size={12} className="cc-reg-icon" />
                        <strong>{Number(comp.registeredCount || 0).toLocaleString()}</strong> registrations
                      </span>
                      <span className={`cc-countdown-chip ${comp.urgency === 'high' ? 'red' : comp.urgency === 'medium' ? 'yellow' : 'green'}`}>
                        <span className="cc-status-dot" />
                        <ClockIcon size={12} />
                        <span>{comp.remainDaysText || 'Active'}</span>
                      </span>
                    </div>

                    {/* Actions: Primary Apply Button + Tinted Squad Up */}
                    <div className="cc-card-actions">
                      <a href={comp.unstopUrl} target="_blank" rel="noopener noreferrer" className="cc-action-btn cc-btn-apply">
                        <span>Apply Now</span>
                        <ExternalLinkIcon size={12} />
                      </a>

                      {comp.maxTeam > 1 && (
                        <button type="button" className="cc-action-btn cc-btn-team" onClick={(e) => handleFindTeammates(comp, e)}>
                          <UsersIcon size={13} />
                          <span>Squad Up</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className={`cc-share-icon-btn ${copiedId === comp.id ? 'copied' : ''}`}
                        onClick={(e) => handleShare(comp, e)}
                        title="Copy share snippet"
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
      </main>
    </div>
  );
}
