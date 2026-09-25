// api/rounds.js
// Vercel Serverless Function & Vite dev handler to fetch, normalize and serve multi-round competition timelines directly from Unstop

const CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute in-memory server cache
const roundsCache = new Map(); // compId -> { timestamp, data }

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
};

export async function fetchRoundsForSingleCompetition(compId) {
  const cached = roundsCache.get(String(compId));
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const res = await fetch(`https://unstop.com/api/public/competition/${compId}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(6000)
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch competition ${compId} from Unstop: HTTP ${res.status}`);
  }

  const json = await res.json();
  const comp = json?.data?.competition;
  if (!comp) {
    throw new Error(`No competition data returned for ID ${compId}`);
  }

  const now = Date.now();
  const rounds = [];

  // Stage 0: Registration Window
  const regStart = comp.regnRequirements?.start_regn_dt || comp.start_date || null;
  const regEnd = comp.regnRequirements?.end_regn_dt || comp.end_date || null;
  const regEndTime = regEnd ? new Date(regEnd).getTime() : 0;
  const regIsClosed = regEndTime > 0 && regEndTime < now;

  rounds.push({
    order: 0,
    stageNumber: 0,
    id: `reg_${comp.id}`,
    title: 'Registration',
    type: 'registration',
    typeLabel: 'Registration Window',
    typeEmoji: '📝',
    startDate: regStart,
    endDate: regEnd,
    status: regIsClosed ? 'completed' : 'live',
    duration: null,
    totalQuestions: null,
    displayText: comp.regnRequirements?.remain_days || (regIsClosed ? 'Closed' : 'Open'),
    publicUrl: comp.seo_url || `https://unstop.com/competitions/${comp.public_url || comp.id}`
  });

  // Stage 1+: Multi-Round Pipeline
  const rawRounds = Array.isArray(comp.rounds) ? comp.rounds : [];
  rawRounds.forEach((r, idx) => {
    const d = Array.isArray(r.details) ? r.details[0] : (r.details || {});
    const title = d.title || r.title || `Round ${r.round_order || (idx + 1)}`;
    const lowerTitle = title.toLowerCase();

    let type = 'round';
    let typeLabel = 'Round';
    let typeEmoji = '🎯';

    if (r.entity_type?.includes('Assessment') || d.type === 1 || d.total_questions || lowerTitle.includes('quiz') || lowerTitle.includes('assessment')) {
      type = 'quiz';
      typeLabel = 'Quiz / Assessment';
      typeEmoji = '🧠';
    } else if (r.entity_type?.includes('Offline') || lowerTitle.includes('offline') || lowerTitle.includes('campus') || lowerTitle.includes('in-person')) {
      type = 'offline';
      typeLabel = 'In-Person / Finale';
      typeEmoji = '🏛️';
    } else if (r.entity_type?.includes('Rounds') || lowerTitle.includes('case') || lowerTitle.includes('submission') || lowerTitle.includes('deck') || lowerTitle.includes('ppt')) {
      type = 'submission';
      typeLabel = 'Case Submission';
      typeEmoji = '📊';
    } else if (lowerTitle.includes('hack') || lowerTitle.includes('code') || lowerTitle.includes('prototype')) {
      type = 'hackathon';
      typeLabel = 'Hackathon / Build';
      typeEmoji = '💻';
    } else if (lowerTitle.includes('interview') || lowerTitle.includes('pitch') || lowerTitle.includes('presentation')) {
      type = 'presentation';
      typeLabel = 'Presentation / Pitch';
      typeEmoji = '🎙️';
    }

    const sDate = d.start_date || null;
    const eDate = d.end_date || null;
    const sTime = sDate ? new Date(sDate).getTime() : 0;
    const eTime = eDate ? new Date(eDate).getTime() : 0;

    let computedStatus = 'upcoming';
    if (!eDate || r.to_be_announced === 1) {
      computedStatus = 'tba';
    } else if (eTime > 0 && eTime < now) {
      computedStatus = 'completed';
    } else if (sTime > 0 && sTime <= now && eTime > now) {
      computedStatus = 'live';
    } else if (d.status === 'LIVE' || r.status === 'LIVE') {
      computedStatus = 'live';
    } else if (d.status === 'FINISHED' || r.status === 'FINISHED') {
      computedStatus = 'completed';
    }

    // Clean display text (strip simple tags or keep excerpt)
    let cleanText = d.display_text || d.description || '';
    if (cleanText) {
      cleanText = cleanText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      if (cleanText.length > 300) cleanText = cleanText.slice(0, 300) + '...';
    }

    let publicUrl = d.public_url || r.public_url || null;
    if (publicUrl && !publicUrl.startsWith('http')) {
      publicUrl = 'https://unstop.com' + (publicUrl.startsWith('/') ? '' : '/') + publicUrl;
    }
    if (!publicUrl) publicUrl = d.seo_url || comp.seo_url || null;

    rounds.push({
      order: r.round_order || (idx + 1),
      stageNumber: idx + 1,
      id: r.id || `rnd_${idx + 1}`,
      title,
      type,
      typeLabel,
      typeEmoji,
      startDate: sDate,
      endDate: eDate,
      status: computedStatus,
      duration: d.duration || null,
      totalQuestions: d.total_questions || null,
      displayText: cleanText || null,
      publicUrl
    });
  });

  // Calculate summary metrics
  const completedCount = rounds.filter(r => r.status === 'completed').length;
  const liveRound = rounds.find(r => r.status === 'live');
  const nextRound = rounds.find(r => r.status === 'live' || r.status === 'upcoming');

  let nextDeadline = null;
  let nextDeadlineLabel = null;
  let daysRemaining = null;

  if (nextRound && nextRound.endDate) {
    nextDeadline = nextRound.endDate;
    nextDeadlineLabel = nextRound.title;
    const diffMs = new Date(nextRound.endDate).getTime() - now;
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const isRegistrationClosed = Boolean(regIsClosed);
  const isConcluded = rounds.length > 0 && completedCount === rounds.length;
  const lastRound = rounds[rounds.length - 1];
  const finalDeadline = lastRound?.endDate || regEnd;

  const minTeam = comp.regnRequirements?.min_team_size || 1;
  const maxTeam = comp.regnRequirements?.max_team_size || 4;
  const isFree = !comp.isPaid;
  const host = comp.organisation?.name || comp.host || 'Host Institution';
  const logo = comp.organisation?.logoUrl2 || comp.organisation?.logoUrl || comp.logoUrl2 || null;

  const normalized = {
    id: comp.id,
    title: comp.title,
    host,
    orgName: host,
    logo,
    orgLogo: logo,
    unstopUrl: comp.seo_url || `https://unstop.com/competitions/${comp.public_url || comp.id}`,
    minTeam,
    maxTeam,
    teamSizeDisplay: minTeam === maxTeam 
      ? (minTeam === 1 ? 'Solo / Individual' : `${minTeam} Members`) 
      : `${minTeam} - ${maxTeam} Members`,
    isFree,
    fee: isFree ? 'Free' : (comp.fee || 'Paid'),
    deadline: regEnd,
    rounds,
    totalStages: rounds.length,
    completedStages: completedCount,
    progressPercent: Math.round((completedCount / Math.max(1, rounds.length)) * 100),
    isRegistrationClosed,
    isConcluded,
    finalDeadline,
    activeRound: liveRound || null,
    nextRound: nextRound || null,
    nextDeadline,
    nextDeadlineLabel,
    daysRemaining,
    fetchedAt: new Date().toISOString()
  };

  roundsCache.set(String(compId), { timestamp: Date.now(), data: normalized });
  return normalized;
}

