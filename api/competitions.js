// api/competitions.js
// Vercel Serverless Function: fetches open competitions from Unstop, classifies them
// (category, sub-tracks, circuit, eligibility) and merges the scraped listings stored in Supabase.

import { classifyCircuit, matchesKeyword } from '../src/data/circuitKeywords.js';
import { MBA_EXCLUSION_PATTERN, UG_AFFIRMATIVE_PATTERN, isPgOnlyByTitle } from '../src/utils/eligibilityUtils.js';

const FLAGSHIP_KEYWORDS = [
  'iim', 'iit', 'srcc', 'sscbs', 'shri ram', 'bits', 'xlri', 'fms',
  "stephen's", 'st. stephen', 'stephens college', 'hansraj', 'hindu college', 'lsr', 'lady shri ram', 'sggscc',
  'nsut', 'dtu', "l'oreal", 'loreal', 'tata', 'hul', 'hindustan unilever',
  'aditya birla', 'mckinsey', 'bain', 'bcg', 'boston consulting', 'kearney',
  'ey', 'deloitte', 'pwc', 'kpmg', 'reliance', 'amazon', 'flipkart',
  'google', 'microsoft', 'tvs', 'optum', 'marico', 'itc', 'mondelez',
  'reckitt', 'accenture', 'sibm', 'spjimr', 'mdi', 'great lakes', 'glim',
  'maruti suzuki', 'qualcomm', 'asian paints',
  'brainwars', 'cafta', 'steel-a-thon', 'the ultimate pitch', 'stratos', 'flipkart grid', 'finserv atom'
];

// ---------- text helpers ----------

const ENTITIES = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', bull: '•', rarr: '→' };

