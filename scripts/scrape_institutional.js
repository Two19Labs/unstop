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

// Target collegiate & fest portals across DU, IIMs, IITs, and Premier Institutions
const TARGET_SOURCES = [
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
    institution: 'IIM Calcutta (Intaglio International Summit)',
    url: 'https://www.iimcal.ac.in',
    eventUrls: [],
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b2/IIM_Calcutta_Logo.svg/300px-IIM_Calcutta_Logo.svg.png'
  },
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
    institution: 'IIT Bombay (Mood Indigo & E-Cell Eureka)',
    url: 'https://www.ecell.in/eureka',
    eventUrls: ['https://moodi.org'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/IIT_Bombay_Logo.svg/300px-IIT_Bombay_Logo.svg.png'
  },
  {
    institution: 'IIT Delhi (Tryst & Rendezvous)',
    url: 'https://home.iitd.ac.in',
    eventUrls: ['https://tryst-iitd.org'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Indian_Institute_of_Technology_Delhi_Logo.svg/300px-Indian_Institute_of_Technology_Delhi_Logo.svg.png'
  },
  {
    institution: 'IIT Madras (Shaastra Tech Summit)',
    url: 'https://shaastra.org',
    eventUrls: [],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/69/IIT_Madras_Logo.svg/300px-IIT_Madras_Logo.svg.png'
  },
  {
    institution: 'Indian School of Business (ISB)',
    url: 'https://www.isb.edu',
    eventUrls: [],
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Indian_School_of_Business_logo.svg/300px-Indian_School_of_Business_logo.svg.png'
  },
  {
    institution: 'BITS Pilani (Conquest & APOGEE)',
    url: 'https://conquest.org.in',
    eventUrls: ['https://bits-apogee.org'],
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/BITS_Pilani-Logo.svg/300px-BITS_Pilani-Logo.svg.png'
  }
];

// Helper: Strip HTML tags to reduce token count for Gemini
function cleanHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16000); // 16k chars fits comfortably into free quota and runs fast
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

// Extract competitions using Google AI Studio Gemini API (Free Tier: gemini-2.0-flash / gemini-1.5-flash)
async function extractCompetitionsWithGemini(pageText, sourceMeta) {
  if (!GEMINI_API_KEY) {
    return [];
  }

  if (!pageText || pageText.length < 50) {
    return [];
  }

  const prompt = `
You are an expert parser for collegiate competitions, business summits, fests, hackathons, and case challenges across premier Indian universities (DU, IIMs, IITs, B-schools).
Analyze the following text extracted from the institutional website of "${sourceMeta.institution}".

Extract any active, upcoming, or recently announced competitions, case challenges, hackathons, quizzes, trading simulations, or debate summits.
If the text describes a multi-event summit (like Eureka, Red Brick Summit, Vista, Mood Indigo), extract individual flagship competitions where possible.

Return a JSON array of objects. Each object MUST strictly follow this structure:
{
  "title": "Clear and specific competition title",
  "category": "case" | "hackathon" | "quiz" | "simulation" | "writing" | "debate",
  "category_label": "Case Competition" | "Hackathon" | "Quiz" | "Simulation" | "Writing & Research" | "Debates & MUNs",
  "category_emoji": "💼" | "💻" | "🧠" | "📈" | "✍️" | "🗣️",
  "sub_tracks": ["Finance", "Strategy & Consulting", "Marketing", "B-Plan", "Product", "Operations", "AI & ML", "Web & Mobile", "General"],
  "deadline": "ISO 8601 string (e.g. 2026-10-15T23:59:59Z). If no exact date is mentioned, estimate 14 days from now",
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

If no active competitions are found in the text, return an empty array: []

Extracted Page Text:
"""
${pageText}
"""
`;

  const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 404 || res.status === 400) {
          // Model not supported or deprecated on this key, try next model
          continue;
        }
        console.warn(`   ⚠️ Gemini API (${model}) warning [${res.status}]: ${errText.slice(0, 120)}`);
        continue;
      }

      const data = await res.json();
      const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawOutput) return [];

      const parsed = JSON.parse(rawOutput);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // Try fallback model
      continue;
    }
  }

  return [];
}

// Upsert records into Supabase institutional_competitions table
async function saveToSupabase(competitions, sourceMeta) {
  if (!competitions || competitions.length === 0) return 0;

  const records = competitions.map(c => {
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
      source_platform: 'campus_direct',
      source_label: `${sourceMeta.institution.split('(')[0].trim()} Direct`,
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
      description: c.description || c.title,
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

  let totalFound = 0;
  let totalSaved = 0;

  for (const source of TARGET_SOURCES) {
    console.log(`\n🔍 Scanning: ${source.institution}...`);
    
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