export async function fetchRoundsForMultipleCompetitions(compIds = []) {
  const uniqueIds = Array.from(new Set(compIds.map(String).filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const results = {};
  const missingIds = [];

  // Check in-memory cache first
  const now = Date.now();
  for (const id of uniqueIds) {
    const cached = roundsCache.get(id);
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      results[id] = cached.data;
    } else {
      missingIds.push(id);
    }
  }

  if (missingIds.length > 0) {
    // Concurrency pool (up to 6 at a time to prevent socket exhaustion)
    const BATCH_SIZE = 6;
    for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
      const slice = missingIds.slice(i, i + BATCH_SIZE);
      await Promise.all(
        slice.map(async (id) => {
          try {
            const data = await fetchRoundsForSingleCompetition(id);
            results[id] = data;
          } catch (err) {
            console.warn(`[api/rounds] Could not load rounds for ${id}:`, err.message);
            results[id] = { id, error: err.message, rounds: [] };
          }
        })
      );
    }
  }

  return results;
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const rawIds = url.searchParams.get('ids') || url.searchParams.get('id') || '';
    const ids = rawIds.split(',').map(s => s.trim()).filter(Boolean);

    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required "ids" query parameter (e.g. /api/rounds?ids=1760928,1760303)'
      });
    }

    const data = await fetchRoundsForMultipleCompetitions(ids);

    // Cache at the Edge for 15 minutes, stale revalidate for 30 minutes
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({
      success: true,
      count: Object.keys(data).length,
      data
    });
  } catch (err) {
    console.error('[api/rounds] Handler error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while fetching competition rounds'
    });
  }
}
