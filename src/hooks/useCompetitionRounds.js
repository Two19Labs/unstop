// src/hooks/useCompetitionRounds.js
// Client hook to fetch, cache, and provide multi-round competition timelines

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_CACHE_KEY = 'onestop_comp_rounds_cache_v1';
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
  const ids = useMemo(() => {
    if (!Array.isArray(competitionIds)) return [];
    return Array.from(new Set(competitionIds.map(String).filter(Boolean)));
  }, [competitionIds]);

  const [roundsMap, setRoundsMap] = useState(() => readStorageCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRounds = useCallback(async (targetIds, force = false) => {
    if (!targetIds || targetIds.length === 0) return;

    const currentCached = force ? {} : readStorageCache();
    const missing = targetIds.filter(id => !currentCached[id]);

    if (missing.length === 0) {
      setRoundsMap(prev => ({ ...prev, ...currentCached }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/rounds?ids=${missing.join(',')}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        setRoundsMap(prev => {
          const next = { ...prev, ...json.data };
          writeStorageCache(next);
          return next;
        });
      }
    } catch (err) {
      console.warn('[useCompetitionRounds] Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ids.length > 0) {
      fetchRounds(ids);
    }
  }, [ids, fetchRounds]);

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
