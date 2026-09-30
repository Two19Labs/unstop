// api/competitions.js
// Vercel Serverless Function to fetch, filter and serve 100% REAL active case competitions directly from Unstop

const FLAGSHIP_KEYWORDS = [
  'iim', 'iit', 'srcc', 'sscbs', 'shri ram', 'bits', 'xlri', 'fms',
  "stephen's", "st. stephen", 'stephens college', 'hansraj', 'hindu college', 'lsr', 'lady shri ram', 'sggscc',
  'nsut', 'dtu', "l'oreal", 'loreal', 'tata', 'hul', 'hindustan unilever',
  'aditya birla', 'mckinsey', 'bain', 'bcg', 'boston consulting', 'kearney',
  'ey', 'deloitte', 'pwc', 'kpmg', 'reliance', 'amazon', 'flipkart',
  'google', 'microsoft', 'tvs', 'optum', 'marico', 'itc', 'mondelez',
  'reckitt', 'accenture', 'sibm', 'spjimr', 'mdi', 'great lakes', 'glim',
  'maruti suzuki', 'qualcomm', 'asian paints'
];

const DU_KEYWORDS = [
  'delhi university', 'university of delhi', '(du)', 'sscbs', 'shaheed sukhdev',
  'srcc', 'shri ram college', "stephen's", "st. stephen", "stephens college",
  'hindu college', 'hansraj', 'lsr', 'lady shri ram',
  'sggscc', 'ramjas', 'kirori mal', 'kmc', 'drc', 'daulat ram', 'gargi', 'venkateswara',
  'venky', 'sgtb khalsa', 'sgtb', 'sri guru tegh bahadur khalsa', 'keshav mahavidyalaya',
  'deen dayal upadhyaya college', 'ddu college',
  'miranda house', 'miranda', 'jesus and mary', 'jmc', 'atma ram', 'arsd', 'sbsc',
  'shaheed bhagat singh', 'motilal nehru college', 'indraprastha college', 'ipcw',
  'maharaja agrasen college', 'ramanujan college', 'kalindi college', 'kamala nehru college',
  'shaheed rajguru', 'bharati college', 'college of vocational studies', 'cvs'
];

const IIM_IIT_PREMIER_KEYWORDS = [
  // IIMs (All 21 Indian Institutes of Management & IIM Mumbai / NITIE)
  'iim', 'indian institute of management', 'nitie',
  // IITs & Premier Research
  'iit', 'indian institute of technology', 'doms', 'dms', 'sjmsom', 'vgsom', 'iisc', 'indian institute of science', 'techkriti', 'ism dhanbad',
  'iit bhu', 'banaras hindu university', 'iit (bhu)', 'iit-bhu',
  // BITS Pilani (All campuses: Pilani, Goa, Hyderabad)
  'bits pilani', 'birla institute of technology & science', 'birla institute of technology and science', 'bits goa', 'bits hyderabad', 'bits',
  // NITs (All National Institutes of Technology)
  'nit ', 'nit,', 'nit)', 'nit -', 'nit-', 'national institute of technology', 'vnit', 'mnit', 'mnnit', 'svnit', 'manit',
  'motilal nehru national institute of technology',
  // IIITs (Indian Institutes of Information Technology)
  'iiit', 'iiit-delhi', 'iiitd', 'iiith', 'iiitb', 'iiit hyderabad', 'iiit bangalore', 'iiit delhi', 'iiit allahabad',
  // Top Tier 1 & Prominent B-Schools
  'xlri', 'xavier school of management', 'xavier labour',
  'isb', 'indian school of business',
  'fms', 'faculty of management studies',
  'spjimr', 'sp jain', 's.p. jain', 's p jain',
  'mdi', 'management development institute',
  'iift', 'indian institute of foreign trade',
  'nmims', 'narsee monjee', 'sbm',
  'sibm', 'scmhrd', 'siib', 'siom', 'scit',
  'tiss', 'tata institute of social sciences',
  'jbims', 'jamnalal bajaj',
  'mica', 'mudra institute',
  'imt', 'imt ghaziabad', 'imt nagpur', 'imt hyderabad',
  'great lakes', 'glim',
  'tapmi', 't. a. pai', 't a pai',
  'ximb', 'xim university', 'xavier institute of management',
  'gim', 'goa institute of management',
  'k j somaiya', 'kj somaiya', 'somaiya', 'simsr', 'kj sim',
  'fore school', 'fore school of management',
  'lbsim', 'lal bahadur shastri',
  'irma', 'institute of rural management',
  'imi', 'international management institute',
  'bimtech', 'birla institute of management',
  'liba', 'loyola institute of business administration',
  'welingkar', 'weschool',
  'ibs', 'icfai business school', 'icfai',
  'masters union', "masters' union",
  'soil institute', 'ifmr', 'krea university',
  'nibm', 'nia pune', 'bimm', 'balaji institute',
  'iiswbm', 'iifm', 'indian institute of forest management',
  'ksom', 'kiit school of management', 'bvimr', 'gl bajaj institute of management',
  'commerce and business management, osmania',
  // Premier State / Central Tech Universities
  'nsut', 'netaji subhas', 'dtu', 'delhi technological university', 'dce',
  'bit mesra', 'birla institute of technology (bit), mesra', 'birla institute of technology, mesra',
  'punjab engineering college', 'pec chandigarh', 'pec, chandigarh', 'coep', 'vjti',
  'jadavpur university', 'anna university', 'ceg guindy', 'thapar',
  'psg tech', 'psg college of technology', 'rvce', 'bmsce', 'msrit', 'mit manipal', 'mahe',
  // Premier Autonomous & Multidisciplinary Colleges
  'st. xavier', 'st xavier', "xavier's college", 'xaviers college',
  'ashoka university', 'ashoka', 'christ university', 'christ (deemed to be university)',
  'loyola college', 'madras christian college', 'mcc chennai',
  'presidency college', 'presidency university', 'jindal global', 'o.p. jindal',
  'shiv nadar', 'snu', 'plaksha',
  // Premier Law / NLUs
  'nlsiu', 'nalsar', 'nujs', 'nlu delhi', 'nlu jodhpur', 'gnlu',
  // Premier Science & Statistics
  'indian statistical institute', 'isi kolkata', 'cmi', 'tifr', 'iiser', 'niser'
];

