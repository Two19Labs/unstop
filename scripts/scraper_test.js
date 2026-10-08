// scripts/scraper_test.js
// Tests for the pure helpers behind scripts/scrape_institutional.js

import { parseDevpostDeadline, isOnlineOrIndia, devpostSubTracks, plainPrize, stableId, insideKampusTeam } from './lib/scraperUtils.js';

let total = 0;
let failed = 0;
function assert(condition, name, detail = '') {
  total++;
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${name}${detail ? `\n     ↳ ${detail}` : ''}`);
  }
}

console.log('\n📅 Devpost deadlines (never invented)');
const DATES = [
  ['Sep 01 - Oct 14, 2026', '2026-10-14T23:59:59.000Z'],
  ['Oct 01 - 10, 2026', '2026-10-10T23:59:59.000Z'],
  ['Oct 05 - 27, 2026', '2026-10-27T23:59:59.000Z'],
  ['Dec 15, 2026 - Jan 10, 2027', '2027-01-10T23:59:59.000Z'],
  ['Oct 14, 2026', '2026-10-14T23:59:59.000Z'],
  ['September 3 - November 2, 2026', '2026-11-02T23:59:59.000Z'],
  ['Sept 3 - Sept 30, 2026', '2026-09-30T23:59:59.000Z'],
];
for (const [input, expected] of DATES) {
  const got = parseDevpostDeadline(input);
  assert(got === expected, `"${input}" → ${expected.slice(0, 10)}`, `got ${got}`);
}
for (const bad of ['', null, 'Ongoing', 'Feb 31, 2027', 'TBD - TBD']) {
  assert(parseDevpostDeadline(bad) === null, `Unreadable date ${JSON.stringify(bad)} gives null (listing skipped)`);
}

console.log('\n🇮🇳 Reachable from India');
assert(isOnlineOrIndia('Online'), 'Online');
assert(isOnlineOrIndia('Bengaluru, Karnataka, India'), 'In person in India');
assert(!isOnlineOrIndia('Chapel Hill, NC, USA'), 'In person in the US is dropped');
assert(!isOnlineOrIndia('London, UK'), 'In person in the UK is dropped');
assert(!isOnlineOrIndia(''), 'Unknown location is dropped');

console.log('\n🏷️  Devpost themes → sub-tracks');
const subs = devpostSubTracks([{ name: 'Machine Learning/AI' }, { name: 'Web' }, { name: 'Blockchain' }, { name: 'Beginner Friendly' }]);
assert(subs.includes('hack_ai') && subs.includes('hack_dev') && subs.includes('hack_web3') && subs.length === 3, 'Known themes map to sub-track ids; others are ignored', subs.join(','));

console.log('\n🆔 Stable ids & small helpers');
assert(stableId('devpost', 12345) === 'devpost_12345', 'Devpost id comes from its own id');
assert(stableId('insidekampus', 'abc-DEF') === 'insidekampus_abc_def', 'InsideKampus id is normalised');
assert(plainPrize('$<span data-currency-value>10,000</span>') === '$10,000 Prize Pool', 'Prize HTML is cleaned');
assert(plainPrize('$0') === null, 'A $0 prize is not shown as a prize pool');
assert(JSON.stringify(insideKampusTeam({ type: 'MAX', size: 4 })) === '{"min":1,"max":4}', 'InsideKampus "up to 4" team');
assert(JSON.stringify(insideKampusTeam({ type: 'SOLO', size: 1 })) === '{"min":1,"max":1}', 'InsideKampus solo');

console.log(`\n${failed === 0 ? '🎉' : '⚠️'} Scraper helpers: ${total - failed}/${total} passed`);
if (failed > 0) process.exit(1);
