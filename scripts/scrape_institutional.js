// scripts/scrape_institutional.js
/**
 * OneStop  -  ₹0 Free-Tier Institutional AI Scanner
 * 
 * Uses Google AI Studio's Gemini 2.0 / 1.5 Flash (Free Tier: 1,500 req/day, $0 cost)
 * to scan collegiate, fest, and society portals, extract structured competition metadata,
 * and upsert them directly into Supabase's `institutional_competitions` table.
 * 
 * Run locally or automated via GitHub Actions cron.
 * 
 * Required Environment Variables (or loaded from .env / .env.local):
 * - GEMINI_API_KEY: Free API key from https://aistudio.google.com/app/apikey
 * - SUPABASE_URL: e.g. https://ncnkzlugelkhafjtupbf.supabase.co
 * - SUPABASE_SERVICE_KEY: Supabase service_role key (preferred) or anon key
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to auto-load local .env or .env.local without requiring third-party dotenv
function loadLocalEnv() {
  const rootDir = path.resolve(__dirname, '..');
  const envFiles = ['.env.local', '.env'];

  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    try {
      if (fs.existsSync(fullPath)) {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        raw.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const eqIdx = trimmed.indexOf('=');
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
      }
    } catch (e) {}
  }
}

loadLocalEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ncnkzlugelkhafjtupbf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbmt6bHVnZWxraGFmanR1cGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTcxNDYsImV4cCI6MjEwNDk3MzE0Nn0.DERn_Nf62VX0ScFXF9Jyokm9cLJZsdr_RcttHsoi8lU';

// Target collegiate, fest & premier corporate challenge portals
const TARGET_SOURCES = [
  // ─── 1. CORPORATE PROPRIETARY COMPETITION PORTALS ────────────────────────
  {
    institution: 'Tata Group (Tata Crucible Quiz & Tata Imagination Challenge)',
    url: 'https://www.tatacrucible.com',
    eventUrls: ['https://www.tatacrucible.com/campus/'],
    circuit: 'corporate',
    sourceLabel: 'Tata Crucible Official',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tata_logo.svg/300px-Tata_logo.svg.png'
  },
  {
    institution: 'Microsoft (Imagine Cup Global Student Competition)',
    url: 'https://imaginecup.microsoft.com',
    eventUrls: ['https://imaginecup.microsoft.com/en-us/Events'],
    circuit: 'corporate',
    sourceLabel: 'Microsoft Imagine Cup',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/300px-Microsoft_logo_%282012%29.svg.png'
  },
  {
    institution: 'Google (Summer of Code & Solution Challenge)',
    url: 'https://summerofcode.withgoogle.com',
    eventUrls: ['https://developers.google.com/community/gdsc-solution-challenge'],
    circuit: 'corporate',
    sourceLabel: 'Google Developer Challenges',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/300px-Google_2015_logo.svg.png'
  },
  {
    institution: 'WorldQuant (International Quant Championship - IQC)',
    url: 'https://platform.worldquantbrain.com',
    eventUrls: ['https://www.worldquant.com/brain/'],
    circuit: 'corporate',
    sourceLabel: 'WorldQuant BRAIN IQC',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/WorldQuant_logo.svg/300px-WorldQuant_logo.svg.png'
  },
  {
    institution: 'CFA Institute (Global Research Challenge)',
    url: 'https://www.cfainstitute.org/en/societies/challenge',
    eventUrls: [],
    circuit: 'corporate',
    sourceLabel: 'CFA Institute Direct',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/CFA_Institute_logo.svg/300px-CFA_Institute_logo.svg.png'
  },
  {
    institution: "L'Oréal (Brandstorm Global Innovation Challenge)",
    url: 'https://www.loreal.com/en/careers/',
    eventUrls: ['https://brandstorm.loreal.com/en'],
    circuit: 'corporate',
    sourceLabel: "L'Oréal Brandstorm",
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/L%27Or%C3%A9al_logo.svg/300px-L%27Or%C3%A9al_logo.svg.png'
  },

  // ─── 2. PREMIER IIMS & B-SCHOOL SUMMITS ─────────────────────────────────
  {
    institution: 'IIM Ahmedabad (The Red Brick Summit & Confluence)',
    url: 'https://iima.ac.in',
    eventUrls: ['https://trbs.iima.ac.in'],
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/IIM_Ahmedabad_Logo.svg/300px-IIM_Ahmedabad_Logo.svg.png'
  },
  {
    institution: 'IIM Bangalore (Vista - Flagship Business Summit)',
    url: 'https://iimb-vista.com',
    eventUrls: ['https://www.iimb.ac.in'],
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/12/IIM_Bangalore_Logo.svg/300px-IIM_Bangalore_Logo.svg.png'
  },
  {
    institution: 'IIM Lucknow (Manfest-Varchasva)',
    url: 'https://www.iiml-manfestvarchasva.com',
    eventUrls: ['https://www.iiml.ac.in'],
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/IIM_Lucknow_Logo.svg/300px-IIM_Lucknow_Logo.svg.png'
  },
  {
    institution: 'IIM Calcutta (Intaglio & Carpe Diem)',
    url: 'https://www.iimcal.ac.in',
    eventUrls: ['https://iimcal.ac.in/events'],
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b2/IIM_Calcutta_Logo.svg/300px-IIM_Calcutta_Logo.svg.png'
  },
  {
    institution: 'IIM Kozhikode (Backwaters & Horizons)',
    url: 'https://www.iimk.ac.in',
    eventUrls: ['https://www.iimk.ac.in/events'],
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/IIM_Kozhikode_Logo.svg/300px-IIM_Kozhikode_Logo.svg.png'
  },
  {
    institution: 'Indian School of Business (ISB)',
    url: 'https://www.isb.edu',
    eventUrls: ['https://www.isb.edu/en/events.html'],
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Indian_School_of_Business_logo.svg/300px-Indian_School_of_Business_logo.svg.png'
  },
  {
    institution: 'XLRI Jamshedpur (Ensemble-Valhalla & Maxi Fair)',
    url: 'https://xlri.ac.in',
    eventUrls: ['https://xlri.ac.in/events/'],
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/XLRI_Jamshedpur_Logo.svg/300px-XLRI_Jamshedpur_Logo.svg.png'
  },
  {
    institution: 'Faculty of Management Studies (FMS Delhi)',
    url: 'https://fms.edu',
    eventUrls: ['https://fms.edu/events'],
    circuit: 'du',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/FMS_Delhi_Logo.png/300px-FMS_Delhi_Logo.png'
  },

  // ─── 3. PREMIER IITS & TECH FESTS ───────────────────────────────────────
  {
    institution: 'IIT Bombay (Mood Indigo & E-Cell Eureka)',
    url: 'https://www.ecell.in/eureka',
    eventUrls: ['https://moodi.org'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/IIT_Bombay_Logo.svg/300px-IIT_Bombay_Logo.svg.png'
  },
  {
    institution: 'IIT Delhi (Tryst & Rendezvous)',
    url: 'https://tryst-iitd.org',
    eventUrls: ['https://home.iitd.ac.in'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Indian_Institute_of_Technology_Delhi_Logo.svg/300px-Indian_Institute_of_Technology_Delhi_Logo.svg.png'
  },
  {
    institution: 'IIT Madras (Shaastra Tech Summit)',
    url: 'https://shaastra.org',
    eventUrls: ['https://www.iitm.ac.in'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/69/IIT_Madras_Logo.svg/300px-IIT_Madras_Logo.svg.png'
  },
  {
    institution: 'IIT Kharagpur (Kshitij Techno-Management Fest)',
    url: 'https://ktj.in',
    eventUrls: ['https://www.iitkgp.ac.in'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/IIT_Kharagpur_Logo.svg/300px-IIT_Kharagpur_Logo.svg.png'
  },
  {
    institution: 'IIT Kanpur (Techkriti Innovation Fest)',
    url: 'https://techkriti.org',
    eventUrls: ['https://www.iitk.ac.in'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/IIT_Kanpur_Logo.svg/300px-IIT_Kanpur_Logo.svg.png'
  },
  {
    institution: 'IIT Roorkee (Cognizance Fest)',
    url: 'https://cognizance.org.in',
    eventUrls: ['https://www.iitr.ac.in'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/IIT_Roorkee_logo.svg/300px-IIT_Roorkee_logo.svg.png'
  },
  {
    institution: 'IIT Guwahati (Techniche Fest)',
    url: 'https://techniche.org.in',
    eventUrls: ['https://www.iitg.ac.in'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/12/IIT_Guwahati_Logo.svg/300px-IIT_Guwahati_Logo.svg.png'
  },
  {
    institution: 'BITS Pilani (APOGEE, Oasis & Conquest)',
    url: 'https://bits-apogee.org',
    eventUrls: ['https://bits-oasis.org', 'https://conquest.org.in'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/BITS_Pilani-Logo.svg/300px-BITS_Pilani-Logo.svg.png'
  },

  // ─── 4. PREMIER DELHI UNIVERSITY COLLEGES ──────────────────────────────
  {
    institution: 'Shaheed Sukhdev College of Business Studies (SSCBS DU)',
    url: 'https://sscbs.du.ac.in',
    eventUrls: ['https://sscbs.du.ac.in/events/'],
    circuit: 'du',
    defaultLogo: 'https://sscbs.du.ac.in/wp-content/uploads/2021/04/cropped-sscbs-logo-1.png'
  },
  {
    institution: 'Shri Ram College of Commerce (SRCC DU)',
    url: 'https://www.srcc.edu',
    eventUrls: ['https://www.srcc.edu/students/events'],
    circuit: 'du',
    defaultLogo: 'https://www.srcc.edu/sites/default/files/srcc-logo.png'
  },
  {
    institution: "St. Stephen's College (DU)",
    url: 'https://www.ststephens.edu',
    eventUrls: [],
    circuit: 'du',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9c/St._Stephen%27s_College%2C_Delhi_crest.svg/300px-St._Stephen%27s_College%2C_Delhi_crest.svg.png'
  },
  {
    institution: 'Hindu College (DU)',
    url: 'https://hinducollege.ac.in',
    eventUrls: [],
    circuit: 'du',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Hindu_College%2C_University_of_Delhi_logo.png/300px-Hindu_College%2C_University_of_Delhi_logo.png'
  },
  {
    institution: 'Lady Shri Ram College (LSR DU)',
    url: 'https://lsr.edu.in',
    eventUrls: [],
    circuit: 'du',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/55/Lady_Shri_Ram_College_for_Women_logo.svg/300px-Lady_Shri_Ram_College_for_Women_logo.svg.png'
  },
  {
    institution: 'Hansraj College (DU)',
    url: 'https://www.hansrajcollege.ac.in',
    eventUrls: [],
    circuit: 'du',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Hansraj_College_logo.svg/300px-Hansraj_College_logo.svg.png'
  }
];

// Helper: Strip HTML tags and focus on competition-relevant text for fast AI parsing
function cleanHtml(html) {
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= 6000) return text;

  // Intelligently select paragraphs/sentences containing collegiate event keywords
  const KEYWORDS = /(competition|challenge|hackathon|summit|fest|conclave|round|case|prize|deadline|register|quiz|trophy|cash|ppi|prizes|team)/i;
  const segments = text.split(/(?<=[.!?\n])\s+/);
  const relevant = segments.filter(s => KEYWORDS.test(s));

  if (relevant.length >= 4) {
    return relevant.join(' ').slice(0, 6000);
  }

  return text.slice(0, 6000);
}

// Fetch web page text safely
async function fetchPageContent(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    return cleanHtml(html);
  } catch (err) {
    return null;
  }
}

function extractJsonArray(rawText) {
  if (!rawText) return [];
  try {
    const cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = cleaned.slice(start, end + 1);
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    }
    const direct = JSON.parse(cleaned);
    return Array.isArray(direct) ? direct : [];
  } catch (e) {
    return [];
  }
}

// Extract competitions using Google AI Studio Gemini / Gemma API
async function extractCompetitionsWithGemini(pageText, sourceMeta) {
  if (!GEMINI_API_KEY) {
    return [];
  }

  if (!pageText || pageText.length < 50) {
    return [];
  }

  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  const currentYear = now.getFullYear();

  const prompt = `
You are an expert parser for collegiate competitions, business summits, engineering fests, hackathons, and corporate challenges across premier Indian universities and global companies (DU, IIMs, IITs, B-schools, Fortune 500 tech & finance giants).
Analyze the following text extracted from the portal of "${sourceMeta.institution}".

CRITICAL DATE & TIMELINESS VERIFICATION RULES:
- Today's date is: ${todayIso} (Current Year: ${currentYear}).
- STRICTLY EXCLUDE EXPIRED OR HISTORICAL COMPETITIONS:
  If a competition, fest edition, or challenge already took place in the past (e.g. concluded earlier in ${currentYear} like Jan/Feb/March, or from previous years ${currentYear - 1}, ${currentYear - 2}), or if its registration deadline has passed, YOU MUST DISCARD IT. Do NOT extract it. Return [] for expired events.
- ONLY extract competitions that are explicitly ACTIVE, UPCOMING, or CURRENTLY ACCEPTING APPLICATIONS for future dates in ${currentYear} or later.
- If the text describes a multi-event summit, only extract individual flagship competitions that have FUTURE deadlines.
- For "deadline": MUST be a valid ISO 8601 string strictly in the future (after ${todayIso}). If the competition has already concluded or registrations closed, omit it completely.

Return a valid JSON array of objects. Return JSON only, with no commentary. Each object MUST strictly follow this structure:
[
  {
    "title": "Clear and specific competition title",
    "category": "case" | "hackathon" | "quiz" | "simulation" | "writing" | "debate",
    "category_label": "Case Competition" | "Hackathon" | "Quiz" | "Simulation" | "Writing & Research" | "Debates & MUNs",
    "category_emoji": "💼" | "💻" | "🧠" | "📈" | "✍️" | "🗣️",
    "sub_tracks": ["Finance", "Strategy & Consulting", "Marketing", "B-Plan", "Product", "Operations", "AI & ML", "Web & Mobile", "General"],
    "deadline": "ISO 8601 string strictly in the future (e.g. 2026-11-15T23:59:59Z)",
    "prizes": "Exact prize pool mentioned (e.g. ₹50,000 Cash Pool, or Certificates & Trophies)",
    "fee": "Free" or fee amount string,
    "mode": "Online" | "Offline" | "Hybrid",
    "location": "Online or campus name/city",
    "min_team": 1,
    "max_team": 4,
    "apply_url": "Direct registration URL or ${sourceMeta.url}",
    "registered_count": 0,
    "description": "2 concise sentences explaining what participants are tasked with solving."
  }
]

If no active upcoming competitions are found in the text, return an empty array: []

Extracted Page Text:
"""
${pageText}
"""
`;

  const modelsToTry = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.7-flash',
    'gemma-4-26b-a4b-it'
  ];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const isGemma = model.startsWith('gemma');
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: isGemma ? { temperature: 0.1 } : { response_mime_type: 'application/json', temperature: 0.1 }
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 16000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text();
        console.log(`   🤖 ${model} responded with ${res.status}:`, errText.slice(0, 80));
        continue;
      }

      const data = await res.json();
      const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawOutput) {
        console.log(`   🤖 ${model} produced no text candidates.`);
        continue;
      }

      console.log(`   🤖 ${model} responded successfully (${rawOutput.length} chars).`);
      const parsed = extractJsonArray(rawOutput);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.log(`   🤖 ${model} error:`, err.message);
      continue;
    }
  }

  return [];
}

// Helper: Deactivate expired competitions in Supabase
async function deactivateExpiredCompetitionsInDb() {
  try {
    const nowIso = new Date().toISOString();
    await fetch(`${SUPABASE_URL}/rest/v1/institutional_competitions?deadline=lt.${encodeURIComponent(nowIso)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_active: false })
    });
  } catch (e) {}
}

// Upsert records into Supabase institutional_competitions table
async function saveToSupabase(competitions, sourceMeta) {
  if (!competitions || competitions.length === 0) return 0;

  // Strict Programmatic Guard: Filter out any competition whose deadline has already passed
  const nowMs = Date.now();
  const validCompetitions = competitions.filter(c => {
    if (!c.deadline) return true;
    const dl = new Date(c.deadline).getTime();
    if (!isNaN(dl) && dl < nowMs) {
      console.log(`   ⏭️ Skipping expired/past competition: "${c.title}" (deadline: ${c.deadline})`);
      return false;
    }
    return true;
  });

  if (validCompetitions.length === 0) {
    console.log(`   ⚠️ All parsed competitions from this source were past/expired events.`);
    return 0;
  }

  const records = validCompetitions.map(c => {
    const slug = (c.title || 'competition')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 50);
    const id = `inst_${slug}`;

    return {
      id,
      title: c.title,
      slug,
      host_institution: sourceMeta.institution,
      organizer: sourceMeta.institution,
      category: c.category || 'case',
      category_label: c.category_label || 'Case Competition',
      category_emoji: c.category_emoji || '💼',
      sub_tracks: Array.isArray(c.sub_tracks) && c.sub_tracks.length > 0 ? c.sub_tracks : ['General'],
      source_platform: sourceMeta.circuit === 'corporate' ? 'corporate' : 'campus_direct',
      source_label: sourceMeta.circuit === 'corporate'
        ? (sourceMeta.sourceLabel || sourceMeta.institution.split('(')[0].trim())
        : `${sourceMeta.institution.split('(')[0].trim()} Direct`,
      apply_url: c.apply_url || sourceMeta.url,
      website_url: sourceMeta.url,
      banner_url: null,
      logo_url: sourceMeta.defaultLogo,
      prizes: c.prizes || 'Cash Prizes & Certificates',
      fee: c.fee || 'Free',
      mode: c.mode || 'Online',
      location: c.location || (c.mode === 'Offline' ? sourceMeta.institution : 'Online'),
      min_team: typeof c.min_team === 'number' ? c.min_team : 1,
      max_team: typeof c.max_team === 'number' ? c.max_team : 4,
      deadline: c.deadline || new Date(Date.now() + 14 * 86400000).toISOString(),
      registered_count: Number(c.registered_count) || 0,
      views_count: 0,
      raw_scraped_text: c.description || c.title,
      is_undergrad_eligible: true,
      is_pg_only: false,
      is_du: sourceMeta.circuit === 'du',
      is_iim_or_iit: sourceMeta.circuit === 'iim' || sourceMeta.circuit === 'iit',
      is_premier: true,
      is_flagship: true,
      is_active: true,
      updated_at: new Date().toISOString()
    };
  });

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/institutional_competitions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(records)
    });

    if (!res.ok) {
      const err = await res.text();
      if (res.status === 401 || err.includes('row-level security')) {
        console.warn(`   ⚠️ Supabase RLS Permission Notice: Database policy requires service role key or scanner policy.`);
      } else {
        console.warn(`   ⚠️ Supabase save error [${res.status}]:`, err.slice(0, 140));
      }
      return 0;
    }

    console.log(`   ✨ Saved ${records.length} opportunities into Supabase.`);
    return records.length;
  } catch (err) {
    console.error(`   ❌ Supabase connection failed:`, err.message);
    return 0;
  }
}

// Main Execution Loop
async function main() {
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('🏛️  OneStop Institutional AI Opportunity Scanner');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`🎯 Targets: ${TARGET_SOURCES.length} premier colleges & fests`);

  if (!GEMINI_API_KEY) {
    console.log('═════════════════════════════════════════════════════════════════');
    console.log('⚠️  GEMINI_API_KEY is not configured yet!');
    console.log('👉 Quick 10-second setup (100% Free):');
    console.log('   1. Visit: https://aistudio.google.com/app/apikey');
    console.log('   2. Click "Create API key"');
    console.log('   3. Add GEMINI_API_KEY=your_key in your .env file');
    console.log('═════════════════════════════════════════════════════════════════');
  } else {
    console.log('🔑 Gemini API Key: Configured (Free Tier: 1,500 req/day)');
    console.log('═════════════════════════════════════════════════════════════════');
  }

  // Automatically deactivate expired competitions in Supabase
  await deactivateExpiredCompetitionsInDb();

  let totalFound = 0;
  let totalSaved = 0;

  for (let i = 0; i < TARGET_SOURCES.length; i++) {
    const source = TARGET_SOURCES[i];
    console.log(`\n[${i + 1}/${TARGET_SOURCES.length}] 🔍 Scanning: ${source.institution}...`);
    
    // Aggregate page text from main URL and any dedicated event URLs
    const urlsToFetch = [source.url, ...(source.eventUrls || [])];
    let combinedText = '';

    for (const url of urlsToFetch) {
      const text = await fetchPageContent(url);
      if (text) {
        combinedText += `\n[Page: ${url}]\n` + text;
      }
    }

    if (!combinedText) {
      console.log(`   ⚠️ Could not fetch content (portal might be unreachable or blocking bots).`);
      continue;
    }

    const comps = await extractCompetitionsWithGemini(combinedText, source);
    totalFound += comps.length;
    console.log(`   Found ${comps.length} competition(s).`);

    if (comps.length > 0) {
      comps.forEach(c => {
        console.log(`     • ${c.title} (${c.category_label || c.category}) | ${c.prizes || 'Free'}`);
      });
      const saved = await saveToSupabase(comps, source);
      totalSaved += saved;
    }

    // Gentle 2.5s breathing room between targets to stay safely under 15 RPM
    if (i < TARGET_SOURCES.length - 1) {
      await new Promise(r => setTimeout(r, 2500));
    }
  }

  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log(`✅ Institutional Scanner Run Completed!`);
  console.log(`📊 Competitions Discovered: ${totalFound}`);
  console.log(`💾 Competitions Upserted to Supabase: ${totalSaved}`);
  console.log('═════════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal scan error:', err);
  process.exit(1);
});
