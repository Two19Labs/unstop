// Circuit keyword lists shared by api/competitions.js and scripts/scrape_institutional.js.
// Matching is done against the organiser name (and the title only when the organiser
// is not itself a college), see classifyCircuit() below.

export const DU_KEYWORDS = [
  'delhi university', 'university of delhi', '(du)', 'sscbs', 'shaheed sukhdev',
  'srcc', 'shri ram college', "stephen's", 'st. stephen', 'stephens college',
  'hindu college', 'hansraj', 'lsr', 'lady shri ram',
  'sggscc', 'ramjas', 'kirori mal', 'kmc', 'drc', 'daulat ram', 'gargi', 'venkateswara',
  'venky', 'sgtb khalsa', 'sgtb', 'sri guru tegh bahadur khalsa', 'keshav mahavidyalaya',
  'deen dayal upadhyaya college', 'ddu college',
  'miranda house', 'miranda', 'jesus and mary', 'jmc', 'atma ram', 'arsd', 'sbsc',
  'shaheed bhagat singh', 'motilal nehru college', 'indraprastha college', 'ipcw',
  'maharaja agrasen college', 'ramanujan college', 'kalindi college', 'kamala nehru college',
  'shaheed rajguru', 'bharati college', 'college of vocational studies', 'cvs'
];

export const PREMIER_KEYWORDS = [
  // IIMs (incl. IIM Mumbai / NITIE)
  'iim', 'indian institute of management', 'nitie',
  // IITs & premier research
  'iit', 'indian institute of technology', 'doms', 'dms', 'sjmsom', 'vgsom', 'iisc', 'indian institute of science', 'techkriti', 'ism dhanbad',
  'iit bhu', 'banaras hindu university', 'iit (bhu)', 'iit-bhu',
  // BITS Pilani (all campuses)
  'bits pilani', 'birla institute of technology & science', 'birla institute of technology and science', 'bits goa', 'bits hyderabad', 'bits',
  // NITs
  'nit', 'national institute of technology', 'vnit', 'mnit', 'mnnit', 'svnit', 'manit',
  'motilal nehru national institute of technology',
  // IIITs
  'iiit', 'iiit-delhi', 'iiitd', 'iiith', 'iiitb', 'iiit hyderabad', 'iiit bangalore', 'iiit delhi', 'iiit allahabad',
  // B-schools
  'xlri', 'xavier school of management', 'xavier labour',
  'isb', 'indian school of business',
  'fms', 'faculty of management studies',
  'spjimr', 'sp jain', 's.p. jain', 's p jain',
  'mdi', 'management development institute',
  'iift', 'indian institute of foreign trade',
  'nmims', 'narsee monjee', 'sbm',
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
  // Symbiosis (all institutes)
  'symbiosis', 'sibm', 'scmhrd', 'siib', 'siom', 'scit',
  // Premier state / central tech universities
  'nsut', 'netaji subhas', 'dtu', 'delhi technological university', 'dce',
  'bit mesra', 'birla institute of technology (bit), mesra', 'birla institute of technology, mesra',
  'punjab engineering college', 'pec chandigarh', 'pec, chandigarh', 'coep', 'vjti',
  'jadavpur university', 'anna university', 'ceg guindy', 'thapar',
  'psg tech', 'psg college of technology', 'rvce', 'bmsce', 'msrit',
  // VIT (Vellore, Chennai, Bhopal, AP) - never a bare "vit", which also means Vidyalankar, Mumbai
  'vellore institute of technology', 'vit vellore', 'vit chennai', 'vit bhopal', 'vit-ap', 'vit ap', 'vit university',
  // Premier autonomous & multidisciplinary
  'st. xavier', 'st xavier', "xavier's college", 'xaviers college',
  'ashoka university', 'ashoka',
  'christ university', 'christ (deemed to be university)', 'christ deemed to be university',
  'loyola college', 'madras christian college', 'mcc chennai',
  'presidency college', 'presidency university', 'jindal global', 'o.p. jindal',
  'shiv nadar', 'snu', 'plaksha',
  // NLUs
  'nlsiu', 'nalsar', 'nujs', 'nlu delhi', 'nlu jodhpur', 'gnlu',
  // Science & statistics
  'indian statistical institute', 'isi kolkata', 'cmi', 'tifr', 'iiser', 'niser'
];

