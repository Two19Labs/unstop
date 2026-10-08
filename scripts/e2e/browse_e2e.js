// scripts/e2e/browse_e2e.js
// Drives the real app in Chrome and checks Browse end to end: loading, filters and counts, drawer,
// saved filters, Home/Browse agreement, mobile drawer, sign-in bookmark flow and load performance.
//
// Listings come from a frozen snapshot (fixtures/competitions.json, deadlines re-based to now) and
// Supabase is mocked at the network layer, so the run is deterministic and never touches real data.
//
//   npm run test:e2e                 (uses installed Google Chrome)
//   CHROME_PATH=/path/to/chrome npm run test:e2e

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.E2E_PORT || 5199);
const BASE = `http://localhost:${PORT}`;
const LONG_TASK_BUDGET_MS = Number(process.env.E2E_LONG_TASK_BUDGET_MS || 1000);

let total = 0;
let failed = 0;
function assert(condition, name, detail = '') {
  total++;
  if (condition) {
    console.log(`  ✅ PASS: ${name}${detail ? `  (${detail})` : ''}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${name}${detail ? `\n     ↳ ${detail}` : ''}`);
  }
}

// ---------- fixtures & mocks ----------

const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'competitions.json'), 'utf8'));
function apiPayload() {
  const now = Date.now();
  const data = snapshot.map(({ deadlineOffsetMs, ...c }) => ({ ...c, deadline: new Date(now + deadlineOffsetMs).toISOString() }));
  return JSON.stringify({ success: true, count: data.length, data });
}

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const UID = '11111111-2222-3333-4444-555555555555';
function fakeSession() {
  const now = Math.floor(Date.now() / 1000);
  const user = { id: UID, aud: 'authenticated', role: 'authenticated', email: 'e2e@example.com', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email' }, user_metadata: { full_name: 'E2E Tester' }, created_at: new Date().toISOString() };
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: UID, aud: 'authenticated', role: 'authenticated', email: user.email, exp: now + 3600, iat: now })}.sig`;
  return { user, session: { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'r', user } };
}

async function newContext(browser, { viewport = { width: 1440, height: 900 }, prefs = null, supabase = {} } = {}) {
  const ctx = await browser.newContext({ viewport, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript((savedPrefs) => {
    try {
      if (!sessionStorage.getItem('__e2e')) {
        localStorage.clear();
        localStorage.setItem('onestop_walkthrough_seen', 'true');
        if (savedPrefs) localStorage.setItem('onestop_user_filter_prefs', JSON.stringify(savedPrefs));
        sessionStorage.setItem('__e2e', '1');
      }
    } catch (e) {}
  }, prefs);
  await ctx.route('**/api/competitions', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: apiPayload() }));
  // Third-party analytics are irrelevant here
  await ctx.route(/posthog\.com/, (route) => route.fulfill({ status: 200, body: '{}' }));
  // Supabase: never reach the real project
  await ctx.routeWebSocket(/supabase\.co/, () => {});
  const { user, session } = fakeSession();
  const writes = [];
  await ctx.route(/supabase\.co/, async (route) => {
    const req = route.request();
    const url = req.url();
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    const wantsObject = (req.headers().accept || '').includes('vnd.pgrst.object');
    if (url.includes('/auth/v1/token')) return json(session);
    if (url.includes('/auth/v1/user')) return json(user);
    if (url.includes('/auth/v1/')) return json({});
    if (url.includes('/rest/v1/bookmarks')) {
      if (req.method() === 'GET') return json((supabase.bookmarks || []).map(id => ({ comp_id: id })));
      writes.push(`${req.method()} ${decodeURIComponent(url.split('/rest/v1/')[1])} ${req.postData() || ''}`);
      return route.fulfill({ status: req.method() === 'POST' ? 201 : 204, body: '' });
    }
    if (url.includes('/rest/v1/profiles')) {
      const p = { id: UID, full_name: 'E2E Tester', college: 'Test College', year: 'UG 2nd Year', phone: '9876543210', skills: [] };
      return json(wantsObject ? p : [p]);
    }
    return wantsObject ? json(null, 406) : json([]);
  });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.supabaseWrites = writes;
  return { ctx, page };
}

const cards = (page) => page.locator('.cc-grid article.cc-card');
const resultCount = async (page) => Number((await page.locator('.cc-inline-count strong').first().textContent()).trim());
const optionCount = async (page, label) => Number(((await page.locator('.cc-filter-sidebar label.cc-filter-checkbox-row', { hasText: label }).first().textContent()) || '').match(/\((\d+)\)/)?.[1]);
const tick = async (page, label) => { await page.locator('.cc-filter-sidebar label.cc-filter-checkbox-row', { hasText: label }).first().click(); await page.waitForTimeout(120); };
async function openBrowse(page) {
  await page.goto(`${BASE}/#browse`);
  await page.waitForSelector('.cc-grid article.cc-card, .cc-empty-state', { timeout: 30000 });
}