const CORPORATE_KEYWORDS = [
  // Management Consulting & Professional Services
  'mckinsey', 'bain', 'bcg', 'boston consulting', 'kearney', 'oliver wyman', 'strategy&',
  'deloitte', 'pwc', 'pricewaterhousecoopers', 'ey', 'ernst & young', 'kpmg', 'grant thornton', 'bdo', 'accenture',
  // FMCG & Consumer Brands
  "l'oreal", 'loreal', 'brandstorm', 'hul', 'hindustan unilever', 'lime', 'unilever',
  'itc', 'interrobang', 'marico', 'over the wall', 'mondelez', 'reckitt', 'nestle', 'p&g', 'procter & gamble',
  'pepsico', 'coca-cola', 'coke', 'aditya birla', 'stratfresh', 'abg', 'dabur', 'godrej', 'asian paints', 'berger paints', 'britannia',
  // Automotive, Industrial, Energy & PSUs
  'maruti suzuki', 'maruti', 'satin finserv',
  'hindustan petroleum', 'hpcl', 'hp power lab', 'bharat petroleum', 'bpcl', 'indian oil', 'iocl', 'ongc', 'gail', 'ntpc', 'bhel', 'coal india',
  'tata group', 'tata steel', 'tata motors', 'tcs', 'tata crucible', 'tata imagination', 'tata',
  'reliance', 'reliance retail', 'mahindra', 'war room', 'mahindra rise', 'tvs', 'tvs credit',
  'hero motocorp', 'hero colabs', 'bajaj finserv', 'bajaj auto', 'l&t', 'larsen & toubro', 'vedanta', 'adani', 'jsw',
  // Tech, E-commerce, Telecom & Semis
  'amazon', 'flipkart', 'google', 'microsoft', 'apple', 'meta', 'uber', 'swiggy', 'zomato',
  'qualcomm', 'intel', 'cisco', 'ibm', 'infosys', 'wipro', 'hcl', 'cognizant', 'capgemini', 'tech mahindra',
  'airtel', 'jio', 'vodafone', 'supervity', 'salesforce', 'adobe',
  // Banking & Financial Services
  'goldman sachs', 'jpmorgan', 'jp morgan', 'morgan stanley', 'citi', 'citigroup', 'hsbc',
  'american express', 'amex', 'standard chartered', 'barclays', 'deutsche bank',
  'hdfc', 'icici', 'axis bank', 'kotak', 'optum', 'stratethon', 'raam group',
  // Startups, Platforms & Corporate entities
  'cogniza', 'wonksknow', 'noobsync', 'invoqe', 'upforge', 'jetlearn', 'languify',
  'product space', 'mhtechin', 'monomousumi', 'kartexa', 'skilled sapiens', 'indiastox',
  'godstockss', 'acecubing', 'campusorbit', 'pharmaorbit', 'boss console', 'hackathon raptors',
  'heritage vastra', 'code-x-novas', 'elite coders', 'wecodecoders', 'interactup', 'internhill',
  'innovation hacks', 'gradient learnings', 'bharat academix', 'cyber hx', 'talentsec', 'techverse', 'peakforge'
];

const GLOBAL_KEYWORDS = [
  // Top Global Universities & International B-Schools
  'harvard', 'stanford', 'wharton', 'massachusetts institute of technology', 'yale',
  'columbia university', 'oxford', 'cambridge', 'london school of economics', 'london business school',
  'insead', 'national university of singapore', 'nanyang technological university', 'hult prize',
  'hec paris', 'nyu stern', 'kellogg', 'chicago booth', 'berkeley haas', 'mit sloan',
  'imperial college', 'eth zurich', 'monash', 'melbourne university', 'sydney university', 'toronto university',
  // Prestigious Global Case Challenges & Flagships
  'unilever future leaders', 'brandstorm', 'imagine cup', 'solution challenge',
  'world bank', 'bloomberg global', 'cfa institute research challenge', 'schneider go green',
  'international case competition', 'global challenge', 'worldwide challenge'
];

