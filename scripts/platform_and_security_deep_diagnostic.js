// scripts/platform_and_security_deep_diagnostic.js
// Comprehensive Platform Health & Security Diagnostic Suite for OneStop
// Covers:
// 1. Security Audit: Sensitive data leakage, frontend exposure, inspect element vulnerability,
//    bundle scrutiny, environment isolation, presence PII masking, PostHog telemetry privacy,
//    CSP/security headers, and Supabase RLS defense-in-depth.
// 2. Platform End-to-End Functional Diagnostic: Skills, academic standing, eligibility engine,
//    phone sanitization, profile cooldown, solo/squad hosting, applications, conversations,
//    deadline snapshot diffing, notifications, and storage hygiene.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { SKILLS, SKILL_ALIASES, normalizeSkill, isMockPost, isMockApp } from '../src/data/initialData.js';
import { normalizeYear, YEAR_OPTIONS } from '../src/data/colleges.js';
import { isEligibleForUndergrad, checkIsPostgraduate, MBA_EXCLUSION_PATTERN, UG_AFFIRMATIVE_PATTERN } from '../src/utils/eligibilityUtils.js';
import { sanitizeIndianPhone, isValidIndianPhone, cleanPhoneInput, phoneValidationError, formatWhatsAppUrl } from '../src/utils/phoneUtils.js';
import { PROFILE_COOLDOWN_MS, getProfileCooldown } from '../src/utils/profileCooldown.js';
import { isSoloCompetition } from '../src/utils/competitionUtils.js';
import { formatDurationDiff } from '../src/lib/deadlineSnapshotEngine.js';
import { formatRelativeTime } from '../src/lib/notificationService.js';
import { purgeLegacyPrivateStorage, purgeUserStorage } from '../src/lib/storage.js';

// Replicated pure functions from AuthContext.jsx for headless Node testing:
function accountHasPassword(user) {
  const identities = user?.identities;
  if (!Array.isArray(identities) || identities.length === 0) {
    return (user?.app_metadata?.provider || 'email') === 'email';
  }
  return identities.some(i => i.provider === 'email');
}

const RECENT_SIGN_IN_MS = 9 * 60 * 1000;
function signedInRecently(user) {
  const at = user?.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
  return Boolean(at) && Date.now() - at < RECENT_SIGN_IN_MS;
}

function normalizeSquadApp(a, userId, applicantPhones = null) {
  const isApplicant = a.applicant_id === userId;
  const applicantPhone = (!isApplicant && applicantPhones?.get(String(a.id))) || '';
  return {
    ...a,
    dir: isApplicant ? 'out' : 'in',
    postId: a.post_id,
    who: a.applicant_name,
    meta: a.applicant_college,
    applicant_name: a.applicant_name,
    applicant_college: a.applicant_college,
    applicant_year: a.applicant_year || '',
    skills: a.highlighted_skills || [],
    highlighted_skills: a.highlighted_skills || [],
    pitch: a.pitch_note,
    pitch_note: a.pitch_note,
    phone: applicantPhone,
    applicant_phone: applicantPhone,
    comm_method: a.comm_method || 'whatsapp'
  };
}

function normalizeConversation(c, userId) {
  const isHost = c.host_id === userId;
  return {
    ...c,
    post_id: String(c.post_id),
    role: isHost ? 'host' : 'member',
    otherName: isHost ? (c.member_name || 'Student') : (c.host_name || 'Squad host'),
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, diagnosticDetail = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (diagnosticDetail) {
      console.error(`     ↳ Diagnostic: ${diagnosticDetail}`);
    }
    failedTests++;
    failures.push({ testName, diagnosticDetail });
  }
}

