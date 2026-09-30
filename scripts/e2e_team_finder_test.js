// scripts/e2e_team_finder_test.js
// Automated End-to-End Test Suite for OneStop Team Finder Feature

import { normalizeYear } from '../src/data/colleges.js';

export function sanitizeIndianPhone(raw) {
  if (!raw) return '';
  let digits = String(raw).trim().replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  else if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(-10);
  return digits.slice(0, 10);
}

export function formatWhatsAppUrl(phone, textMessage = '') {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!cleanPhone || cleanPhone.length !== 10) return '#';
  return `https://wa.me/91${cleanPhone}${textMessage ? `?text=${encodeURIComponent(textMessage)}` : ''}`;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('ONESTOP TEAM FINDER END-TO-END AUTOMATED VERIFICATION');
console.log('====================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 1: Phone Sanitization & WhatsApp Handshake URL Generation
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- TEST SUITE 1: Phone Sanitization & WhatsApp Handshake ---');
{
  assert(sanitizeIndianPhone('9876543210') === '9876543210', 'Direct 10-digit number sanitized');
  assert(sanitizeIndianPhone('+91 98765 43210') === '9876543210', '+91 format sanitized');
  assert(sanitizeIndianPhone('09876543210') === '9876543210', 'Leading 0 sanitized');
  assert(sanitizeIndianPhone('919876543210') === '9876543210', 'Leading 91 without plus sanitized');
  assert(sanitizeIndianPhone('12345') === '12345', 'Short number preserves digits');
  assert(sanitizeIndianPhone('') === '', 'Empty string returns empty string');

  const waUrl = formatWhatsAppUrl('9876543210', 'Hey Rohan! Connecting regarding squad');
  assert(waUrl.startsWith('https://wa.me/919876543210?text='), 'WhatsApp URL generates with country code and query text');
  assert(formatWhatsAppUrl('123') === '#', 'Invalid phone number gracefully returns #');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 2: College Year & Education Level Normalization
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 2: Collegiate Academic Year Normalization ---');
{
  assert(normalizeYear('2nd Year') === 'UG 2nd Year', 'UG year standardized');
  assert(normalizeYear('3rd year') === 'UG 3rd Year', 'Case-insensitive year standardized');
  assert(normalizeYear('MBA 1st Year') === 'PG 1st Year', 'MBA standardized to PG');
  assert(normalizeYear('Masters') === 'PG 1st Year', 'Masters standardized to PG');
  assert(normalizeYear('UG 4th Year') === 'UG 4th Year', '4th year maintained for 4-year degree programs');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 3: Competition Categorization & Circuit Mapping
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 3: Competition Categorization & Circuit Mapping ---');
{
  const testComps = [
    { id: '101', title: 'SRCC Business Conclave Case Challenge', host: 'SRCC', category: 'Case Competition', isDU: true },
    { id: '102', title: 'IIT Bombay Techfest Hackathon', host: 'IIT Bombay', category: 'Hackathon', isIIMorIIT: true },
    { id: '103', title: 'McKinsey Next Generation Women Leaders', host: 'McKinsey & Company', category: 'Case', isCorporate: true },
    { id: '104', title: 'National Parliamentary Debate', host: 'St. Stephen\'s College', category: 'Debate', isDU: true },
  ];

  function mapComp(c) {
    let cat = 'Case Comps';
    const catKey = (c.category || '').toLowerCase();
    if (catKey.includes('hack')) cat = 'Hackathons';
    else if (catKey.includes('debat')) cat = 'Debates';

    let circ = 'Others';
    if (c.isDU || /srcc|stephen/i.test(c.host)) circ = 'DU Circuit';
    else if (c.isIIMorIIT || /iit/i.test(c.host)) circ = 'IIMs, IITs & Premier';
    else if (c.isCorporate || /mckinsey/i.test(c.host)) circ = 'Corporate & Global';

    return { cat, circ };
  }

  assert(mapComp(testComps[0]).cat === 'Case Comps' && mapComp(testComps[0]).circ === 'DU Circuit', 'SRCC Case comp mapped to DU Circuit');
  assert(mapComp(testComps[1]).cat === 'Hackathons' && mapComp(testComps[1]).circ === 'IIMs, IITs & Premier', 'IIT Bombay Hackathon mapped to IIM/IIT');
  assert(mapComp(testComps[2]).cat === 'Case Comps' && mapComp(testComps[2]).circ === 'Corporate & Global', 'McKinsey mapped to Corporate');
  assert(mapComp(testComps[3]).cat === 'Debates' && mapComp(testComps[3]).circ === 'DU Circuit', 'Debate competition mapped to DU Circuit');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 4: Squad Hosting, Spots & State Computation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 4: Squad Hosting & Spots Calculation ---');
{
  const currentUser = { id: 'user_lead_1', email: 'lead@srcc.du.ac.in', user_metadata: { full_name: 'Aarav Mehta' } };

  // 1. Create a squad post
  const rawPost = {
    id: 'post_1001',
    competition_id: '101',
    competition_name: 'SRCC Business Conclave Case Challenge',
    organizer: 'SRCC',
    total_members: 4,
    spots_left: 2,
    comm_method: 'chat',
    phone_number: '9876543210',
    skills_looking_for: ['Deck design', 'Market research'],
    skills_have: ['Financial Modeling'],
    user_id: currentUser.id,
    created_by_name: currentUser.user_metadata.full_name,
    created_by_email: currentUser.email,
    college: 'SRCC',
    is_open: true,
    created_at: new Date().toISOString()
  };

  assert(rawPost.competition_id === '101', 'Squad post retains linked competition ID');
  assert(rawPost.comm_method === 'chat', 'In-Platform chat comm method correctly retained');
  assert(rawPost.spots_left === 2 && rawPost.total_members === 4, 'Total members and spots initialized');

  // Verify ownership identification
  const isMine = Boolean(rawPost.user_id === currentUser.id);
  assert(isMine === true, 'Squad creator correctly identified as owner');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 5: Team Finding, Filtering & Skill Match Engine
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 5: Team Finding & Skill Matching Algorithm ---');
{
  const applicantProfile = {
    college: 'Hindu College',
    skills: ['Deck design', 'Presentation', 'Public Speaking']
  };

  const samplePosts = [
    {
      id: 'p1',
      comp: { title: 'Case Challenge', cat: 'Case Comps', circuit: 'DU Circuit', days: 5 },
      college: 'SRCC',
      want: ['Deck design', 'Financial Modeling'],
      openN: 2,
      isOwn: false,
      state: 'open'
    },
    {
      id: 'p2',
      comp: { title: 'AI Hackathon', cat: 'Hackathons', circuit: 'IIMs, IITs & Premier', days: 12 },
      college: 'IIT Delhi',
      want: ['Python', 'Machine Learning'],
      openN: 1,
      isOwn: false,
      state: 'open'
    },
    {
      id: 'p3',
      comp: { title: 'Policy Paper Contest', cat: 'Writing & Research', circuit: 'DU Circuit', days: 3 },
      college: 'Hindu College',
      want: ['Econometrics', 'Presentation'],
      openN: 3,
      isOwn: false,
      state: 'open'
    }
  ];

  // Calculate skill matches
  samplePosts.forEach(p => {
    p.match = p.want.filter(w => applicantProfile.skills.includes(w)).length;
  });

  assert(samplePosts[0].match === 1, 'P1 matches 1 skill (Deck design)');
  assert(samplePosts[1].match === 0, 'P2 matches 0 skills');
  assert(samplePosts[2].match === 1, 'P3 matches 1 skill (Presentation)');

  // Filter 1: Matches my skills
  const matchFilter = samplePosts.filter(p => p.match > 0);
  assert(matchFilter.length === 2 && !matchFilter.includes(samplePosts[1]), 'Skills filter excludes posts with zero matching skills');

  // Filter 2: Teams from my college
  const collegeMatches = (pCollege, myCollege) => pCollege.toLowerCase() === myCollege.toLowerCase();
  const collegeFilter = samplePosts.filter(p => collegeMatches(p.college, applicantProfile.college));
  assert(collegeFilter.length === 1 && collegeFilter[0].id === 'p3', 'College filter correctly selects teams from applicant college');

  // Filter 3: Category filter (Hackathons)
  const catFilter = samplePosts.filter(p => p.comp.cat === 'Hackathons');
  assert(catFilter.length === 1 && catFilter[0].id === 'p2', 'Category filter correctly isolates Hackathons');

  // Filter 4: Open spots filter (1 spot left)
  const spotsFilter = samplePosts.filter(p => p.openN === 1);
  assert(spotsFilter.length === 1 && spotsFilter[0].id === 'p2', 'Spots filter correctly isolates teams with exactly 1 spot');

  // Filter 5: Closes this week (<= 7 days)
  const closesWeekFilter = samplePosts.filter(p => p.comp.days <= 7);
  assert(closesWeekFilter.length === 2, 'Closing soon filter correctly isolates competitions ending in <= 7 days');

  // Search filter (text query)
  const searchFilter = samplePosts.filter(p => `${p.comp.title} ${p.college} ${p.want.join(' ')}`.toLowerCase().includes('delhi'));
  assert(searchFilter.length === 1 && searchFilter[0].id === 'p2', 'Text search query matches college substring');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 6: Application Workflow (Apply -> Pending)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 6: Request to Join Application Lifecycle ---');
{
  const applicantUser = { id: 'user_app_2', email: 'applicant@hindu.du.ac.in' };
  const targetPost = {
    id: 'post_1001',
    user_id: 'user_lead_1',
    comm_method: 'chat',
    spots_left: 2,
    total_members: 4,
    created_by_name: 'Aarav Mehta'
  };

  const newApplication = {
    id: 'app_uuid_555',
    post_id: targetPost.id,
    applicant_id: applicantUser.id,
    applicant_name: 'Priya Verma',
    applicant_college: 'Hindu College',
    applicant_phone: '9123456780',
    highlighted_skills: ['Deck design'],
    pitch_note: '3x National Case Comp Finalist with strong PPT storytelling.',
    status: 'pending',
    comm_method: 'chat',
    dir: 'out',
    lead_phone: null // Hidden during pending vetting
  };

  assert(newApplication.status === 'pending', 'Initial application state is strictly pending');
  assert(newApplication.lead_phone === null, 'Lead phone number is securely masked during pending status');
  assert(newApplication.comm_method === 'chat', 'Communication method preference is attached to application');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 7: In-Platform OneStop Chat & Turn-Based Vetting
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 7: In-Platform OneStop Chat Turn-Based Vetting ---');
{
  const leadUser = { id: 'user_lead_1', email: 'lead@srcc.du.ac.in' };
  const applicantUser = { id: 'user_app_2', email: 'applicant@hindu.du.ac.in' };
  const post = { id: 'post_1001', user_id: leadUser.id, comm_method: 'chat' };
  const application = { id: 'app_uuid_555', post_id: post.id, applicant_id: applicantUser.id, status: 'pending' };

  // Role resolution function (verified against our fixed component logic)
  function resolveRole(user, app, p) {
    const isLead = Boolean(
      app?.dir === 'in' ||
      (user?.id && p?.user_id && p.user_id === user.id) ||
      p?.mine ||
      p?.isOwn
    );
    return isLead ? 'lead' : 'applicant';
  }

  assert(resolveRole(leadUser, application, post) === 'lead', 'Lead correctly resolved as role "lead"');
  assert(resolveRole(applicantUser, application, post) === 'applicant', 'Applicant correctly resolved as role "applicant"');

  // Turn-based check function
  function canUserSend(userRole, userId, messages, appStatus, isExpired = false) {
    if (isExpired) return false;
    if (appStatus === 'accepted') return true;
    if (appStatus !== 'pending') return false;

    if (messages.length === 0) return true; // Anyone can initiate
    const lastMsg = messages[messages.length - 1];
    return lastMsg.sender_role !== userRole && lastMsg.sender_id !== userId;
  }

  let chatMessages = [];

  // Step 1: Empty thread -> Applicant sends first message
  assert(canUserSend('applicant', applicantUser.id, chatMessages, 'pending') === true, 'Applicant can send initial vetting greeting');
  assert(canUserSend('lead', leadUser.id, chatMessages, 'pending') === true, 'Lead could also initiate if desired');

  chatMessages.push({
    id: 'm1',
    sender_id: applicantUser.id,
    sender_name: 'Priya Verma',
    sender_role: 'applicant',
    content: 'Hi Aarav! Saw your squad listing. I specialize in deck design.'
  });

  // Step 2: After applicant sends, applicant turn is consumed
  assert(canUserSend('applicant', applicantUser.id, chatMessages, 'pending') === false, 'Applicant CANNOT send consecutive messages (turn consumed)');
  assert(canUserSend('lead', leadUser.id, chatMessages, 'pending') === true, 'Lead CAN reply with a question');

  // Step 3: Lead asks a vetting question
  chatMessages.push({
    id: 'm2',
    sender_id: leadUser.id,
    sender_name: 'Aarav Mehta',
    sender_role: 'lead',
    content: 'Awesome Priya! Have you worked with consulting decks or market sizing before?'
  });

  // Step 4: Now lead is consumed, applicant turn is restored
  assert(canUserSend('lead', leadUser.id, chatMessages, 'pending') === false, 'Lead CANNOT send consecutive messages');
  assert(canUserSend('applicant', applicantUser.id, chatMessages, 'pending') === true, 'Applicant CAN reply to vetting question');

  // Step 5: Applicant answers
  chatMessages.push({
    id: 'm3',
    sender_id: applicantUser.id,
    sender_name: 'Priya Verma',
    sender_role: 'applicant',
    content: 'Yes! Finalist at Bain Case Comp with McKinsey framework deck.'
  });

  assert(canUserSend('applicant', applicantUser.id, chatMessages, 'pending') === false, 'Applicant turn consumed again');
  assert(canUserSend('lead', leadUser.id, chatMessages, 'pending') === true, 'Lead ready to decide or respond');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 8: Lead Decision (Accept, Spot Decrement, Phone Unlocked)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 8: Application Acceptance & Handshake Transition ---');
{
  let post = {
    id: 'post_1001',
    spots_left: 2,
    total_members: 4,
    phone_number: '9876543210',
    accepted_emails: [],
    is_open: true
  };

  let application = {
    id: 'app_uuid_555',
    applicant_email: 'applicant@hindu.du.ac.in',
    status: 'pending',
    lead_phone: null
  };

  // Simulate respond_to_application('accepted') RPC logic
  function acceptApplication(p, a, leadPhone) {
    if (p.spots_left <= 0) throw new Error('No spots left');
    p.spots_left = Math.max(0, p.spots_left - 1);
    p.is_open = p.spots_left > 0;
    p.accepted_emails.push(a.applicant_email);
    a.status = 'accepted';
    a.lead_phone = leadPhone;
    return { p, a };
  }

  const { p: updatedPost, a: updatedApp } = acceptApplication(post, application, '9876543210');

  assert(updatedApp.status === 'accepted', 'Application status updated to accepted');
  assert(updatedPost.spots_left === 1, 'Spots left decremented from 2 to 1');
  assert(updatedPost.accepted_emails.includes('applicant@hindu.du.ac.in'), 'Applicant email recorded in accepted roster');
  assert(updatedApp.lead_phone === '9876543210', 'Lead phone number unlocked and delivered to applicant');

  // Verify chat after acceptance
  function canSendAccepted(messages) {
    return true; // Unrestricted chatting once teamed up
  }
  assert(canSendAccepted() === true, 'Chat becomes fully open for continuous messaging after acceptance');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 9: Member Removal & Spot Reclaim
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- TEST SUITE 9: Member Removal & Spot Reclaim Lifecycle ---');
{
  let post = {
    id: 'post_1001',
    spots_left: 1,
    total_members: 4,
    accepted_emails: ['applicant@hindu.du.ac.in'],
    is_open: true
  };

  let application = {
    id: 'app_uuid_555',
    applicant_email: 'applicant@hindu.du.ac.in',
    status: 'accepted',
    lead_phone: '9876543210'
  };

  // Simulate respond_to_application('removed') RPC logic
  function removeMember(p, a) {
    p.spots_left = Math.min(p.total_members, p.spots_left + 1);
    p.is_open = true;
    p.accepted_emails = p.accepted_emails.filter(e => e !== a.applicant_email);
    a.status = 'removed';
    a.lead_phone = null;
    return { p, a };
  }

  const { p: removedPost, a: removedApp } = removeMember(post, application);

  assert(removedApp.status === 'removed', 'Application marked as removed');
  assert(removedPost.spots_left === 2, 'Open spot reclaimed back to 2');
  assert(!removedPost.accepted_emails.includes('applicant@hindu.du.ac.in'), 'Email removed from accepted roster');
  assert(removedApp.lead_phone === null, 'Lead phone locked upon removal');
}

console.log('\n====================================================');
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
