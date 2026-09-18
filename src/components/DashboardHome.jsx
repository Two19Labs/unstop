// src/components/DashboardHome.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  SearchIcon,
  ClockIcon,
  TrophyIcon,
  UsersIcon,
  FlameIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  ZapIcon,
  ChevronDownIcon,
  BookmarkIcon,
  WhatsAppIcon,
  UserIcon,
  FilterIcon,
  CloseIcon,
  RotateCcwIcon,
  SparklesIcon
} from './icons';
import './DashboardHome.css';

const CIRCUIT_LABELS = {
  'du': 'DU Circuit',
  'iim-iit-premier': 'IIMs & IITs',
  'corporate-global': 'Corporate & Global',
  'others': 'Others',
};

const TRACK_LABELS = {
  'case': 'Case Comps',
  'hackathon': 'Hackathons',
  'simulation': 'Simulations',
  'quiz': 'Quizzes',
  'writing': 'Writing',
  'debate': 'Debates',
};

function getWhatsAppUrl(phone, hostName, compTitle) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  const cleanPhone = digits.slice(-10);
  if (cleanPhone.length !== 10) return null;
  const greetingName = hostName && hostName !== 'Competitor' ? ` ${hostName.split(' ')[0]}` : '';
  const msg = `Hi${greetingName}! Saw your squad post for "${compTitle}" on OneStop. I'd love to connect and discuss teaming up!`;
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