export function htmlToText(html) {
  return String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|li|div|h\d)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function makeSummary(html, max = 200) {
  const text = htmlToText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).replace(/[\s,;:.\-–—]+$/, '')}…`;
}

// Event identity for de-duplication: ignores years, editions and punctuation
export function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\b(season|edition|ed\.?|vol\.?)\s*\d+\b/g, ' ')
    .replace(/[^a-z]+/g, '');
}

// Unstop sends approved_date as "2026-10-09 12:37:52 GMT+0530", which Safari can't parse
export function parseUnstopDate(value) {
  if (!value) return null;
  const m = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)\s*(?:GMT|UTC)?\s*([+-]\d{2}):?(\d{2})$/);
  const ms = m ? Date.parse(`${m[1]}T${m[2]}${m[3]}:${m[4]}`) : Date.parse(value);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

// ---------- eligibility ----------

// Check if a competition is strictly for school/K-12 students
function isSchoolOnly(item) {
  if (!item) return false;
  const filterNames = (item.filters || []).map(f => (f.name || '').toLowerCase().trim());
  if (filterNames.length > 0 && filterNames.every(f => f.includes('school'))) {
    return true;
  }
  const title = (item.title || '').toLowerCase();
  const org = (item.organisation?.name || item.orgName || item.host || '').toLowerCase();
  if (/\b(school students only|school students|class [1-9]|class 1[0-2]|k-12|junior robo|junior hackathon|junior make-a-thon|junior drone)\b/i.test(title)) {
    return true;
  }
  if (/\b(grammar school|high school|public school|senior secondary school|vidyalaya)\b/i.test(org) && !/\b(college|university|institute|school of)\b/i.test(org)) {
    return true;
  }
  return false;
}

// Check if an item is a fest pass, delegate ticket, or entry ticket rather than a competition
function isJunkOrPass(item) {
  if (!item) return true;
  const title = (item.title || '').toLowerCase();
  return /\b(gold pass|silver pass|platinum pass|event pass|entry pass|delegate pass|accommodation pass|student pass|general pass|festival pass|ticket pass|entry ticket|workshop pass)\b/i.test(title);
}

// Eligibility check: Allow competitions that undergraduates can participate in
function isUndergradEligible(item) {
  if (!item) return false;
  if (isSchoolOnly(item)) return false;
  if (isPgOnlyByTitle(item.title)) return false;

  const platform = (item.sourcePlatform || item.source_platform || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const orgName = (item.organisation?.name || item.orgName || item.host || item.host_institution || item.organizer || '').toLowerCase();
  const desc = (item.description || item.raw_scraped_text || '').toLowerCase();
  const fullText = `${title} ${orgName} ${desc}`;

  // 1. InsideKampus & InsideIIM: dedicated MBA / B-School platform
  const isInsideCampus = platform === 'inside_campus' || platform === 'inside_iim' ||
    /\binside(iim|kampus)\b/i.test(orgName) || /\binside(iim|kampus)\b/i.test(title);

  if (isInsideCampus) {
    const hasUgAffirmative = UG_AFFIRMATIVE_PATTERN.test(fullText);
    const hasMbaExclusion = MBA_EXCLUSION_PATTERN.test(fullText);
    const hasUgCohort = /\b(ug\s+campuses|engineering\s+campuses|undergraduate\s+track)\b/i.test(fullText);
    if (!(hasUgAffirmative && (!hasMbaExclusion || hasUgCohort))) {
      return false;
    }
  }

  // 2. Text-based strong MBA/PG exclusivity pattern across title, host and description
  if (MBA_EXCLUSION_PATTERN.test(fullText) && !UG_AFFIRMATIVE_PATTERN.test(fullText)) {
    return false;
  }

  // 3. Filter-based exclusivity from Unstop tags
  const filterNames = (item.filters || []).map(f => (typeof f === 'string' ? f : (f.name || '')).toLowerCase().trim());
  const hasUG = filterNames.some(f => f.includes('undergraduate') || f.includes('engineering') || f.includes('arts') || f.includes('bachelor'));
  const hasPG = filterNames.some(f => f.includes('postgraduate') || f.includes('mba') || f.includes('b-school'));
  if (hasPG && !hasUG) {
    return false;
  }

  // 4. Structured registration eligibility payload from Unstop
  let regnEligibility = item.regnRequirements?.eligibility;
  if (typeof regnEligibility === 'string') {
    try {
      regnEligibility = JSON.parse(regnEligibility);
    } catch (e) {}
  }

  if (regnEligibility && typeof regnEligibility === 'object') {
    const bSchools = Array.isArray(regnEligibility.bSchools) ? regnEligibility.bSchools : [];
    const arts = Array.isArray(regnEligibility.arts) ? regnEligibility.arts : [];
    const engineering = Array.isArray(regnEligibility.engineering) ? regnEligibility.engineering : [];
    const others = Array.isArray(regnEligibility.others) ? regnEligibility.others : [];

    const extractCourses = (arr) => arr.map(c => (typeof c === 'string' ? c : (c?.course || '')).toLowerCase()).filter(Boolean);
    const bSchoolCourses = extractCourses(bSchools);
    const hasUgInBschool = bSchoolCourses.some(c => c.includes('bba') || c.includes('bcom') || c.includes('bms') || c.includes('bhm'));
    const hasPgInBschool = bSchoolCourses.some(c => c.includes('mba') || c.includes('pgdm') || c.includes('exec') || c.includes('phd'));

    // Strictly restricted to B-schools with no undergrad/arts/tech access
    if (bSchools.length > 0 && extractCourses(engineering).length === 0 && extractCourses(arts).length === 0) {
      if (!hasUgInBschool && hasPgInBschool) {
        return false;
      }
      if (others.length === 0 || (others.length === 1 && others[0] === 'all' && hasPG && !hasUG)) {
        return false;
      }
    }
  }

  return true;
}

// Eligibility check: Allow competitions that postgraduates / MBA students can participate in
function isPostgradEligible(item) {
  if (!item) return false;
  if (isSchoolOnly(item)) return false;

  const title = (item.title || '').toLowerCase();
  if (/\b(undergraduate\s+only|ug\s+only|only\s+for\s+ug|only\s+for\s+undergraduate)\b/i.test(title)) return false;

  const filterNames = (item.filters || []).map(f => (f.name || '').toLowerCase().trim());
  const hasAll = filterNames.length === 0 || filterNames.includes('all');
  const hasPG = filterNames.some(f => f.includes('postgraduate') || f.includes('mba'));
  const hasUG = filterNames.some(f => f.includes('undergraduate'));

  return !(hasUG && !hasPG && !hasAll && filterNames.length === 1);
}

// ---------- category ----------

const CATEGORY_LABELS = {
  case: { categoryLabel: 'Case Comp', categoryEmoji: '📊' },
  hackathon: { categoryLabel: 'Hackathon', categoryEmoji: '💻' },
  quiz: { categoryLabel: 'Quiz & Trivia', categoryEmoji: '🧠' },
  debate: { categoryLabel: 'Debate & MUN', categoryEmoji: '🗣️' },
  writing: { categoryLabel: 'Writing & Research', categoryEmoji: '✍️' },
  simulation: { categoryLabel: 'Simulation & Auction', categoryEmoji: '📈' },
  other: { categoryLabel: 'Other', categoryEmoji: '🏅' },
};

const withLabel = (category) => ({ category, ...CATEGORY_LABELS[category] });

// Order matters: the first matching rule wins
const TITLE_RULES = [
  ['writing', /\b(case writing|case study writing|call for (papers|articles|abstracts)|paper presentation|research paper|article writing|essay (writing|competition|contest)|essay|white paper|blog writing|content writing|poetry|story writing|creative writing|policy)\b/i],
  ['case', /\b(case competition|case study|case challenge|case comp|case|business case|consulting challenge|crack the case|break the case)\b/i],
  ['hackathon', /(hackathon|\bhacks?\b|hack[-\s]?(sphere|era|verse|fest|night|day)|\bcodefest|\bcode\s?fest|coding (challenge|contest|competition|round)|\bctf\b|capture the flag|datathon|buildathon|make-?a-?thon|devfest|\bdsa\b|competitive programming|\bcode\b|\bcoding\b|programming|\bprompt\w*|bug bounty|\b\w+(?<!ide|mar)athon\b)/i],
  ['quiz', /\b(quiz\w*|trivia|treasure hunt|clue\w*|brain teaser|inquizitive|knowledge bowl|sawaal|buzzer|jeopardy|kahoot|mindspree|olympiad|aptitude|reasoning (test|challenge)|assessment test|bee)\b/i],
  ['debate', /\b(debate|debating|parliamentary|asian pd|british parliamentary|turncoat|mun|model united nations|youth parliament|lok sabha|unsc|unhrc|oratory|public speaking|extempore|elocution|gavel|battle of ideas|model cop)\b/i],
  ['simulation', /\b(auction|ipl|mock\s?stock|stock (market|trading|wars?)|trading (simulation|challenge|league|game)|simulation|portfolio management|bull[-\s]?vs[-\s]?bear|big bull|deal room|crisis room|monopoly|predictions? challenge|nifty|equities prediction|bidding|bid|bargain|trade wars?)\b/i],
];

// Events that are none of the six categories: shown in the full list and search, under no category filter
const NON_TRACK_TITLE = /\b(bgmi|valorant|free fire|pubg|call of duty|e-?sports?|gaming tournament|chess|checkmate|ludo|carrom|fantasy (football|cricket|league)|war zone|battle zone|minecraft|clash royale|marathon|cricket tournament|football tournament|badminton|robo\w*|robot\w*|bots?|escape|\w*xcape|drone|rc car|aero\s?model\w*|truss|bridge (design|building|it)|cad\b|seismic|hydra\w*|breadboard|circuit (design|making|craft)|soldering|arduino|wireless power|line follower|model (exhibition|making)|project (expo|exhibition)|poster|reels?\b|photography|videography|short film|film making|\bart\b|painting|sketch\w*|design (challenge|competition|contest|decode)|dance|singing|music|fashion|cooking|leather|fabriquer)\b/i;

const CASE_WEAK_TITLE = /\b(pitch\w*|shark tank|b-?plan|business plan|startup|venture|founder|ideathon|consult\w*|strateg\w*|brand\w*|marketing|valuation|equity research|investment|finance|financial|teardown|product (management|case)|go-to-market|growth hack|business model|entrepreneur\w*|enactus|impact tank|investor\w*|innovat\w*|idea\w*|business|manager\w*|management|hr|economics|audit|bank\w*|fraud\w*)\b/i;

// Unstop files puzzle events under the broad "Quizzes & Treasure Hunt" work function; only trust it with a puzzle-like title
const TECH_TITLE = /(llms?|ai agents?|syntax|software|tech solutions?|technology solutions?)|w*hack/i;
const PUZZLE_TITLE = /\b(hunt|rush|logic|puzzle\w*|cognitive|apti\w*|prashn\w*|brain\w*|riddle\w*|cryptic|decode)\b/i;

function topicalText(item) {
  const workFunctions = Array.isArray(item.workfunction)
    ? item.workfunction.map(w => (w?.name || '').toLowerCase()).filter(w => w && w !== 'quizzes & treasure hunt')
    : [];
  // Eligibility tags ("Engineering Students", "Arts, Commerce, Sciences & Others") say who may enter, not what the event is about
  const topicFilters = Array.isArray(item.filters)
    ? item.filters.filter(f => f && f.type !== 'eligible').map(f => (f.name || '').toLowerCase())
    : [];
  const tags = Array.isArray(item.tags) ? item.tags.map(t => (t?.name || t || '').toString().toLowerCase()) : [];
  return `${workFunctions.join(' ')} ${topicFilters.join(' ')} ${tags.join(' ')}`;
}

export function classifyOpportunity(item) {
  const title = String(item.title || '');
  const type = (item.type || '').toLowerCase();
  const subtype = (item.subtype || item.subType || '').toLowerCase();

  // 1. What the title explicitly says
  for (const [category, re] of TITLE_RULES) {
    if (re.test(title)) return withLabel(category);
  }
  // 2. Clearly not one of the six (esports, sport, engineering builds, art & media)
  if (NON_TRACK_TITLE.test(title)) return withLabel('other');

  // 3. Unstop's own structure
  if (type === 'hackathons' || subtype === 'online_coding_challenge') return withLabel('hackathon');
  if (subtype === 'case_competition') return withLabel('case');
  if (type === 'quizzes') return withLabel('quiz');

  // 4. Business-flavoured titles and puzzle events
  if (CASE_WEAK_TITLE.test(title)) return withLabel('case');
  const hasPuzzleWorkFunction = Array.isArray(item.workfunction) && item.workfunction.some(w => (w?.name || '').toLowerCase() === 'quizzes & treasure hunt');
  if (hasPuzzleWorkFunction && PUZZLE_TITLE.test(title)) return withLabel('quiz');

  // 5. Topic tags (never eligibility tags, never the broad "Quizzes & Treasure Hunt" work function)
  const topics = topicalText(item);
  if (TECH_TITLE.test(title) || /(programming|coding|software|hackathon|data science|artificial intelligence|machine learning|cyber|web development|app development)/.test(topics)) return withLabel('hackathon');
  if (/(trading|stock market|simulation)/.test(topics)) return withLabel('simulation');
  if (/(debate|model united nations|mun)/.test(topics)) return withLabel('debate');
  if (/(writing|content|journalism|research paper|essay)/.test(topics)) return withLabel('writing');
  // Unstop innovation challenges are ideation / pitch events
  if (subtype === 'innovation_challenge') return withLabel('case');
  if (/(case|strategy|business plan|marketing|entrepreneurship|finance|consulting|operations|product management|startup)/.test(topics)) return withLabel('case');

  // 6. Unknown: never forced into a category
  return withLabel('other');
}

// ---------- sub-tracks ----------

const SUBTRACK_RULES = {
  case: [
    ['finance', /\b(finance|financial|valuation|equity|m&a|merger|acquisition|fintech|banking|investment|capital market|credit|accounting)\b/i],
    ['strategy', /\b(strategy|strategic|consulting|consultant|market entry|gtm|go-to-market|growth|business analysis)\b/i],
    ['marketing', /\b(marketing|brand|branding|advertis\w*|fmcg|consumer|campaign)\b/i],
    ['bplan', /\b(b-?plan|business plan|pitch\w*|shark tank|startup|entrepreneur\w*|venture|incubat\w*|ideathon|founder)\b/i],
    ['product', /\b(product management|product case|product teardown|product|apm|ui\/ux|teardown|prd)\b/i],
    ['operations', /\b(operations|supply chain|scm|logistics|procurement|process improvement|six sigma|warehouse)\b/i],
  ],
  hackathon: [
    ['hack_ai', /\b(ai|a\.i\.|ml|machine learning|artificial intelligence|deep learning|computer vision|nlp|llm|llms|gen\s?ai|generative|neural|agentic|agents?|prompt)\b/i],
    ['hack_data', /\b(data science|datathon|analytics|kaggle|big data|data analytics|visuali[sz]ation|data engineering)\b/i],
    ['hack_web3', /\b(blockchain|web3|crypto\w*|smart contracts?|solidity|ethereum|dapps?|defi|nfts?)\b/i],
    ['hack_cyber', /\b(cyber\w*|ctf|capture the flag|ethical hacking|security|infosec|cloud|devops)\b/i],
    ['hack_dev', /\b(web|webdev|apps?|full\s?stack|frontend|backend|mobile|android|ios|software development|web development|app development)\b/i],
  ],
  quiz: [
    ['quiz_business', /\b(business|biz|brand\w*|corporate|marketing|startup|management|economy|economics)\b/i],
    ['quiz_tech', /\b(tech|technology|technical|science|engineering|computing|coding|ai|physics|chemistry|math\w*|quantum|algo\w*)\b/i],
    ['quiz_finance', /\b(finance|financial|stock|markets?|money|banking|investment|accounting|economy)\b/i],
    ['quiz_general', /\b(general|trivia|pop culture|sports|movies?|entertainment|gk|open quiz|treasure hunt|clue\w*|india quiz|mela)\b/i],
  ],
  simulation: [
    ['sim_stock', /\b(stock\w*|trading|markets?|portfolio|forex|equit\w*|shares|mock\s?stock|bull|bear|nifty|prediction\w*)\b/i],
    ['sim_auction', /\b(auction|ipl|bid|bidding|bidstorm)\b/i],
    ['sim_crisis', /\b(crisis|deal room|escape room|boardroom|negotiation|hr room)\b/i],
  ],
  debate: [
    ['debate_pd', /\b(parliamentary|asian pd|british parliamentary|pd|bp|cross examination)\b/i],
    ['debate_mun', /\b(mun|model united nations|youth parliament|lok sabha|unhrc|unsc|united nations)\b/i],
    ['debate_conventional', /\b(conventional|turncoat|extempore|oratory|public speaking|speech|elocution|oxford style|english debate|hindi debate)\b/i],
  ],
  writing: [
    ['writing_paper', /\b(research paper|paper presentation|call for papers|academic|ieee|journal|conference)\b/i],
    ['writing_article', /\b(articles?|essays?|blog|editorial|op-ed|content writing|creative writing|poetry|story)\b/i],
    ['writing_case', /\b(case writing|policy|white paper|case study writing)\b/i],
  ],
};

// Only evidence from the title and topic tags; no default sub-tracks
export function extractSubTracks(item, category) {
  const rules = SUBTRACK_RULES[category];
  if (!rules) return [];
  const haystack = `${item.title || ''} ${topicalText(item)}`;
  return rules.filter(([, re]) => re.test(haystack)).map(([id]) => id);
}

// ---------- Unstop ----------

let cachedCompetitions = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute in-memory cache

const extractValidUrl = (...urls) => {
  for (const u of urls) {
    if (typeof u === 'string' && u.trim().length > 0 && u.trim() !== 'null' && u.trim() !== 'undefined') {
      const trimmed = u.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      if (trimmed.startsWith('//')) return `https:${trimmed}`;
      if (trimmed.startsWith('/')) return `https://d8it4huxumps7.cloudfront.net${trimmed}`;
      return trimmed;
    }
  }
  return null;
};

