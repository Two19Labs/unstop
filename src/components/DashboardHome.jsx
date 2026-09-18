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
  UserIcon
} from './icons';
import './DashboardHome.css';

export default function DashboardHome({
  competitions = [],
  metrics = {},
  user = null,
  profile = null,
  bookmarkedIds = [],
  searchQuery = '',
  onSearchChange,
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

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Urgent opportunities (closing soonest, within next 48-72h)
  const urgentCompetitions = useMemo(() => {
    const now = Date.now();
    return [...competitions]
      .filter((c) => {
        if (!c.deadline) return false;
        const diff = new Date(c.deadline).getTime() - now;
        return diff > 0;
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 3);
  }, [competitions]);

  // High-Stakes Leaderboard (Top 4 competitions by prize money)
  const highStakesCompetitions = useMemo(() => {
    const parseAmount = (pStr) => {
      if (!pStr) return 0;
      const match = pStr.replace(/,/g, '').match(/₹(\d+)/);
      return match ? Number(match[1]) : 0;
    };

    return [...competitions]
      .filter((c) => parseAmount(c.prizes) > 0)
      .sort((a, b) => parseAmount(b.prizes) - parseAmount(a.prizes))
      .slice(0, 4);
  }, [competitions]);

  // User's saved / bookmarked competitions
  const userBookmarkedCompetitions = useMemo(() => {
    return competitions.filter((c) => bookmarkedIds.includes(c.id)).slice(0, 3);
  }, [competitions, bookmarkedIds]);

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
              <span className="t19-status-metric"><strong>{metrics.total || competitions.length}</strong> Undergrad Opportunities</span>
              <span className="t19-status-dot-sep">•</span>
              <span className="t19-status-metric"><strong>{totalPrizeString}</strong> Total Prizes</span>
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
            onClick={() => onQuickFilter('bookmarked')}
            title="View your saved opportunities"
          >
            <BookmarkIcon size={14} filled={bookmarkedIds.length > 0} color="var(--color-lab-blue)" />
            <span>Saved ({bookmarkedIds.length})</span>
          </button>
        </div>
      </header>

      {/* ── 12-Column Bento Grid ── */}
      <div className="t19-bento-grid">
        {/* ── Tile 1: Urgent Action Radar (Col 1-7) ── */}
        <section className="t19-bento-card t19-bento-urgent">
          <div className="t19-card-header">
            <div className="t19-card-header-left">
              <span className="t19-card-idx">01 //</span>
              <h3 className="t19-card-title">URGENT ACTION RADAR</h3>
              <span className="t19-urgency-badge">
                <FlameIcon size={12} color="#DC2626" />
                <span>Closing &lt; 48h</span>
              </span>
            </div>
            <button
              type="button"
              className="t19-card-header-link"
              onClick={() => onQuickFilter('urgent')}
            >
              <span>View all closing soon</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>

          <div className="t19-urgent-list">
            {urgentCompetitions.map((comp) => {
              const diff = comp.deadline ? new Date(comp.deadline).getTime() - Date.now() : 0;
              const hoursLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
              const daysLeft = Math.floor(hoursLeft / 24);
              const remHours = hoursLeft % 24;
              const mins = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

              let countdownText = 'Ending Soon';
              if (diff > 0) {
                if (daysLeft === 0) {
                  countdownText = `⏳ ${remHours}h ${mins}m left`;
                } else {
                  countdownText = `⏳ ${daysLeft}d ${remHours}h left`;
                }
              }

              return (
                <article key={comp.id} className="t19-urgent-row">
                  <div className="t19-urgent-row-main">
                    <div className="t19-urgent-org-line">
                      {comp.orgLogo ? (
                        <img
                          src={comp.orgLogo}
                          alt={comp.orgName}
                          className="t19-urgent-org-logo"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="t19-urgent-org-fallback">
                          {(comp.orgName || 'OS').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="t19-urgent-org-name" title={comp.orgName}>
                        {comp.orgName}
                      </span>
                      <span className="t19-urgent-countdown">{countdownText}</span>
                    </div>

                    <h4 className="t19-urgent-title" title={comp.title}>
                      {comp.title}
                    </h4>

                    <div className="t19-urgent-meta-line">
                      <span className="t19-urgent-prize">
                        <TrophyIcon size={12} color="var(--color-lab-blue)" />
                        {comp.prizes || 'Certificates & Recognition'}
                      </span>
                      <span className="t19-urgent-meta-tag">{comp.teamSizeDisplay || 'Solo / Team'}</span>
                      <span className="t19-urgent-meta-tag">{comp.categoryLabel || 'Challenge'}</span>
                    </div>
                  </div>

                  <div className="t19-urgent-row-actions">
                    <button
                      type="button"
                      className="t19-btn-squad-up"
                      onClick={() =>
                        onFindTeammates({
                          competition_name: comp.title,
                          competition_url: comp.unstopUrl,
                          organizer: comp.orgName,
                          category: comp.category || 'general'
                        })
                      }
                      title="Find batchmates to compete together"
                    >
                      <ZapIcon size={12} />
                      <span>Squad Up</span>
                    </button>

                    <a
                      href={comp.unstopUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="t19-btn-unstop-link"
                      title="Open application page on Unstop"
                    >
                      <span>Apply</span>
                      <ExternalLinkIcon size={12} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Tile 2: Live Squad Exchange (Col 8-12) ── */}
        <section className="t19-bento-card t19-bento-squad">
          <div className="t19-card-header">
            <div className="t19-card-header-left">
              <span className="t19-card-idx">02 //</span>
              <h3 className="t19-card-title">SQUAD EXCHANGE</h3>
              <span className="t19-squad-live-badge">Teammates Wanted</span>
            </div>
            <button
              type="button"
              className="t19-card-header-link"
              onClick={onNavigateToSquads}
            >
              <span>Explore All</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>

          <p className="t19-squad-subtext">
            Cross-college students recruiting complementary skill sets. 1-click WhatsApp handshakes.
          </p>

          <div className="t19-squad-card-list">
            {/* Squad Post 1 */}
            <div className="t19-squad-mini-card">
              <div className="t19-squad-mini-header">
                <span className="t19-squad-circuit-tag">DU CIRCUIT CASE COMP</span>
                <span className="t19-squad-slot-pill">Need 1 Teammate</span>
              </div>
              <h4 className="t19-squad-comp-title">SSCBS National Case Conclave</h4>
              <div className="t19-skill-tags-row">
                <span className="t19-skill-pill highlight">Deck Specialist</span>
                <span className="t19-skill-pill">Financial Modeling</span>
              </div>
              <div className="t19-squad-mini-footer">
                <span className="t19-poster-name">Aditya • SSCBS ('26)</span>
                <button
                  type="button"
                  className="t19-whatsapp-connect-btn"
                  onClick={onNavigateToSquads}
                  title="Connect with team lead"
                >
                  <WhatsAppIcon size={13} />
                  <span>Connect</span>
                </button>
              </div>
            </div>

            {/* Squad Post 2 */}
            <div className="t19-squad-mini-card">
              <div className="t19-squad-mini-header">
                <span className="t19-squad-circuit-tag premier">TIER-1 PREMIER CHALLENGE</span>
                <span className="t19-squad-slot-pill">Need 2 Teammates</span>
              </div>
              <h4 className="t19-squad-comp-title">IIM Rohtak Strategic Simulation</h4>
              <div className="t19-skill-tags-row">
                <span className="t19-skill-pill highlight">Market Research</span>
                <span className="t19-skill-pill">Pitch / Speaker</span>
              </div>
              <div className="t19-squad-mini-footer">
                <span className="t19-poster-name">Rhea • SRCC ('25)</span>
                <button
                  type="button"
                  className="t19-whatsapp-connect-btn"
                  onClick={onNavigateToSquads}
                  title="Connect with team lead"
                >
                  <WhatsAppIcon size={13} />
                  <span>Connect</span>
                </button>
              </div>
            </div>
          </div>

          <div className="t19-squad-bottom-cta">
            <button
              type="button"
              className="t19-post-squad-btn"
              onClick={onNavigateToSquads}
            >
              <span>+ Post Your Squad Requirement</span>
            </button>
          </div>
        </section>

        {/* ── Tile 3: Prestige Circuit Command Cards (Col 1-12) ── */}
        <section className="t19-bento-card t19-bento-circuits">
          <div className="t19-card-header">
            <div className="t19-card-header-left">
              <span className="t19-card-idx">03 //</span>
              <h3 className="t19-card-title">COLLEGIATE BATTLEGROUNDS</h3>
              <span className="t19-circuits-stamp">100% Undergrad Filtered</span>
            </div>
            <span className="t19-circuits-hint">Click any circuit to filter catalog</span>
          </div>

          <div className="t19-circuits-tiles-grid">
            {/* Tile 1: DU Circuit */}
            <div
              className="t19-circuit-tile"
              onClick={() => onSelectCircuit('du')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectCircuit('du')}
            >
              <div className="t19-circuit-tile-top">
                <span className="t19-circuit-code">CIRCUIT 01</span>
                <span className="t19-circuit-badge du">{metrics.du || 0} active</span>
              </div>
              <h4 className="t19-circuit-name">DU Collegiate Circuit</h4>
              <p className="t19-circuit-colleges">
                SRCC · SSCBS · Hindu · Hansraj · St. Stephen’s · LSR · Gargi
              </p>
              <div className="t19-circuit-tile-bottom">
                <span className="t19-tile-action">Open Circuit →</span>
              </div>
            </div>

            {/* Tile 2: IIM / IIT Premier */}
            <div
              className="t19-circuit-tile"
              onClick={() => onSelectCircuit('iim-iit-premier')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectCircuit('iim-iit-premier')}
            >
              <div className="t19-circuit-tile-top">
                <span className="t19-circuit-code">CIRCUIT 02</span>
                <span className="t19-circuit-badge premier">{metrics.iimIitPremier || 0} active</span>
              </div>
              <h4 className="t19-circuit-name">IIMs, IITs & B-Schools</h4>
              <p className="t19-circuit-colleges">
                IIM Rohtak · Kozhikode · IIT Bombay · FMS · XLRI Undergrad Opens
              </p>
              <div className="t19-circuit-tile-bottom">
                <span className="t19-tile-action">Open Tier-1 →</span>
              </div>
            </div>

            {/* Tile 3: Corporate Flagships */}
            <div
              className="t19-circuit-tile"
              onClick={() => onSelectCircuit('corporate-global')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectCircuit('corporate-global')}
            >
              <div className="t19-circuit-tile-top">
                <span className="t19-circuit-code">CIRCUIT 03</span>
                <span className="t19-circuit-badge corporate">{metrics.corporateGlobal || 0} active</span>
              </div>
              <h4 className="t19-circuit-name">Corporate & Global</h4>
              <p className="t19-circuit-colleges">
                McKinsey · Bain · HUL L.I.M.E · Tata · Flipkart GRiD PPIs
              </p>
              <div className="t19-circuit-tile-bottom">
                <span className="t19-tile-action">Open Flagships →</span>
              </div>
            </div>

            {/* Tile 4: Dev & Hackathons */}
            <div
              className="t19-circuit-tile"
              onClick={() => onSelectTrack('hackathon')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectTrack('hackathon')}
            >
              <div className="t19-circuit-tile-top">
                <span className="t19-circuit-code">TRACK 04</span>
                <span className="t19-circuit-badge tech">{metrics.hackathons || 0} active</span>
              </div>
              <h4 className="t19-circuit-name">Hackathons & Dev Sprints</h4>
              <p className="t19-circuit-colleges">
                Fullstack Dev · AI/ML · Web3 · Build Challenges & Bounties
              </p>
              <div className="t19-circuit-tile-bottom">
                <span className="t19-tile-action">Open Dev Sprints →</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tile 4: High-Stakes Leaderboard (Col 1-6) ── */}
        <section className="t19-bento-card t19-bento-leaderboard">
          <div className="t19-card-header">
            <div className="t19-card-header-left">
              <span className="t19-card-idx">04 //</span>
              <h3 className="t19-card-title">HIGH-STAKES LEADERBOARD</h3>
            </div>
            <span className="t19-card-subbadge">Highest Cash & Grants</span>
          </div>

          <div className="t19-leaderboard-list">
            {highStakesCompetitions.map((comp, idx) => (
              <div key={comp.id} className="t19-leaderboard-row">
                <div className="t19-rank-num">#{idx + 1}</div>
                <div className="t19-rank-info">
                  <span className="t19-rank-org">{comp.orgName || 'Premier'}</span>
                  <h5 className="t19-rank-title" title={comp.title}>
                    {comp.title}
                  </h5>
                </div>
                <div className="t19-rank-prize-col">
                  <span className="t19-rank-prize">{comp.prizes}</span>
                  <a
                    href={comp.unstopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t19-rank-view-link"
                    title="View on Unstop"
                  >
                    Apply ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tile 5: My Track & Workbench (Col 7-12) ── */}
        <section className="t19-bento-card t19-bento-workbench">
          <div className="t19-card-header">
            <div className="t19-card-header-left">
              <span className="t19-card-idx">05 //</span>
              <h3 className="t19-card-title">MY TRACK & SAVED</h3>
            </div>
            <button
              type="button"
              className="t19-card-header-link"
              onClick={() => onQuickFilter('bookmarked')}
            >
              <span>Manage ({bookmarkedIds.length})</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>

          {userBookmarkedCompetitions.length > 0 ? (
            <div className="t19-workbench-list">
              {userBookmarkedCompetitions.map((comp) => (
                <div key={comp.id} className="t19-workbench-item">
                  <div className="t19-wb-left">
                    <BookmarkIcon size={14} filled color="var(--color-lab-blue)" />
                    <div className="t19-wb-details">
                      <h5 className="t19-wb-title" title={comp.title}>{comp.title}</h5>
                      <span className="t19-wb-deadline">{comp.remainDaysText || 'Active'}</span>
                    </div>
                  </div>
                  <a
                    href={comp.unstopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t19-wb-action"
                  >
                    Open ↗
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="t19-workbench-empty">
              <div className="t19-wb-empty-icon">
                <BookmarkIcon size={24} color="var(--ink-faint)" />
              </div>
              <h5 className="t19-wb-empty-title">Your competition radar is empty</h5>
              <p className="t19-wb-empty-desc">
                Click the bookmark icon on any opportunity to monitor its deadline and squad roster here.
              </p>
              <button
                type="button"
                className="t19-wb-explore-btn"
                onClick={onScrollToRepository}
              >
                Explore Active Competitions ↓
              </button>
            </div>
          )}
        </section>

        {/* ── Tile 6: Discipline Launchpad & Omnisearch (Col 1-12) ── */}
        <section className="t19-bento-card t19-bento-search">
          <div className="t19-command-box-v2">
            <div className="t19-command-input-row">
              <SearchIcon size={16} className="t19-cmd-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="t19-cmd-input"
                placeholder="Search SRCC, IIM, McKinsey, Dev Hackathons, or ₹1L+ cash pools..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onScrollToRepository()}
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="t19-cmd-clear"
                  onClick={() => onSearchChange('')}
                >
                  ✕
                </button>
              ) : (
                <kbd className="t19-cmd-shortcut" title="Press / to search">/</kbd>
              )}
            </div>

            {/* Discipline Launchpad Chips */}
            <div className="t19-discipline-pills">
              <span className="t19-pills-label">Discipline Tracks:</span>

              <button
                type="button"
                className="t19-track-chip"
                onClick={() => onSelectTrack('case')}
              >
                📊 Case Comps <span className="t19-track-count">{metrics.cases || 0}</span>
              </button>

              <button
                type="button"
                className="t19-track-chip"
                onClick={() => onSelectTrack('hackathon')}
              >
                💻 Hackathons <span className="t19-track-count">{metrics.hackathons || 0}</span>
              </button>

              <button
                type="button"
                className="t19-track-chip"
                onClick={() => onSelectTrack('simulation')}
              >
                📈 Simulations <span className="t19-track-count">{metrics.simulations || 0}</span>
              </button>

              <button
                type="button"
                className="t19-track-chip"
                onClick={() => onSelectTrack('quiz')}
              >
                🧠 Quizzes <span className="t19-track-count">{metrics.quizzes || 0}</span>
              </button>

              <button
                type="button"
                className="t19-track-chip"
                onClick={() => onSelectTrack('writing')}
              >
                ✍️ Writing <span className="t19-track-count">{metrics.writing || 0}</span>
              </button>

              <button
                type="button"
                className="t19-track-chip"
                onClick={() => onSelectTrack('debate')}
              >
                🗣️ Debates <span className="t19-track-count">{metrics.debates || 0}</span>
              </button>

              <button
                type="button"
                className="t19-track-chip free"
                onClick={() => onQuickFilter('free')}
              >
                🆓 Free Entry
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Seamless Transition to Directory ── */}
      <div className="t19-directory-anchor-row">
        <button
          type="button"
          className="t19-directory-anchor-btn"
          onClick={onScrollToRepository}
        >
          <span>Explore Complete Directory ({competitions.length} Opportunities & Full Sidebar)</span>
          <ChevronDownIcon size={15} />
        </button>
      </div>
    </div>
  );
}