// ---------- tests ----------

async function desktopSuite(browser) {
  console.log('\n🖥️  Browse on desktop');
  const { ctx, page } = await newContext(browser);
  await page.addInitScript(() => {
    window.__longest = 0;
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__longest = Math.max(window.__longest, e.duration);
      }).observe({ type: 'longtask', buffered: true });
    } catch (e) {}
  });
  const t0 = Date.now();
  await page.goto(`${BASE}/#browse`);
  await page.waitForSelector('.section-loading-card', { timeout: 30000 });
  const loaderShown = Date.now();
  await page.waitForSelector('.cc-grid article.cc-card', { timeout: 30000 });
  const loaderMs = Date.now() - loaderShown;
  assert(loaderMs >= 1400 && loaderMs < 4500, 'Loading screen stays about 1.5s and then gives way', `${loaderMs}ms`);
  const longest = await page.evaluate(() => window.__longest);
  assert(longest < LONG_TASK_BUDGET_MS, `No main-thread freeze over ${LONG_TASK_BUDGET_MS}ms while rendering`, `longest task ${Math.round(longest)}ms, page ready in ${Date.now() - t0}ms`);

  const totalResults = await resultCount(page);
  assert((await cards(page).count()) === Math.min(24, totalResults), 'First batch renders 24 cards, not the whole list', `${await cards(page).count()} of ${totalResults}`);
  await page.locator('.cc-show-more-btn').click();
  await page.waitForTimeout(200);
  assert((await cards(page).count()) === Math.min(48, totalResults), '"Show more" adds the next batch');

  // Facet counts equal what you get by ticking
  for (const label of ['DU Circuit', 'Hackathons', 'Quizzes']) {
    const shown = await optionCount(page, label);
    await tick(page, label);
    const got = await resultCount(page);
    assert(shown === got, `"${label}" count matches its results`, `label ${shown}, results ${got}`);
    await tick(page, label);
  }

  // Sub-tracks only narrow their own category
  await tick(page, 'Case Comps');
  await tick(page, 'Hackathons');
  const hackathonsOnly = await (async () => { await tick(page, 'Case Comps'); const n = await resultCount(page); await tick(page, 'Case Comps'); return n; })();
  const financePill = page.locator('.cc-subtrack-pill', { hasText: 'Finance & Valuation' }).first();
  if (await financePill.count()) {
    const pillCount = Number((await financePill.locator('.cc-subtrack-count').textContent()).trim());
    await financePill.click();
    await page.waitForTimeout(150);
    const after = await resultCount(page);
    assert(after === hackathonsOnly + pillCount, 'Case > Finance keeps every hackathon', `${after} = ${hackathonsOnly} hackathons + ${pillCount} finance cases`);
  } else {
    assert(false, 'Finance sub-track pill is available under Case Comps');
  }
  await page.locator('.cc-clear-all-pill-btn').click();
  await page.waitForTimeout(150);
  assert((await resultCount(page)) === totalResults, '"Clear all" restores every listing');

  // Uncategorised listings appear in the full list but under no category
  const allCategories = await (async () => {
    await page.locator('.cc-filter-subgroup', { hasText: 'Categories' }).locator('.cc-mini-select-all').click();
    await page.waitForTimeout(150);
    return resultCount(page);
  })();
  assert(allCategories === totalResults, 'Ticking all categories = no category filter');
  await page.locator('.cc-clear-all-pill-btn').click().catch(() => {});
  await page.locator('.cc-filter-subgroup', { hasText: 'Categories' }).locator('.cc-mini-select-all').click().catch(() => {});
  await page.waitForTimeout(150);

  // Paid: card tags and the drawer agree; no false "Format" row
  await page.locator('.cc-seg-btn', { hasText: 'Paid' }).click();
  await page.waitForTimeout(150);
  const paidTags = await page.locator('.cc-grid .cc-entry-tag.paid').count();
  assert(paidTags === (await cards(page).count()) && paidTags > 0, 'Paid filter shows only paid listings', `${paidTags}`);
  await cards(page).first().locator('.cc-card-title-btn').click();
  await page.waitForSelector('.detail-drawer-panel');
  const facts = await page.locator('.detail-drawer-fact-row').allTextContents();
  assert(facts.some(f => /^Entry\s*Paid/.test(f)), 'Drawer says "Paid" for a paid listing', facts.find(f => f.startsWith('Entry')));
  assert(!facts.some(f => f.startsWith('Format')), 'Drawer has no online/offline "Format" row');
  const title = (await page.locator('.detail-drawer-title').textContent()).trim();
  const desc = await page.locator('.detail-drawer-desc').count() ? (await page.locator('.detail-drawer-desc').textContent()).trim() : '';
  assert(desc === '' || !desc.startsWith(title), 'Drawer description is real text, not the title repeated');
  await page.keyboard.press('Escape');
  await page.locator('.cc-segmented-subgroup', { hasText: 'Entry Fee' }).locator('.cc-seg-btn', { hasText: 'All' }).click();
  await page.waitForTimeout(150);

  // Apply opens the listing without also opening the drawer
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
    cards(page).first().locator('.cc-btn-apply').click(),
  ]);
  await page.waitForTimeout(250);
  assert(Boolean(popup), 'Apply opens the competition page');
  assert(!(await page.locator('.detail-drawer-panel').isVisible()), 'Apply does not also open the detail drawer');
  if (popup) await popup.close();

  // Search matches word starts
  await page.fill('.cc-search-input', 'du');
  await page.waitForTimeout(200);
  const duTitles = (await page.locator('.cc-grid .cc-card-title').allTextContents()).map(t => t.trim());
  const duCards = await cards(page).evaluateAll(els => els.map(e => e.innerText));
  // A result must start a word with "du" somewhere, or be a DU Circuit listing (circuit names are searchable)
  const isDuCircuit = (title) => snapshot.some(c => String(c.title).trim() === title && c.circuit === 'DU Circuit');
  const stray = duCards.filter((text, i) => !/(^|[^a-z0-9])du/i.test(text) && !isDuCircuit(duTitles[i]));
  assert(duCards.length > 0 && stray.length === 0, '"du" finds DU listings, not words like "Product"', stray.length ? stray[0].slice(0, 80) : `${duCards.length} results`);
  await page.fill('.cc-search-input', '');

  // Keyboard: card titles are buttons
  assert((await page.locator('.cc-grid .cc-card-title-btn').count()) > 0, 'Card titles are keyboard-focusable buttons');

  // Sort pill
  await page.selectOption('#cc-sort-select', 'popular');
  await page.waitForTimeout(150);
  assert((await page.locator('.cc-active-pill.pill-sort').count()) === 1, 'A changed sort order shows its own pill');

  assert(page.errors.length === 0, 'No JavaScript errors', page.errors.slice(0, 3).join(' | '));
  await ctx.close();
}