const DISCIPLINE = { case: 'Case', hackathon: 'Hackathon', quiz: 'Quiz', simulation: 'Simulation', writing: 'Writing', debate: 'Debate & MUN', other: 'Other' };

function formatUnstopItem(item, now) {
  const orgName = (item.organisation?.name || 'Academic Institution').trim();
  const title = String(item.title || '').trim();
  const circuit = classifyCircuit(orgName, title);
  const { category, categoryLabel, categoryEmoji } = classifyOpportunity({ ...item, title });

  const minTeam = item.regnRequirements?.min_team_size || 1;
  const maxTeam = item.regnRequirements?.max_team_size || 4;
  const isFree = !item.isPaid;

  // Prize: cumulative cash pool across all positions
  let prizeDisplay = 'Certificates & Recognition';
  if (Array.isArray(item.prizes) && item.prizes.length > 0) {
    const totalCash = item.prizes.reduce((sum, p) => sum + (Number(p.cash) || 0), 0);
    if (totalCash > 0) {
      prizeDisplay = `₹${totalCash.toLocaleString('en-IN')} Prize Pool`;
    } else if (item.prizes.some(p => p.rank)) {
      prizeDisplay = item.prizes.map(p => String(p.rank || '').trim()).filter(Boolean).slice(0, 2).join(' · ');
    }
  }

  const remainDaysText = item.regnRequirements?.remain_days || 'Ongoing';
  let daysRemainingNum = 999;
  if (item.regnRequirements?.end_regn_dt) {
    const diffMs = new Date(item.regnRequirements.end_regn_dt).getTime() - now;
    daysRemainingNum = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const undergradOk = isUndergradEligible(item);
  const isPGOnly = !undergradOk;
  const lowerCombined = `${orgName} ${title}`.toLowerCase();
  const isMBAorPG = isPGOnly || (item.filters || []).some(f => /mba|postgraduate/i.test(f.name || '')) || /\b(mba|pgdm|iim|b-school)\b/i.test(lowerCombined);

  const orgLogoUrl = extractValidUrl(item.organisation?.logoUrl2, item.organisation?.logoUrl, item.organisation?.logo, item.organisation?.image);
  const compLogoUrl = extractValidUrl(item.logoUrl2, item.logo);
  const bannerImgUrl = extractValidUrl(item.banner_mobile?.url, item.banner_desktop?.url, item.banner?.url);

  return {
    id: item.id || item.short_id,
    title,
    host: orgName,
    orgName,
    circuit,
    discipline: DISCIPLINE[category],
    days: daysRemainingNum,
    fee: isFree ? 'Free' : 'Paid',
    orgLogo: orgLogoUrl || compLogoUrl || null,
    logo: orgLogoUrl || compLogoUrl || bannerImgUrl || null,
    bannerUrl: bannerImgUrl || compLogoUrl || null,
    unstopUrl: item.seo_url || `https://unstop.com/o/${item.short_id || item.id}`,
    deadline: item.regnRequirements?.end_regn_dt || item.end_date,
    startDate: item.regnRequirements?.start_regn_dt || item.start_date || null,
    // When Unstop made the listing public (edits don't move it)
    postedAt: parseUnstopDate(item.approved_date),
    remainDaysText,
    daysRemainingNum,
    urgency: daysRemainingNum <= 2 ? 'high' : daysRemainingNum <= 5 ? 'medium' : 'normal',
    category,
    categoryLabel,
    categoryEmoji,
    minTeam,
    maxTeam,
    teamSizeDisplay: minTeam === maxTeam
      ? (minTeam === 1 ? 'Solo / Individual' : `${minTeam} Members`)
      : `${minTeam} - ${maxTeam} Members`,
    prizes: prizeDisplay,
    prize: prizeDisplay,
    summary: makeSummary(item.details),
    isFree,
    isFlagship: FLAGSHIP_KEYWORDS.some(kw => matchesKeyword(lowerCombined, kw)),
    isDU: circuit === 'DU Circuit',
    isIIMorIIT: circuit === 'IIM / IIT',
    isPremier: circuit === 'IIM / IIT',
    isIIMorIITorPremier: circuit === 'IIM / IIT',
    isBschool: circuit === 'IIM / IIT',
    isCorporate: circuit === 'Corporate',
    isCorporateOrGlobal: circuit === 'Corporate',
    isOthers: circuit === 'Others',
    isFirstYearFriendly: isFree && maxTeam >= 1 && maxTeam <= 5,
    registeredCount: item.registerCount || 0,
    viewsCount: item.viewsCount || 0,
    isUndergradEligible: undergradOk,
    isPGOnly,
    isMBAorPG,
    targetLevel: isPGOnly ? 'pg' : 'ug',
    subTracks: extractSubTracks({ ...item, title }, category),
    sourcePlatform: 'unstop',
    sourceLabel: 'Unstop',
  };
}

// ---------- scraped listings (Supabase) ----------

// Only rows written by the current scraper (stable per-source ids). Legacy rows (MLH, campus
// homepages, BITS Oasis, AI-guessed deadlines) are ignored until the scraper deactivates them.
const CURRENT_SCRAPER_ID = /^(devpost|insidekampus|corp_[a-z0-9]+)_/;
const ALLOWED_PLATFORMS = new Set(['corporate', 'devpost', 'inside_campus', 'inside_iim']);

const SUBTRACK_LABEL_TO_ID = {
  'finance': 'finance', 'finance & valuation': 'finance',
  'strategy & consulting': 'strategy', 'strategy': 'strategy',
  'marketing': 'marketing', 'marketing & brand': 'marketing',
  'b-plan': 'bplan', 'b-plan & pitch': 'bplan',
  'product': 'product', 'product & tech': 'product',
  'operations': 'operations', 'operations & scm': 'operations',
  'ai & ml': 'hack_ai', 'ai & machine learning': 'hack_ai', 'machine learning/ai': 'hack_ai',
  'web & mobile': 'hack_dev', 'full-stack & mobile': 'hack_dev', 'web': 'hack_dev', 'mobile': 'hack_dev',
  'blockchain': 'hack_web3', 'cybersecurity': 'hack_cyber', 'security': 'hack_cyber',
  'databases': 'hack_data', 'data science': 'hack_data',
};

function normaliseSubTracks(raw) {
  const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return [...new Set(list.map(s => {
    const v = String(s || '').trim();
    return SUBTRACK_RULES_IDS.has(v) ? v : SUBTRACK_LABEL_TO_ID[v.toLowerCase()];
  }).filter(Boolean))];
}
const SUBTRACK_RULES_IDS = new Set(Object.values(SUBTRACK_RULES).flatMap(rules => rules.map(([id]) => id)));

function httpUrlOr(value, fallback = '#') {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : fallback;
  } catch (e) {
    return fallback;
  }
}

