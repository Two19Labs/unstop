// src/hooks/useCompetitionRounds.js
// Client hook to fetch, cache, and provide multi-round competition timelines

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const STORAGE_CACHE_KEY = 'onestop_comp_rounds_cache_v2';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute client cache

function readStorageCache() {
  try {
    if (typeof window === 'undefined') return {};
    const raw = sessionStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const valid = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (entry && (now - (entry.cachedAt || 0) < CACHE_TTL_MS)) {
        valid[id] = entry.data;
      }
    }
    return valid;
  } catch (e) {
    return {};
  }
}

function writeStorageCache(updatedMap) {
  try {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const payload = {};
    for (const [id, data] of Object.entries(updatedMap)) {
      payload[id] = { cachedAt: now, data };
    }
    sessionStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(payload));
  } catch (e) {}
}

export function useCompetitionRounds(competitionIds = []) {
  // Stable string serialization of IDs to eliminate array reference churn
  const idsKey = useMemo(() => {
    if (!Array.isArray(competitionIds)) return '';
    return Array.from(new Set(competitionIds.map(String).filter(Boolean))).sort().join(',');
  }, [competitionIds]);

  const ids = useMemo(() => (idsKey ? idsKey.split(',') : []), [idsKey]);

  const [roundsMap, setRoundsMap] = useState(() => readStorageCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inFlightRef = useRef(false);

  const fetchRounds = useCallback(async (targetIds, force = false) => {
    if (!targetIds || targetIds.length === 0) return;

    const currentCached = force ? {} : readStorageCache();
    const missing = targetIds.filter(id => !currentCached[id]);

    if (missing.length === 0) {
      setRoundsMap(prev => {
        let hasDiff = false;
        for (const id of targetIds) {
          if (currentCached[id] && prev[id] !== currentCached[id]) {
            hasDiff = true;
            break;
          }
        }
        return hasDiff ? { ...prev, ...currentCached } : prev;
      });
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      let combinedData = {};

      // 1. Try serverless /api/rounds first (fast and cached at Edge)
      try {
        const res = await fetch(`/api/rounds?ids=${missing.join(',')}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            combinedData = { ...json.data };
          }
        }
      } catch (apiErr) {
        // Fallback continues below
      }

      // 2. Direct Supabase fallback for any institutional competitions (inst_*) not returned by /api/rounds
      const instMissing = missing.filter(id => id.startsWith('inst_') && (!combinedData[id] || !combinedData[id].rounds?.length));
      if (instMissing.length > 0 && supabase) {
        try {
          const { data: rows } = await supabase
            .from('institutional_competitions')
            .select('*')
            .in('id', instMissing);

          if (Array.isArray(rows)) {
            const now = Date.now();
            rows.forEach(item => {
              const deadlineTime = item.deadline ? new Date(item.deadline).getTime() : 0;
              const regIsClosed = deadlineTime > 0 && deadlineTime < now;
              const rounds = [
                {
                  order: 0,
                  stageNumber: 0,
                  id: `reg_${item.id}`,
                  title: 'Registration',
                  type: 'registration',
                  typeLabel: 'Registration Window',
                  typeEmoji: '📝',
                  startDate: item.start_date || null,
                  endDate: item.deadline || null,
                  status: regIsClosed ? 'completed' : 'live',
                  duration: null,
                  totalQuestions: null,
                  displayText: regIsClosed ? 'Closed' : 'Open',
                  publicUrl: item.apply_url || item.website_url || '#'
                },
                {
                  order: 1,
                  stageNumber: 1,
                  id: `rnd_sub_${item.id}`,
                  title: item.category === 'case' ? 'Case Submission / PPT' : (item.category === 'hackathon' ? 'Prototype Build' : 'Evaluation Round'),
                  type: item.category === 'case' ? 'submission' : (item.category === 'hackathon' ? 'hackathon' : 'round'),
                  typeLabel: item.category === 'case' ? 'Case Submission' : (item.category === 'hackathon' ? 'Hackathon Build' : 'Evaluation Round'),
                  typeEmoji: item.category_emoji || '🎯',
                  startDate: item.deadline || null,
                  endDate: item.deadline ? new Date(new Date(item.deadline).getTime() + 7 * 86400000).toISOString() : null,
                  status: regIsClosed ? 'live' : 'upcoming',
                  displayText: item.location || 'Online',
                  publicUrl: item.apply_url || item.website_url || '#'
                }
              ];
              combinedData[item.id] = {
                id: item.id,
                title: item.title,
                host: item.host_institution || item.organizer || 'Campus Direct',
                orgName: item.host_institution || item.organizer || 'Campus Direct',
                logo: item.logo_url || null,
                orgLogo: item.logo_url || null,
                deadline: item.deadline,
                sourcePlatform: item.source_platform || 'campus_direct',
                unstopUrl: item.apply_url || item.website_url || '#',
                rounds
              };
            });
          }
        } catch (supaErr) {
          console.warn('[useCompetitionRounds] Supabase fallback error:', supaErr.message);
        }
      }

      if (Object.keys(combinedData).length > 0) {
        setRoundsMap(prev => {
          const next = { ...prev, ...combinedData };
          writeStorageCache(next);
          return next;
        });
      }
    } catch (err) {
      console.warn('[useCompetitionRounds] Fetch error:', err.message);
      setError(err.message);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ids.length > 0) {
      fetchRounds(ids);
    }
  }, [idsKey, fetchRounds]);

  const refreshRounds = useCallback(() => {
    if (ids.length > 0) {
      fetchRounds(ids, true);
    }
  }, [ids, fetchRounds]);

  const getRoundsForComp = useCallback((compId) => {
    return roundsMap[String(compId)] || null;
  }, [roundsMap]);

  // Derived: Find imminent rounds closing within 48h across all provided competitions
  const imminentRounds = useMemo(() => {
    const now = Date.now();
    const list = [];

    ids.forEach(id => {
      const compData = roundsMap[id];
      if (!compData || !Array.isArray(compData.rounds)) return;

      compData.rounds.forEach(r => {
        if (!r.endDate) return;
        const eTime = new Date(r.endDate).getTime();
        const diffMs = eTime - now;
        // Due between now and next 48 hours
        if (diffMs > 0 && diffMs <= 48 * 60 * 60 * 1000) {
          list.push({
            competitionId: id,
            competitionTitle: compData.title,
            round: r,
            hoursRemaining: Math.ceil(diffMs / (1000 * 60 * 60)),
            isLive: r.status === 'live'
          });
        }
      });
    });

    list.sort((a, b) => new Date(a.round.endDate).getTime() - new Date(b.round.endDate).getTime());
    return list;
  }, [ids, roundsMap]);

  // Derived: Find currently active rounds
  const activeNowRounds = useMemo(() => {
    const list = [];
    ids.forEach(id => {
      const compData = roundsMap[id];
      if (!compData || !Array.isArray(compData.rounds)) return;
      compData.rounds.forEach(r => {
        if (r.status === 'live') {
          list.push({
            competitionId: id,
            competitionTitle: compData.title,
            round: r
          });
        }
      });
    });
    return list;
  }, [ids, roundsMap]);

  return {
    roundsMap,
    loading,
    error,
    refreshRounds,
    getRoundsForComp,
    imminentRounds,
    activeNowRounds
  };
}