function matchesKeyword(text, keyword) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return false;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\b)${escaped}(\\b|$)`, 'i');
  return regex.test(text);
}

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

const MBA_EXCLUSION_PATTERN = /\b(mba\s+only|pgdm\s+only|postgraduate\s+only|post-graduate\s+only|mba\s+students\s+only|only\s+for\s+mba|only\s+mba|mba\s+graduate|mba\s+graduates|pre-mba|b-school\s+only|only\s+b-school|mba\s+track|for\s+mba\s+students|for\s+pgdm\s+students|executive\s+mba|1st\s+year\s+mba|2nd\s+year\s+mba|pgp\s+only|only\s+pgp)\b/i;

// Eligibility check: Allow competitions that undergraduates can participate in
function isUndergradEligible(item) {
  if (!item) return false;
  if (isSchoolOnly(item)) return false;

  const title = (item.title || '').toLowerCase();
  const orgName = (item.organisation?.name || item.orgName || item.host || '').toLowerCase();
  const desc = (item.description || item.raw_scraped_text || '').toLowerCase();
  const combinedText = `${title} ${orgName}`;

  // 1. Text-based strong MBA/PG exclusivity pattern
  if (MBA_EXCLUSION_PATTERN.test(combinedText)) {
    const explicitlyMentionsUG = /\b(undergraduate|b\.tech|bba|b\.com|bachelor|ug\s+students)\b/i.test(combinedText + ' ' + desc);
    if (!explicitlyMentionsUG) {
      return false;
    }
  }

  // Special catch: InsideIIM MBA Graduate awards
  if (/\b(insideiim)\b/i.test(orgName) && /\b(mba|graduate|b-school)\b/i.test(title)) {
    return false;
  }

  const filterNames = (item.filters || []).map(f => (f.name || '').toLowerCase().trim());
  const hasUG = filterNames.some(f => f.includes('undergraduate'));
  const hasPG = filterNames.some(f => f.includes('postgraduate') || f.includes('mba'));

  // 2. Filter-based exclusivity:
  // If explicitly tagged for PG/MBA and NOT tagged for undergraduate, exclude for UG.
  // We do NOT let a generic 'all' tag override this if hasPG is true and hasUG is false.
  if (hasPG && !hasUG) {
    return false;
  }

  // 3. Check structured registration eligibility payload from Unstop
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
    const engCourses = extractCourses(engineering);
    const artsCourses = extractCourses(arts);

    const hasUgInBschool = bSchoolCourses.some(c => c.includes('bba') || c.includes('bcom') || c.includes('bms') || c.includes('bhm'));
    const hasPgInBschool = bSchoolCourses.some(c => c.includes('mba') || c.includes('pgdm') || c.includes('exec') || c.includes('phd'));

    const hasEng = engCourses.length > 0;
    const hasArts = artsCourses.length > 0;

    // If strictly restricted to B-schools with no undergrad/arts/tech access
    if (bSchools.length > 0 && !hasEng && !hasArts) {
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
  const ugOnlyTitle = /\b(undergraduate\s+only|ug\s+only|only\s+for\s+ug|only\s+for\s+undergraduate)\b/i.test(title);
  if (ugOnlyTitle) return false;

  const filterNames = (item.filters || []).map(f => (f.name || '').toLowerCase().trim());
  const hasAll = filterNames.length === 0 || filterNames.includes('all');
  const hasPG = filterNames.some(f => f.includes('postgraduate') || f.includes('mba'));
  const hasUG = filterNames.some(f => f.includes('undergraduate'));

  if (hasUG && !hasPG && !hasAll && filterNames.length === 1) {
    return false;
  }

  return true;
}

function classifyOpportunity(item) {
  const type = (item.type || '').toLowerCase();
  const subtype = (item.subtype || item.subType || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const seoUrl = (item.seo_url || '').toLowerCase();
  const filterNames = (item.filters || []).map(f => (f.name || '').toLowerCase());
  const workFunctions = Array.isArray(item.workfunction) 
    ? item.workfunction.map(w => (w?.name || '').toLowerCase())
    : [];
  const tags = Array.isArray(item.tags)
    ? item.tags.map(t => (t?.name || t || '').toLowerCase())
    : [];

  // Exclude broad workfunction category 'quizzes & treasure hunt' from corrupting case comps!
  const cleanedWorkFunctions = workFunctions.filter(w => w !== 'quizzes & treasure hunt');
  const combined = `${title} ${seoUrl} ${filterNames.join(' ')} ${cleanedWorkFunctions.join(' ')} ${tags.join(' ')}`;

  // Priority 1: High-confidence Title & Explicit Subtype Signals
  // 1a. Explicit Case Comps (Unstop subtype OR title explicitly mentions case comp/study)
  if (
    subtype === 'case_competition' ||
    subtype === 'case-competitions' ||
    /\b(case competition|case study|case challenge|case comp|business case|consulting challenge|case quest|break the case|crack the case)\b/i.test(title)
  ) {
    return { category: 'case', categoryLabel: 'Case Comp', categoryEmoji: '📊' };
  }

  // 1b. Explicit Coding Challenges & Hackathons (online coding contest or type hackathon)
  if (
    type === 'hackathons' ||
    subtype === 'online_coding_challenge' ||
    /\b(hackathon|codefest|coding challenge|hack\b|devfest|web dev|app dev|fullstack|machine learning|ai\/ml|data science|datathon|cybersecurity|blockchain|dapp|algorithmic|kaggle|robotics|robot\b|prompt challenge|prompt engineering|techfest|symposium|iot|hardware challenge|developer challenge|open source|ctf\b|code\b)\b/i.test(title)
  ) {
    return { category: 'hackathon', categoryLabel: 'Hackathon', categoryEmoji: '💻' };
  }

  // 1c. Explicit Quizzes & Trivia
  if (
    type === 'quizzes' ||
    /\b(quiz\b|trivia\b|quizzing|brain teaser|inquisitive|inquizire|knowledge bowl|sawaal|sawaal jawaab|buzzer|jeopardy|kahoot|brainwave|mindspree)\b/i.test(title) ||
    filterNames.some(f => f.includes('quiz') || f.includes('quizzing') || f.includes('trivia'))
  ) {
    return { category: 'quiz', categoryLabel: 'Quiz & Trivia', categoryEmoji: '🧠' };
  }

  // 1d. Explicit Debates & Model UN
  if (
    /\b(debate\b|debating|parliamentary debate|asian pd|british parliamentary|turncoat|mun\b|model united nations|youth parliament|oratory|public speaking|gavel|battle of ideas)\b/i.test(title) ||
    filterNames.some(f => f.includes('debate') || f.includes('mun'))
  ) {
    return { category: 'debate', categoryLabel: 'Debate & MUN', categoryEmoji: '🗣️' };
  }

  // 1e. Explicit Writing & Research
  if (
    /\b(article writing|essay writing|essay competition|essay contest|paper presentation|research paper|call for papers|white paper)\b/i.test(title) ||
    filterNames.some(f => f.includes('writing') || f.includes('essay') || f.includes('paper presentation') || f.includes('research'))
  ) {
    return { category: 'writing', categoryLabel: 'Writing & Research', categoryEmoji: '✍️' };
  }

  // 1f. Explicit Simulations & Auctions
  if (
    /\b(auction\b|ipl auction|football auction|cricket auction|player auction|mock stock|stock trading|trading simulation|simulation game|deal room|portfolio management|bidding|equities prediction|monopoly)\b/i.test(title) ||
    filterNames.some(f => f.includes('simulation') || f.includes('gaming'))
  ) {
    return { category: 'simulation', categoryLabel: 'Simulation & Auction', categoryEmoji: '📈' };
  }

  // Priority 2: Workfunction & Tag Fallbacks
  if (
    filterNames.some(f => f.includes('programming') || f.includes('hackathon') || f.includes('coding') || f.includes('computer') || f.includes('software')) ||
    cleanedWorkFunctions.some(w => w.includes('software') || w.includes('data science') || w.includes('artificial intelligence') || w.includes('engineering') || w.includes('cyber') || w.includes('robotics'))
  ) {
    return { category: 'hackathon', categoryLabel: 'Hackathon', categoryEmoji: '💻' };
  }

  if (
    cleanedWorkFunctions.some(w => w.includes('trading') || w.includes('simulation') || w.includes('gaming'))
  ) {
    return { category: 'simulation', categoryLabel: 'Simulation & Auction', categoryEmoji: '📈' };
  }

  if (
    cleanedWorkFunctions.some(w => w.includes('writing') || w.includes('content') || w.includes('journalism') || w.includes('research'))
  ) {
    return { category: 'writing', categoryLabel: 'Writing & Research', categoryEmoji: '✍️' };
  }

  if (
    workFunctions.some(w => w.includes('quiz') || w.includes('trivia'))
  ) {
    return { category: 'quiz', categoryLabel: 'Quiz & Trivia', categoryEmoji: '🧠' };
  }

  if (
    filterNames.some(f => f.includes('case') || f.includes('strategy') || f.includes('business plan') || f.includes('marketing') || f.includes('entrepreneurship') || f.includes('finance') || f.includes('consulting')) ||
    cleanedWorkFunctions.some(w => w.includes('strategy') || w.includes('consulting') || w.includes('business') || w.includes('marketing') || w.includes('finance') || w.includes('operations')) ||
    /\b(case\b|case study|case competition|consulting|strategy|b-plan|business plan|pitch deck|pitch\b|valuation|shark tank|impact tank|tank\b|ideathon|venture|entrepreneurship|consultant|product innovation|marketing challenge|brand challenge|brand storm|market entry|growth hack|case challenge|business challenge|enact|enactus|fintech)\b/i.test(combined)
  ) {
    return { category: 'case', categoryLabel: 'Case Comp', categoryEmoji: '📊' };
  }

  // Default collegiate fallback: Case Comp (eliminates dead general track)
  return { category: 'case', categoryLabel: 'Case Comp', categoryEmoji: '📊' };
}

export function extractSubTracks(item, mainCategory) {
  const subTracks = new Set();
  const title = (item.title || '').toLowerCase();
  const workFunctions = Array.isArray(item.workfunction) 
    ? item.workfunction.map(w => (w?.name || '').toLowerCase())
    : [];
  const filterNames = Array.isArray(item.filters)
    ? item.filters.map(f => (f?.name || '').toLowerCase())
    : [];
  const textHaystack = `${title} ${workFunctions.join(' ')} ${filterNames.join(' ')}`;

  // 1. Case Comps Sub-Tracks
  if (mainCategory === 'case' || textHaystack.includes('case') || textHaystack.includes('consulting') || textHaystack.includes('strategy')) {
    if (/\b(finance|financial|valuation|equity|m&a|merger|acquisition|fintech|banking|investment banking|capital market|corporate finance|deal room)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('finance') || w.includes('banking') || w.includes('investment'))) {
      subTracks.add('finance');
    }
    if (/\b(strategy|consulting|consultant|market entry|gtm|go-to-market|growth|corporate strategy|strategic|business analysis)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('strategy') || w.includes('consulting') || w.includes('business analysis'))) {
      subTracks.add('strategy');
    }
    if (/\b(marketing|brand|branding|brandstorm|advertising|fmcg|consumer|pr|ad\b|media|campaign)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('marketing') || w.includes('market research') || w.includes('brand'))) {
      subTracks.add('marketing');
    }
    if (/\b(b-plan|bplan|business plan|pitch deck|pitch|pitching|shark tank|startup|entrepreneur|venture|seed|incubator|ideathon)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('entrepreneur') || w.includes('business plan'))) {
      subTracks.add('bplan');
    }
    if (/\b(product|product management|apm|pm\b|ui\/ux|teardown|feature spec|prd)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('product management'))) {
      subTracks.add('product');
    }
    if (/\b(operations|supply chain|scm|logistics|procurement|process improvement|six sigma|warehouse|distribution)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('operations') || w.includes('supply chain') || w.includes('process improvement'))) {
      subTracks.add('operations');
    }
    if (subTracks.size === 0) {
      subTracks.add('strategy');
    }
  }

  // 2. Hackathons Sub-Tracks
  if (mainCategory === 'hackathon' || textHaystack.includes('hack') || textHaystack.includes('coding') || textHaystack.includes('developer')) {
    if (/\b(ai|ml|machine learning|artificial intelligence|data science|datathon|deep learning|computer vision|nlp|llm|genai|kaggle)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('artificial intelligence') || w.includes('machine learning') || w.includes('applied ai') || w.includes('data science'))) {
      subTracks.add('hack_ai');
    }
    if (/\b(web\b|app\b|fullstack|full stack|frontend|backend|mobile app|android|ios|dev\b|software development|cloud|devops)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('software development') || w.includes('frontend') || w.includes('backend') || w.includes('full stack'))) {
      subTracks.add('hack_dev');
    }
    if (/\b(blockchain|web3|crypto|smart contract|solidity|ethereum|dapp|defi|nft)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('blockchain') || w.includes('web3'))) {
      subTracks.add('hack_web3');
    }
    if (/\b(open innovation|ideathon|design thinking|prototype|social innovation|smart city)\b/i.test(textHaystack)) {
      subTracks.add('hack_ideathon');
    }
    if (/\b(competitive programming|algorithms|data structures|algorithmic|speed coding|icpc|codeforces|codechef)\b/i.test(textHaystack) ||
        filterNames.some(f => f.includes('coding challenge') || f.includes('programming'))) {
      subTracks.add('hack_cp');
    }
    if (/\b(cybersecurity|cyber|ctf|capture the flag|ethical hacking|security|infosec)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('cyber') || w.includes('security'))) {
      subTracks.add('hack_cyber');
    }
    if (subTracks.size === 0) {
      subTracks.add('hack_dev');
    }
  }

  // 3. Quizzes Sub-Tracks
  if (mainCategory === 'quiz' || textHaystack.includes('quiz') || textHaystack.includes('trivia')) {
    if (/\b(business|brand|brands|corporate|tata crucible|menti|ad\b|company)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('strategy') || w.includes('marketing') || w.includes('business'))) {
      subTracks.add('quiz_biz');
    }
    if (/\b(tech|technology|science|engineering|sci-biz-tech|computing|it\b)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('technology') || w.includes('science'))) {
      subTracks.add('quiz_tech');
    }
    if (/\b(finance|stock|market|money|banking|economy|economic)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('investment') || w.includes('finance'))) {
      subTracks.add('quiz_finance');
    }
    if (/\b(general|trivia|pop culture|sports|movies|entertainment|gk|world|inquizitive|treasure hunt)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('treasure hunt'))) {
      subTracks.add('quiz_general');
    }
    if (subTracks.size === 0) {
      subTracks.add('quiz_general');
    }
  }

  // 4. Simulations Sub-Tracks
  if (mainCategory === 'simulation' || textHaystack.includes('simulation') || textHaystack.includes('auction')) {
    if (/\b(stock|trading|market|portfolio|forex|equity|aarohan|bidding stock|shares)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('investment') || w.includes('trading'))) {
      subTracks.add('sim_stock');
    }
    if (/\b(auction|ipl|cricket auction|football auction|player auction|bid|bidding)\b/i.test(textHaystack)) {
      subTracks.add('sim_auction');
    }
    if (/\b(crisis|deal room|escape room|hr room|boardroom|negotiation)\b/i.test(textHaystack) ||
        workFunctions.some(w => w.includes('crisis') || w.includes('human resources') || w.includes('psychology'))) {
      subTracks.add('sim_crisis');
    }
    if (subTracks.size === 0) {
      subTracks.add('sim_stock');
    }
  }

  // 5. Debates Sub-Tracks
  if (mainCategory === 'debate' || textHaystack.includes('debate') || textHaystack.includes('mun')) {
    if (/\b(parliamentary|asian pd|british parliamentary|pd\b|bp\b|cross examination)\b/i.test(textHaystack)) {
      subTracks.add('debate_pd');
    }
    if (/\b(mun|model united nations|youth parliament|lok sabha|unhrc|unsc|united nations)\b/i.test(textHaystack)) {
      subTracks.add('debate_mun');
    }
    if (/\b(conventional|turncoat|extempore|oratory|public speaking|speech|clash)\b/i.test(textHaystack)) {
      subTracks.add('debate_conventional');
    }
    if (subTracks.size === 0) {
      subTracks.add('debate_conventional');
    }
  }

  // 6. Writing Sub-Tracks
  if (mainCategory === 'writing' || textHaystack.includes('writing') || textHaystack.includes('essay') || textHaystack.includes('paper')) {
    if (/\b(research paper|paper presentation|call for papers|academic|ieee|journal)\b/i.test(textHaystack)) {
      subTracks.add('writing_paper');
    }
    if (/\b(article|essay|blog|editorial|op-ed|content writing)\b/i.test(textHaystack)) {
      subTracks.add('writing_article');
    }
    if (/\b(case writing|policy|white paper|case study writing)\b/i.test(textHaystack)) {
      subTracks.add('writing_case');
    }
    if (subTracks.size === 0) {
      subTracks.add('writing_article');
    }
  }

  return Array.from(subTracks);
}

const MULTIPLATFORM_OPPORTUNITIES = [];

let cachedCompetitions = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute in-memory cache

async function fetchInstitutionalCompetitionsFromSupabase() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ncnkzlugelkhafjtupbf.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbmt6bHVnZWxraGFmanR1cGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTcxNDYsImV4cCI6MjEwNDk3MzE0Nn0.DERn_Nf62VX0ScFXF9Jyokm9cLJZsdr_RcttHsoi8lU';
    
    if (typeof fetch !== 'function') return [];
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${supabaseUrl}/rest/v1/institutional_competitions?is_active=eq.true&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const rows = await res.json();
    const nowMs = Date.now();
    return rows
      .filter(r => {
        if (!r.deadline) return true;
        const dl = new Date(r.deadline).getTime();
        return !isNaN(dl) && dl >= nowMs;
      })
      .map(r => {
        const rawInstItem = {
          title: r.title,
          description: r.raw_scraped_text || r.description || '',
          filters: Array.isArray(r.filters) ? r.filters : [],
          organisation: { name: r.host_institution || r.organizer || '' },
          host: r.host_institution || r.organizer || ''
        };
        const autoUndergradEligible = isUndergradEligible(rawInstItem);
        const isPGOnly = Boolean(r.is_pg_only) || !autoUndergradEligible;
        const isUndergrad = r.is_undergrad_eligible !== false && !isPGOnly && autoUndergradEligible;
        const isMBAorPG = isPGOnly || Boolean(r.is_mba_or_pg) || /\b(mba|pgdm|iim|b-school|insideiim)\b/i.test(`${r.title || ''} ${r.host_institution || ''}`);

        return {
          id: r.id || `inst_${r.slug || Math.random().toString(36).substring(7)}`,
          title: r.title,
          orgName: r.host_institution || r.organizer || 'Host Institution',
          host: r.host_institution || r.organizer || 'Host Institution',
          bannerUrl: r.banner_url || null,
          logo: r.logo_url || null,
          orgLogo: r.logo_url || null,
          deadline: r.deadline,
          startDate: r.start_date || null,
          daysRemainingNum: r.deadline ? Math.max(0, Math.ceil((new Date(r.deadline) - Date.now()) / (1000 * 60 * 60 * 24))) : 7,
          remainDaysText: r.deadline ? `${Math.max(0, Math.ceil((new Date(r.deadline) - Date.now()) / (1000 * 60 * 60 * 24)))} days left` : '7 days left',
          mode: r.mode || 'Online',
          location: r.location || 'Online',
          fee: r.fee || 'Free',
          isFree: !r.fee || /free/i.test(r.fee),
          prizes: r.prizes || 'Certificates & Cash Prize',
          category: r.category || 'case',
          categoryLabel: r.category_label || 'Case Competition',
          categoryEmoji: r.category_emoji || '💼',
          subTracks: Array.isArray(r.sub_tracks) ? r.sub_tracks : (r.sub_tracks ? [r.sub_tracks] : ['General']),
          sourcePlatform: r.source_platform || 'campus_direct',
          sourceLabel: r.source_label || (r.host_institution ? `${r.host_institution} Direct` : 'Campus Direct'),
          unstopUrl: r.apply_url || r.website_url || '#',
          sourceUrl: r.apply_url || r.website_url || '#',
          registeredCount: r.registered_count || 0,
          viewsCount: r.views_count || 0,
          description: r.raw_scraped_text || r.description || r.title,
          minTeam: r.min_team || 1,
          maxTeam: r.max_team || 4,
          teamSizeDisplay: (r.min_team || 1) === (r.max_team || 4) ? `${r.min_team || 1} Members` : `${r.min_team || 1} - ${r.max_team || 4} Members`,
          isUndergradEligible: isUndergrad,
          isPGOnly: isPGOnly,
          isMBAorPG: isMBAorPG,
          targetLevel: isPGOnly ? 'pg' : (isUndergrad ? 'ug' : 'all'),
          isDU: Boolean(r.is_du),
          isIIMorIIT: Boolean(r.is_iim_or_iit) && r.source_platform !== 'corporate' && r.source_platform !== 'devpost',
          isPremier: Boolean(r.is_premier) && r.source_platform !== 'corporate' && r.source_platform !== 'devpost',
          isCorporate: r.source_platform === 'corporate' || r.source_platform === 'devpost' || Boolean(r.is_corporate),
          isCorporateOrGlobal: r.source_platform === 'corporate' || r.source_platform === 'devpost' || Boolean(r.is_corporate),
          isOthers: !Boolean(r.is_du) && !Boolean(r.is_iim_or_iit) && !Boolean(r.is_premier) && r.source_platform !== 'corporate' && r.source_platform !== 'devpost' && !Boolean(r.is_corporate),
          circuit: Boolean(r.is_du) ? 'DU Circuit' : (Boolean(r.is_iim_or_iit) || Boolean(r.is_premier)) ? 'IIM / IIT' : (r.source_platform === 'corporate' || r.source_platform === 'devpost' || Boolean(r.is_corporate)) ? 'Corporate' : 'Others',
          discipline: r.category_label || 'Case',
          isFlagship: Boolean(r.is_flagship)
        };
      });
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
  // Fetch in concurrent batches of 5 requests with 6000ms timeout
  for (let i = 0; i < queryEndpoints.length; i += 5) {
    const chunk = queryEndpoints.slice(i, i + 5);
    const chunkResults = await Promise.all(
      chunk.map(q =>
        fetch(`https://unstop.com/api/public/opportunity/search-result?${q}`, {
          headers,
          signal: AbortSignal.timeout(6000)
        })
          .then(res => (res.ok ? res.json() : null))
          .then(json => (json?.data?.data || []))
          .catch(err => {
            console.warn(`Error querying Unstop for [${q}]:`, err.message);
            return [];
          })
      )
    );
    batches.push(...chunkResults);
  }

  const now = Date.now();
  const map = new Map();

  for (const list of batches) {
    for (const item of list) {
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

      // Strictly exclude school-only / K-12 competitions
      if (isSchoolOnly(item)) continue;

      // Strictly exclude festival passes, tickets, or delegate cards
      if (isJunkOrPass(item)) continue;

      // Ensure item is eligible for collegiate students (either Undergrad or Postgrad/MBA)
      const undergradOk = isUndergradEligible(item);
      const postgradOk = isPostgradEligible(item);
      if (!undergradOk && !postgradOk) continue;

      map.set(item.id, item);
    }
  }

  const rawList = Array.from(map.values());

  const formatted = rawList.map(item => {
    const orgName = item.organisation?.name || 'Academic Institution';
    const lowerOrg = orgName.toLowerCase();
    const lowerTitle = (item.title || '').toLowerCase();
    const combined = `${lowerOrg} ${lowerTitle}`;

    // Tag categorization: prioritize host institution
    const isIIMorIITorPremier = IIM_IIT_PREMIER_KEYWORDS.some(kw => matchesKeyword(lowerOrg, kw)) ||
      /\b(iit|iim|nit|iiit|bits pilani|iisc)\b/i.test(lowerOrg) ||
      (!/\b(college|university|institute|school of)\b/i.test(lowerOrg) && IIM_IIT_PREMIER_KEYWORDS.some(kw => matchesKeyword(lowerTitle, kw)));

    const isDU = !isIIMorIITorPremier && (
      DU_KEYWORDS.some(kw => matchesKeyword(lowerOrg, kw)) ||
      /\b(delhi university|university of delhi|\(du\))\b/i.test(lowerOrg) ||
      (!/\b(college|university|institute|school of)\b/i.test(lowerOrg) && DU_KEYWORDS.some(kw => matchesKeyword(lowerTitle, kw)))
    );

    const isCorporateOrGlobal = !isDU && !isIIMorIITorPremier && (
      CORPORATE_KEYWORDS.some(kw => matchesKeyword(lowerOrg, kw)) ||
      GLOBAL_KEYWORDS.some(kw => matchesKeyword(lowerOrg, kw)) ||
      (/\b(pvt ltd|private limited|corporation ltd|corporation limited|inc\b|technologies llc|llp\b|limited$|ltd$)\b/i.test(lowerOrg.trim()) && !/\b(college|university|institute|school of|academy|society|trust)\b/i.test(lowerOrg)) ||
      (item.isCorporate && !/\b(college|university|institute|school of|academy)\b/i.test(lowerOrg)) ||
      (!/\b(college|university|institute|school of)\b/i.test(lowerOrg) && CORPORATE_KEYWORDS.some(kw => matchesKeyword(lowerTitle, kw)))
    );

    const isOthers = !isDU && !isIIMorIITorPremier && !isCorporateOrGlobal;
    const isCorporate = isCorporateOrGlobal;
    const isFlagship = FLAGSHIP_KEYWORDS.some(kw => matchesKeyword(combined, kw));

    // Multi-track discipline classification
    const { category, categoryLabel, categoryEmoji } = classifyOpportunity(item);

    const minTeam = item.regnRequirements?.min_team_size || 1;
    const maxTeam = item.regnRequirements?.max_team_size || 4;
    const isFree = !item.isPaid;
    const isFirstYearFriendly = isFree && (maxTeam >= 1 && maxTeam <= 5);

    // Extract prizes: calculate true cumulative cash pool across all positions
    let prizeDisplay = 'Certificates & Recognition';
    if (Array.isArray(item.prizes) && item.prizes.length > 0) {
      const totalCash = item.prizes.reduce((sum, p) => sum + (Number(p.cash) || 0), 0);
      if (totalCash > 0) {
        prizeDisplay = `₹${totalCash.toLocaleString('en-IN')} Prize Pool`;
      } else if (item.prizes.some(p => p.rank)) {
        prizeDisplay = item.prizes.map(p => p.rank).filter(Boolean).slice(0, 2).join(' · ');
      }
    }

    // Remaining days & urgency
    const remainDaysText = item.regnRequirements?.remain_days || 'Ongoing';
    let daysRemainingNum = 999;
    if (item.regnRequirements?.end_regn_dt) {
      const diffMs = new Date(item.regnRequirements.end_regn_dt).getTime() - now;
      daysRemainingNum = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const urgency = daysRemainingNum <= 2 ? 'high' : daysRemainingNum <= 5 ? 'medium' : 'normal';

    const undergradOk = isUndergradEligible(item);
    const isPGOnly = !undergradOk;
    const isMBAorPG = isPGOnly || (item.filters || []).some(f => /mba|postgraduate/i.test(f.name || '')) || /\b(mba|pgdm|iim|b-school)\b/i.test(combined);

    let circuitVal = 'Others';
    if (isDU) circuitVal = 'DU Circuit';
    else if (isIIMorIITorPremier) circuitVal = 'IIM / IIT';
    else if (isCorporateOrGlobal) circuitVal = 'Corporate';
    else circuitVal = 'Others';

    let disciplineVal = categoryLabel || 'Case';
    if (disciplineVal.includes('Hackathon') || disciplineVal.includes('Tech')) disciplineVal = 'Hackathon';
    else if (disciplineVal.includes('Quiz')) disciplineVal = 'Quiz';
    else if (disciplineVal.includes('Simul')) disciplineVal = 'Simulation';
    else if (disciplineVal.includes('Writ') || disciplineVal.includes('Paper')) disciplineVal = 'Writing';
    else if (disciplineVal.includes('Debate') || disciplineVal.includes('MUN')) disciplineVal = 'Debate & MUN';
    else disciplineVal = 'Case';

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

    const orgLogoUrl = extractValidUrl(
      item.organisation?.logoUrl2,
      item.organisation?.logoUrl,
      item.organisation?.logo,
      item.organisation?.image
    );
    const compLogoUrl = extractValidUrl(item.logoUrl2, item.logo);
    const bannerImgUrl = extractValidUrl(item.banner_mobile?.url, item.banner_desktop?.url, item.banner?.url);

    const finalOrgLogo = orgLogoUrl || compLogoUrl || null;
    const finalCompLogo = orgLogoUrl || compLogoUrl || bannerImgUrl || null;

    return {
      id: item.id || item.short_id,
      title: item.title,
      host: orgName,
      orgName,
      circuit: circuitVal,
      discipline: disciplineVal,
      days: daysRemainingNum,
      fee: isFree ? 'Free' : (item.fee || 'Free'),
      orgLogo: finalOrgLogo,
      logo: finalCompLogo,
      bannerUrl: bannerImgUrl || compLogoUrl || null,
      unstopUrl: item.seo_url || `https://unstop.com/o/${item.short_id || item.id}`,
      deadline: item.regnRequirements?.end_regn_dt || item.end_date,
      startDate: item.regnRequirements?.start_regn_dt || item.start_date || null,
      remainDaysText,
      daysRemainingNum,
      urgency,
      category,
      categoryLabel,
      categoryEmoji,
      minTeam,
      maxTeam,
      teamSizeDisplay: minTeam === maxTeam 
        ? (minTeam === 1 ? 'Solo / Individual' : `${minTeam} Members`) 
        : `${minTeam} - ${maxTeam} Members`,
      prizes: prizeDisplay,
      isFree,
      isFlagship,
      isDU,
      isIIMorIIT: isIIMorIITorPremier,
      isBschool: isIIMorIITorPremier,
      isPremier: isIIMorIITorPremier,
      isIIMorIITorPremier,
      isCorporate,
      isCorporateOrGlobal,
      isOthers,
      isFirstYearFriendly,
      registeredCount: item.registerCount || 0,
      viewsCount: item.viewsCount || 0,
      isUndergradEligible: undergradOk,
      isPGOnly,
      isMBAorPG,
      targetLevel: isPGOnly ? 'pg' : (undergradOk ? 'ug' : 'all'),
      subTracks: extractSubTracks(item, category),
      sourcePlatform: 'unstop',
      sourceLabel: 'Unstop',
    };
  });

  // Append curated multi-platform opportunities
  formatted.push(...MULTIPLATFORM_OPPORTUNITIES);

  // Append live institutional competitions stored in Supabase (if available)
  try {
    const institutional = await fetchInstitutionalCompetitionsFromSupabase();
    if (Array.isArray(institutional) && institutional.length > 0) {
      formatted.push(...institutional);
    }
  } catch (e) {
    // Non-blocking fallback
  }

  // Sort: Exact closing deadline timestamp first, then by registrations
  formatted.sort((a, b) => {
    const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    const validA = !isNaN(timeA) ? timeA : Infinity;
    const validB = !isNaN(timeB) ? timeB : Infinity;
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
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch competitions from Unstop',
    });
  }
}
