// src/components/DashboardHome.jsx
// Two19 Labs — High-Density Minimal Competitor Workstation
// Editorial Brutalist / Utilitarian: Compact, Zero Slop, Maximum Signal
import React, { useMemo } from 'react';
import {
  ExternalLinkIcon,
  ZapIcon,
  ChevronDownIcon,
  BookmarkIcon,
  WhatsAppIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  PlusIcon
} from './icons';
import { normalizeYear } from '../data/colleges';
import './DashboardHome.css';

const CIRCUIT_LABELS = {
  'du': 'DU Circuit',
  'iim-iit-premier': 'IIMs & IITs',
  'corporate-global': 'Corporate',
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

function formatCleanCountdown(deadline) {
  if (!deadline) return { text: 'Ongoing', urgency: 'normal' };
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { text: 'Closing Soon', urgency: 'red' };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days === 0) {
    return { text: `${remHours}h ${mins}m left`, urgency: 'red' };
  }
  if (days <= 2) {
    return { text: `${days}d ${remHours}h left`, urgency: 'amber' };
  }
  return { text: `${days}d left`, urgency: 'normal' };
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
  const competitorName = useMemo(() => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Competitor';
  }, [profile, user]);

  const competitorCollege = useMemo(() => {
    return profile?.college || user?.user_metadata?.college || 'SSCBS';
  }, [profile, user]);

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

  const hasActiveFilters = useMemo(() => {
    return (
      (selectedCircuits && selectedCircuits.length > 0) ||
      (selectedTracks && selectedTracks.length > 0) ||
      teamFilter !== 'all' ||
      feeFilter !== 'all' ||
      Boolean(searchQuery && searchQuery.trim())
    );
  }, [selectedCircuits, selectedTracks, teamFilter, feeFilter, searchQuery]);

  const displayCompetitions = topFilteredCompetitions.length > 0
    ? topFilteredCompetitions
    : filteredCompetitions.slice(0, 6);

  const displaySquads = matchingSquads.length > 0
    ? matchingSquads
    : [];

  const isAllCircuits = !selectedCircuits || selectedCircuits.length === 0;

  return (
    <div className="t19-dashboard-minimal">
      {/* ── 01 // Streamlined Compact Competitor Bar ── */}
      <header className="t19-min-bar">
        <div className="t19-min-bar-left">
          <div className="t19-user-badge">
            <span className="t19-user-avatar">
              {(competitorName || 'C').charAt(0).toUpperCase()}
            </span>
            <span className="t19-user-name">{competitorName}</span>
            <span className="t19-user-college">{competitorCollege}</span>
          </div>

          <div className="t19-bar-stats">
            <span className="t19-live-dot" title="Live Synced from Unstop" />
            <span className="t19-stat-item">
              <strong>{competitions.length}</strong> live opportunities
            </span>
            <span className="t19-stat-sep">·</span>
            <span className="t19-stat-item">
              <strong>{totalPrizeString}</strong> total pool
            </span>
          </div>
        </div>

        <div className="t19-min-bar-right">
          <button
            type="button"
            className="t19-btn-recruit"
            onClick={onNavigateToSquads}
            title="Create squad post to recruit teammates"
          >
            <PlusIcon size={13} />
            <span>Recruit Teammates</span>
          </button>

          <button
            type="button"
            className={`t19-btn-saved ${bookmarkedIds.length > 0 ? 'has-saved' : ''}`}
            onClick={() => onQuickFilter && onQuickFilter('bookmarked')}
            title="View saved opportunities"
          >
            <BookmarkIcon size={13} filled={bookmarkedIds.length > 0} color="currentColor" />
            <span>Saved ({bookmarkedIds.length})</span>
          </button>
        </div>
      </header>

      {/* ── 02 // Tight 1-Line Radar Filter Navigation ── */}
      <nav className="t19-filter-nav">
        <div className="t19-filter-tabs">
          <span className="t19-filter-label">Filter:</span>

          <button
            type="button"
            className={`t19-tab-btn ${isAllCircuits && selectedTracks.length === 0 && feeFilter === 'all' ? 'active' : ''}`}
            onClick={onResetFilters}
          >
            All Live
          </button>

          <button
            type="button"
            className={`t19-tab-btn ${selectedCircuits.includes('du') ? 'active' : ''}`}
            onClick={() => onToggleCircuit && onToggleCircuit('du')}
          >
            DU Circuit
            {selectedCircuits.includes('du') && <span className="t19-tab-remove">×</span>}
          </button>

          <button
            type="button"
            className={`t19-tab-btn ${selectedCircuits.includes('iim-iit-premier') ? 'active' : ''}`}
            onClick={() => onToggleCircuit && onToggleCircuit('iim-iit-premier')}
          >
            IIMs & IITs
            {selectedCircuits.includes('iim-iit-premier') && <span className="t19-tab-remove">×</span>}
          </button>

          <button
            type="button"
            className={`t19-tab-btn ${selectedCircuits.includes('corporate-global') ? 'active' : ''}`}
            onClick={() => onToggleCircuit && onToggleCircuit('corporate-global')}
          >
            Corporate
            {selectedCircuits.includes('corporate-global') && <span className="t19-tab-remove">×</span>}
          </button>

          <span className="t19-tab-sep">|</span>

          <button
            type="button"
            className={`t19-tab-btn ${selectedTracks.includes('case') ? 'active' : ''}`}
            onClick={() => onToggleTrack && onToggleTrack('case')}
          >
            Case Comps
            {selectedTracks.includes('case') && <span className="t19-tab-remove">×</span>}
          </button>

          <button
            type="button"
            className={`t19-tab-btn ${selectedTracks.includes('hackathon') ? 'active' : ''}`}
            onClick={() => onToggleTrack && onToggleTrack('hackathon')}
          >
            Hackathons
            {selectedTracks.includes('hackathon') && <span className="t19-tab-remove">×</span>}
          </button>

          <button
            type="button"
            className={`t19-tab-btn ${feeFilter === 'free' ? 'active' : ''}`}
            onClick={() => onSetFeeFilter && onSetFeeFilter(feeFilter === 'free' ? 'all' : 'free')}
          >
            Free Entry
            {feeFilter === 'free' && <span className="t19-tab-remove">×</span>}
          </button>
        </div>

        <div className="t19-filter-nav-right">
          {hasActiveFilters && (
            <button
              type="button"
              className="t19-link-reset"
              onClick={onResetFilters}
              title="Clear all filters"
            >
              <RotateCcwIcon size={11} />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            className="t19-link-deep-filters"
            onClick={onScrollToRepository}
            title="Browse all opportunities and deep filters below"
          >
            <span>All Comps ({filteredCompetitions.length}) ↓</span>
          </button>
        </div>
      </nav>

      {/* ── 03 // Compact 50/50 Split Grid (Linear / Terminal Density) ── */}
      <div className="t19-grid-split">
        {/* ── Left Column: Top Matching Competitions ── */}
        <section className="t19-column">
          <div className="t19-col-header">
            <div className="t19-col-title-group">
              <span className="t19-col-num">01</span>
              <h3 className="t19-col-title">Top Matching Competitions</h3>
              <span className="t19-col-count">
                {displayCompetitions.length} of {filteredCompetitions.length}
              </span>
            </div>

            <button
              type="button"
              className="t19-col-link"
              onClick={onScrollToRepository}
            >
              <span>View all ({filteredCompetitions.length})</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>

          <div className="t19-rows-list">
            {displayCompetitions.length === 0 ? (
              <div className="t19-empty-row">
                <span>No competitions match active filters.</span>
                <button type="button" className="t19-btn-inline-reset" onClick={onResetFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              displayCompetitions.map((comp) => {
                const countdown = formatCleanCountdown(comp.deadline);
                const isBookmarked = bookmarkedIds.includes(comp.id);
                const initial = (comp.orgName || 'OS').slice(0, 2).toUpperCase();

                return (
                  <article key={comp.id} className="t19-item-row comp-row">
                    <div className="t19-row-avatar">
                      {comp.orgLogo ? (
                        <img
                          src={comp.orgLogo}
                          alt={comp.orgName}
                          className="t19-row-img"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="t19-row-monogram">{initial}</span>
                      )}
                    </div>

                    <div className="t19-row-content">
                      <div className="t19-row-meta-top">
                        <span className="t19-row-org">{comp.orgName || 'Undergrad Open'}</span>
                        <span className="t19-meta-dot">·</span>
                        <span className="t19-row-circuit">{comp.circuitLabel || 'Open'}</span>
                      </div>

                      <h4 className="t19-row-title" title={comp.title}>
                        {comp.title}
                      </h4>

                      <div className="t19-row-meta-bottom">
                        <span className="t19-pill-prize">{comp.prizes || 'Certificates'}</span>
                        <span className="t19-meta-dot">·</span>
                        <span className="t19-pill-tag">{comp.teamSizeDisplay || 'Solo / Team'}</span>
                        <span className="t19-meta-dot">·</span>
                        <span className="t19-pill-tag">{comp.categoryLabel || 'Case'}</span>
                      </div>
                    </div>

                    <div className="t19-row-actions">
                      <span className={`t19-countdown-tag ${countdown.urgency}`}>
                        {countdown.text}
                      </span>

                      <div className="t19-btn-group">
                        <button
                          type="button"
                          className="t19-btn-action squad"
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
                          title="Recruit teammates for this comp"
                        >
                          <ZapIcon size={11} />
                          <span>Squad Up</span>
                        </button>

                        <a
                          href={comp.unstopUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="t19-btn-action apply"
                          title="Apply on Unstop"
                        >
                          <span>Apply</span>
                          <ExternalLinkIcon size={11} />
                        </a>

                        <button
                          type="button"
                          className={`t19-btn-bookmark ${isBookmarked ? 'active' : ''}`}
                          onClick={(e) => onToggleBookmark && onToggleBookmark(comp.id, e)}
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark competition'}
                          aria-label="Bookmark"
                        >
                          <BookmarkIcon size={13} filled={isBookmarked} color="currentColor" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* ── Right Column: Matching Squads (Same Filters) ── */}
        <section className="t19-column">
          <div className="t19-col-header">
            <div className="t19-col-title-group">
              <span className="t19-col-num">02</span>
              <h3 className="t19-col-title">Matching Squads & Rosters</h3>
              <span className="t19-col-tag-sync">Same Filters</span>
            </div>

            <button
              type="button"
              className="t19-col-post-btn"
              onClick={onNavigateToSquads}
              title="Post your squad requirement"
            >
              <PlusIcon size={12} />
              <span>Post Squad</span>
            </button>
          </div>

          <div className="t19-rows-list">
            {displaySquads.length === 0 ? (
              <div className="t19-empty-row">
                <span>No open squads posted for this filter yet.</span>
                <button type="button" className="t19-btn-inline-reset" onClick={onNavigateToSquads}>
                  + Be the first to recruit
                </button>
              </div>
            ) : (
              displaySquads.map((squad, idx) => {
                const waUrl = getWhatsAppUrl(
                  squad.phone_number,
                  squad.student_name,
                  squad.competition_name
                );
                const leadInitial = (squad.student_name || 'U').charAt(0).toUpperCase();

                return (
                  <article key={squad.id || `squad-${idx}`} className="t19-item-row squad-row">
                    <div className="t19-row-avatar host">
                      <span className="t19-row-monogram">{leadInitial}</span>
                    </div>

                    <div className="t19-row-content">
                      <div className="t19-row-meta-top">
                        <span className="t19-row-target-tag">{squad.circuitLabel || 'UNDERGRAD SQUAD'}</span>
                        <span className="t19-meta-dot">·</span>
                        <span className="t19-row-host-info">
                          {squad.student_name || 'Lead'} · {squad.college || 'SSCBS'} ({normalizeYear(squad.year)})
                        </span>
                      </div>

                      <h4 className="t19-row-title squad-target" title={squad.competition_name}>
                        {squad.competition_name}
                      </h4>

                      <div className="t19-skills-inline">
                        <span className="t19-skills-prefix">Needs:</span>
                        {(squad.skills_looking_for && squad.skills_looking_for.length > 0
                          ? squad.skills_looking_for
                          : ['Deck Specialist', 'Financial Modeling']
                        ).slice(0, 2).map((skill, sIdx) => (
                          <span key={`skill-${sIdx}`} className="t19-skill-compact">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="t19-row-actions">
                      <span className="t19-spots-indicator">
                        {squad.spots_left || 1} open slot{squad.spots_left > 1 ? 's' : ''}
                      </span>

                      <div className="t19-btn-group">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="t19-btn-wa"
                            title="Connect with team lead on WhatsApp"
                          >
                            <WhatsAppIcon size={13} />
                            <span>Connect</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="t19-btn-wa fallback"
                            onClick={onNavigateToSquads}
                            title="Open Squad in Team Finder"
                          >
                            <span>Connect</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* ── 04 // Quiet Link to Full Repository ── */}
      <div className="t19-bottom-anchor">
        <button
          type="button"
          className="t19-anchor-link"
          onClick={onScrollToRepository}
        >
          <span>Explore Complete Directory ({competitions.length} Opportunities & Deep Filters)</span>
          <ChevronDownIcon size={13} />
        </button>
      </div>
    </div>
  );
}
