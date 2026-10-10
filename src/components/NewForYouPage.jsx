// src/components/NewForYouPage.jsx  -  "New for you this week": the saved Browse filter, posted in the last 7 days
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import SectionLoadingWidget from './SectionLoadingWidget';
import { BROWSE_PUNS } from './FunLoadingScreen';
import { CompCard, competitionShareText } from './CompetitionsPage';
import { trackEvent } from '../lib/posthog';
import {
  CIRCUIT_OPTIONS, TRACK_OPTIONS, PLATFORM_OPTIONS, SUBTRACK_MAP,
  sanitizePrefs, getNewForYou, formatPostedAgo,
} from '../utils/competitionFilters';
import './NewForYouPage.css';

const labelOf = (options, id) => options.find(o => o.id === id)?.label || id;
const SUBTRACK_LABEL = Object.fromEntries(Object.values(SUBTRACK_MAP).flat().map(s => [s.id, s.label]));

// Human labels for the filter the list follows (all-selected groups mean "no filter")
function filterLabels(prefs) {
  const p = sanitizePrefs(prefs);
  const partial = (sel, all) => sel.length > 0 && sel.length < all.length;
  return [
    ...(partial(p.selectedTracks, TRACK_OPTIONS) ? p.selectedTracks.map(id => labelOf(TRACK_OPTIONS, id)) : []),
    ...p.selectedSubTracks.map(id => SUBTRACK_LABEL[id] || id),
    ...(partial(p.selectedCircuits, CIRCUIT_OPTIONS) ? p.selectedCircuits.map(id => labelOf(CIRCUIT_OPTIONS, id)) : []),
    ...(partial(p.selectedPlatforms, PLATFORM_OPTIONS) ? p.selectedPlatforms.map(id => labelOf(PLATFORM_OPTIONS, id)) : []),
    ...(p.teamFilter === 'solo' ? ['Solo OK'] : p.teamFilter === 'team' ? ['Team'] : []),
    ...(p.feeFilter === 'free' ? ['Free entry'] : p.feeFilter === 'paid' ? ['Paid entry'] : []),
  ];
}

export default function NewForYouPage({
  competitions = [],
  loading = false,
  savedFilter,
  isPostgraduate = false,
  bookmarks = [],
  onToggleBookmark,
  onOpenDetail,
  onFindTeammates,
  onBack,
  onEditFilters,
  onShowNewest,
  showToast,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [copiedId, setCopiedId] = useState(null);
  const copiedTimerRef = useRef(null);

  // Keeps "Posted 5m ago" current and drops listings as they pass the 7-day mark
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => () => clearTimeout(copiedTimerRef.current), []);

  const list = useMemo(
    () => getNewForYou(competitions, savedFilter, { isPostgrad: isPostgraduate, now: nowMs }),
    [competitions, savedFilter, isPostgraduate, nowMs]
  );
  const chips = useMemo(() => filterLabels(savedFilter), [savedFilter]);
  const bookmarkedIds = useMemo(() => new Set((bookmarks || []).map(String)), [bookmarks]);

  const latest = useRef({});
  latest.current = { onToggleBookmark, onFindTeammates, onOpenDetail, showToast };

  const handleToggleBookmark = useCallback((id) => latest.current.onToggleBookmark?.(String(id)), []);
  const handleFindTeammates = useCallback((comp) => latest.current.onFindTeammates?.(comp), []);
  const handleOpenDetail = useCallback((id) => latest.current.onOpenDetail?.(id), []);
  const handleApply = useCallback((comp) => {
    trackEvent('competition_outbound_clicked', { competition_id: comp.id, title: comp.title, source: 'new_for_you' });
  }, []);
  const handleShare = useCallback(async (comp) => {
    trackEvent('competition_shared', { competition_id: comp.id, title: comp.title });
    try {
      await navigator.clipboard.writeText(competitionShareText(comp));
      setCopiedId(comp.id);
      latest.current.showToast?.('Competition details copied to clipboard!');
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      latest.current.showToast?.('Could not copy. Your browser blocked clipboard access.');
    }
  }, []);

  const isLoading = loading && competitions.length === 0;

  return (
    <div className="nfy-page">
      <header className="nfy-header">
        {onBack && (
          <button type="button" className="cc-back-btn" onClick={onBack} aria-label="Back to home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}
        <div className="nfy-header-info">
          <h1 className="cc-title">New for you this week</h1>
          <p className="cc-subtitle">
            {isLoading
              ? 'Checking what was posted in the last 7 days…'
              : `${list.length} ${list.length === 1 ? 'opportunity' : 'opportunities'} posted in the last 7 days that match your Browse filters, newest first.`}
          </p>
        </div>
      </header>

      <div className="nfy-filter-row">
        <span className="nfy-filter-label">Your filters:</span>
        {chips.length > 0
          ? chips.map(chip => <span key={chip} className="nfy-chip">{chip}</span>)
          : <span className="nfy-chip">Everything</span>}
        {onEditFilters && (
          <button type="button" className="nfy-edit-btn" onClick={onEditFilters}>Edit in Browse</button>
        )}
      </div>

      {isLoading ? (
        <SectionLoadingWidget
          headline="Fetching live competitions..."
          subtitle="Finding what was posted this week"
          customPuns={BROWSE_PUNS}
          isReady={!loading}
        />
      ) : list.length === 0 ? (
        <div className="cc-empty-state">
          <h3 className="cc-empty-title">Nothing new matches your filters this week</h3>
          <p className="cc-empty-desc">Widen your filters in Browse, or see everything sorted newest first.</p>
          {onShowNewest && (
            <button type="button" className="cc-empty-btn" onClick={onShowNewest}>See newest in Browse</button>
          )}
        </div>
      ) : (
        <div className="cc-grid">
          {list.map(comp => (
            <CompCard
              key={comp.id}
              comp={comp}
              isBookmarked={bookmarkedIds.has(String(comp.id))}
              isCopied={copiedId === comp.id}
              nowMs={nowMs}
              postedLabel={formatPostedAgo(comp, nowMs)}
              onOpenDetail={handleOpenDetail}
              onToggleBookmark={handleToggleBookmark}
              onFindTeammates={handleFindTeammates}
              onShare={handleShare}
              onApply={handleApply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
