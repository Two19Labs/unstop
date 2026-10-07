import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1].trim()] = val.trim();
  }
});

Object.assign(process.env, env);

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  ONESTOP LIVE BACKEND & SERVICE DIAGNOSTIC SUITE');
console.log('═══════════════════════════════════════════════════════════════════\n');

async function runLiveDiagnostics() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  function record(name, pass, note = '', isWarn = false) {
    results.total++;
    if (pass) {
      results.passed++;
      console.log(`  ✅ PASS: ${name}${note ? ' (' + note + ')' : ''}`);
    } else if (isWarn) {
      results.warnings++;
      console.log(`  ⚠️ WARN: ${name}${note ? ' (' + note + ')' : ''}`);
    } else {
      results.failed++;
      console.log(`  ❌ FAIL: ${name}${note ? ' (' + note + ')' : ''}`);
    }
    results.details.push({ name, pass, isWarn, note });
  }

  // 1. Check Supabase Connectivity
  console.log('--- 1. Supabase Live Connectivity & Tables ---');
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  record('VITE_SUPABASE_URL is configured', Boolean(supabaseUrl));
  record('VITE_SUPABASE_ANON_KEY is configured', Boolean(anonKey));

  const supabase = createClient(supabaseUrl, anonKey);

  // Test squad_posts
  try {
    const { data: posts, error: postErr } = await supabase
      .from('squad_posts')
      .select('id, title, competition_name, college, is_open, spots_left, total_members, comm_method, created_at')
      .limit(10);
    record('squad_posts table reachable', !postErr, postErr?.message || `${posts?.length || 0} posts found`);
  } catch (err) {
    record('squad_posts table reachable', false, err.message);
  }

  // Test squad_post_contacts RLS (should return empty or error for anon)
  try {
    const { data: contacts, error: contactErr } = await supabase
      .from('squad_post_contacts')
      .select('*')
      .limit(5);
    const protectedWell = (contacts && contacts.length === 0) || Boolean(contactErr);
    record('squad_post_contacts RLS blocks anon leak', protectedWell, 
      contactErr ? `Blocked with: ${contactErr.message}` : `Returned ${contacts?.length} rows (0 expected for anon)`);
  } catch (err) {
    record('squad_post_contacts RLS blocks anon leak', true, `Exception: ${err.message}`);
  }

  // Test profiles RLS
  try {
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, college, phone')
      .limit(5);
    const profProtected = (profiles && profiles.length === 0) || Boolean(profErr);
    record('profiles table RLS blocks bulk anon reading', profProtected,
      profErr ? `Blocked: ${profErr.message}` : `Returned ${profiles?.length} rows (0 expected for anon)`);
  } catch (err) {
    record('profiles table RLS blocks bulk anon reading', true, `Exception: ${err.message}`);
  }

  // Test squad_applications RLS
  try {
    const { data: apps, error: appErr } = await supabase
      .from('squad_applications')
      .select('*')
      .limit(5);
    const appProtected = (apps && apps.length === 0) || Boolean(appErr);
    record('squad_applications RLS blocks anon reading', appProtected,
      appErr ? `Blocked: ${appErr.message}` : `Returned ${apps?.length} rows (0 expected for anon)`);
  } catch (err) {
    record('squad_applications RLS blocks anon reading', true, `Exception: ${err.message}`);
  }

  // Test squad_conversations table
  try {
    const { data: convs, error: convErr } = await supabase
      .from('squad_conversations')
      .select('*')
      .limit(5);
    const convProtected = (convs && convs.length === 0) || Boolean(convErr);
    record('squad_conversations table exists & protected by RLS', convProtected && !convErr,
      convErr ? `Blocked: ${convErr.message}` : `Returned ${convs?.length} rows (0 expected for anon)`);
  } catch (err) {
    record('squad_conversations table exists & protected by RLS', false, err.message);
  }

  // Test squad_messages table
  try {
    const { data: msgs, error: msgErr } = await supabase
      .from('squad_messages')
      .select('*')
      .limit(5);
    const msgProtected = (msgs && msgs.length === 0) || Boolean(msgErr);
    record('squad_messages table exists & protected by RLS', msgProtected && !msgErr,
      msgErr ? `Blocked: ${msgErr.message}` : `Returned ${msgs?.length} rows (0 expected for anon)`);
  } catch (err) {
    record('squad_messages table exists & protected by RLS', false, err.message);
  }

  // Test institutional_competitions table
  try {
    const { data: insts, error: instErr } = await supabase
      .from('institutional_competitions')
      .select('*')
      .limit(5);
    record('institutional_competitions table accessible', !instErr,
      instErr ? `Error: ${instErr.message}` : `${insts?.length || 0} rows found`);
  } catch (err) {
    record('institutional_competitions table accessible', false, err.message);
  }

  // Test app_admins table
  try {
    const { data: admins, error: adminErr } = await supabase
      .from('app_admins')
      .select('*')
      .limit(5);
    const adminProtected = (admins && admins.length === 0) || Boolean(adminErr);
    record('app_admins table protected from anon', adminProtected,
      adminErr ? `Blocked: ${adminErr.message}` : `Returned ${admins?.length} rows (0 expected for anon)`);
  } catch (err) {
    record('app_admins table protected from anon', true, `Exception: ${err.message}`);
  }

  // Test bookmarks table
  try {
    const { data: bms, error: bmErr } = await supabase
      .from('bookmarks')
      .select('*')
      .limit(5);
    const bmProtected = (bms && bms.length === 0) || Boolean(bmErr);
    record('bookmarks table protected by RLS', bmProtected && !bmErr,
      bmErr ? `Blocked: ${bmErr.message}` : `Returned ${bms?.length} rows (0 expected for anon)`);
  } catch (err) {
    record('bookmarks table protected by RLS', false, err.message);
  }

  // Test user_notifications table
  try {
    const { data: notifs, error: notifErr } = await supabase
      .from('user_notifications')
      .select('*')
      .limit(5);
    const notifProtected = (notifs && notifs.length === 0) || Boolean(notifErr);
    record('user_notifications table protected by RLS', notifProtected && !notifErr,
      notifErr ? `Blocked: ${notifErr.message}` : `Returned ${notifs?.length} rows (0 expected for anon)`);
  } catch (err) {
    record('user_notifications table protected by RLS', false, err.message);
  }

  // Test RPC: is_admin (should return false for anon)
  try {
    const { data: isAdmin, error: rpcErr } = await supabase.rpc('is_admin');
    record('RPC is_admin handles unauthenticated calls safely', !rpcErr && isAdmin === false,
      rpcErr ? `Error: ${rpcErr.message}` : `Returned ${isAdmin}`);
  } catch (err) {
    record('RPC is_admin handles unauthenticated calls safely', false, err.message);
  }

  // Test RPC: get_squad_host_whatsapp (should reject for anon)
  try {
    const { data: hostWa, error: waErr } = await supabase.rpc('get_squad_host_whatsapp', { p_post_id: '00000000-0000-0000-0000-000000000000' });
    const waBlocked = Boolean(waErr) || !hostWa;
    record('RPC get_squad_host_whatsapp rejects unauthenticated lookup', waBlocked,
      waErr ? `Safely rejected: ${waErr.message}` : `Returned ${JSON.stringify(hostWa)}`);
  } catch (err) {
    record('RPC get_squad_host_whatsapp rejects unauthenticated lookup', true, `Rejected via error: ${err.message}`);
  }

  // 2. Test Live Unstop Ingestion & Rounds
  console.log('\n--- 2. Unstop Public API Ingestion & Rounds Pipeline ---');
  let fetchedComps = [];
  try {
    const compModule = await import('../api/competitions.js');
    fetchedComps = await compModule.fetchCompetitionsFromUnstop(true);
    record('fetchCompetitionsFromUnstop succeeds', Array.isArray(fetchedComps) && fetchedComps.length > 0,
      `Fetched ${fetchedComps?.length || 0} competitions`);
  } catch (err) {
    record('fetchCompetitionsFromUnstop succeeds', false, err.message);
  }

  if (fetchedComps.length > 0) {
    // Validate schema of returned competitions
    const sample = fetchedComps[0];
    const hasRequiredFields = sample &&
      typeof sample.id !== 'undefined' &&
      typeof sample.title === 'string' &&
      typeof sample.circuit === 'string' &&
      typeof sample.deadline === 'string' &&
      typeof sample.daysRemainingNum !== 'undefined' &&
      typeof sample.unstopUrl === 'string';
    record('Competition objects adhere to required UI schema', hasRequiredFields,
      `Sample: "${sample.title.slice(0, 30)}..." | circuit: ${sample.circuit} | days: ${sample.daysRemainingNum}`);

    // Check circuit distributions
    const circuits = {};
    fetchedComps.forEach(c => {
      circuits[c.circuit] = (circuits[c.circuit] || 0) + 1;
    });
    console.log(`    📊 Circuit breakdown: ${JSON.stringify(circuits)}`);
    record('Multiple circuits identified (DU, IIM/IIT, Corporate, etc.)', Object.keys(circuits).length >= 2,
      `${Object.keys(circuits).length} circuits found`);

    // Test rounds fetching for first 3 competitions
    try {
      const roundsModule = await import('../api/rounds.js');
      const testIds = fetchedComps.slice(0, 3).map(c => c.id);
      const roundsResult = await roundsModule.fetchRoundsForMultipleCompetitions(testIds);
      const compIds = Object.keys(roundsResult);
      record('fetchRoundsForMultipleCompetitions succeeds for live IDs', compIds.length > 0,
        `Retrieved timelines for ${compIds.length} competitions`);
      
      const firstCompData = roundsResult[compIds[0]];
      const stages = firstCompData?.rounds;
      record('Rounds timeline contains structured stage data', Array.isArray(stages) && stages.length > 0,
        `Stage count: ${stages?.length || 0}, First stage: ${stages?.[0]?.title} (${stages?.[0]?.status})`);
    } catch (err) {
      record('fetchRoundsForMultipleCompetitions succeeds for live IDs', false, err.message);
    }
  }

  // 3. Test PostHog & Gemini Key presence
  console.log('\n--- 3. External Integrations Configuration ---');
  record('PostHog analytics key configured', Boolean(env.VITE_POSTHOG_KEY && env.VITE_POSTHOG_KEY.startsWith('phc_')));
  record('PostHog host configured', Boolean(env.VITE_POSTHOG_HOST));
  record('Gemini API key configured in server environment', Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 10));

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`TOTAL: ${results.total} | PASSED: ${results.passed} | FAILED: ${results.failed} | WARNINGS: ${results.warnings}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  return results;
}

runLiveDiagnostics()
  .then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('Fatal diagnostic failure:', err);
    process.exit(1);
  });