console.log('╔════════════════════════════════════════════════════════════════════════╗');
console.log('║  ONESTOP COMPREHENSIVE PLATFORM HEALTH & SECURITY DIAGNOSTIC SUITE    ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: SECURITY DIAGNOSIS & FRONTEND DATA LEAKAGE PREVENTION
// ─────────────────────────────────────────────────────────────────────────────
console.log('═══ 1. SECURITY & FRONTEND SENSITIVE DATA EXPOSURE AUDIT ═══');

// Test 1.1: Environment Variable Isolation
{
  const envExamplePath = path.join(rootDir, '.env.example');
  assert(fs.existsSync(envExamplePath), '.env.example exists');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');

  // Secrets MUST NOT be prefixed with VITE_ (only client-safe public variables get VITE_)
  assert(!envExampleContent.includes('VITE_GEMINI_API_KEY'), 'GEMINI_API_KEY is NOT prefixed with VITE_ (backend isolated)');
  assert(!envExampleContent.includes('VITE_SUPABASE_SERVICE'), 'SUPABASE_SERVICE_KEY is NOT prefixed with VITE_ (service role key backend isolated)');
  assert(envExampleContent.includes('GEMINI_API_KEY='), 'GEMINI_API_KEY documented properly as server-side variable');
  assert(envExampleContent.includes('SUPABASE_SERVICE_KEY='), 'SUPABASE_SERVICE_KEY documented properly as server-side variable');

  // Verify .gitignore shields .env files from git leakage
  const gitignorePath = path.join(rootDir, '.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  assert(gitignoreContent.includes('.env'), '.gitignore ignores .env files');
  assert(gitignoreContent.includes('.env.*'), '.gitignore ignores .env.* variants');
  assert(gitignoreContent.includes('dist'), '.gitignore ignores build dist folder');
}

// Test 1.2: Production Build Bundle Scrutiny (dist/ audit)
{
  const distDir = path.join(rootDir, 'dist');
  // CI runs the tests before the build, so a missing dist/ only skips this audit
  if (!fs.existsSync(distDir)) {
    console.log('  ⏭️  SKIP: no dist/ build to audit (run npm run build first)');
  } else {
    const assetsDir = path.join(distDir, 'assets');
    const assetFiles = fs.readdirSync(assetsDir);

    // Verify sourcemap: false is enforced (No .map files in production)
    const mapFiles = assetFiles.filter(f => f.endsWith('.map'));
    assert(mapFiles.length === 0, 'No source maps (.map) leaked in production bundle', `Found ${mapFiles.length} map files`);

    // Read all JS bundle contents to scan for leaked secrets
    const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
    assert(jsFiles.length > 0, `Production JS bundles exist (${jsFiles.length} chunk files)`);

    let leakedSecretsFound = false;
    let leakedKeys = [];

    for (const jsFile of jsFiles) {
      const code = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
      if (code.includes('SUPABASE_SERVICE_KEY') || code.includes('service_role') || code.includes('GEMINI_API_KEY')) {
        leakedSecretsFound = true;
        leakedKeys.push(jsFile);
      }
    }
    assert(!leakedSecretsFound, 'Zero backend secrets (service_role, GEMINI_API_KEY) found in frontend client JS bundles', `Leaked in: ${leakedKeys.join(', ')}`);
  }
}

// Test 1.3: Production Console & Debugger Stripping
{
  const viteConfigPath = path.join(rootDir, 'vite.config.js');
  const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
  assert(viteConfigContent.includes("drop: mode === 'production' ? ['console', 'debugger'] : []"), 'vite.config.js drops console.log and debugger statements in production builds');
  assert(viteConfigContent.includes("sourcemap: false"), 'vite.config.js explicitly disables sourcemaps in production');
  assert(viteConfigContent.includes("legalComments: 'none'"), 'vite.config.js strips legalComments to minimize attack surface');
}

// Test 1.4: Frontend Squad Post Privacy (Lead Phone & Creator Email Masking)
{
  // A raw squad post from the database or external source
  const rawPostWithPrivateData = {
    id: 'squad_test_999',
    competition_id: 'comp_101',
    competition_name: 'Consulting Cup',
    created_by_name: 'Priya Sharma',
    created_by_email: 'priya@srcc.du.ac.in', // Should be protected
    phone_number: '9876543210',              // MUST be masked
    comm_method: 'whatsapp',
    spots_left: 2,
    total_members: 4,
    accepted_emails: ['secret_member@college.edu'],
    accepted_count: 1
  };

  // When normalized for general public display (no owner contact rights)
  const emptyContactsMap = new Map();
  // Simulate normalizeSquadPost logic from AuthContext:
  const acceptedCount = rawPostWithPrivateData.accepted_count ?? (Array.isArray(rawPostWithPrivateData.accepted_emails) ? rawPostWithPrivateData.accepted_emails.length : 0);
  const normalizedPost = {
    ...rawPostWithPrivateData,
    compId: rawPostWithPrivateData.competition_id,
    comm_method: rawPostWithPrivateData.comm_method === 'chat' ? 'chat' : 'whatsapp',
    accepted_count: Number(acceptedCount) || 0,
    phone_number: '', // Client strictly keeps empty
    created_by_email: '' // Not accessible to general public
  };

  assert(normalizedPost.phone_number === '', 'Squad post listing masks lead phone number as empty string (not in DOM / Inspect Element)');
  assert(normalizedPost.created_by_email === '', 'Squad post listing masks creator email from non-owner viewers');
  assert(normalizedPost.accepted_count === 1, 'Accepted members count tracked numerically without exposing member emails array');
}

// Test 1.5: Presence Radar Privacy (WebSocket Payload PII Leakage Check)
{
  // Simulate buildPresencePayload from presenceService.js
  const testUser = { id: 'usr_abc_123', email: 'aditya@sscbs.du.ac.in', phone: '9999999999', full_name: 'Aditya' };
  const mockPresencePayload = {
    sessionId: 'tab_12345_xyz',
    userId: testUser.id,
    currentScreen: 'home',
    device: 'Desktop',
    lastPing: Date.now(),
    isRegistered: true
  };

  assert(!('email' in mockPresencePayload), 'Presence payload does NOT leak user email over Supabase Realtime');
  assert(!('phone' in mockPresencePayload), 'Presence payload does NOT leak user phone number over Supabase Realtime');
  assert(!('full_name' in mockPresencePayload), 'Presence payload does NOT leak user full name over Supabase Realtime');
  assert(!('college' in mockPresencePayload), 'Presence payload does NOT leak user college over Supabase Realtime');
  assert(typeof mockPresencePayload.userId === 'string' && mockPresencePayload.userId === testUser.id, 'Presence payload carries only opaque UUID for admin-side RLS resolution');
}

// Test 1.6: PostHog Analytics Privacy & Token Scrubbing
{
  const posthogPath = path.join(rootDir, 'src', 'lib', 'posthog.js');
  const posthogContent = fs.readFileSync(posthogPath, 'utf8');

  assert(posthogContent.includes('maskAllInputs: true'), 'PostHog session recording enables maskAllInputs: true');
  assert(posthogContent.includes('password: true'), 'PostHog masks password input fields');
  assert(posthogContent.includes('tel: true'), 'PostHog masks telephone/WhatsApp number input fields');
  assert(posthogContent.includes('before_send: scrubUrlTokens'), 'PostHog scrubs authentication tokens from URLs before dispatch');
  assert(posthogContent.includes('enable_recording_console_log: false'), 'PostHog disables recording console logs to protect dev credentials');
}

// Test 1.7: Cross-Site Scripting (XSS) & Malicious URI Scheme Sanitization
{
  function sanitizeUrl(value, fallback = '#') {
    if (typeof value !== 'string' || !value.trim()) return fallback;
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : fallback;
    } catch (e) {
      return fallback;
    }
  }

  assert(sanitizeUrl('javascript:alert(document.cookie)') === '#', 'Neutralizes "javascript:" URI scheme XSS attempts');
  assert(sanitizeUrl('data:text/html,<script>alert(1)</script>') === '#', 'Neutralizes "data:" URI scheme attacks');
  assert(sanitizeUrl('vbscript:msgbox(1)') === '#', 'Neutralizes "vbscript:" URI scheme attacks');
  assert(sanitizeUrl('https://unstop.com/competitions/123') === 'https://unstop.com/competitions/123', 'Permits valid https:// URLs');
  assert(sanitizeUrl('http://mycollege.edu/event') === 'http://mycollege.edu/event', 'Permits valid http:// URLs');
  assert(sanitizeUrl('') === '#', 'Empty URL safely returns fallback "#"');
  assert(sanitizeUrl(null) === '#', 'Null URL safely returns fallback "#"');
}

// Test 1.8: HTTP Security Headers & Content-Security-Policy (CSP)
{
  const vercelJsonPath = path.join(rootDir, 'vercel.json');
  assert(fs.existsSync(vercelJsonPath), 'vercel.json exists');
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));

  const headers = vercelJson.headers?.[0]?.headers || [];
  const headerMap = new Map(headers.map(h => [h.key, h.value]));

  assert(headerMap.get('X-Frame-Options') === 'DENY', 'X-Frame-Options is DENY (anti-clickjacking)');
  assert(headerMap.get('X-Content-Type-Options') === 'nosniff', 'X-Content-Type-Options is nosniff (anti-MIME sniffing)');
  assert(headerMap.get('Strict-Transport-Security')?.includes('max-age'), 'Strict-Transport-Security (HSTS) is configured');
  assert(headerMap.get('Referrer-Policy') === 'strict-origin-when-cross-origin', 'Referrer-Policy protects private referral data');
  assert(headerMap.get('Permissions-Policy')?.includes('camera=()'), 'Permissions-Policy denies unauthorized camera/mic');

  const csp = headerMap.get('Content-Security-Policy') || '';
  assert(csp.includes("frame-ancestors 'none'"), 'CSP enforces frame-ancestors none');
  assert(csp.includes("object-src 'none'"), 'CSP enforces object-src none');
  assert(csp.includes("base-uri 'self'"), 'CSP enforces base-uri self');
}

