// src/components/CompetitionsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  SearchIcon,
  FilterIcon,
  TrophyIcon,
  UsersIcon,
  BookmarkIcon,
  ClockIcon,
  CalendarIcon,
  FlameIcon,
  ExternalLinkIcon,
  ShareIcon,
  CheckIcon,
  ShieldCheckIcon
} from './icons';
import './CompetitionsPage.css';

const CIRCUITS = [
  { id: 'all', label: 'All Circuits' },
  { id: 'du', label: 'DU Circuit 🏛️' },
  { id: 'premier', label: 'IIM / IIT & Premier 🎓' },
  { id: 'corporate', label: 'Corporate & Global 🌐' },
];

const TRACKS = [
  { id: 'all', label: 'All Disciplines', emoji: '🎯' },
  { id: 'case', label: 'Case Comps', emoji: '📊' },
  { id: 'hackathon', label: 'Hackathons', emoji: '💻' },
  { id: 'simulation', label: 'Simulations & Auctions', emoji: '📈' },
  { id: 'writing', label: 'Writing & Research', emoji: '✍️' },
  { id: 'quiz', label: 'Quizzes & Trivia', emoji: '🧠' },
  { id: 'debate', label: 'Debates & MUN', emoji: '🗣️' },
];

export default function CompetitionsPage({ onFindTeammates, showToast, bookmarkedOnly, setBookmarkedOnly, onCountUpdate }) {
  const { bookmarks, toggleBookmark, isBookmarked } = useAuth();

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCircuit, setSelectedCircuit] = useState('all');
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [teamSizeFilter, setTeamSizeFilter] = useState('all'); // all | solo | team
  const [feeFilter, setFeeFilter] = useState('all'); // all | free | paid
  const [sortBy, setSortBy] = useState('closing-soon');
  const [copiedId, setCopiedId] = useState(null);

  // Fetch competitions from /api/competitions
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
        setLastUpdated(json.updatedAt ? new Date(json.updatedAt) : new Date());
      } else {
        throw new Error('Invalid response structure');
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

  // Format end date nicely (e.g. "Ends 24 Mar 2026")
  const formatEndDate = (dateStr) => {
    if (!dateStr) return 'Ongoing';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Ongoing';
      return `Ends ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } catch {
      return 'Ongoing';
    }
  };

  // 1-Click Share functionality
  const handleShare = async (comp, e) => {
    e.stopPropagation();
    const shareText = `🏆 ${comp.title}\n🏛️ Organized by: ${comp.orgName}\n💰 Prizes: ${comp.prizes}\n👥 Format: ${comp.teamSizeDisplay}\n⏰ Deadline: ${formatEndDate(comp.deadline)}\n🔗 Apply on Unstop: ${comp.unstopUrl}\n\nVia Arena (Collegiate Competition Hub)`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        setCopiedId(comp.id);
        if (showToast) showToast('Competition details copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2500);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedId(comp.id);
        if (showToast) showToast('Competition details copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch (err) {
      console.warn('Share copy failed:', err);
    }
  };

  // Find Teammates handler with pre-fill handshake
  const handleFindTeammates = (comp) => {
    const prefill = {
      competition_name: comp.title,
      organizer: comp.orgName,
      competition_link: comp.unstopUrl,
      total_members: comp.maxTeam || 4,
    };
    sessionStorage.setItem('comp_team_prefill', JSON.stringify(prefill));
    if (onFindTeammates) onFindTeammates(prefill);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCircuit('all');
    setSelectedTrack('all');
    setTeamSizeFilter('all');
    setFeeFilter('all');
    setSortBy('closing-soon');
    setBookmarkedOnly(false);
  };

  // Filter and Sort Pipeline
  const filteredCompetitions = useMemo(() => {
    return competitions.filter((item) => {
      // Bookmarked filter
      if (bookmarkedOnly && !isBookmarked(item.id)) return false;

      // Circuit filter
      if (selectedCircuit === 'du' && !item.isDU) return false;
      if (selectedCircuit === 'premier' && !item.isPremier) return false;
      if (selectedCircuit === 'corporate' && !item.isCorporate) return false;

      // Discipline Track filter
      if (selectedTrack !== 'all' && item.category !== selectedTrack) return false;

      // Team size filter
      if (teamSizeFilter === 'solo' && item.maxTeam > 1) return false;
      if (teamSizeFilter === 'team' && item.maxTeam <= 1) return false;

      // Fee filter
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
      if (sortBy === 'closing-soon') {
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
      if (sortBy === 'prize-high') {
        const extractNum = (str) => {
          if (!str) return 0;
          const match = str.replace(/,/g, '').match(/₹(\d+)/);
          return match ? Number(match[1]) : 0;
        };
        return extractNum(b.prizes) - extractNum(a.prizes);
      }
      if (sortBy === 'alpha') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [competitions, bookmarkedOnly, selectedCircuit, selectedTrack, teamSizeFilter, feeFilter, searchQuery, sortBy, bookmarks]);

  return (
    <div className="competitions-view">
      {/* Editorial Hero Section */}
      <section className="competitions-hero">
        <div className="hero-content">
          <div className="hero-badge-row">
            <div className="hero-live-pill">
              <span className="pulse-dot"></span>
              <strong>{competitions.length}</strong> Active Undergraduate Competitions
            </div>
            <div className="hero-filter-pill">
              <ShieldCheckIcon size={14} color="var(--primary)" />
              <span>Strict Undergrad Eligibility Enforced</span>
            </div>
          </div>
          <h1 className="hero-title">Discover collegiate competitions, filter the noise, assemble your squad.</h1>
          <p className="hero-sub">
            Real-time opportunities synced from Unstop. MBA-restricted programs and dead listings stripped out. Handcrafted for DU, IITs, BITS, and undergraduate circuits across India.
          </p>
        </div>

        {/* Search & Master Filters */}
        <div className="filters-card">
          <div className="search-row">
            <div className="search-input-wrapper">
              <SearchIcon size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by competition title, college (e.g. SRCC, IITB), firm (Bain, L'Oréal), or prize..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>

            <div className="sort-wrapper">
              <span className="sort-label">Sort by:</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="closing-soon">Closing Soonest ⏰</option>
                <option value="closing-latest">Closing Latest 📅</option>
                <option value="popular">Most Popular 🔥</option>
                <option value="prize-high">Highest Prize Pool 🏆</option>
                <option value="alpha">Title (A → Z)</option>
              </select>
            </div>
          </div>

          {/* Circuit Pills */}
          <div className="filter-group">
            <span className="filter-group-label">Circuit:</span>
            <div className="pill-row">
              {CIRCUITS.map((circuit) => (
                <button
                  key={circuit.id}
                  className={`circuit-pill ${selectedCircuit === circuit.id ? 'active' : ''}`}
                  onClick={() => setSelectedCircuit(circuit.id)}
                >
                  {circuit.label}
                </button>
              ))}
            </div>
          </div>

          {/* Track Chips */}
          <div className="filter-group">
            <span className="filter-group-label">Discipline:</span>
            <div className="chip-row">
              {TRACKS.map((track) => (
                <button
                  key={track.id}
                  className={`track-chip ${selectedTrack === track.id ? 'active' : ''}`}
                  onClick={() => setSelectedTrack(track.id)}
                >
                  <span className="chip-emoji">{track.emoji}</span>
                  <span>{track.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Controls Bar */}
          <div className="secondary-controls-row">
            <div className="sub-filter-group">
              <span className="sub-label">Team Size:</span>
              <div className="toggle-btn-group">
                <button
                  className={`toggle-btn ${teamSizeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTeamSizeFilter('all')}
                >
                  All
                </button>
                <button
                  className={`toggle-btn ${teamSizeFilter === 'solo' ? 'active' : ''}`}
                  onClick={() => setTeamSizeFilter('solo')}
                >
                  Solo
                </button>
                <button
                  className={`toggle-btn ${teamSizeFilter === 'team' ? 'active' : ''}`}
                  onClick={() => setTeamSizeFilter('team')}
                >
                  Team
                </button>
              </div>
            </div>

            <div className="sub-filter-group">
              <span className="sub-label">Fee:</span>
              <div className="toggle-btn-group">
                <button
                  className={`toggle-btn ${feeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setFeeFilter('all')}
                >
                  All
                </button>
                <button
                  className={`toggle-btn ${feeFilter === 'free' ? 'active' : ''}`}
                  onClick={() => setFeeFilter('free')}
                >
                  Free Entry
                </button>
                <button
                  className={`toggle-btn ${feeFilter === 'paid' ? 'active' : ''}`}
                  onClick={() => setFeeFilter('paid')}
                >
                  Paid
                </button>
              </div>
            </div>

            {(searchQuery || selectedCircuit !== 'all' || selectedTrack !== 'all' || teamSizeFilter !== 'all' || feeFilter !== 'all' || bookmarkedOnly) && (
              <button className="reset-filters-btn" onClick={resetFilters}>
                Reset Filters
              </button>
            )}

            <div className="results-counter">
              Showing <strong>{filteredCompetitions.length}</strong> matching opportunities
            </div>
          </div>
        </div>
      </section>

      {/* Grid Content */}
      <main className="competitions-main">
        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="comp-card-skeleton">
                <div className="skeleton-header">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-lines">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
                <div className="skeleton-line medium" style={{ margin: '1rem 0' }}></div>
                <div className="skeleton-banner"></div>
                <div className="skeleton-footer"></div>
              </div>
            ))}
          </div>
        ) : error && competitions.length === 0 ? (
          <div className="error-state">
            <h3>Unable to fetch live listings</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadCompetitions}>
              Retry Ingestion
            </button>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No matching opportunities found</h3>
            <p>Try clearing some filters or searching for broader terms like "case", "hackathon", or "SRCC".</p>
            <button className="btn-secondary" onClick={resetFilters}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="competitions-grid">
            {filteredCompetitions.map((comp) => {
              const bookmarked = isBookmarked(comp.id);
              const isClosingFast = comp.urgency === 'high';

              return (
                <article key={comp.id} className={`comp-card ${isClosingFast ? 'card-urgent' : ''}`}>
                  {/* Top Bar: Org Info & Bookmark */}
                  <div className="card-top-row">
                    <div className="org-info-group">
                      {comp.orgLogo ? (
                        <img
                          src={comp.orgLogo}
                          alt={comp.orgName}
                          className="org-logo-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="org-fallback-avatar" style={{ display: comp.orgLogo ? 'none' : 'flex' }}>
                        {(comp.orgName || 'A').charAt(0).toUpperCase()}
                      </div>

                      <div className="org-text-meta">
                        <span className="org-name" title={comp.orgName}>
                          {comp.orgName}
                        </span>
                        <div className="badge-row-small">
                          {comp.isDU && <span className="circuit-tag du">DU Circuit</span>}
                          {comp.isPremier && <span className="circuit-tag premier">IIM / IIT Tier-1</span>}
                          {comp.isCorporate && <span className="circuit-tag corporate">Corporate / Global</span>}
                          <span className="category-tag-small">
                            {comp.categoryEmoji} {comp.categoryLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
                      onClick={() => toggleBookmark(comp.id)}
                      title={bookmarked ? "Remove Bookmark" : "Save Competition"}
                      aria-label="Bookmark"
                    >
                      <BookmarkIcon size={18} filled={bookmarked} color={bookmarked ? "var(--warning)" : "var(--ink-dim)"} />
                    </button>
                  </div>

                  {/* Title */}
                  <h2 className="comp-title" title={comp.title}>
                    <a href={comp.unstopUrl} target="_blank" rel="noopener noreferrer">
                      {comp.title}
                    </a>
                  </h2>

                  {/* Prize Banner */}
                  <div className="prize-pool-banner">
                    <div className="prize-main">
                      <TrophyIcon size={18} color="var(--accent-gold)" />
                      <span className="prize-text">{comp.prizes}</span>
                    </div>
                    <span className={`fee-pill ${comp.isFree ? 'free' : 'paid'}`}>
                      {comp.isFree ? 'Free Entry' : 'Paid'}
                    </span>
                  </div>

                  {/* Specifications Row */}
                  <div className="specs-row">
                    <div className="spec-item">
                      <UsersIcon size={15} color="var(--ink-dim)" />
                      <span>{comp.teamSizeDisplay}</span>
                    </div>
                    <div className="spec-item">
                      <CalendarIcon size={15} color="var(--ink-dim)" />
                      <span>{formatEndDate(comp.deadline)}</span>
                    </div>
                  </div>

                  {/* Urgency & Social Proof Row */}
                  <div className="social-proof-row">
                    <div className="registration-proof">
                      <FlameIcon size={15} color="#ea580c" />
                      <span>{Number(comp.registeredCount || 0).toLocaleString('en-IN')} registered</span>
                    </div>

                    {comp.urgency === 'high' ? (
                      <span className="urgency-chip high">
                        ⚡ {comp.remainDaysText}
                      </span>
                    ) : comp.urgency === 'medium' ? (
                      <span className="urgency-chip medium">
                        ⏰ {comp.remainDaysText}
                      </span>
                    ) : (
                      <span className="urgency-chip normal">
                        ⏱️ {comp.remainDaysText}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="card-actions-row">
                    <a
                      href={comp.unstopUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-apply"
                    >
                      <span>Apply on Unstop</span>
                      <ExternalLinkIcon size={14} />
                    </a>

                    <button
                      className="btn-find-team"
                      onClick={() => handleFindTeammates(comp)}
                      title="Find batchmates and teammates for this competition"
                    >
                      <UsersIcon size={14} />
                      <span>Squad Up</span>
                    </button>

                    <button
                      className={`btn-share ${copiedId === comp.id ? 'copied' : ''}`}
                      onClick={(e) => handleShare(comp, e)}
                      title="Copy pre-formatted share snippet"
                    >
                      {copiedId === comp.id ? <CheckIcon size={14} color="var(--success)" /> : <ShareIcon size={14} />}
                    </button>
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