function formatScrapedRow(r) {
  const title = String(r.title || '').trim();
  const host = (r.host_institution || r.organizer || 'Host Institution').trim();
  const platform = r.source_platform === 'inside_iim' ? 'inside_campus' : r.source_platform;
  const description = r.raw_scraped_text || r.description || '';
  const isInsideCampus = platform === 'inside_campus';

  const autoUndergradEligible = isUndergradEligible({
    title, description, filters: Array.isArray(r.filters) ? r.filters : [], host, sourcePlatform: platform,
  });
  const isUndergrad = isInsideCampus
    ? (r.is_undergrad_eligible === true && !r.is_pg_only && autoUndergradEligible)
    : (r.is_undergrad_eligible !== false && !r.is_pg_only && autoUndergradEligible);
  const isPGOnly = !isUndergrad;

  let circuit;
  if (r.is_du) circuit = 'DU Circuit';
  else if (r.is_iim_or_iit) circuit = 'IIM / IIT';
  else if (platform === 'corporate' || platform === 'devpost' || r.is_corporate) circuit = 'Corporate';
  else circuit = classifyCircuit(host, title);

  const category = CATEGORY_LABELS[r.category] ? r.category : 'other';
  const isFree = !r.fee || /free/i.test(r.fee);
  const minTeam = r.min_team || 1;
  const maxTeam = r.max_team || Math.max(minTeam, 1);
  const deadlineMs = new Date(r.deadline).getTime();
  const daysLeft = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 86400000));
  const ownSubTracks = new Set((SUBTRACK_RULES[category] || []).map(([id]) => id));

  return {
    id: r.id,
    title,
    orgName: host,
    host,
    bannerUrl: httpUrlOr(r.banner_url, null),
    logo: httpUrlOr(r.logo_url, null),
    orgLogo: httpUrlOr(r.logo_url, null),
    deadline: r.deadline,
    startDate: r.start_date || null,
    // First time the scraper saved it (upserts never overwrite created_at)
    postedAt: parseUnstopDate(r.created_at),
    daysRemainingNum: daysLeft,
    remainDaysText: `${daysLeft} days left`,
    fee: isFree ? 'Free' : 'Paid',
    isFree,
    prizes: r.prizes || 'Certificates & Recognition',
    category,
    ...CATEGORY_LABELS[category],
    subTracks: normaliseSubTracks(r.sub_tracks).filter(id => ownSubTracks.has(id)),
    sourcePlatform: platform,
    sourceLabel: r.source_label || 'Direct',
    unstopUrl: httpUrlOr(r.apply_url || r.website_url),
    sourceUrl: httpUrlOr(r.apply_url || r.website_url),
    registeredCount: r.registered_count || 0,
    viewsCount: r.views_count || 0,
    summary: makeSummary(description),
    minTeam,
    maxTeam,
    teamSizeDisplay: minTeam === maxTeam
      ? (minTeam === 1 ? 'Solo / Individual' : `${minTeam} Members`)
      : `${minTeam} - ${maxTeam} Members`,
    isUndergradEligible: isUndergrad,
    isPGOnly,
    isMBAorPG: isPGOnly || Boolean(r.is_mba_or_pg) || isInsideCampus,
    targetLevel: isPGOnly ? 'pg' : 'ug',
    circuit,
    isDU: circuit === 'DU Circuit',
    isIIMorIIT: circuit === 'IIM / IIT',
    isPremier: circuit === 'IIM / IIT',
    isCorporate: circuit === 'Corporate',
    isCorporateOrGlobal: circuit === 'Corporate',
    isOthers: circuit === 'Others',
    discipline: DISCIPLINE[category],
    isFlagship: Boolean(r.is_flagship),
    updatedAt: r.updated_at,
  };
}