async function persistenceSuite(browser) {
  console.log('\n💾 Saved filters & Home agreement');
  const { ctx, page } = await newContext(browser);
  await openBrowse(page);
  await tick(page, 'DU Circuit');
  await tick(page, 'Hackathons');
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForSelector('.cc-grid article.cc-card, .cc-empty-state', { timeout: 30000 });
  const pills = (await page.locator('.cc-active-pill').allTextContents()).join(' ');
  assert(/DU Circuit/.test(pills) && /Hackathons/.test(pills), 'Both filter changes survive a reload', pills.replace(/✕/g, '').trim());
  await ctx.close();

  for (const [name, prefs] of [['Paid', { feeFilter: 'paid' }], ['Free', { feeFilter: 'free' }], ['Solo OK', { teamFilter: 'solo' }], ['DU', { selectedCircuits: ['du'] }]]) {
    const { ctx: c2, page: p2 } = await newContext(browser, { prefs });
    await p2.goto(`${BASE}/#home`);
    const pill = p2.locator('.home-section-count-pill--primary').first();
    await pill.waitFor({ timeout: 30000 });
    await p2.waitForFunction(() => /^\s*\d+\s*$/.test(document.querySelector('.home-section-count-pill--primary')?.textContent || ''), null, { timeout: 30000 });
    const homeN = Number((await pill.textContent()).trim());
    await openBrowse(p2);
    const browseN = await resultCount(p2);
    assert(homeN === browseN, `Home and Browse agree for "${name}"`, `Home ${homeN}, Browse ${browseN}`);
    await c2.close();
  }
}

