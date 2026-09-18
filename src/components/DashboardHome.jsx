// src/components/DashboardHome.jsx
// Two19 Labs — OneStop Competitor Workstation
// Aesthetic: Editorial, Minimal, High-Contrast, High-Density without cramping
import React, { useMemo } from 'react';
import {
  ExternalLinkIcon,
  ZapIcon,
  BookmarkIcon,
  WhatsAppIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  PlusIcon,
  SearchIcon,
  ClockIcon,
  UsersIcon,
  TrophyIcon
} from './icons';
import { normalizeYear } from '../data/colleges';
import './DashboardHome.css';

const CIRCUIT_OPTIONS = [
  { id: 'du', label: 'DU Circuit' },
  { id: 'iim-iit-premier', label: 'IIMs & IITs' },
  { id: 'corporate-global', label: 'Corporate' },
  { id: 'others', label: 'Others' }
];

const TRACK_OPTIONS = [
  { id: 'case', label: 'Case Comps' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'simulation', label: 'Simulations' },
  { id: 'quiz', label: 'Quizzes' }
];

function getWhatsAppUrl(phone, hostName, compTitle) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  const cleanPhone = digits.slice(-10);
  if (cleanPhone.length !== 10) return null;
  const greetingName = hostName && hostName !== 'Competitor' ? ` ${hostName.split(' ')[0]}` : '';
  const msg = `Hi${greetingName}! Saw your squad post for "${compTitle}" on OneStop. I'd love to connect and discuss teaming up!`;
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