async function fetchInstitutionalCompetitionsFromSupabase() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey || typeof fetch !== 'function') return [];

    const res = await fetch(`${supabaseUrl}/rest/v1/institutional_competitions?is_active=eq.true&select=*`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    const nowMs = Date.now();

    const fresh = rows.filter(r => {
      if (!CURRENT_SCRAPER_ID.test(String(r.id || ''))) return false;
      if (!ALLOWED_PLATFORMS.has(r.source_platform)) return false;
      // No real deadline, no listing (the scraper no longer invents one)
      const dl = new Date(r.deadline).getTime();
      return r.deadline && !Number.isNaN(dl) && dl >= nowMs;
    });

    // Same event saved under several titles: keep the most recently seen copy
    const byKey = new Map();
    for (const r of fresh) {
      const key = normalizeTitle(r.title);
      const prev = byKey.get(key);
      if (!prev || String(r.updated_at || '') > String(prev.updated_at || '')) byKey.set(key, r);
    }
    return [...byKey.values()].map(formatScrapedRow);
  } catch (err) {
    return [];
  }
}

export async function fetchCompetitionsFromUnstop(forceRefresh = false) {
  if (!forceRefresh && cachedCompetitions && (Date.now() - cacheTimestamp < CACHE_TTL_MS)) {
    return cachedCompetitions;
  }

  const queryEndpoints = [];
  // 14 pages of competitions (covers ~680 open competitions)
  for (let p = 1; p <= 14; p++) queryEndpoints.push(`opportunity=competitions&oppstatus=open&per_page=50&page=${p}`);
  // 5 pages of hackathons (covers ~240 open hackathons)
  for (let p = 1; p <= 5; p++) queryEndpoints.push(`opportunity=hackathons&oppstatus=open&per_page=50&page=${p}`);
  // 2 pages of quizzes (covers ~60 open quizzes)
  for (let p = 1; p <= 2; p++) queryEndpoints.push(`opportunity=quizzes&oppstatus=open&per_page=50&page=${p}`);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
  };

  const batches = [];
  // Concurrent batches of 10 requests with a 4.5s timeout each
  for (let i = 0; i < queryEndpoints.length; i += 10) {
    const chunk = queryEndpoints.slice(i, i + 10);
    const chunkResults = await Promise.all(
      chunk.map(q =>
        fetch(`https://unstop.com/api/public/opportunity/search-result?${q}`, {
          headers,
          signal: AbortSignal.timeout(4500)
        })
          .then(res => (res.ok ? res.json() : null))
          // null marks a failed request (distinct from a page that is legitimately empty)
          .then(json => (Array.isArray(json?.data?.data) ? json.data.data : null))
          .catch(err => {
            console.warn(`Error querying Unstop for [${q}]:`, err.message);
            return null;
          })
      )
    );
    batches.push(...chunkResults);
  }

  // If Unstop is down or mostly failing, don't replace a good list with a degraded one:
  // throwing lets the handler serve the last good copy (or the Supabase fallback, briefly cached).
  const failedRequests = batches.filter(list => list === null).length;
  if (failedRequests > queryEndpoints.length / 2) {
    throw new Error(`Unstop unavailable (${failedRequests}/${queryEndpoints.length} requests failed)`);
  }

  const now = Date.now();
  const map = new Map();

  for (const list of batches) {
    for (const item of list || []) {
      if (!item || !item.id) continue;
      if (map.has(item.id)) continue;

      const regStatus = item.regnRequirements?.reg_status;
      const remainDays = item.regnRequirements?.remain_days || '';

      // Strictly ignore finished or ended competitions
      if (regStatus === 'FINISHED') continue;
      if (remainDays.toLowerCase().includes('ended')) continue;
      if (item.regnRequirements?.end_regn_dt) {
        const deadlineTime = new Date(item.regnRequirements.end_regn_dt).getTime();
        if (deadlineTime < now) continue;
      }

      if (isSchoolOnly(item)) continue;
      if (isJunkOrPass(item)) continue;

      // Must be open to collegiate students (undergrad or postgrad)
      if (!isUndergradEligible(item) && !isPostgradEligible(item)) continue;

      map.set(item.id, item);
    }
  }

  const formatted = Array.from(map.values()).map(item => formatUnstopItem(item, now));

  // Scraped listings, minus anything Unstop already lists
  try {
    const unstopTitles = new Set(formatted.map(c => normalizeTitle(c.title)));
    const institutional = await fetchInstitutionalCompetitionsFromSupabase();
    formatted.push(...institutional.filter(c => !unstopTitles.has(normalizeTitle(c.title))));
  } catch (e) {
    // Non-blocking
  }

  // Closing deadline first, then registrations
  formatted.sort((a, b) => {
    const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    const validA = !Number.isNaN(timeA) ? timeA : Infinity;
    const validB = !Number.isNaN(timeB) ? timeB : Infinity;
    if (validA !== validB) return validA - validB;
    return (b.registeredCount || 0) - (a.registeredCount || 0);
  });

  if (formatted.length > 0) {
    cachedCompetitions = formatted;
    cacheTimestamp = Date.now();
  }

  return formatted;
}