async function mobileSuite(browser) {
  console.log('\n📱 Browse on mobile');
  const { ctx, page } = await newContext(browser, { viewport: { width: 390, height: 844 } });
  await openBrowse(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 0, 'No horizontal scrolling', `${overflow}px`);
  await page.locator('.cc-mobile-filter-trigger').click();
  await page.waitForTimeout(300);
  assert((await page.locator('.cc-filter-sidebar.mobile-open').count()) === 1, 'Filters button opens the drawer');
  assert((await page.evaluate(() => getComputedStyle(document.body).overflow)) === 'hidden', 'Page behind the drawer is locked');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  assert((await page.locator('.cc-filter-sidebar.mobile-open').count()) === 0, 'Escape closes the drawer');
  assert((await page.evaluate(() => getComputedStyle(document.body).overflow)) !== 'hidden', 'Scrolling is restored after closing');
  assert(page.errors.length === 0, 'No JavaScript errors', page.errors.slice(0, 3).join(' | '));
  await ctx.close();
}

async function signInBookmarkSuite(browser) {
  console.log('\n🔖 Bookmark while signed out, then sign in (Supabase mocked)');
  const account = { bookmarks: [] };
  const { ctx, page } = await newContext(browser, { supabase: account });
  await openBrowse(page);

  // The account already has two bookmarks: the 2nd and 3rd cards; the user taps the 1st
  const titles = (await page.locator('.cc-grid .cc-card-title').allTextContents()).slice(0, 3).map(t => t.trim());
  const idOf = (title) => String(snapshot.find(c => String(c.title).trim() === title)?.id);
  const [tappedId, ...existing] = titles.map(idOf);
  account.bookmarks.push(...existing);

  await cards(page).first().locator('.cc-card-bookmark-btn').click();
  await page.waitForSelector('.onestop-auth-segmented', { timeout: 10000 });
  await page.locator('.onestop-auth-seg-btn', { hasText: 'Sign in' }).click();
  await page.fill('input[type="email"]', 'e2e@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3500);

  assert(!(await page.locator('.onestop-auth-segmented').isVisible().catch(() => false)), 'Sign-up modal does not re-open after signing in');
  const marked = await cards(page).evaluateAll(els => els.slice(0, 3).map(e => e.classList.contains('is-bookmarked')));
  assert(marked.every(Boolean), 'New bookmark is saved and existing bookmarks stay visible', JSON.stringify(marked));
  const writes = page.supabaseWrites;
  assert(writes.length === 1 && writes[0].startsWith('POST') && writes[0].includes(tappedId), 'Exactly one bookmark write, for the tapped listing', writes.join(' | '));
  assert((await page.evaluate(() => sessionStorage.getItem('onestop_pending_bookmark_after_auth'))) === null, 'No pending bookmark is left behind');
  await ctx.close();
}

async function main() {
  const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: PORT, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  try {
    await desktopSuite(browser);
    await persistenceSuite(browser);
    await mobileSuite(browser);
    await signInBookmarkSuite(browser);
  } catch (err) {
    failed++;
    console.error('  ❌ Suite crashed:', err.message);
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(`\n${failed === 0 ? '🎉' : '⚠️'} Browse E2E: ${total - failed}/${total} passed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
