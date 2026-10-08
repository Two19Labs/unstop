// scripts/scrape_institutional.js
/**
 * OneStop listings scraper (runs in GitHub Actions every 6 hours)
 *
 * Sources, all saved to Supabase `institutional_competitions`:
 *  - Devpost: every open hackathon that is online or in India (official JSON API)
 *  - InsideKampus / InsideIIM: every open competition (their GraphQL API)
 *  - A short, verified list of corporate challenges that are not on Unstop, read with Gemini
 *
 * Rules: no invented deadlines, prizes or counts; ids are stable per source; rows that disappear
 * from their source are deactivated; a run that cannot save (or where every source fails) exits 1.
 *
 * Environment (or .env / .env.local):
 *  - SUPABASE_URL, SUPABASE_SERVICE_KEY (service_role, required to save)
 *  - GEMINI_API_KEY (optional: without it the corporate list is skipped)
 *  - DRY_RUN=1 to print what would be saved without writing anything
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyOpportunity, extractSubTracks, htmlToText } from '../api/competitions.js';
import { classifyCircuit } from '../src/data/circuitKeywords.js';
import { parseDevpostDeadline, isOnlineOrIndia, devpostSubTracks, plainPrize, stableId, insideKampusTeam } from './lib/scraperUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadLocalEnv() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.join(path.resolve(__dirname, '..'), file);
    try {
      if (!fs.existsSync(fullPath)) continue;
      for (const line of fs.readFileSync(fullPath, 'utf-8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const eqIdx = trimmed.indexOf('=');
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    } catch (e) {}
  }
}
loadLocalEnv();

const DRY_RUN = process.env.DRY_RUN === '1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// A row not refreshed for this long (two missed 6-hourly runs) is treated as gone from its source
const STALE_AFTER_MS = 13 * 60 * 60 * 1000;

// AI-extracted links are untrusted (a scraped page can steer the model): only http(s) survives
function httpUrlOr(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : fallback;
  } catch (e) {
    return fallback;
  }
}

const CATEGORY_META = {
  case: ['Case Competition', '💼'],
  hackathon: ['Hackathon', '💻'],
  quiz: ['Quiz', '🧠'],
  simulation: ['Simulation', '📈'],
  writing: ['Writing & Research', '✍️'],
  debate: ['Debates & MUNs', '🗣️'],
  other: ['Other', '🏅'],
};

function circuitFlags(host, title) {
  const circuit = classifyCircuit(host, title);
  return {
    is_du: circuit === 'DU Circuit',
    is_iim_or_iit: circuit === 'IIM / IIT',
    is_premier: circuit === 'IIM / IIT',
  };
}

function baseRow(fields) {
  const category = CATEGORY_META[fields.category] ? fields.category : 'other';
  return {
    banner_url: null,
    start_date: null,
    views_count: 0,
    is_flagship: false,
    is_active: true,
    ...fields,
    category,
    category_label: CATEGORY_META[category][0],
    category_emoji: CATEGORY_META[category][1],
    slug: fields.id,
    organizer: fields.host_institution,
    updated_at: new Date().toISOString(),
  };
}

// ---------- Devpost ----------

async function fetchDevpost() {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`https://devpost.com/api/hackathons?status[]=open&page=${page}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Devpost page ${page}: HTTP ${res.status}`);
    const json = await res.json();
    const list = Array.isArray(json.hackathons) ? json.hackathons : [];
    all.push(...list);
    if (list.length === 0 || all.length >= (json.meta?.total_count || 0)) break;
  }

  const now = Date.now();
  const rows = [];
  const skipped = { notIndiaOrOnline: 0, inviteOnly: 0, noDeadline: 0 };
  for (const h of all) {
    if (h.open_state !== 'open') continue;
    if (h.invite_only) { skipped.inviteOnly++; continue; }
    const location = h.displayed_location?.location || '';
    if (!isOnlineOrIndia(location)) { skipped.notIndiaOrOnline++; continue; }
    const deadline = parseDevpostDeadline(h.submission_period_dates);
    if (!deadline || new Date(deadline).getTime() < now) { skipped.noDeadline++; continue; }

    const themes = (h.themes || []).map(t => t.name).filter(Boolean);
    const online = /online/i.test(location);
    rows.push(baseRow({
      id: stableId('devpost', h.id),
      title: String(h.title || '').trim(),
      host_institution: (h.organization_name || 'Devpost').trim(),
      category: 'hackathon',
      sub_tracks: devpostSubTracks(h.themes),
      source_platform: 'devpost',
      source_label: 'Devpost Official',
      apply_url: httpUrlOr(h.url, 'https://devpost.com/hackathons'),
      website_url: httpUrlOr(h.url, 'https://devpost.com/hackathons'),
      logo_url: httpUrlOr(h.thumbnail_url?.startsWith('//') ? `https:${h.thumbnail_url}` : h.thumbnail_url, null),
      prizes: plainPrize(h.prize_amount) || 'Prizes listed on Devpost',
      fee: 'Free',
      mode: online ? 'Online' : 'Offline',
      location: location || 'Online',
      min_team: 1,
      max_team: 4,
      deadline,
      registered_count: Number(h.registrations_count) || 0,
      raw_scraped_text: themes.length ? `Hackathon on Devpost. Themes: ${themes.join(', ')}.` : 'Hackathon on Devpost.',
      is_undergrad_eligible: true,
      is_pg_only: false,
      is_mba_or_pg: false,
      is_du: false,
      is_iim_or_iit: false,
      is_premier: false,
    }));
  }
  console.log(`   Devpost: ${all.length} open, kept ${rows.length} (skipped ${skipped.notIndiaOrOnline} in person outside India, ${skipped.inviteOnly} invite-only, ${skipped.noDeadline} without a readable deadline)`);
  return rows;
}

// ---------- InsideKampus / InsideIIM ----------

const IK_QUERY = `query GetFilteredCompetitions($input: CompetitionMasterPaginatedListInput!) {
  getFilteredCompetitions(CompetitionMasterPaginatedListInput: $input) {
    total page lastPage
    data { _id slug isPrivate title description registrationEnd status rewards eligibility rules noOfParticipants noOfTeams
      teamSize { type size } cardImage { url } featuredImage { url } organization { name } }
  }
}`;

async function fetchInsideKampus() {
  const all = [];
  let lastPage = 1;
  for (let page = 1; page <= lastPage && page <= 20; page++) {
    const res = await fetch('https://api.insidekampus.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://insidekampus.com' },
      body: JSON.stringify({ query: IK_QUERY, variables: { input: { filters: { sortBy: 'CLOSING_SOON' }, limit: 50, page } } }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`InsideKampus page ${page}: HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`InsideKampus: ${json.errors[0]?.message || 'GraphQL error'}`);
    const result = json.data?.getFilteredCompetitions;
    lastPage = Number(result?.lastPage) || 1;
    all.push(...(result?.data || []));
  }

  const now = Date.now();
  const rows = [];
  for (const c of all) {
    if (c.isPrivate || c.status !== 'ACTIVE') continue;
    const end = new Date(c.registrationEnd).getTime();
    if (!c.registrationEnd || Number.isNaN(end) || end < now) continue;

    const title = String(c.title || '').trim();
    const host = (c.organization?.name || 'InsideIIM').trim();
    const eligibility = htmlToText(c.eligibility);
    const description = htmlToText(c.description);
    const rules = htmlToText(c.rules);
    const combined = `${title} ${eligibility} ${rules} ${description}`.toLowerCase();

    const hasUgCohort = /\b(undergraduate|undergrad|undergraduates|ug\s+campuses|ug\s+students|engineering\s+campuses|engineering\s+students|b\.tech|bba|b\.com|bcom|bachelor|bachelors|bsc|b\.sc|b\.a\b|open\s+to\s+all\s+branches|all\s+years|1st\s+to\s+4th\s+year|open\s+to\s+all\s+students|all\s+students\s+eligible)\b/i.test(combined);
    const isMbaExclusive = /\b(only\s+open\s+for\s+.*b-schools|mba\s+students\s+only|only\s+for\s+mba|mba\s+only|pgdm\s+only|postgraduate\s+only|post-graduate\s+only|pre-mba|pgp\s+only|full-time\s+mba|two-year\s+mba|participating\s+b-schools)\b/i.test(eligibility || combined);
    const isUndergradEligible = hasUgCohort && (!isMbaExclusive || /\b(ug\s+campuses|engineering\s+campuses|undergraduate\s+track)\b/i.test(combined));

    const rewards = (Array.isArray(c.rewards) ? c.rewards : []).map(htmlToText).join(' ');
    const cash = rewards.match(/₹\s*([0-9][0-9,]*)/);
    const prizes = cash ? `₹${cash[1]} Prize Pool` : (/\bppi|ppo\b/i.test(rewards) ? 'PPIs / PPOs & Prizes' : 'Prizes listed on InsideKampus');

    // InsideKampus is a B-school challenge platform: unclassifiable titles are case challenges
    let category = classifyOpportunity({ title }).category;
    if (category === 'other') category = 'case';
    const team = insideKampusTeam(c.teamSize);

    rows.push(baseRow({
      id: stableId('insidekampus', c._id || c.slug),
      title,
      host_institution: host,
      category,
      sub_tracks: extractSubTracks({ title }, category),
      source_platform: 'inside_campus',
      source_label: 'InsideKampus Direct',
      apply_url: `https://insidekampus.com/competitions/${encodeURIComponent(c.slug || '')}`,
      website_url: 'https://insidekampus.com/competitions',
      logo_url: httpUrlOr(c.cardImage?.url || c.featuredImage?.url, null),
      prizes,
      fee: 'Free',
      mode: 'Online',
      location: 'Online',
      min_team: team.min,
      max_team: team.max,
      deadline: new Date(end).toISOString(),
      registered_count: Number(c.noOfParticipants || c.noOfTeams) || 0,
      raw_scraped_text: `${eligibility} ${description}`.trim().slice(0, 2000),
      is_undergrad_eligible: isUndergradEligible,
      is_pg_only: !isUndergradEligible,
      is_mba_or_pg: true,
      ...circuitFlags(host, title),
    }));
  }
  console.log(`   InsideKampus: ${all.length} listed, kept ${rows.length} open`);
  return rows;
}

// ---------- Curated corporate challenges (Gemini) ----------

// Verified to return readable pages (2026-10-09). Most corporate challenges are already on Unstop.
const CURATED_SOURCES = [
  { key: 'cfa', institution: 'CFA Institute', url: 'https://www.cfainstitute.org/en/societies/challenge', label: 'CFA Institute Direct' },
  { key: 'callforcode', institution: 'IBM', url: 'https://callforcode.org', label: 'IBM Call for Code' },
  { key: 'deepracer', institution: 'Amazon Web Services', url: 'https://aws.amazon.com/deepracer/student/', label: 'AWS DeepRacer League' },
  { key: 'worldquant', institution: 'WorldQuant', url: 'https://www.worldquant.com/brain/', label: 'WorldQuant BRAIN IQC' },
  { key: 'hultprize', institution: 'Hult Prize Foundation', url: 'https://www.hultprize.org', label: 'Hult Prize' },
];

function pageText(html) {
  const text = htmlToText(html);
  if (text.length <= 6000) return text;
  const relevant = text.split(/(?<=[.!?])\s+/).filter(s => /(competition|challenge|hackathon|round|prize|deadline|register|team|eligib)/i.test(s));
  return (relevant.length >= 4 ? relevant.join(' ') : text).slice(0, 6000);
}

function extractJsonArray(rawText) {
  try {
    const cleaned = String(rawText || '').replace(/```(?:json)?/gi, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    const parsed = JSON.parse(start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

async function askGemini(prompt) {
  const models = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.7-flash'];
  let lastError = 'no model answered';
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: 'application/json', temperature: 0.1 } }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) { lastError = `${model}: HTTP ${res.status}`; continue; }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return extractJsonArray(text);
      lastError = `${model}: empty answer`;
    } catch (err) {
      lastError = `${model}: ${err.message}`;
    }
  }
  throw new Error(lastError);
}

async function fetchCurated(source) {
  const res = await fetch(source.url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`${source.url}: HTTP ${res.status}`);
  const text = pageText(await res.text());
  const today = new Date().toISOString().slice(0, 10);

  const items = await askGemini(`You extract student competitions from the official page of "${source.institution}".
Today is ${today}. Only include competitions that are currently open or upcoming for registration.
Never guess. If the page does not state the registration deadline, set "deadline" to null.
Return a JSON array (or []) of objects:
{"title": string, "category": "case"|"hackathon"|"quiz"|"simulation"|"writing"|"debate"|"other",
 "deadline": ISO 8601 date or null, "prizes": string or null, "fee": "Free" or the fee as written,
 "min_team": number or null, "max_team": number or null, "apply_url": string or null,
 "description": two sentences on what participants do, "open_to_undergraduates": true|false|null}

Page text:
"""
${text}
"""`);

  const now = Date.now();
  const rows = [];
  for (const c of items) {
    const title = String(c.title || '').trim();
    const deadlineMs = new Date(c.deadline).getTime();
    if (!title || !c.deadline || Number.isNaN(deadlineMs) || deadlineMs < now) continue; // no invented deadlines
    const category = CATEGORY_META[c.category] ? c.category : classifyOpportunity({ title }).category;
    const ug = c.open_to_undergraduates !== false;
    rows.push(baseRow({
      id: stableId(`corp_${source.key}`, title.toLowerCase().replace(/\b(19|20)\d{2}\b/g, '')),
      title,
      host_institution: source.institution,
      category,
      sub_tracks: extractSubTracks({ title }, category),
      source_platform: 'corporate',
      source_label: source.label,
      apply_url: httpUrlOr(c.apply_url, source.url),
      website_url: source.url,
      logo_url: null,
      prizes: c.prizes || 'Prizes listed on the official page',
      fee: c.fee || 'Free',
      mode: 'Online',
      location: 'Online',
      min_team: Number(c.min_team) || 1,
      max_team: Number(c.max_team) || Number(c.min_team) || 1,
      deadline: new Date(deadlineMs).toISOString(),
      registered_count: 0,
      raw_scraped_text: String(c.description || '').slice(0, 1000),
      is_undergrad_eligible: ug,
      is_pg_only: !ug,
      is_mba_or_pg: !ug,
      is_du: false,
      is_iim_or_iit: false,
      is_premier: false,
    }));
  }
  return rows;
}

// ---------- Supabase ----------

async function supabase(pathAndQuery, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${pathAndQuery.split('?')[0]}: HTTP ${res.status} ${(await res.text()).slice(0, 160)}`);
  return res;
}

const quoteList = (values) => `(${values.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',')})`;

async function save(rows) {
  if (rows.length === 0) return;
  // Every row carries the same keys, which PostgREST requires for a bulk upsert
  await supabase('institutional_competitions', { method: 'POST', body: rows, prefer: 'resolution=merge-duplicates,return=minimal' });
}

async function deactivate(filter, reason) {
  const res = await supabase(`institutional_competitions?is_active=eq.true&${filter}`, {
    method: 'PATCH', body: { is_active: false }, prefer: 'return=representation',
  });
  const changed = await res.json();
  if (changed.length) console.log(`   ↳ deactivated ${changed.length} row(s): ${reason}`);
}

// ---------- main ----------

async function main() {
  const runStart = Date.now();
  console.log(`OneStop listings scraper  -  ${new Date(runStart).toISOString()}${DRY_RUN ? '  (DRY RUN)' : ''}`);

  if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required to save listings.');
    process.exit(1);
  }

  const sources = [
    { label: 'Devpost Official', run: fetchDevpost },
    { label: 'InsideKampus Direct', run: fetchInsideKampus },
    ...CURATED_SOURCES.map(s => ({ label: s.label, run: () => fetchCurated(s), needsGemini: true })),
  ];

  const results = [];
  for (const source of sources) {
    console.log(`\n▶ ${source.label}`);
    if (source.needsGemini && !GEMINI_API_KEY) {
      console.log('   skipped: GEMINI_API_KEY is not set');
      results.push({ source, ok: false, skipped: true, rows: [] });
      continue;
    }
    try {
      const rows = await source.run();
      rows.forEach(r => console.log(`   • ${r.title}  |  closes ${r.deadline.slice(0, 10)}  |  ${r.category}`));
      results.push({ source, ok: true, rows });
    } catch (err) {
      console.warn(`   ✗ ${err.message}`);
      results.push({ source, ok: false, rows: [] });
    }
  }

  const rows = results.flatMap(r => r.rows);
  const okSources = results.filter(r => r.ok);
  const attempted = results.filter(r => !r.skipped);
  console.log(`\n${rows.length} listing(s) from ${okSources.length}/${attempted.length} source(s)`);

  if (DRY_RUN) {
    console.log('Dry run: nothing written.');
    return;
  }

  let failed = false;
  try {
    await save(rows);
    console.log(`Saved ${rows.length} listing(s).`);

    // Sources that fetched cleanly: anything of theirs not refreshed recently has left the source
    const staleBefore = new Date(runStart - STALE_AFTER_MS).toISOString();
    for (const r of okSources) {
      await deactivate(`source_label=eq.${encodeURIComponent(r.source.label)}&updated_at=lt.${encodeURIComponent(staleBefore)}`, `no longer listed on ${r.source.label}`);
    }
    // Rows from sources this scraper no longer reads (MLH, campus homepages, BITS Oasis, ...)
    await deactivate(`source_label=not.in.${encodeURIComponent(quoteList(sources.map(s => s.label)))}`, 'source removed');
    // Registration closed
    await deactivate(`deadline=lt.${encodeURIComponent(new Date().toISOString())}`, 'deadline passed');
  } catch (err) {
    console.error(`✗ ${err.message}`);
    failed = true;
  }

  if (attempted.length > 0 && okSources.length === 0) {
    console.error('✗ Every source failed this run.');
    failed = true;
  }
  if (failed) process.exit(1);
}

main().catch(err => {
  console.error('Fatal scraper error:', err);
  process.exit(1);
});
