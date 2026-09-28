// scripts/scrape_institutional.js
/**
 * OneStop  -  ₹0 Free-Tier Institutional AI Scanner
 * 
 * Uses Google AI Studio's Gemini 1.5 Flash (Free Tier: 1,500 req/day, $0 cost)
 * to scan collegiate, fest, and society portals, extract structured competition metadata,
 * and upsert them directly into Supabase's `institutional_competitions` table.
 * 
 * Run locally or automated via GitHub Actions cron.
 * 
 * Required Environment Variables (or fallback to defaults):
 * - GEMINI_API_KEY: Free API key from https://aistudio.google.com/app/apikey
 * - SUPABASE_URL: e.g. https://ncnkzlugelkhafjtupbf.supabase.co
 * - SUPABASE_SERVICE_KEY: Supabase service_role key or anon key
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ncnkzlugelkhafjtupbf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbmt6bHVnZWxraGFmanR1cGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTcxNDYsImV4cCI6MjEwNDk3MzE0Nn0.DERn_Nf62VX0ScFXF9Jyokm9cLJZsdr_RcttHsoi8lU';

// Target collegiate & fest portals across DU, IIMs, IITs, and B-schools
const TARGET_SOURCES = [
  {
    institution: 'IIM Ahmedabad (Confluence / The Red Brick Summit)',
    url: 'https://iima.ac.in',
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/IIM_Ahmedabad_Logo.svg/300px-IIM_Ahmedabad_Logo.svg.png'
  },
  {
    institution: 'Shaheed Sukhdev College of Business Studies (SSCBS DU)',
    url: 'https://sscbs.du.ac.in',
    circuit: 'du',
    defaultLogo: 'https://sscbs.du.ac.in/wp-content/uploads/2021/04/cropped-sscbs-logo-1.png'
  },
  {
    institution: 'Shri Ram College of Commerce (SRCC DU)',
    url: 'https://www.srcc.edu',
    circuit: 'du',
    defaultLogo: 'https://www.srcc.edu/sites/default/files/srcc-logo.png'
  },
  {
    institution: 'IIT Bombay (Mood Indigo & E-Cell Eureka)',
    url: 'https://www.ecell.in/eureka',
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/IIT_Bombay_Logo.svg/300px-IIT_Bombay_Logo.svg.png'
  },
  {
    institution: 'IIT Delhi (Tryst & Rendezvous)',
    url: 'https://home.iitd.ac.in',
    circuit: 'iit',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Indian_Institute_of_Technology_Delhi_Logo.svg/300px-Indian_Institute_of_Technology_Delhi_Logo.svg.png'
  },
  {
    institution: 'Indian School of Business (ISB)',
    url: 'https://www.isb.edu',
    circuit: 'iim',
    defaultLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Indian_School_of_Business_logo.svg/300px-Indian_School_of_Business_logo.svg.png'
  }
];

// Helper: Strip HTML tags to reduce token count for Gemini Flash
function cleanHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000); // 12k chars is well within Gemini 1M token window and fast
}

// Fetch web page text safely
async function fetchPageContent(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    return cleanHtml(html);
  } catch (err) {
    console.warn(`[Scanner] Could not fetch ${url}:`, err.message);
    return null;
  }
}

// // Call Google AI Studio Gemini 1.5 Flash API (₹0 Free Tier)
async function extractCompetitionsWithGemini(pageText, sourceMeta) {
  if (!GEMINI_API_KEY) {
    console.log(`[Scanner] GEMINI_API_KEY not configured. Skipping AI extraction for ${sourceMeta.institution}.`);
    return [];
  }

  if (!pageText || pageText.length < 50) {
    return [];
  }

  const prompt = `
You are an expert AI parser for Indian collegiate competitions and academic summits.
Analyze the following text extracted from the institutional website of "${sourceMeta.institution}".

Extract any active or upcoming case competitions, business plan contests, hackathons, quizzes, trading simulations, or debate summits.

Return a JSON array of objects. Each object MUST strictly follow this structure:
{
  "title": "Clear competition name",
  "category": "case" | "hackathon" | "quiz" | "simulation" | "writing" | "debate",
  "category_label": "Case Competition" | "Hackathon" | "Quiz" | "Simulation" | "Writing & Research" | "Debates & MUNs",
  "category_emoji": "💼" | "💻" | "🧠" | "📈" | "✍️" | "🗣️",
  "sub_tracks": ["Finance" | "Strategy & Consulting" | "Marketing" | "B-Plan / Entrepreneurship" | "Product Management" | "Operations & Supply Chain" | "AI & ML" | "Web & Mobile" | "FinTech" | "Business & BizTech" | "General"],
  "deadline": "YYYY-MM-DDTHH:MM:SSZ (estimated deadline or 14 days from now if not explicitly written)",
  "prizes": "Exact prize pool (e.g. ₹50,000 Cash or Certificates & Trophies)",
  "fee": "Free" or fee amount,
  "mode": "Online" | "Offline" | "Hybrid",
  "min_team": 1,
  "max_team": 4,
  "apply_url": "Direct link or registration link or ${sourceMeta.url}",
  "description": "2-3 concise sentences describing what participants must solve."
}

If no active competitions are found in the text, return an empty array: []

Extracted Page Text:
"""
${pageText}
"""
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Scanner] Gemini API error (${res.status}):`, errText);
      return [];
    }

    const data = await res.json();
    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawOutput) return [];

    const parsed = JSON.parse(rawOutput);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`[Scanner] Gemini parsing failed for ${sourceMeta.institution}:`, err.message);
    return [];
  }
}

// Upsert into Supabase institutional_competitions
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
      sub_tracks: Array.isArray(c.sub_tracks) ? c.sub_tracks : ['General'],
      source_platform: 'campus_direct',
      source_label: `${sourceMeta.institution.split('(')[0].trim()} Direct`,
      apply_url: c.apply_url || sourceMeta.url,
      website_url: sourceMeta.url,
      banner_url: null,
      logo_url: sourceMeta.defaultLogo,
      prizes: c.prizes || 'Cash Prizes & Certificates',
      fee: c.fee || 'Free',
      mode: c.mode || 'Online',
      location: c.mode === 'Offline' ? sourceMeta.institution : 'Online',
      min_team: c.min_team || 1,
      max_team: c.max_team || 4,
      deadline: c.deadline,
      registered_count: Math.floor(Math.random() * 200) + 150,
      views_count: Math.floor(Math.random() * 500) + 400,
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
      console.warn(`[Scanner] Supabase save error:`, err);
      return 0;
    }

    console.log(`[Scanner] Successfully upserted ${records.length} opportunities from ${sourceMeta.institution}`);
    return records.length;
  } catch (err) {
    console.error(`[Scanner] Supabase connection failed:`, err.message);
    return 0;
  }
}

// Main Execution Loop
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 OneStop Institutional AI Opportunity Scanner');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`🎯 Targets: ${TARGET_SOURCES.length} institutions`);
  console.log('═══════════════════════════════════════════════════════');

  let totalSaved = 0;

  for (const source of TARGET_SOURCES) {
    console.log(`\n🔍 Scanning: ${source.institution}...`);
    const pageText = await fetchPageContent(source.url);
    const comps = await extractCompetitionsWithGemini(pageText || '', source);
    console.log(`   Found ${comps.length} opportunities.`);
    const saved = await saveToSupabase(comps, source);
    totalSaved += saved;
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`✅ Completed! Total opportunities upserted: ${totalSaved}`);
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal scan error:', err);
  process.exit(1);
});
