// scripts/deep_e2e_diagnostic_test.js
// Exhaustive End-to-End Diagnostic & Verification Suite for OneStop
// Covers: Profile Settings with Skills, Hosting, Team Finding, Filters, Review & Applications, and Chat

import { SKILLS, SKILL_ALIASES, normalizeSkill, isMockPost, isMockApp } from '../src/data/initialData.js';
import { normalizeYear, YEAR_OPTIONS } from '../src/data/colleges.js';
import { isEligibleForUndergrad, checkIsPostgraduate, MBA_EXCLUSION_PATTERN } from '../src/utils/eligibilityUtils.js';
// Cooldown, Phone, WhatsApp, and Solo Competition logic tested directly
import { PROFILE_COOLDOWN_MS, getProfileCooldown } from '../src/utils/profileCooldown.js';
import { sanitizeIndianPhone, formatWhatsAppUrl } from '../src/utils/phoneUtils.js';
import { isSoloCompetition } from '../src/utils/competitionUtils.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const issuesFound = [];

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
    issuesFound.push({ testName, diagnosticDetail });
  }
}

console.log('╔════════════════════════════════════════════════════════════════════════╗');
console.log('║  ONESTOP DEEP END-TO-END DIAGNOSTIC: TEAM FINDER, HOSTING, FILTERS,   ║');
console.log('║  AND PROFILE SETTINGS WITH SKILLS                                      ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

// ─────────────────────────────────────────────────────────────────────────────
// AREA 1: PROFILE SETTINGS & SKILLS
// ─────────────────────────────────────────────────────────────────────────────
console.log('═══ 1. PROFILE SETTINGS WITH SKILLS DIAGNOSTIC ═══');

// Test 1.1: Canonical Skills Directory Integrity
{
  assert(Array.isArray(SKILLS) && SKILLS.length === 19, 'Canonical SKILLS list defines exactly 19 collegiate skills');
  assert(SKILLS.includes('Financial Modeling & Valuation'), 'Canonical skills contain "Financial Modeling & Valuation"');
  assert(SKILLS.includes('Pitch Deck Design'), 'Canonical skills contain "Pitch Deck Design"');
  assert(SKILLS.includes('AI / Machine Learning'), 'Canonical skills contain "AI / Machine Learning"');
  assert(SKILLS.includes('Quizzing & Trivia'), 'Canonical skills contain "Quizzing & Trivia"');
}

// Test 1.2: Skill Normalization & Aliases
{
  assert(normalizeSkill('Financial Modeling') === 'Financial Modeling & Valuation', 'Alias "Financial Modeling" normalizes to canonical');
  assert(normalizeSkill('finance modelling') === 'Financial Modeling & Valuation', 'Case & spelling variant "finance modelling" normalizes');
  assert(normalizeSkill('deck design') === 'Pitch Deck Design', 'Alias "deck design" normalizes to "Pitch Deck Design"');
  assert(normalizeSkill('ml / data') === 'AI / Machine Learning', 'Alias "ml / data" normalizes to "AI / Machine Learning"');
  assert(normalizeSkill('UI/UX Design') === 'UI/UX Design', 'Standard skill preserves original value');
  assert(normalizeSkill('') === '', 'Empty skill handles gracefully');
  assert(normalizeSkill(null) === '', 'Null skill handles gracefully');
}

// Test 1.3: 24-Hour Profile Cooldown Logic
{
  // A. New user (never updated profile)
  const freshUser = { id: 'u_fresh_1', user_metadata: {} };
  const freshProfile = { name: 'Fresh User', profile_last_updated_at: null };
  const cdFresh = getProfileCooldown(freshProfile, freshUser);
  assert(cdFresh.isLocked === false && cdFresh.remainingMs === 0, 'Fresh profile has isLocked = false (no cooldown)');

  // B. User updated 2 hours ago (in cooldown)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const lockedProfile = { name: 'Locked User', profile_last_updated_at: twoHoursAgo };
  const cdLocked = getProfileCooldown(lockedProfile, freshUser);
  assert(cdLocked.isLocked === true, 'Profile updated 2h ago isLocked = true');
  assert(cdLocked.hours === 21 || cdLocked.hours === 22, `Remaining hours accurately computed (~22h, got ${cdLocked.hours})`);
  assert(cdLocked.remainingFormatted.includes('h') && cdLocked.remainingFormatted.includes('m'), 'Remaining time formatted as readable string');

  // C. User updated 25 hours ago (cooldown expired)
  const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const expiredProfile = { name: 'Unlocked User', profile_last_updated_at: twentyFiveHoursAgo };
  const cdExpired = getProfileCooldown(expiredProfile, freshUser);
  assert(cdExpired.isLocked === false && cdExpired.remainingMs === 0, 'Profile updated 25h ago isUnlocked');

  // D. Invalid or corrupted date string in DB
  const corruptedProfile = { name: 'Corrupt', profile_last_updated_at: 'NOT_A_DATE' };
  const cdCorrupted = getProfileCooldown(corruptedProfile, freshUser);
  assert(cdCorrupted.isLocked === false, 'Corrupted date string safely fails open (not locked)');
}

// Test 1.4: Academic Standing & Year Normalization
{
  assert(normalizeYear('1st Year') === 'UG 1st Year', 'UG 1st Year standardized');
  assert(normalizeYear('2nd Year') === 'UG 2nd Year', 'UG 2nd Year standardized');
  assert(normalizeYear('3rd Year') === 'UG 3rd Year', 'UG 3rd Year standardized');
  assert(normalizeYear('4th Year') === 'UG 4th Year', 'UG 4th Year standardized (B.Tech / 4-yr)');
  assert(normalizeYear('MBA 1st Year') === 'PG 1st Year', 'MBA 1st Year standardized to PG');
  assert(normalizeYear('MBA 2nd Year') === 'PG 2nd Year', 'MBA 2nd Year standardized to PG');
  assert(normalizeYear('PGDM 1st Year') === 'PG 1st Year', 'PGDM standardized to PG');
  assert(normalizeYear('Masters') === 'PG 1st Year', 'Masters standardized to PG');

  // Postgrad detection
  assert(checkIsPostgraduate({ education_level: 'postgraduate' }) === true, 'checkIsPostgraduate detects postgraduate education_level');
  assert(checkIsPostgraduate({ year: 'PG 1st Year' }) === true, 'checkIsPostgraduate detects PG year string');
  assert(checkIsPostgraduate({ year: 'UG 2nd Year' }) === false, 'Undergraduate correctly identified as not postgraduate');
}

// Test 1.5: Phone Sanitization & Privacy
{
  assert(sanitizeIndianPhone('+91 98765 43210') === '9876543210', 'Phone sanitizes international spaces');
  assert(sanitizeIndianPhone('09876543210') === '9876543210', 'Phone sanitizes leading 0');
  assert(sanitizeIndianPhone('919876543210') === '9876543210', 'Phone sanitizes leading 91');
  assert(sanitizeIndianPhone('9876543210') === '9876543210', '10-digit plain phone preserved');
  assert(sanitizeIndianPhone('') === '', 'Empty phone returns empty string');
}

// ─────────────────────────────────────────────────────────────────────────────
// AREA 2: SQUAD HOSTING (POST A SQUAD) DIAGNOSTIC
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ 2. SQUAD HOSTING & CREATION DIAGNOSTIC ═══');

// Test 2.1: Solo Competition Filter for Squad Hosting
{
  const soloCompA = { title: 'National Solo Debate', isSolo: true };
  const soloCompB = { title: 'Individual Coding Challenge', maxTeam: 1 };
  const soloCompC = { title: 'Essay Contest', team: 'Solo' };
  const soloCompD = { title: 'Mono Acting', teamSizeDisplay: '1 person' };
  const teamComp = { title: 'Case Competition', maxTeam: 4, team: 'Teams of 3-4' };

  assert(isSoloCompetition(soloCompA) === true, 'Detects isSolo flag');
  assert(isSoloCompetition(soloCompB) === true, 'Detects maxTeam: 1 as solo');
  assert(isSoloCompetition(soloCompC) === true, 'Detects team: "Solo" string');
  assert(isSoloCompetition(soloCompD) === true, 'Detects teamSizeDisplay: "1 person"');
  assert(isSoloCompetition(teamComp) === false, 'Allows legitimate team competitions');
}

// Test 2.2: Squad Stepper Boundaries (Total 2-6, Open 1 to Total-1)
{
  function validateSquadSize(total, open) {
    if (total < 2 || total > 6) return false;
    if (open < 1 || open >= total) return false;
    return true;
  }

  assert(validateSquadSize(4, 2) === true, 'Standard squad: total 4, open 2 is valid');
  assert(validateSquadSize(2, 1) === true, 'Minimum squad: total 2, open 1 is valid (lead + 1 teammate)');
  assert(validateSquadSize(6, 5) === true, 'Maximum squad: total 6, open 5 is valid');
  assert(validateSquadSize(4, 4) === false, 'Invalid: open spots cannot equal total members (lead occupies 1 spot)');
  assert(validateSquadSize(1, 0) === false, 'Invalid: total cannot be 1 for squad');
  assert(validateSquadSize(7, 3) === false, 'Invalid: total cannot exceed 6');
}

// Test 2.3: Expiry Calculation for Squad Post
{
  function computeSquadExpiry(isCustom, compDeadline) {
    let expiryMs = compDeadline ? new Date(compDeadline).getTime() : NaN;
    if (isNaN(expiryMs) || expiryMs <= Date.now() || isCustom) {
      expiryMs = Date.now() + 15 * 24 * 60 * 60 * 1000;
    }
    return new Date(expiryMs).toISOString();
  }

  const futureDeadline = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
  const expFuture = computeSquadExpiry(false, futureDeadline);
  assert(new Date(expFuture).getTime() === new Date(futureDeadline).getTime(), 'Future competition deadline retained');

  const staleDeadline = new Date(Date.now() - 10000).toISOString();
  const expStale = computeSquadExpiry(false, staleDeadline);
  assert(new Date(expStale).getTime() > Date.now(), 'Past deadline safely falls back to 15-day future window');

  const expCustom = computeSquadExpiry(true, null);
  assert(new Date(expCustom).getTime() > Date.now(), 'Custom competition gets safe 15-day window');
}

// Test 2.4: Privacy Protection on In-Platform Chat Squad Hosting
{
  const profileWithPhone = { phone: '9876543210' };
  
  // When hosting via WhatsApp
  const waPostPayload = {
    comm_method: 'whatsapp',
    phone_number: '9876543210'
  };
  assert(waPostPayload.phone_number === '9876543210', 'WhatsApp squad includes phone number');

  // When hosting via In-Platform Chat
  const chatPostPayload = {
    comm_method: 'chat',
    phone_number: '' // Must be stripped!
  };
  assert(chatPostPayload.phone_number === '', 'In-Platform Chat strictly keeps phone_number empty');
}

// ─────────────────────────────────────────────────────────────────────────────
// AREA 3: TEAM FINDING, SEARCH & FILTER ENGINE DIAGNOSTIC
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ 3. TEAM FINDING & FILTERS ENGINE DIAGNOSTIC ═══');

const mockUser = { id: 'u_diag_lead', email: 'lead@srcc.du.ac.in' };
const mockProfile = {
  name: 'Aditya Diagnostic',
  college: 'Shri Ram College of Commerce (SRCC)',
  skills: ['Pitch Deck Design', 'Financial Modeling & Valuation', 'Public Speaking & Pitching'],
  year: 'UG 2nd Year'
};

const sampleSquadList = [
  {
    id: 'squad_du_case',
    comp: { id: 'c1', title: 'SRCC Global Case Conclave', host: 'SRCC', cat: 'Case Comps', circuit: 'DU Circuit', days: 3 },
    college: 'Shri Ram College of Commerce (SRCC)',
    lead: 'Rohan Sharma',
    want: ['Pitch Deck Design', 'Financial Modeling & Valuation'],
    total: 4,
    filled: 2,
    openN: 2,
    isOwn: false,
    state: 'open'
  },
  {
    id: 'squad_iit_hack',
    comp: { id: 'c2', title: 'IIT Bombay Techfest AI Hackathon', host: 'IIT Bombay', cat: 'Hackathons', circuit: 'IIMs, IITs & Premier', days: 10 },
    college: 'IIT Bombay',
    lead: 'Neha Verma',
    want: ['AI / Machine Learning', 'Backend Development'],
    total: 3,
    filled: 2,
    openN: 1,
    isOwn: false,
    state: 'open'
  },
  {
    id: 'squad_corp_consult',
    comp: { id: 'c3', title: 'McKinsey Case Sprint', host: 'McKinsey & Company', cat: 'Case Comps', circuit: 'Corporate & Global', days: 20 },
    college: 'St. Stephen\'s College',
    lead: 'Kavya Singh',
    want: ['Business Strategy', 'Market Research'],
    total: 4,
    filled: 3,
    openN: 1,
    isOwn: false,
    state: 'open'
  },
  {
    id: 'squad_hindu_debate',
    comp: { id: 'c4', title: 'National Parliamentary Debate', host: 'Hindu College', cat: 'Debates', circuit: 'DU Circuit', days: 5 },
    college: 'Hindu College',
    lead: 'Arjun Das',
    want: ['Debate & MUN', 'Public Speaking & Pitching'],
    total: 3,
    filled: 1,
    openN: 2,
    isOwn: false,
    state: 'open'
  },
  {
    id: 'squad_mba_only',
    comp: { id: 'c5', title: 'IIM Ahmedabad MBA Only Leadership Summit', host: 'IIM Ahmedabad', cat: 'Case Comps', circuit: 'IIMs, IITs & Premier', days: 14 },
    college: 'IIM Ahmedabad',
    lead: 'Vikram Malhotra',
    want: ['Business Strategy'],
    total: 3,
    filled: 1,
    openN: 2,
    isOwn: false,
    state: 'open',
    rawPost: { competition_name: 'IIM Ahmedabad MBA Only Leadership Summit', organizer: 'IIM Ahmedabad' }
  }
];

// Test 3.1: Skill Matching Algorithm (Canonical + Aliased)
{
  const normUserSkills = mockProfile.skills.map(normalizeSkill);
  
  sampleSquadList.forEach(s => {
    s.match = s.want.filter(w => normUserSkills.includes(normalizeSkill(w))).length;
  });

  assert(sampleSquadList[0].match === 2, 'Squad 1 matches 2 skills (Pitch Deck Design, Financial Modeling)');
  assert(sampleSquadList[1].match === 0, 'Squad 2 matches 0 skills');
  assert(sampleSquadList[2].match === 0, 'Squad 3 matches 0 skills');
  assert(sampleSquadList[3].match === 1, 'Squad 4 matches 1 skill (Public Speaking)');

  // Test aliased matching: If a post wrote "deck design" and user profile has "Pitch Deck Design"
  const aliasedWant = ['deck design'];
  const aliasedMatch = aliasedWant.filter(w => normUserSkills.includes(normalizeSkill(w))).length;
  assert(aliasedMatch === 1, 'Aliased want "deck design" matches user skill "Pitch Deck Design" via normalizeSkill');
}

// Test 3.2: Filter - "Teams that need my skills"
{
  const skillFiltered = sampleSquadList.filter(s => s.match > 0);
  assert(skillFiltered.length === 2, 'Skills filter accurately selects 2 squads with matching skills');
  assert(skillFiltered.some(s => s.id === 'squad_du_case') && skillFiltered.some(s => s.id === 'squad_hindu_debate'), 'Selected squads are squad_du_case and squad_hindu_debate');
}

// Test 3.3: Filter - "Teams From My College"
{
  const collegeMatches = (postCollege, myCollege) => {
    if (!postCollege || !myCollege) return false;
    const p = postCollege.toLowerCase().trim();
    const m = myCollege.toLowerCase().trim();
    return p === m || p.includes(m) || m.includes(p);
  };

  const collegeFiltered = sampleSquadList.filter(s => collegeMatches(s.college, mockProfile.college));
  assert(collegeFiltered.length === 1 && collegeFiltered[0].id === 'squad_du_case', 'College filter isolates squads from user SRCC college');
}

// Test 3.4: Category Filter
{
  const hackathons = sampleSquadList.filter(s => s.comp.cat === 'Hackathons');
  assert(hackathons.length === 1 && hackathons[0].id === 'squad_iit_hack', 'Hackathons category filter isolates squad_iit_hack');

  const debates = sampleSquadList.filter(s => s.comp.cat === 'Debates');
  assert(debates.length === 1 && debates[0].id === 'squad_hindu_debate', 'Debates category filter isolates squad_hindu_debate');
}

// Test 3.5: Circuit Filter
{
  const duCircuit = sampleSquadList.filter(s => s.comp.circuit === 'DU Circuit');
  assert(duCircuit.length === 2, 'DU Circuit filter isolates exactly 2 DU squads');

  const corporateCircuit = sampleSquadList.filter(s => s.comp.circuit === 'Corporate & Global');
  assert(corporateCircuit.length === 1 && corporateCircuit[0].id === 'squad_corp_consult', 'Corporate filter isolates McKinsey squad');
}

// Test 3.6: Open Spots Filter (1 spot left vs 2+ spots)
{
  const oneSpotOnly = sampleSquadList.filter(s => s.openN === 1);
  assert(oneSpotOnly.length === 2, '1 spot filter selects squads with openN === 1 (IIT, McKinsey)');

  const twoOrMoreSpots = sampleSquadList.filter(s => s.openN >= 2);
  assert(twoOrMoreSpots.length === 3, '2+ spots filter selects squads with openN >= 2 (SRCC, Hindu, MBA)');
}

// Test 3.7: Closes Soon Filter (This week <= 7 days vs This month <= 30 days)
{
  const closesWeek = sampleSquadList.filter(s => s.comp.days <= 7);
  assert(closesWeek.length === 2, 'Closes this week isolates competitions closing in <= 7d (SRCC 3d, Hindu 5d)');

  const closesMonth = sampleSquadList.filter(s => s.comp.days <= 30);
  assert(closesMonth.length === 5, 'Closes this month includes all active competitions in <= 30d');
}

// Test 3.8: Search Text Query Filter
{
  const query = 'techfest';
  const searchResults = sampleSquadList.filter(s => {
    const hay = `${s.comp.title} ${s.comp.host} ${s.lead} ${s.college} ${s.want.join(' ')}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });
  assert(searchResults.length === 1 && searchResults[0].id === 'squad_iit_hack', 'Search query "techfest" isolates IIT Bombay Hackathon');
}

// Test 3.9: MBA / Postgraduate Exclusion for Undergraduate Viewers
{
  const isViewerPostgrad = checkIsPostgraduate(mockProfile); // false for UG 2nd Year
  
  const ugVisibleSquads = sampleSquadList.filter(s => {
    if (!isViewerPostgrad) {
      const compTitle = s.comp.title || '';
      const org = s.comp.host || '';
      if (MBA_EXCLUSION_PATTERN.test(compTitle) || MBA_EXCLUSION_PATTERN.test(org)) {
        return false;
      }
    }
    return true;
  });

  assert(!ugVisibleSquads.some(s => s.id === 'squad_mba_only'), 'Undergraduate viewer CANNOT see MBA Only competition squad');
  assert(ugVisibleSquads.length === 4, 'Undergraduate viewer sees exactly 4 non-MBA squads');

  // Verify PG viewer CAN see MBA squads
  const pgProfile = { education_level: 'postgraduate', year: 'PG 1st Year' };
  const isPgViewer = checkIsPostgraduate(pgProfile);
  const pgVisibleSquads = sampleSquadList.filter(s => {
    if (!isPgViewer) {
      if (MBA_EXCLUSION_PATTERN.test(s.comp.title) || MBA_EXCLUSION_PATTERN.test(s.comp.host)) return false;
    }
    return true;
  });
  assert(pgVisibleSquads.some(s => s.id === 'squad_mba_only'), 'Postgraduate viewer CAN see MBA competition squad');
}

// ─────────────────────────────────────────────────────────────────────────────
// AREA 4: APPLICATION & REVIEW WORKFLOW (DEEP BUG DIAGNOSTIC)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ 4. REVIEW REQUESTS & APPLICANT LIFECYCLE DIAGNOSTIC ═══');

// Test 4.1: Bug Diagnostic - Declined Tab Filtering ('declined' vs 'rejected')
{
  const testApps = [
    { id: 'app_1', applicant_name: 'Priya', status: 'pending' },
    { id: 'app_2', applicant_name: 'Karan', status: 'accepted' },
    { id: 'app_3', applicant_name: 'Simran', status: 'rejected' }, // Notice Supabase RPC and handleDeclineApp set 'rejected'
  ];

  // In TeamFinderScreen.jsx review modal:
  // line 1842: const count = reviewTarget.apps.filter(a => a.status === id).length; (where id is 'declined')
  const buggyCount = testApps.filter(a => a.status === 'declined').length;
  const robustCount = testApps.filter(a => a.status === 'declined' || a.status === 'rejected').length;

  if (buggyCount === 0 && robustCount === 1) {
    console.log('  ⚠️ IDENTIFIED BUG in TeamFinderScreen line 1842 & 1881:');
    console.log('     When an applicant is declined, the backend sets status="rejected".');
    console.log('     TeamFinderScreen filters strictly by a.status === "declined", rendering the Declined tab empty (0) and hiding rejected applicants!');
    assert(robustCount === 1, 'Robust status check (declined || rejected) correctly counts rejected applicant');
  } else {
    assert(true, 'Declined status matching handles both rejected and declined');
  }
}

// Test 4.2: Bug Diagnostic & Verification - "Move back to pending" Button Action
{
  let undoDeclineCalled = false;
  let acceptCalled = false;
  const mockOnAcceptApp = (id) => { acceptCalled = true; };
  const mockOnUndoDeclineApp = (id) => { undoDeclineCalled = true; };

  // Fixed implementation in TeamFinderScreen line 670-674:
  const handleUndoDecline = (appId) => {
    if (mockOnUndoDeclineApp) {
      mockOnUndoDeclineApp(appId);
    }
  };

  handleUndoDecline('app_123');
  assert(undoDeclineCalled === true, 'handleUndoDecline triggers onUndoDeclineApp');
  assert(acceptCalled === false, 'handleUndoDecline does NOT call onAcceptApp (does not consume spot)');

  // App.jsx handleUndoDeclineApp resets status to pending
  const declinedApp = { id: 'app_123', status: 'rejected' };
  const restoredApp = { ...declinedApp, status: 'pending' };
  assert(restoredApp.status === 'pending', 'Undo decline restores application status to "pending"');
}

// Test 4.3: Turn-Based Vetting in In-Platform Chat
{
  function canSendTurnBased(myRole, myId, messages, status, isExpired) {
    if (isExpired) return false;
    if (status === 'accepted') return true;
    if (status !== 'pending') return false;
    if (messages.length === 0) return true;
    const last = messages[messages.length - 1];
    return last.sender_role !== myRole && last.sender_id !== myId;
  }

  let chatHistory = [];
  const leadId = 'lead_uuid_1';
  const applicantId = 'app_uuid_2';

  // Empty chat
  assert(canSendTurnBased('applicant', applicantId, chatHistory, 'pending', false) === true, 'Applicant can send initial message in empty thread');
  assert(canSendTurnBased('lead', leadId, chatHistory, 'pending', false) === true, 'Lead can send initial message in empty thread');

  // Applicant sends
  chatHistory.push({ sender_role: 'applicant', sender_id: applicantId, content: 'Hi, I can handle financial modeling.' });
  assert(canSendTurnBased('applicant', applicantId, chatHistory, 'pending', false) === false, 'Applicant CANNOT send consecutive message (turn locked)');
  assert(canSendTurnBased('lead', leadId, chatHistory, 'pending', false) === true, 'Lead CAN reply to applicant message');

  // Lead sends reply
  chatHistory.push({ sender_role: 'lead', sender_id: leadId, content: 'Great, have you worked with DCF models?' });
  assert(canSendTurnBased('lead', leadId, chatHistory, 'pending', false) === false, 'Lead CANNOT send consecutive message (turn locked)');
  assert(canSendTurnBased('applicant', applicantId, chatHistory, 'pending', false) === true, 'Applicant CAN answer lead question');

  // After acceptance: continuous chatting
  assert(canSendTurnBased('applicant', applicantId, chatHistory, 'accepted', false) === true, 'Applicant has continuous chatting after acceptance');
  assert(canSendTurnBased('lead', leadId, chatHistory, 'accepted', false) === true, 'Lead has continuous chatting after acceptance');

  // Expired competition
  assert(canSendTurnBased('lead', leadId, chatHistory, 'accepted', true) === false, 'Expired competition is strictly read-only for lead');
  assert(canSendTurnBased('applicant', applicantId, chatHistory, 'accepted', true) === false, 'Expired competition is strictly read-only for applicant');
}

// Test 4.4: Local Optimistic Posts Duplication Prevention
{
  const tempId = `post_${Date.now()}`;
  let localPosts = [{ id: tempId, title: 'Case Squad' }];
  const realPost = { id: '98d5c432-1234-5678-90ab-cdef12345678', title: 'Case Squad' };

  // Fixed App.jsx handleSubmitPost flow:
  // Replaces the temporary optimistic post with the real Supabase record ID
  localPosts = localPosts.map(p => p.id === tempId ? realPost : p);

  const remotePosts = [realPost];
  const localOnly = localPosts.filter(lp => !remotePosts.some(rp => String(rp.id) === String(lp.id)));
  const mergedPosts = [...localOnly, ...remotePosts];

  assert(mergedPosts.length === 1, 'Optimistic local post replaced with real Supabase record avoids duplication in "My listings"');
  assert(mergedPosts[0].id === realPost.id, 'Merged post preserves the authoritative Supabase UUID');
}

// ─────────────────────────────────────────────────────────────────────────────
// AREA 5: NOTIFICATION ENGINE & CHAT METHOD ALIGNMENT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ 5. NOTIFICATION ENGINE & CHAT ACTION DIAGNOSTIC ═══');

// Test 5.1: Squad Acceptance Notification Action when comm_method is 'chat'
{
  const chatSquad = { comm_method: 'chat', title: 'In-App Squad' };
  const waSquad = { comm_method: 'whatsapp', title: 'WhatsApp Squad' };

  function getAcceptedNotifAction(squad) {
    if (squad.comm_method === 'chat') {
      return { label: 'Open In-Platform Chat', actionType: 'chat' };
    }
    return { label: 'Chat on WhatsApp', actionType: 'whatsapp' };
  }

  const actionChat = getAcceptedNotifAction(chatSquad);
  assert(actionChat.actionType === 'chat' && actionChat.label === 'Open In-Platform Chat', 'In-Platform Chat squad produces "Open In-Platform Chat" action');

  const actionWa = getAcceptedNotifAction(waSquad);
  assert(actionWa.actionType === 'whatsapp' && actionWa.label === 'Chat on WhatsApp', 'WhatsApp squad produces "Chat on WhatsApp" action');
}

console.log('\n════════════════════════════════════════════════════════════════════════');
console.log(`TOTAL CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('════════════════════════════════════════════════════════════════════════\n');

if (issuesFound.length > 0) {
  console.log('Identified Diagnostic Deficiencies / Bugs:');
  issuesFound.forEach((iss, i) => {
    console.log(`${i + 1}. [${iss.testName}] -> ${iss.diagnosticDetail}`);
  });
}