export const CORPORATE_KEYWORDS = [
  // Consulting & professional services
  'mckinsey', 'bain', 'bcg', 'boston consulting', 'kearney', 'oliver wyman', 'strategy&',
  'deloitte', 'pwc', 'pricewaterhousecoopers', 'ey', 'ernst & young', 'kpmg', 'grant thornton', 'bdo', 'accenture',
  'brainwars', 'bain capability network', 'cafta', 'steel-a-thon', 'the ultimate pitch', 'stratos', 'flipkart grid', 'finserv atom',
  // FMCG & consumer
  "l'oreal", 'loreal', 'brandstorm', 'hul', 'hindustan unilever', 'lime', 'unilever',
  'itc', 'interrobang', 'marico', 'over the wall', 'mondelez', 'reckitt', 'nestle', 'p&g', 'procter & gamble',
  'pepsico', 'coca-cola', 'coke', 'aditya birla', 'stratfresh', 'abg', 'dabur', 'godrej', 'asian paints', 'berger paints', 'britannia',
  // Automotive, industrial, energy & PSUs
  'maruti suzuki', 'maruti', 'satin finserv',
  'hindustan petroleum', 'hpcl', 'hp power lab', 'bharat petroleum', 'bpcl', 'indian oil', 'iocl', 'ongc', 'gail', 'ntpc', 'bhel', 'coal india',
  'tata group', 'tata steel', 'tata motors', 'tcs', 'tata crucible', 'tata imagination', 'tata',
  'reliance', 'reliance retail', 'mahindra', 'war room', 'mahindra rise', 'tvs', 'tvs credit',
  'hero motocorp', 'hero colabs', 'bajaj finserv', 'bajaj auto', 'l&t', 'larsen & toubro', 'vedanta', 'adani', 'jsw',
  'sun pharma', 'sun pharmaceutical', 'cummins',
  // Tech, e-commerce, telecom & semis
  'amazon', 'flipkart', 'google', 'microsoft', 'apple', 'meta', 'uber', 'swiggy', 'zomato',
  'qualcomm', 'intel', 'cisco', 'ibm', 'infosys', 'wipro', 'hcl', 'cognizant', 'capgemini', 'tech mahindra',
  'airtel', 'jio', 'vodafone', 'supervity', 'salesforce', 'adobe',
  // Banking & financial services
  'goldman sachs', 'jpmorgan', 'jp morgan', 'morgan stanley', 'citi', 'citigroup', 'hsbc',
  'american express', 'amex', 'standard chartered', 'barclays', 'deutsche bank',
  'hdfc', 'icici', 'axis bank', 'kotak', 'optum', 'stratethon', 'raam group', 'cfa institute',
  // Startups, platforms & corporate entities
  'cogniza', 'wonksknow', 'noobsync', 'invoqe', 'upforge', 'jetlearn', 'languify',
  'product space', 'mhtechin', 'monomousumi', 'kartexa', 'skilled sapiens', 'indiastox',
  'godstockss', 'acecubing', 'campusorbit', 'pharmaorbit', 'boss console', 'hackathon raptors',
  'heritage vastra', 'code-x-novas', 'elite coders', 'wecodecoders', 'interactup', 'internhill',
  'innovation hacks', 'gradient learnings', 'bharat academix', 'cyber hx', 'talentsec', 'techverse', 'peakforge',
  'insideiim', 'insidekampus'
];

export const GLOBAL_KEYWORDS = [
  'harvard', 'stanford', 'wharton', 'massachusetts institute of technology', 'yale',
  'columbia university', 'oxford', 'cambridge', 'london school of economics', 'london business school',
  'insead', 'national university of singapore', 'nanyang technological university', 'hult prize',
  'hec paris', 'nyu stern', 'kellogg', 'chicago booth', 'berkeley haas', 'mit sloan',
  'imperial college', 'eth zurich', 'monash', 'melbourne university', 'sydney university', 'toronto university',
  'unilever future leaders', 'brandstorm', 'imagine cup', 'solution challenge',
  'world bank', 'bloomberg global', 'cfa institute research challenge', 'schneider go green',
  'international case competition', 'global challenge', 'worldwide challenge'
];

const COLLEGE_WORDS = /\b(college|university|institute|school of|academy|vidyapeeth|vidyalaya|campus|iit|iim|nit|iiit)\b/i;
const COMPANY_WORDS = /(\bpvt\.?\s*ltd\b|\bprivate limited\b|\blimited\b|\bltd\b\.?|\bllp\b|\binc\b\.?|\bcorporation\b|\btechnologies\b|\bsolutions\b|\blabs\b|\bindustries\b|\bpharmaceuticals?\b|\bventures\b|\bconsult(ing|ancy)\b)/i;

const keywordCache = new Map();

// Whole-keyword match that also works for keywords that start or end with punctuation,
// e.g. "christ (deemed to be university)" or "iit (bhu)" (\b fails next to "(" and ")").
export function matchesKeyword(text, keyword) {
  const kw = String(keyword || '').trim().toLowerCase();
  if (!kw || !text) return false;
  let re = keywordCache.get(kw);
  if (!re) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
    keywordCache.set(kw, re);
  }
  return re.test(text);
}

export const anyKeyword = (text, list) => list.some(kw => matchesKeyword(text, kw));

export function looksLikeCompany(orgName) {
  const org = String(orgName || '').toLowerCase().trim();
  return COMPANY_WORDS.test(org) && !COLLEGE_WORDS.test(org);
}

// Returns one of: 'DU Circuit' | 'IIM / IIT' | 'Corporate' | 'Others'
export function classifyCircuit(orgName, title = '') {
  const org = String(orgName || '').toLowerCase();
  const t = String(title || '').toLowerCase();
  const orgIsCollege = COLLEGE_WORDS.test(org);

  const premier = anyKeyword(org, PREMIER_KEYWORDS) || (!orgIsCollege && anyKeyword(t, PREMIER_KEYWORDS));
  if (premier) return 'IIM / IIT';

  const du = anyKeyword(org, DU_KEYWORDS) || (!orgIsCollege && anyKeyword(t, DU_KEYWORDS));
  if (du) return 'DU Circuit';

  const corporate = anyKeyword(org, CORPORATE_KEYWORDS) ||
    anyKeyword(org, GLOBAL_KEYWORDS) ||
    looksLikeCompany(org) ||
    (!orgIsCollege && (anyKeyword(t, CORPORATE_KEYWORDS) || anyKeyword(t, GLOBAL_KEYWORDS)));
  if (corporate) return 'Corporate';

  return 'Others';
}