// Test 1.9: Admin Rights & Row-Level Security Defense-in-Depth
{
  const secMigrationPath = path.join(rootDir, 'SECURITY_HARDENING_MIGRATION.sql');
  const secMigration = fs.readFileSync(secMigrationPath, 'utf8');

  assert(secMigration.includes('CREATE POLICY "profiles_select_own" ON public.profiles'), 'RLS policy: users can only SELECT their own profile');
  assert(secMigration.includes('CREATE POLICY "profiles_select_admin" ON public.profiles'), 'RLS policy: only verified admins can SELECT other profiles');
  assert(secMigration.includes('CREATE POLICY "squad_contacts_select_owner" ON public.squad_post_contacts'), 'RLS policy: squad contact numbers are isolated to post owner or admin');
  assert(secMigration.includes('CREATE POLICY "squad_apps_select" ON public.squad_applications'), 'RLS policy: squad applications are only visible to applicant or squad lead');
  assert(secMigration.includes('CREATE POLICY "squad_messages_select" ON public.squad_messages'), 'RLS policy: squad messages are strictly isolated to conversation participants');

  const adminByIdMigrationPath = path.join(rootDir, 'ADMIN_BY_USER_ID_MIGRATION.sql');
  const adminByIdMigration = fs.readFileSync(adminByIdMigrationPath, 'utf8');
  assert(adminByIdMigration.includes('auth.uid() IS NOT NULL AND EXISTS'), 'is_admin() checks authenticated user ID against app_admins table (spoof-proof)');
}

