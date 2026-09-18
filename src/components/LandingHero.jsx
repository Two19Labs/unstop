// src/components/LandingHero.jsx
import React, { useMemo, useRef } from 'react';
import {
  SearchIcon,
  ClockIcon,
  TrophyIcon,
  UsersIcon,
  FlameIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  ZapIcon,
  ChevronDownIcon
} from './icons';
import './LandingHero.css';

export default function LandingHero({
  competitions = [],
  metrics = {},
  searchQuery = '',
  onSearchChange,
  onSelectCircuit,
  onSelectTrack,
  onQuickFilter,
  onFindTeammates,
  onNavigateToSquads,
  onScrollToRepository
}) {
  const searchInputRef = useRef(null);

  // Focus search input when user presses '/' key
  React.useEffect(() => {
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
        return diff > 0 && diff <= 5 * 24 * 60 * 60 * 1000; // closing within 5 days
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 3);
  }, [competitions]);

  // Fallback if no imminent closing comps in range
  const displayUrgent = urgentCompetitions.length > 0 ? urgentCompetitions : competitions.slice(0, 3);

  // Calculate live closing-within-24h count
  const closing24hCount = useMemo(() => {
    const now = Date.now();
    return competitions.filter((c) => {
      if (!c.deadline) return false;
      const diff = new Date(c.deadline).getTime() - now;
      return diff > 0 && diff <= 24 * 60 * 60 * 1000;
    }).length;
  }, [competitions]);

  // Free entry count
  const freeCount = useMemo(() => {
    return competitions.filter((c) => c.isFree).length;
  }, [competitions]);

  return (
    <section className="t19-landing-portal">
      {/* ── Brand Hero Area ── */}
      <div className="t19-hero-container">
        {/* Brand Stamp Eyebrow */}
        <div className="t19-hero-badge-row">
          <div className="t19-hero-badge">
            <span className="t19-pulse-dot" />
            <span className="t19-badge-text">TWO19 LABS // OPPORTUNITY ENGINE</span>
            <span className="t19-blue-dot-pill">.</span>
          </div>
          <span className="t19-hero-tag">UNDERGRAD CIRCUIT INGESTION</span>
        </div>

        {/* Display Typography */}
        <h1 className="t19-hero-headline">
          BUILT TO WIN<span className="t19-headline-dot">.</span>
        </h1>

        <div className="t19-hero-accent-row">
          <span className="t19-hero-accent-text">ready to be unstoppable?</span>
        </div>

        <p className="t19-hero-lead">
          Real-time collegiate competitions and hackathons ingested directly from Unstop.
          Purged of all MBA/PG noise, indexed by tier-1 circuits, and wired to an integrated
          peer squad finder with 1-click WhatsApp handshakes.
        </p>

        {/* ── Omnisearch Command Bar ── */}
        <div className="t19-command-box">
          <div className="t19-command-input-wrapper">
            <SearchIcon size={18} className="t19-command-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="t19-command-input"
              placeholder="Search SRCC, IIM, McKinsey, hackathons, or ₹1L+ cash pools..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onScrollToRepository();
                }
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                className="t19-command-clear-btn"
                onClick={() => onSearchChange('')}
                title="Clear search"
              >
                ✕
              </button>
            ) : (
              <kbd className="t19-command-kbd" title="Press / to focus">
                /
              </kbd>
            )}
          </div>

          {/* Quick Filter Discovery Pills */}
          <div className="t19-command-pills">
            <span className="t19-pills-label">Quick Launch:</span>

            <button
              type="button"
              className="t19-pill-chip"
              onClick={() => onSelectCircuit('du')}
            >
              🏛️ DU Circuit <span className="t19-chip-count">{metrics.du || 0}</span>
            </button>

            <button
              type="button"
              className="t19-pill-chip"
              onClick={() => onSelectCircuit('iim-iit-premier')}
            >
              🏆 IIM & IIT Premier <span className="t19-chip-count">{metrics.iimIitPremier || 0}</span>
            </button>

            <button
              type="button"
              className="t19-pill-chip"
              onClick={() => onSelectCircuit('corporate-global')}
            >
              💼 Corporate Flagships <span className="t19-chip-count">{metrics.corporateGlobal || 0}</span>
            </button>

            <button
              type="button"
              className="t19-pill-chip"
              onClick={() => onSelectTrack('hackathon')}
            >
              💻 Dev & Hackathons <span className="t19-chip-count">{metrics.hackathons || 0}</span>
            </button>

            {closing24hCount > 0 && (
              <button
                type="button"
                className="t19-pill-chip urgent"
                onClick={() => onQuickFilter('urgent')}
              >
                🔥 Closing Today <span className="t19-chip-count">{closing24hCount}</span>
              </button>
            )}

            <button
              type="button"
              className="t19-pill-chip"
              onClick={() => onQuickFilter('free')}
            >
              🆓 Free Entry <span className="t19-chip-count">{freeCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 01: Live Telemetry Metric Strip ── */}
      <div className="t19-telemetry-strip">
        <div className="t19-telemetry-item">
          <span className="t19-telemetry-num">01</span>
          <div className="t19-telemetry-data">
            <span className="t19-telemetry-val">{metrics.total || competitions.length}</span>
            <span className="t19-telemetry-label">Live Undergrad Comps</span>
          </div>
        </div>

        <div className="t19-telemetry-item">
          <span className="t19-telemetry-num">02</span>
          <div className="t19-telemetry-data">
            <span className="t19-telemetry-val">{totalPrizeString}</span>
            <span className="t19-telemetry-label">Active Cash Pools</span>
          </div>
        </div>

        <div className="t19-telemetry-item">
          <span className="t19-telemetry-num">03</span>
          <div className="t19-telemetry-data">
            <span className="t19-telemetry-val">100%</span>
            <span className="t19-telemetry-label">MBA/PG Noise Purged</span>
          </div>
        </div>

        <div className="t19-telemetry-item">
          <span className="t19-telemetry-num">04</span>
          <div className="t19-telemetry-data">
            <span className="t19-telemetry-val">14+</span>
            <span className="t19-telemetry-label">Open Squad Slots</span>
          </div>
        </div>
      </div>

      {/* ── Section 02: Urgency Radar (Closing Soonest) ── */}
      <div className="t19-section-block">
        <div className="t19-section-header">
          <div className="t19-section-title-wrap">
            <span className="t19-section-idx">02 //</span>
            <h2 className="t19-section-title">URGENCY RADAR</h2>
            <span className="t19-urgency-beacon">
              <FlameIcon size={14} color="#DC2626" />
              <span>Closing Soonest</span>
            </span>
          </div>
          <button
            type="button"
            className="t19-section-action-btn"
            onClick={() => onQuickFilter('urgent')}
          >
            <span>View all closing soon</span>
            <ArrowRightIcon size={13} />
          </button>
        </div>

        <div className="t19-urgency-grid">
          {displayUrgent.map((comp) => {
            const diff = comp.deadline ? new Date(comp.deadline).getTime() - Date.now() : 0;
            const hoursLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
            const daysLeft = Math.floor(hoursLeft / 24);
            const remHours = hoursLeft % 24;

            let urgencyLabel = comp.remainDaysText || 'Ending Soon';
            if (diff > 0) {
              urgencyLabel = daysLeft === 0 ? `⏳ ${remHours}h left` : `⏳ ${daysLeft}d ${remHours}h left`;
            }

            return (
              <div key={comp.id} className="t19-urgency-card">
                <div className="t19-urgency-card-top">
                  <div className="t19-card-org-row">
                    {comp.orgLogo ? (
                      <img
                        src={comp.orgLogo}
                        alt={comp.orgName}
                        className="t19-card-org-img"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="t19-card-org-fallback">
                        {(comp.orgName || 'OS').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="t19-card-org-name" title={comp.orgName}>
                      {comp.orgName}
                    </span>
                  </div>
                  <span className="t19-urgency-countdown-pill">{urgencyLabel}</span>
                </div>

                <h3 className="t19-urgency-card-title" title={comp.title}>
                  {comp.title}
                </h3>

                <div className="t19-urgency-card-meta">
                  <span className="t19-meta-prize">
                    <TrophyIcon size={12} color="var(--color-lab-blue)" />
                    {comp.prizes || 'Certificates & Trophies'}
                  </span>
                  <span className="t19-meta-pill">{comp.categoryLabel || 'Challenge'}</span>
                </div>

                <div className="t19-urgency-card-actions">
                  <button
                    type="button"
                    className="t19-card-squad-btn"
                    onClick={() =>
                      onFindTeammates({
                        competition_name: comp.title,
                        competition_url: comp.unstopUrl,
                        organizer: comp.orgName,
                        category: comp.category || 'general'
                      })
                    }
                  >
                    <ZapIcon size={13} />
                    <span>Squad Up</span>
                  </button>

                  <a
                    href={comp.unstopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t19-card-unstop-btn"
                    title="View on Unstop"
                  >
                    <span>Apply</span>
                    <ExternalLinkIcon size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 03: Prestige Circuits & Discipline Launchpads ── */}
      <div className="t19-section-block">
        <div className="t19-section-header">
          <div className="t19-section-title-wrap">
            <span className="t19-section-idx">03 //</span>
            <h2 className="t19-section-title">TARGET CIRCUITS</h2>
            <span className="t19-section-subline">Select your collegiate battleground</span>
          </div>
          <span className="t19-editorial-stamp">100% UNDERGRAD PURGED</span>
        </div>

        <div className="t19-circuits-grid">
          {/* Card 1: DU Circuit */}
          <div
            className="t19-circuit-card"
            onClick={() => onSelectCircuit('du')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectCircuit('du');
              }
            }}
          >
            <div className="t19-circuit-card-header">
              <span className="t19-circuit-tag">DELHI UNIVERSITY</span>
              <span className="t19-circuit-count">{metrics.du || 0} active</span>
            </div>
            <h3 className="t19-circuit-title">DU Collegiate Circuit</h3>
            <p className="t19-circuit-desc">
              SRCC, SSCBS, Hindu, Hansraj, St. Stephen’s, Gargi & LSR. Case competitions, policy debacles & commerce conclaves.
            </p>
            <div className="t19-circuit-footer">
              <span className="t19-circuit-cta">
                Explore DU Circuit <ArrowRightIcon size={13} />
              </span>
            </div>
          </div>

          {/* Card 2: IIM / IIT Premier */}
          <div
            className="t19-circuit-card"
            onClick={() => onSelectCircuit('iim-iit-premier')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectCircuit('iim-iit-premier');
              }
            }}
          >
            <div className="t19-circuit-card-header">
              <span className="t19-circuit-tag premier">TIER-1 PREMIER</span>
              <span className="t19-circuit-count">{metrics.iimIitPremier || 0} active</span>
            </div>
            <h3 className="t19-circuit-title">IIMs, IITs & B-Schools</h3>
            <p className="t19-circuit-desc">
              IIM Rohtak, IIM Kozhikode, IIT Bombay, FMS & XLRI undergraduate open categories with premier industry jury.
            </p>
            <div className="t19-circuit-footer">
              <span className="t19-circuit-cta">
                Explore Tier-1 <ArrowRightIcon size={13} />
              </span>
            </div>
          </div>

          {/* Card 3: Corporate Flagships */}
          <div
            className="t19-circuit-card"
            onClick={() => onSelectCircuit('corporate-global')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectCircuit('corporate-global');
              }
            }}
          >
            <div className="t19-circuit-card-header">
              <span className="t19-circuit-tag corporate">INDUSTRY FLAGSHIPS</span>
              <span className="t19-circuit-count">{metrics.corporateGlobal || 0} active</span>
            </div>
            <h3 className="t19-circuit-title">Corporate & Global</h3>
            <p className="t19-circuit-desc">
              McKinsey, Bain BVCC, HUL L.I.M.E, Tata Imagination, Flipkart GRiD & L'Oréal Brandstorm with direct PPI pipelines.
            </p>
            <div className="t19-circuit-footer">
              <span className="t19-circuit-cta">
                Explore Corporate <ArrowRightIcon size={13} />
              </span>
            </div>
          </div>

          {/* Card 4: Dev & Hackathons */}
          <div
            className="t19-circuit-card"
            onClick={() => onSelectTrack('hackathon')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectTrack('hackathon');
              }
            }}
          >
            <div className="t19-circuit-card-header">
              <span className="t19-circuit-tag tech">DEV & BUILD</span>
              <span className="t19-circuit-count">{metrics.hackathons || 0} active</span>
            </div>
            <h3 className="t19-circuit-title">Hackathons & Tech Sprints</h3>
            <p className="t19-circuit-desc">
              Fullstack prototyping, open-source challenges, web3 & AI/ML build sprints with cloud credits and cash bounties.
            </p>
            <div className="t19-circuit-footer">
              <span className="t19-circuit-cta">
                Explore Hackathons <ArrowRightIcon size={13} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 04: Live Squad Exchange Teaser ── */}
      <div className="t19-section-block">
        <div className="t19-squad-spotlight-box">
          <div className="t19-squad-left">
            <div className="t19-section-title-wrap">
              <span className="t19-section-idx">04 //</span>
              <h2 className="t19-section-title">SQUAD EXCHANGE</h2>
            </div>
            <h3 className="t19-squad-box-heading">
              Need complementary skills to win?
            </h3>
            <p className="t19-squad-box-desc">
              Stop competing solo against teams. Build a balanced roster with verified batchmates across financial modeling, deck design, and dev. Direct 1-click WhatsApp handshakes when matched.
            </p>
            <div className="t19-squad-box-actions">
              <button
                type="button"
                className="t19-primary-btn"
                onClick={onNavigateToSquads}
              >
                <UsersIcon size={15} />
                <span>Browse Active Squads</span>
              </button>
              <button
                type="button"
                className="t19-secondary-btn"
                onClick={onNavigateToSquads}
              >
                <span>+ Post Squad Requirement</span>
              </button>
            </div>
          </div>

          {/* Sample Live Roster Calls */}
          <div className="t19-squad-right">
            <div className="t19-squad-sample-card">
              <div className="t19-sample-top">
                <span className="t19-sample-org">DU Circuit Case Comp</span>
                <span className="t19-sample-slot">Seeking 1 Teammate</span>
              </div>
              <h4 className="t19-sample-comp">SSCBS National Case Competition</h4>
              <div className="t19-sample-skills">
                <span className="t19-skill-badge highlight">Deck Specialist</span>
                <span className="t19-skill-badge">Financial Modeling</span>
              </div>
              <div className="t19-sample-meta">
                <span>Aditya (SSCBS, '26)</span>
                <button
                  type="button"
                  className="t19-sample-cta"
                  onClick={onNavigateToSquads}
                >
                  Join Squad →
                </button>
              </div>
            </div>

            <div className="t19-squad-sample-card">
              <div className="t19-sample-top">
                <span className="t19-sample-org">IIM Rohtak Challenge</span>
                <span className="t19-sample-slot">Seeking 2 Teammates</span>
              </div>
              <h4 className="t19-sample-comp">National Strategic Simulation</h4>
              <div className="t19-sample-skills">
                <span className="t19-skill-badge highlight">Market Research</span>
                <span className="t19-skill-badge">Public Speaking</span>
              </div>
              <div className="t19-sample-meta">
                <span>Rhea (SRCC, '25)</span>
                <button
                  type="button"
                  className="t19-sample-cta"
                  onClick={onNavigateToSquads}
                >
                  Join Squad →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 05: Jump to Full Directory ── */}
      <div className="t19-directory-jump-row">
        <button
          type="button"
          className="t19-directory-jump-btn"
          onClick={onScrollToRepository}
        >
          <span>Explore All {competitions.length} Opportunities & Deep Filters</span>
          <ChevronDownIcon size={16} />
        </button>
      </div>
    </section>
  );
}