export default function DashboardHome({
  competitions = [],
  filteredCompetitions = [],
  topFilteredCompetitions = [],
  matchingSquads = [],
  metrics = {},
  user = null,
  profile = null,
  bookmarkedIds = [],
  searchQuery = '',
  onSearchChange,
  selectedCircuits = [],
  selectedTracks = [],
  teamFilter = 'all',
  feeFilter = 'all',
  sortBy = 'closing-soonest',
  activeFilterCount = 0,
  onToggleCircuit,
  onToggleTrack,
  onSetTeamFilter,
  onSetFeeFilter,
  onSetSortBy,
  onResetFilters,
  onOpenFiltersDrawer,
  onSelectCircuit,
  onSelectTrack,
  onQuickFilter,
  onFindTeammates,
  onNavigateToSquads,
  onScrollToRepository,
  onToggleBookmark
}) {
  const searchInputRef = useRef(null);

  // Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const competitorName = useMemo(() => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Competitor';
  }, [profile, user]);

  const competitorCollege = useMemo(() => {
    return profile?.college || user?.user_metadata?.college || 'Undergraduate Circuit';
  }, [profile, user]);

  // Compute total prize pool estimate
  const totalPrizeString = useMemo(() => {
    let totalLakhs = 0;
    for (const comp of competitions) {
      if (!comp.prizes) continue;
      const match = comp.prizes.replace(/,/g, '').match(/₹(\d+)/);
      if (match) {
        const val = Number(match[1]);
        if (!isNaN(val)) totalLakhs += val;
      }
    }
    if (totalLakhs >= 100000) {
      return `₹${(totalLakhs / 100000).toFixed(1)}L+`;
    }
    return '₹25L+';
  }, [competitions]);

  // Has any active non-default filter
  const hasFilterPreferences = useMemo(() => {
    return (
      (selectedCircuits && selectedCircuits.length > 0) ||
      (selectedTracks && selectedTracks.length > 0) ||
      teamFilter !== 'all' ||
      feeFilter !== 'all' ||
      (searchQuery && searchQuery.trim() !== '')
    );
  }, [selectedCircuits, selectedTracks, teamFilter, feeFilter, searchQuery]);

  // Active filter label summary
  const activeFiltersSummary = useMemo(() => {
    const parts = [];
    if (selectedCircuits && selectedCircuits.length > 0) {
      parts.push(selectedCircuits.map((id) => CIRCUIT_LABELS[id] || id).join(', '));
    }
    if (selectedTracks && selectedTracks.length > 0) {
      parts.push(selectedTracks.map((id) => TRACK_LABELS[id] || id).join(', '));
    }
    if (teamFilter === 'team') parts.push('Teams');
    if (teamFilter === 'solo') parts.push('Solo');
    if (feeFilter === 'free') parts.push('Free');
    if (feeFilter === 'paid') parts.push('Paid');
    return parts.length > 0 ? parts.join(' • ') : 'All Circuits & Categories';
  }, [selectedCircuits, selectedTracks, teamFilter, feeFilter]);

  // Fallback top competitions if prop not provided
  const displayCompetitions = topFilteredCompetitions.length > 0
    ? topFilteredCompetitions
    : filteredCompetitions.slice(0, 6);

  // Fallback squads if prop not provided
  const displaySquads = matchingSquads.length > 0
    ? matchingSquads
    : [];

  return (
    <div className="t19-dashboard-root">
      {/* ── 00 // Competitor Status Bar ── */}
      <header className="t19-dash-status-bar">
        <div className="t19-dash-status-left">
          <div className="t19-status-avatar">
            <UserIcon size={18} />
          </div>
          <div className="t19-status-info">
            <div className="t19-status-title-row">
              <span className="t19-status-greeting">{greeting},</span>
              <h2 className="t19-status-name">{competitorName}</h2>
              <span className="t19-status-college-pill">{competitorCollege}</span>
            </div>
            <div className="t19-status-meta-row">
              <span className="t19-pulse-beacon">
                <span className="t19-pulse-dot-green" />
                <span>Real-Time Unstop Sync</span>
              </span>
              <span className="t19-status-dot-sep">•</span>
              <span className="t19-status-metric">
                <strong>{competitions.length}</strong> Undergrad Opportunities
              </span>
              <span className="t19-status-dot-sep">•</span>
              <span className="t19-status-metric">
                <strong>{totalPrizeString}</strong> Total Prizes
              </span>
            </div>
          </div>
        </div>

        <div className="t19-dash-status-right">
          <button
            type="button"
            className="t19-status-btn squad-cta"
            onClick={onNavigateToSquads}
            title="Create a teammate recruitment post"
          >
            <UsersIcon size={14} />
            <span>+ Recruit Teammates</span>
          </button>

          <button
            type="button"
            className="t19-status-btn secondary"
            onClick={() => onQuickFilter && onQuickFilter('bookmarked')}
            title="View your saved opportunities"
          >
            <BookmarkIcon size={14} filled={bookmarkedIds.length > 0} color="var(--color-lab-blue)" />
            <span>Saved ({bookmarkedIds.length})</span>
          </button>
        </div>
      </header>

      {/* ── 01 // Saved Filter Preferences Bar ── */}
      <section className="t19-filter-prefs-bar">
        <div className="t19-filter-prefs-left">
          <div className="t19-filter-prefs-label-group">
            <FilterIcon size={14} className="t19-filter-icon" />
            <span className="t19-prefs-label">YOUR RADAR FILTERS:</span>
          </div>

          <div className="t19-active-pills-list">
            {selectedCircuits && selectedCircuits.map((circuitId) => (
              <span key={`pill-circuit-${circuitId}`} className="t19-active-pill circuit">
                <span>🏛️ {CIRCUIT_LABELS[circuitId] || circuitId}</span>
                <button
                  type="button"
                  className="t19-pill-remove"
                  onClick={() => onToggleCircuit && onToggleCircuit(circuitId)}
                  title="Remove this circuit filter"
                >
                  ✕
                </button>
              </span>
            ))}

            {selectedTracks && selectedTracks.map((trackId) => (
              <span key={`pill-track-${trackId}`} className="t19-active-pill track">
                <span>🎯 {TRACK_LABELS[trackId] || trackId}</span>
                <button
                  type="button"
                  className="t19-pill-remove"
                  onClick={() => onToggleTrack && onToggleTrack(trackId)}
                  title="Remove this category filter"
                >
                  ✕
                </button>
              </span>
            ))}

            {teamFilter !== 'all' && (
              <span className="t19-active-pill format">
                <span>👥 {teamFilter === 'solo' ? 'Solo Only' : 'Teams (2+)'}</span>
                <button
                  type="button"
                  className="t19-pill-remove"
                  onClick={() => onSetTeamFilter && onSetTeamFilter('all')}
                  title="Remove team filter"
                >
                  ✕
                </button>
              </span>
            )}

            {feeFilter !== 'all' && (
              <span className="t19-active-pill fee">
                <span>{feeFilter === 'free' ? '🆓 Free Entry' : '💳 Paid'}</span>
                <button
                  type="button"
                  className="t19-pill-remove"
                  onClick={() => onSetFeeFilter && onSetFeeFilter('all')}
                  title="Remove fee filter"
                >
                  ✕
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="t19-active-pill search">
                <span>🔍 "{searchQuery}"</span>
                <button
                  type="button"
                  className="t19-pill-remove"
                  onClick={() => onSearchChange && onSearchChange('')}
                  title="Clear search query"
                >
                  ✕
                </button>
              </span>
            )}

            {!hasFilterPreferences && (
              <span className="t19-active-pill default">
                <span>🌐 All Circuits & Categories (Saved Default)</span>
              </span>
            )}
          </div>
        </div>

        <div className="t19-filter-prefs-right">
          {hasFilterPreferences && (
            <button
              type="button"
              className="t19-reset-prefs-btn"
              onClick={onResetFilters}
              title="Reset all filters to defaults"
            >
              <RotateCcwIcon size={12} />
              <span>Reset Filters</span>
            </button>
          )}

          <button
            type="button"
            className="t19-change-filters-btn"
            onClick={onScrollToRepository}
            title="Change & refine deep filters below"
          >
            <span>⚙️ Change Filters</span>
            <ChevronDownIcon size={12} />
          </button>
        </div>
      </section>

      {/* ── 02 // Quick Filter Switchers (1-click toggle) ── */}
      <div className="t19-quick-filter-strip">
        <span className="t19-quick-label">Quick Switch:</span>

        <button
          type="button"
          className={`t19-quick-chip ${selectedCircuits.includes('du') ? 'active' : ''}`}
          onClick={() => onToggleCircuit && onToggleCircuit('du')}
        >
          🏛️ DU Circuit
        </button>

        <button
          type="button"
          className={`t19-quick-chip ${selectedCircuits.includes('iim-iit-premier') ? 'active' : ''}`}
          onClick={() => onToggleCircuit && onToggleCircuit('iim-iit-premier')}
        >
          🎓 IIMs & IITs
        </button>

        <button
          type="button"
          className={`t19-quick-chip ${selectedCircuits.includes('corporate-global') ? 'active' : ''}`}
          onClick={() => onToggleCircuit && onToggleCircuit('corporate-global')}
        >
          💼 Corporate Flagships
        </button>

        <span className="t19-strip-divider">|</span>

        <button
          type="button"
          className={`t19-quick-chip ${selectedTracks.includes('case') ? 'active' : ''}`}
          onClick={() => onToggleTrack && onToggleTrack('case')}
        >
          📊 Case Comps
        </button>

        <button
          type="button"
          className={`t19-quick-chip ${selectedTracks.includes('hackathon') ? 'active' : ''}`}
          onClick={() => onToggleTrack && onToggleTrack('hackathon')}
        >
          💻 Hackathons
        </button>

        <button
          type="button"
          className={`t19-quick-chip ${selectedTracks.includes('simulation') ? 'active' : ''}`}
          onClick={() => onToggleTrack && onToggleTrack('simulation')}
        >
          📈 Simulations
        </button>

        <button
          type="button"
          className={`t19-quick-chip ${feeFilter === 'free' ? 'active' : ''}`}
          onClick={() => onSetFeeFilter && onSetFeeFilter(feeFilter === 'free' ? 'all' : 'free')}
        >
          🆓 Free Entry
        </button>
      </div>

      {/* ── 03 // THE 50/50 SPLIT SCREEN ── */}
      <div className="t19-split-dashboard">
        {/* ════════════════════════════════════════════════════════════
            LEFT HALF (50%): TOP 5-6 COMPETITIONS MATCHING FILTERS
           ════════════════════════════════════════════════════════════ */}
        <section className="t19-split-column t19-split-comps">
          <div className="t19-column-header">
            <div className="t19-column-header-left">
              <span className="t19-column-idx">01 //</span>
              <h3 className="t19-column-title">TOP MATCHING COMPETITIONS</h3>
              <span className="t19-column-badge comps">
                {displayCompetitions.length} of {filteredCompetitions.length} Live
              </span>
            </div>

            <button
              type="button"
              className="t19-column-header-link"
              onClick={onScrollToRepository}
              title="Open full catalog below"
            >
              <span>View All ({filteredCompetitions.length})</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>

          <p className="t19-column-subtext">
            Top live competitions matching your active filters: <strong>{activeFiltersSummary}</strong>.
          </p>

          <div className="t19-split-card-list">
            {displayCompetitions.length === 0 ? (
              <div className="t19-empty-column-state">
                <div className="t19-empty-icon">🔍</div>
                <h4 className="t19-empty-title">No competitions match your current filters</h4>
                <p className="t19-empty-desc">
                  Try clearing some filter tags or search terms to broaden your results.
                </p>
                <button
                  type="button"
                  className="t19-empty-action-btn"
                  onClick={onResetFilters}
                >
                  Reset Filter Preferences
                </button>
              </div>
            ) : (
              displayCompetitions.map((comp) => {
                const diff = comp.deadline ? new Date(comp.deadline).getTime() - Date.now() : 0;
                const hoursLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
                const daysLeft = Math.floor(hoursLeft / 24);
                const remHours = hoursLeft % 24;
                const mins = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

                let countdownText = 'Ongoing';
                let urgencyClass = 'green';
                if (diff > 0) {
                  if (daysLeft === 0) {
                    countdownText = `⏳ ${remHours}h ${mins}m left`;
                    urgencyClass = 'red';
                  } else if (daysLeft <= 2) {
                    countdownText = `⏳ ${daysLeft}d ${remHours}h left`;
                    urgencyClass = 'red';
                  } else if (daysLeft <= 6) {
                    countdownText = `⏳ ${daysLeft}d left`;
                    urgencyClass = 'yellow';
                  } else {
                    countdownText = `⏳ ${daysLeft}d left`;
                    urgencyClass = 'green';
                  }
                } else if (comp.deadline) {
                  countdownText = 'Closing Soon';
                  urgencyClass = 'red';
                }

                const isBookmarked = bookmarkedIds.includes(comp.id);

                return (
                  <article key={comp.id} className="t19-split-comp-card">
                    <div className="t19-comp-card-top">
                      <div className="t19-comp-org-box">
                        {comp.orgLogo ? (
                          <img
                            src={comp.orgLogo}
                            alt={comp.orgName}
                            className="t19-comp-org-logo"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="t19-comp-org-initial">
                            {(comp.orgName || 'OS').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="t19-comp-org-meta">
                          <span className="t19-comp-org-name" title={comp.orgName}>
                            {comp.orgName || 'Premier University'}
                          </span>
                          <span className="t19-comp-circuit-pill">
                            {comp.circuitLabel || 'Undergrad Open'}
                          </span>
                        </div>
                      </div>

                      <div className="t19-comp-top-right">
                        <span className={`t19-comp-countdown-pill ${urgencyClass}`}>
                          {countdownText}
                        </span>
                        <button
                          type="button"
                          className={`t19-comp-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                          onClick={(e) => onToggleBookmark && onToggleBookmark(comp.id, e)}
                          title={isBookmarked ? 'Saved to bookmarks' : 'Bookmark competition'}
                          aria-label="Bookmark competition"
                        >
                          <BookmarkIcon size={14} filled={isBookmarked} color={isBookmarked ? 'var(--color-lab-blue)' : 'currentColor'} />
                        </button>
                      </div>
                    </div>

                    <h4 className="t19-comp-card-title" title={comp.title}>
                      {comp.title}
                    </h4>

                    <div className="t19-comp-card-meta-row">
                      <span className="t19-comp-prize-badge">
                        <TrophyIcon size={12} color="var(--color-lab-blue)" />
                        <span>{comp.prizes || 'Certificates & PPIs'}</span>
                      </span>

                      <span className="t19-comp-meta-chip">
                        {comp.teamSizeDisplay || 'Solo / Team'}
                      </span>

                      <span className="t19-comp-meta-chip category">
                        {comp.categoryLabel || 'Case Comp'}
                      </span>
                    </div>

                    <div className="t19-comp-card-footer">
                      <button
                        type="button"
                        className="t19-btn-squad-action"
                        onClick={() =>
                          onFindTeammates &&
                          onFindTeammates({
                            competition_name: comp.title,
                            competition_url: comp.unstopUrl,
                            organizer: comp.orgName,
                            category: comp.category || 'case',
                            maxTeam: comp.maxTeam || 4
                          })
                        }
                        title="Find complementary teammates for this comp"
                      >
                        <ZapIcon size={12} />
                        <span>⚡ Squad Up</span>
                      </button>

                      <a
                        href={comp.unstopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="t19-btn-unstop-action"
                        title="Open application on Unstop"
                      >
                        <span>Apply</span>
                        <ExternalLinkIcon size={12} />
                      </a>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="t19-column-footer-action">
            <button
              type="button"
              className="t19-open-all-comps-btn"
              onClick={onScrollToRepository}
            >
              <span>Open All Live Comps ({filteredCompetitions.length}) & Deep Filters</span>
              <ChevronDownIcon size={15} />
            </button>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            RIGHT HALF (50%): TEAMS HOSTED FOR THE SAME FILTERS
           ════════════════════════════════════════════════════════════ */}
        <section className="t19-split-column t19-split-squads">
          <div className="t19-column-header">
            <div className="t19-column-header-left">
              <span className="t19-column-idx">02 //</span>
              <h3 className="t19-column-title">MATCHING SQUADS & ROSTERS</h3>
              <span className="t19-column-badge squads">
                Same Filtered Comps
              </span>
            </div>

            <button
              type="button"
              className="t19-post-squad-pill-btn"
              onClick={onNavigateToSquads}
              title="Post your own team requirement"
            >
              <span>+ Post Squad</span>
            </button>
          </div>

          <p className="t19-column-subtext">
            Students actively recruiting teammates for these competitions. 1-click WhatsApp handshakes.
          </p>

          <div className="t19-split-card-list">
            {displaySquads.length === 0 ? (
              <div className="t19-empty-column-state">
                <div className="t19-empty-icon">👥</div>
                <h4 className="t19-empty-title">No squads currently posted for this filter</h4>
                <p className="t19-empty-desc">
                  Be the first competitor to build a squad for these opportunities!
                </p>
                <button
                  type="button"
                  className="t19-empty-action-btn squad"
                  onClick={onNavigateToSquads}
                >
                  + Post Squad Requirement
                </button>
              </div>
            ) : (
              displaySquads.map((squad, idx) => {
                const waUrl = getWhatsAppUrl(
                  squad.phone_number,
                  squad.student_name,
                  squad.competition_name
                );

                return (
                  <article key={squad.id || `squad-${idx}`} className="t19-split-squad-card">
                    <div className="t19-squad-card-top">
                      <div className="t19-squad-target-info">
                        <span className="t19-squad-target-tag">
                          {squad.circuitLabel || 'UNDERGRAD SQUAD'}
                        </span>
                        <h4 className="t19-squad-target-title" title={squad.competition_name}>
                          {squad.competition_name}
                        </h4>
                      </div>

                      <div className="t19-squad-spots-badge">
                        <span className="t19-squad-spots-pulse" />
                        <span>Need {squad.spots_left || 1} Teammate{squad.spots_left > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="t19-squad-host-row">
                      <div className="t19-squad-host-avatar">
                        {(squad.student_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="t19-squad-host-details">
                        <span className="t19-squad-host-name">
                          {squad.student_name || 'Lead Competitor'}
                        </span>
                        <span className="t19-squad-host-college">
                          {squad.college || 'Delhi University'} • {squad.course || 'Undergrad'} ({squad.year || '2nd Year'})
                        </span>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    <div className="t19-squad-skills-section">
                      <span className="t19-squad-skills-label">Looking for:</span>
                      <div className="t19-squad-skills-pills">
                        {(squad.skills_looking_for && squad.skills_looking_for.length > 0
                          ? squad.skills_looking_for
                          : ['Deck Specialist', 'Financial Modeling']
                        ).map((skill, sIdx) => (
                          <span
                            key={`skill-${sIdx}`}
                            className={`t19-squad-skill-pill ${sIdx === 0 ? 'priority' : ''}`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer / WhatsApp CTA */}
                    <div className="t19-squad-card-footer">
                      <span className="t19-squad-roster-status">
                        Slots: <strong>{squad.spots_left || 1}</strong> of {squad.total_members || 3} Open
                      </span>

                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="t19-squad-whatsapp-btn"
                          title="Direct WhatsApp handshake with team lead"
                        >
                          <WhatsAppIcon size={14} />
                          <span>WhatsApp Connect</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="t19-squad-whatsapp-btn"
                          onClick={onNavigateToSquads}
                          title="Connect with team lead in Squad Finder"
                        >
                          <UsersIcon size={14} />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="t19-column-footer-action">
            <button
              type="button"
              className="t19-explore-squads-btn"
              onClick={onNavigateToSquads}
            >
              <span>Explore All Squads & Open Listings</span>
              <ArrowRightIcon size={14} />
            </button>
          </div>
        </section>
      </div>

      {/* ── 04 // Seamless Transition to Full Repository ── */}
      <div className="t19-directory-anchor-row">
        <button
          type="button"
          className="t19-directory-anchor-btn"
          onClick={onScrollToRepository}
        >
          <span>Explore Complete Directory ({competitions.length} Opportunities & Full Filter Sidebar)</span>
          <ChevronDownIcon size={15} />
        </button>
      </div>
    </div>
  );
}