function formatDeadlineTag(deadline) {
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
  onFindTeammates,
  onNavigateToSquads,
  onScrollToRepository,
  onToggleBookmark,
  onSwitchToDirectory,
  pageViewMode = 'dashboard',
  onSetPageViewMode
}) {
  const competitorName = useMemo(() => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Competitor';
  }, [profile, user]);

  const competitorCollege = useMemo(() => {
    return profile?.college || user?.user_metadata?.college || '';
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
    ? matchingSquads.slice(0, 6)
    : [];

  const isAllCircuits = !selectedCircuits || selectedCircuits.length === 0;

  return (
    <div className="t19-dashboard-station">
      {/* ── 01 // Executive Top Command Bar ── */}
      <header className="t19-top-header">
        <div className="t19-header-left">
          <div className="t19-desk-title-wrap">
            <div className="t19-kicker-row">
              <span className="t19-kicker-tag">COMPETITOR RADAR</span>
              <span className="t19-live-indicator">
                <span className="t19-pulse-dot" />
                <span>Live Sync</span>
              </span>
            </div>
            <h1 className="t19-desk-heading">Opportunity Desk</h1>
            <p className="t19-desk-sub">
              Curated undergraduate competitions paired with matching teammate rosters.
            </p>
          </div>
        </div>

        <div className="t19-header-right">
          {/* View Mode Switcher */}
          <div className="t19-view-switcher" role="tablist">
            <button
              type="button"
              className={`t19-view-toggle-btn ${pageViewMode === 'dashboard' ? 'active' : ''}`}
              onClick={() => onSetPageViewMode && onSetPageViewMode('dashboard')}
            >
              <span>Split Radar</span>
            </button>
            <button
              type="button"
              className={`t19-view-toggle-btn ${pageViewMode === 'directory' ? 'active' : ''}`}
              onClick={() => onSwitchToDirectory && onSwitchToDirectory()}
            >
              <span>All Comps ({competitions.length})</span>
            </button>
          </div>

          {/* User Status / Quick Actions */}
          <div className="t19-user-quick-actions">
            {user && (
              <div className="t19-user-pill-tag">
                <span className="t19-user-avatar">
                  {(competitorName || 'C').charAt(0).toUpperCase()}
                </span>
                <span className="t19-user-name">{competitorName}</span>
                {competitorCollege && (
                  <span className="t19-user-college">{competitorCollege}</span>
                )}
              </div>
            )}

            <button
              type="button"
              className="t19-btn-recruit-primary"
              onClick={onNavigateToSquads}
              title="Post squad requirement"
            >
              <PlusIcon size={14} />
              <span>Recruit Teammates</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 02 // Clean Command Filter Strip ── */}
      <section className="t19-command-strip">
        {/* Search Input */}
        <div className="t19-search-inline">
          <SearchIcon size={15} className="t19-search-icon" />
          <input
            type="text"
            className="t19-search-field"
            placeholder="Search by college, competition, prize, skill..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="t19-clear-search-btn"
              onClick={() => onSearchChange && onSearchChange('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills Group */}
        <div className="t19-filter-pills-row">
          <span className="t19-strip-label">Circuit:</span>
          <button
            type="button"
            className={`t19-pill-chip ${isAllCircuits ? 'active' : ''}`}
            onClick={onResetFilters}
          >
            All
          </button>
          {CIRCUIT_OPTIONS.map((c) => {
            const isSelected = selectedCircuits.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`t19-pill-chip ${isSelected ? 'active' : ''}`}
                onClick={() => onToggleCircuit && onToggleCircuit(c.id)}
              >
                {c.label}
                {isSelected && <span className="t19-pill-x">×</span>}
              </button>
            );
          })}

          <span className="t19-strip-divider">|</span>

          <span className="t19-strip-label">Track:</span>
          {TRACK_OPTIONS.map((t) => {
            const isSelected = selectedTracks.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                className={`t19-pill-chip ${isSelected ? 'active' : ''}`}
                onClick={() => onToggleTrack && onToggleTrack(t.id)}
              >
                {t.label}
                {isSelected && <span className="t19-pill-x">×</span>}
              </button>
            );
          })}

          <button
            type="button"
            className={`t19-pill-chip ${feeFilter === 'free' ? 'active' : ''}`}
            onClick={() => onSetFeeFilter && onSetFeeFilter(feeFilter === 'free' ? 'all' : 'free')}
          >
            Free Entry
            {feeFilter === 'free' && <span className="t19-pill-x">×</span>}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              className="t19-pill-reset"
              onClick={onResetFilters}
              title="Clear all active filters"
            >
              <RotateCcwIcon size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </section>

      {/* ── 03 // Main 50/50 Split Grid ── */}
      <div className="t19-split-layout">
        {/* ── Left Column: Top Matching Competitions ── */}
        <section className="t19-split-col">
          <div className="t19-col-header">
            <div className="t19-col-title-wrap">
              <h2 className="t19-col-title">Live Competitions</h2>
              <span className="t19-col-badge">
                {displayCompetitions.length} of {filteredCompetitions.length} matches
              </span>
            </div>

            <button
              type="button"
              className="t19-link-view-all"
              onClick={onSwitchToDirectory}
            >
              <span>View all ({filteredCompetitions.length})</span>
              <ArrowRightIcon size={13} />
            </button>
          </div>

          <div className="t19-cards-stack">
            {displayCompetitions.length === 0 ? (
              <div className="t19-empty-card">
                <p className="t19-empty-text">No competitions match your current filter preferences.</p>
                <button type="button" className="t19-btn-reset-empty" onClick={onResetFilters}>
                  Clear all filters
                </button>
              </div>
            ) : (
              displayCompetitions.map((comp) => {
                const deadlineTag = formatDeadlineTag(comp.deadline);
                const isBookmarked = bookmarkedIds.includes(comp.id);
                const initial = (comp.orgName || 'OS').slice(0, 2).toUpperCase();

                return (
                  <article key={comp.id} className="t19-comp-card">
                    {/* Header Row */}
                    <div className="t19-card-header">
                      <div className="t19-org-lockup">
                        <div className="t19-org-avatar">
                          {comp.orgLogo ? (
                            <img
                              src={comp.orgLogo}
                              alt={comp.orgName}
                              className="t19-org-logo"
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="t19-org-monogram">{initial}</span>
                          )}
                        </div>

                        <div className="t19-org-text">
                          <span className="t19-org-name">{comp.orgName || 'Undergrad Open'}</span>
                          <span className="t19-circuit-tag">{comp.circuitLabel || 'Open'}</span>
                        </div>
                      </div>

                      <div className={`t19-deadline-badge ${deadlineTag.urgency}`}>
                        <ClockIcon size={12} />
                        <span>{deadlineTag.text}</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="t19-card-body">
                      <h3 className="t19-comp-title" title={comp.title}>
                        {comp.title}
                      </h3>

                      <div className="t19-meta-chips-row">
                        <span className="t19-chip-prize">
                          <TrophyIcon size={12} />
                          <span>{comp.prizes || 'Certificates'}</span>
                        </span>
                        <span className="t19-chip-tag">
                          <UsersIcon size={12} />
                          <span>{comp.teamSizeDisplay || 'Solo / Team'}</span>
                        </span>
                        <span className="t19-chip-tag">
                          {comp.categoryLabel || 'Case Comp'}
                        </span>
                        {comp.isFree && (
                          <span className="t19-chip-free">Free Entry</span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="t19-card-footer">
                      <button
                        type="button"
                        className={`t19-btn-bookmark-icon ${isBookmarked ? 'active' : ''}`}
                        onClick={(e) => onToggleBookmark && onToggleBookmark(comp.id, e)}
                        title={isBookmarked ? 'Remove saved' : 'Save competition'}
                      >
                        <BookmarkIcon size={14} filled={isBookmarked} />
                      </button>

                      <div className="t19-card-btn-group">
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
                          title="Recruit teammates for this competition"
                        >
                          <ZapIcon size={12} />
                          <span>Squad Up</span>
                        </button>

                        <a
                          href={comp.unstopUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="t19-btn-apply-action"
                          title="Open official listing on Unstop"
                        >
                          <span>Apply</span>
                          <ExternalLinkIcon size={12} />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* ── Right Column: Matching Squads (Exact Same Filters) ── */}
        <section className="t19-split-col">
          <div className="t19-col-header">
            <div className="t19-col-title-wrap">
              <h2 className="t19-col-title">Matching Teammates</h2>
              <span className="t19-sync-tag">Same Filter Preference</span>
            </div>

            <button
              type="button"
              className="t19-link-post-squad"
              onClick={onNavigateToSquads}
            >
              <PlusIcon size={13} />
              <span>Post Squad</span>
            </button>
          </div>

          <div className="t19-cards-stack">
            {displaySquads.length === 0 ? (
              <div className="t19-empty-card">
                <p className="t19-empty-text">
                  No teammate squads posted yet for these filters.
                </p>
                <button
                  type="button"
                  className="t19-btn-recruit-empty"
                  onClick={onNavigateToSquads}
                >
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
                  <article key={squad.id || `squad-${idx}`} className="t19-squad-card">
                    {/* Header Row */}
                    <div className="t19-card-header">
                      <div className="t19-host-lockup">
                        <div className="t19-host-avatar">
                          {leadInitial}
                        </div>
                        <div className="t19-host-text">
                          <div className="t19-host-name-row">
                            <span className="t19-host-name">{squad.student_name || 'Student Lead'}</span>
                            <span className="t19-verified-dot" title="Verified undergraduate" />
                          </div>
                          <span className="t19-host-college">
                            {squad.college || 'SSCBS'} · {normalizeYear(squad.year)}
                          </span>
                        </div>
                      </div>

                      <span className="t19-spots-badge">
                        <UsersIcon size={11} />
                        <span>{squad.spots_left || 1} open spot{squad.spots_left > 1 ? 's' : ''}</span>
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="t19-card-body">
                      <div className="t19-squad-comp-row">
                        <span className="t19-squad-kicker">Teaming for:</span>
                        <h3 className="t19-squad-comp-title" title={squad.competition_name}>
                          {squad.competition_name}
                        </h3>
                      </div>

                      <div className="t19-skills-req-wrap">
                        <span className="t19-skills-label">Looking for:</span>
                        <div className="t19-skills-chips">
                          {(squad.skills_looking_for && squad.skills_looking_for.length > 0
                            ? squad.skills_looking_for
                            : ['Deck Specialist', 'Financial Modeling']
                          ).slice(0, 3).map((skill, sIdx) => (
                            <span key={`skill-${sIdx}`} className="t19-skill-badge">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="t19-card-footer squad-footer">
                      <span className="t19-squad-status-note">Direct Lead Chat</span>

                      <div className="t19-card-btn-group">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="t19-btn-whatsapp"
                            title="Chat with team lead on WhatsApp"
                          >
                            <WhatsAppIcon size={14} />
                            <span>Connect on WhatsApp</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="t19-btn-view-squad"
                            onClick={onNavigateToSquads}
                          >
                            <span>View Squad</span>
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

      {/* ── 04 // Bottom Switch to Full Directory ── */}
      <footer className="t19-bottom-directory-banner">
        <div className="t19-bottom-banner-content">
          <div className="t19-bottom-banner-text">
            <span className="t19-bottom-banner-kicker">WANT TO EXPLORE EVERYTHING?</span>
            <p className="t19-bottom-banner-title">
              Browse all {competitions.length} opportunities with deep search and sidebar filters.
            </p>
          </div>

          <button
            type="button"
            className="t19-btn-open-directory"
            onClick={onSwitchToDirectory}
          >
            <span>Open All Competitions Directory</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>
      </footer>
    </div>
  );
}