export default async function handler(req, res) {
  // The app never sends a query string; one-off ones would bypass the edge cache
  // and make cold instances re-fetch everything from Unstop
  if ((req.url || '').includes('?')) {
    res.setHeader('Location', '/api/competitions');
    return res.status(308).end();
  }

  try {
    const competitions = await fetchCompetitionsFromUnstop();

    // Cache on Vercel Edge CDN for 30 minutes
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json({
      success: true,
      count: competitions.length,
      updatedAt: new Date().toISOString(),
      data: competitions,
    });
  } catch (error) {
    console.error('Error fetching competitions from Unstop:', error);

    // Resilient fallback 1: Return in-memory cache if available
    if (cachedCompetitions && cachedCompetitions.length > 0) {
      console.warn('Serving from in-memory fallback cache');
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json({
        success: true,
        count: cachedCompetitions.length,
        fromCache: true,
        updatedAt: new Date(cacheTimestamp).toISOString(),
        data: cachedCompetitions,
      });
    }

    // Resilient fallback 2: Return scraped competitions from Supabase
    try {
      const fallback = await fetchInstitutionalCompetitionsFromSupabase();
      if (Array.isArray(fallback) && fallback.length > 0) {
        console.warn('Serving from Supabase institutional fallback');
        // Degraded list: keep it at the edge only briefly so recovery shows up within a minute
        res.setHeader('Cache-Control', 's-maxage=60');
        return res.status(200).json({
          success: true,
          count: fallback.length,
          fallback: true,
          updatedAt: new Date().toISOString(),
          data: fallback,
        });
      }
    } catch (e) {}

    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch competitions',
    });
  }
}