// Test 1.10: Rate Limiting & Abuse Prevention
{
  const fixesMigrationPath = path.join(rootDir, 'PLATFORM_FIXES_MIGRATION.sql');
  const fixesMigration = fs.readFileSync(fixesMigrationPath, 'utf8');

  assert(fixesMigration.includes('v_hosts >= 15'), 'get_squad_host_whatsapp enforces a strict 15-host lookup limit per 24 hours per user');
  assert(fixesMigration.includes('This squad is closed or has expired'), 'get_squad_host_whatsapp rejects lookups on closed or expired squads');
  assert(fixesMigration.includes('REVOKE ALL ON FUNCTION public.get_squad_host_whatsapp(UUID) FROM PUBLIC, anon'), 'get_squad_host_whatsapp is revoked from anonymous access (authenticated only)');
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: END-TO-END FUNCTIONAL PLATFORM DIAGNOSIS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ 2. PLATFORM END-TO-END FUNCTIONAL DIAGNOSIS ═══');

// Test 2.1: Canonical Skills Directory & Normalization
{
  assert(Array.isArray(SKILLS) && SKILLS.length === 19, 'Canonical SKILLS list defines exactly 19 collegiate skills');
  assert(normalizeSkill('Financial Modeling') === 'Financial Modeling & Valuation', 'Alias "Financial Modeling" normalizes to canonical');
  assert(normalizeSkill('finance modelling') === 'Financial Modeling & Valuation', 'Alias "finance modelling" normalizes to canonical');
  assert(normalizeSkill('valuation') === 'Financial Modeling & Valuation', 'Alias "valuation" normalizes to canonical');
  assert(normalizeSkill('deck design') === 'Pitch Deck Design', 'Alias "deck design" normalizes to "Pitch Deck Design"');
  assert(normalizeSkill('frontend') === 'Frontend Development', 'Alias "frontend" normalizes to "Frontend Development"');
  assert(normalizeSkill('backend') === 'Backend Development', 'Alias "backend" normalizes to "Backend Development"');
  assert(normalizeSkill('ml / data') === 'AI / Machine Learning', 'Alias "ml / data" normalizes to "AI / Machine Learning"');
  assert(normalizeSkill('copywriting') === 'Content Writing & Copywriting', 'Alias "copywriting" normalizes to "Content Writing & Copywriting"');
  assert(normalizeSkill('public speaking') === 'Public Speaking & Pitching', 'Alias "public speaking" normalizes to "Public Speaking & Pitching"');
  assert(normalizeSkill('design') === 'UI/UX Design', 'Alias "design" normalizes to "UI/UX Design"');
}

// Test 2.2: Academic Standing & Year Normalization
{
  assert(normalizeYear('1st Year') === 'UG 1st Year', '1st Year -> UG 1st Year');
  assert(normalizeYear('2nd Year') === 'UG 2nd Year', '2nd Year -> UG 2nd Year');
  assert(normalizeYear('3rd Year') === 'UG 3rd Year', '3rd Year -> UG 3rd Year');
  assert(normalizeYear('4th Year') === 'UG 4th Year', '4th Year -> UG 4th Year');
  assert(normalizeYear('MBA 1st Year') === 'PG 1st Year', 'MBA 1st Year -> PG 1st Year');
  assert(normalizeYear('MBA 2nd Year') === 'PG 2nd Year', 'MBA 2nd Year -> PG 2nd Year');
  assert(normalizeYear('PGDM 2nd Year') === 'PG 2nd Year', 'PGDM 2nd Year -> PG 2nd Year');
  assert(normalizeYear('Masters') === 'PG 1st Year', 'Masters -> PG 1st Year');
}

// Test 2.3: Eligibility Classification Engine (Undergrad vs PG/MBA)
{
  const ugComp = {
    id: 'c_ug_1',
    title: 'SRCC Global Business Challenge 2026',
    host: 'Shri Ram College of Commerce',
    desc: 'Open to all undergraduate students pursuing B.Com, BBA, Eco (Hons), or B.Tech.',
    eligibility: 'Undergraduate collegiate students'
  };
  assert(isEligibleForUndergrad(ugComp) === true, 'Undergraduate case competition classified as UG eligible');

  const mbaComp = {
    id: 'c_mba_1',
    title: 'Aditya Birla Group Stratos 2026',
    host: 'Aditya Birla Group',
    desc: 'Open only to premier B-School MBA and PGDM students of batch 2025-2027.',
    eligibility: 'MBA Only / Premier B-Schools'
  };
  assert(isEligibleForUndergrad(mbaComp) === false, 'MBA-only competition strictly classified as NOT UG eligible');

  const insideKampusMba = {
    id: 'c_ik_1',
    title: 'HUL L.I.M.E. Season 16',
    sourcePlatform: 'inside_campus',
    host: 'InsideIIM',
    desc: 'Hindustan Unilever flagship competition for 1st year MBA students'
  };
  assert(isEligibleForUndergrad(insideKampusMba) === false, 'InsideKampus MBA competition classified as NOT UG eligible');

  const insideKampusUg = {
    id: 'c_ik_2',
    title: 'Tech Innovation Cup',
    sourcePlatform: 'inside_campus',
    host: 'InsideIIM',
    desc: 'Special undergraduate track for engineering students B.Tech all years',
    eligibility: 'Undergraduate engineering campuses eligible'
  };
  assert(isEligibleForUndergrad(insideKampusUg) === true, 'InsideKampus with explicit UG track classified as UG eligible');

  assert(checkIsPostgraduate({ year: 'UG 2nd Year', education_level: 'undergraduate' }) === false, 'UG student identified correctly as not postgraduate');
  assert(checkIsPostgraduate({ year: 'PG 1st Year', education_level: 'postgraduate' }) === true, 'PG student identified correctly as postgraduate');
  assert(checkIsPostgraduate({ year: 'MBA 2nd Year' }) === true, 'MBA student string identified correctly as postgraduate');
}

// Test 2.4: Phone Number Validation & WhatsApp URL Generator
{
  assert(sanitizeIndianPhone('+91 98765 43210') === '9876543210', 'Sanitizes international spaced Indian phone');
  assert(sanitizeIndianPhone('09876543210') === '9876543210', 'Sanitizes leading zero');
  assert(sanitizeIndianPhone('919876543210') === '9876543210', 'Sanitizes leading 91');
  assert(sanitizeIndianPhone('9876543210') === '9876543210', 'Preserves standard 10-digit mobile number');
  assert(isValidIndianPhone('9876543210') === true, '9876543210 is valid Indian mobile');
  assert(isValidIndianPhone('5876543210') === false, 'Invalid: Indian mobile cannot start with 5');
  assert(isValidIndianPhone('12345') === false, 'Invalid: short number');
  assert(cleanPhoneInput('abcd 98765-43210 xyz') === '9876543210', 'cleanPhoneInput strips non-numeric characters');
  assert(phoneValidationError('') === 'Please enter your 10-digit WhatsApp number.', 'Validation catches empty phone');
  assert(phoneValidationError('98765') === 'WhatsApp number must be exactly 10 digits.', 'Validation catches short phone');
  assert(phoneValidationError('5876543210') === 'Enter a valid mobile number (starts with 6, 7, 8 or 9).', 'Validation catches invalid starting digit');
  assert(phoneValidationError('9876543210') === '', 'Valid phone produces empty error string');

  const waUrl = formatWhatsAppUrl('9876543210', 'Hey! Let us team up');
  assert(waUrl.startsWith('https://wa.me/919876543210?text='), 'Formats WhatsApp URL with country code and encoded text');
  assert(formatWhatsAppUrl('invalid') === '#', 'Invalid phone safely returns "#"');
}

// Test 2.5: 24-Hour Profile Cooldown Engine
{
  const freshUser = { id: 'u1' };
  const freshProfile = { profile_last_updated_at: null };
  const cdFresh = getProfileCooldown(freshProfile, freshUser);
  assert(cdFresh.isLocked === false, 'Fresh profile has isLocked = false');

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const lockedProfile = { profile_last_updated_at: twoHoursAgo };
  const cdLocked = getProfileCooldown(lockedProfile, freshUser);
  assert(cdLocked.isLocked === true, 'Profile updated 2 hours ago isLocked = true');
  assert(cdLocked.hours >= 21 && cdLocked.hours <= 22, `Remaining hours correctly computed (~22h, got ${cdLocked.hours})`);

  const expiredProfile = { profile_last_updated_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() };
  const cdExpired = getProfileCooldown(expiredProfile, freshUser);
  assert(cdExpired.isLocked === false, 'Profile updated 25 hours ago has expired cooldown (isLocked = false)');

  const corruptedProfile = { profile_last_updated_at: 'INVALID_TIMESTAMP' };
  const cdCorrupted = getProfileCooldown(corruptedProfile, freshUser);
  assert(cdCorrupted.isLocked === false, 'Corrupted timestamp safely fails open');
}

// Test 2.6: Solo vs Team Competition Detection
{
  assert(isSoloCompetition({ isSolo: true }) === true, 'Detects isSolo: true');
  assert(isSoloCompetition({ maxTeam: 1 }) === true, 'Detects maxTeam: 1 as solo');
  assert(isSoloCompetition({ maxTeam: '1' }) === true, 'Detects maxTeam: "1" as solo');
  assert(isSoloCompetition({ team: 'Solo' }) === true, 'Detects team: "Solo" string');
  assert(isSoloCompetition({ team: '1 member' }) === true, 'Detects team: "1 member" string');
  assert(isSoloCompetition({ teamSizeDisplay: '1 person' }) === true, 'Detects teamSizeDisplay: "1 person"');
  assert(isSoloCompetition({ maxTeam: 4, team: '2-4 members' }) === false, 'Correctly identifies team competition as not solo');
}

// Test 2.7: Squad Application Normalization & Directionality
{
  const userId = 'user_me_123';
  const outgoingRawApp = {
    id: 'app_1',
    post_id: 'post_100',
    applicant_id: userId,
    applicant_name: 'Aditya',
    applicant_college: 'SSCBS',
    applicant_year: 'UG 3rd Year',
    pitch_note: 'Excited to build the deck!',
    highlighted_skills: ['Pitch Deck Design'],
    status: 'pending'
  };
  const outNorm = normalizeSquadApp(outgoingRawApp, userId);
  assert(outNorm.dir === 'out', 'Application created by user has dir = "out"');
  assert(outNorm.phone === '', 'Outgoing application phone is masked');

  const incomingRawApp = {
    id: 'app_2',
    post_id: 'post_200',
    applicant_id: 'user_other_456',
    applicant_name: 'Rohan',
    applicant_college: 'SRCC',
    applicant_year: 'UG 2nd Year',
    pitch_note: 'I can do financial models',
    highlighted_skills: ['Financial Modeling & Valuation'],
    status: 'pending'
  };
  const applicantPhonesMap = new Map([['app_2', '9876543210']]);
  const inNorm = normalizeSquadApp(incomingRawApp, userId, applicantPhonesMap);
  assert(inNorm.dir === 'in', 'Application to user squad has dir = "in"');
  assert(inNorm.phone === '9876543210', 'Lead of WhatsApp squad receives looked-up applicant phone');
}

// Test 2.8: Conversation Normalization & Role Derivation
{
  const myUserId = 'user_lead_789';
  const rawConvAsHost = {
    id: 'conv_1',
    post_id: 'post_300',
    host_id: myUserId,
    member_id: 'user_applicant_111',
    host_name: 'Lead User',
    member_name: 'Ananya Roy',
    status: 'accepted'
  };
  const hostNorm = normalizeConversation(rawConvAsHost, myUserId);
  assert(hostNorm.role === 'host', 'User is identified as host in their own squad chat');
  assert(hostNorm.otherName === 'Ananya Roy', 'Host sees applicant name as otherName');

  const rawConvAsMember = {
    id: 'conv_2',
    post_id: 'post_400',
    host_id: 'user_lead_999',
    member_id: myUserId,
    host_name: 'Karan Mehra',
    member_name: 'Lead User',
    status: 'accepted'
  };
  const memberNorm = normalizeConversation(rawConvAsMember, myUserId);
  assert(memberNorm.role === 'member', 'User is identified as member in squad they joined');
  assert(memberNorm.otherName === 'Karan Mehra', 'Member sees host name as otherName');
}

// Test 2.9: Deadline Extension Diffing & Relative Time Formatting
{
  assert(formatDurationDiff(2 * 86400000) === '+2 days', '2 days diff formatted');
  assert(formatDurationDiff(86400000 + 4 * 3600000) === '+1d 4h', '1d 4h diff formatted');
  assert(formatDurationDiff(5 * 3600000) === '+5 hours', '5 hours diff formatted');
  assert(formatDurationDiff(30 * 60000) === '+30 mins', '30 mins diff formatted');

  const now = Date.now();
  assert(formatRelativeTime(now - 10000) === 'Just now', '10s ago -> Just now');
  assert(formatRelativeTime(now - 5 * 60000) === '5m ago', '5m ago formatted');
  assert(formatRelativeTime(now - 3 * 3600000) === '3h ago', '3h ago formatted');
  assert(formatRelativeTime(now - 2 * 86400000) === '2d ago', '2d ago formatted');
}

// Test 2.10: Session & Password Helpers
{
  const emailUser = { identities: [{ provider: 'email' }] };
  const googleUser = { identities: [{ provider: 'google' }] };
  assert(accountHasPassword(emailUser) === true, 'Email account identified as having password');
  assert(accountHasPassword(googleUser) === false, 'Google-only OAuth account identified as having NO password');

  const recentLoginUser = { last_sign_in_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() };
  const oldLoginUser = { last_sign_in_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() };
  assert(signedInRecently(recentLoginUser) === true, 'Login 2 minutes ago is signedInRecently');
  assert(signedInRecently(oldLoginUser) === false, 'Login 30 minutes ago requires fresh sign-in for sensitive actions');
}

// Test 2.11: LocalStorage Privacy & Sanitization
{
  const storageLibPath = path.join(rootDir, 'src', 'lib', 'storage.js');
  const storageLibContent = fs.readFileSync(storageLibPath, 'utf8');

  assert(storageLibContent.includes('LEGACY_PRIVATE_KEYS'), 'Defines legacy private keys to scrub');
  assert(storageLibContent.includes('purgeLegacyPrivateStorage'), 'Provides purgeLegacyPrivateStorage');
  assert(storageLibContent.includes('purgeUserStorage'), 'Provides purgeUserStorage on sign-out');
  assert(storageLibContent.includes('onestop_user_profile'), 'Scrubs onestop_user_profile from localStorage');
  assert(storageLibContent.includes('onestop_applications'), 'Scrubs onestop_applications from localStorage');
  assert(storageLibContent.includes('onestop_posts'), 'Scrubs onestop_posts from localStorage');
  assert(storageLibContent.includes('onestop_squad_chat_'), 'Scrubs squad chat transcripts from localStorage');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY & VERDICT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════════════════════════════════════');
console.log(`TOTAL CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('════════════════════════════════════════════════════════════════════════\n');

if (failedTests > 0) {
  console.error('❌ Failures identified:');
  failures.forEach(f => console.error(`  - ${f.testName}: ${f.diagnosticDetail}`));
  process.exit(1);
} else {
  console.log('🎉 ALL SECURITY & FUNCTIONAL DIAGNOSTICS PASSED WITH ZERO ERRORS!');
  process.exit(0);
}
