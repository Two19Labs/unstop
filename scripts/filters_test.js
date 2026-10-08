// scripts/filters_test.js
// Tests for src/utils/competitionFilters.js, the filter engine shared by Browse and Home.

import {
  filterCompetitions, facetCounts, sortCompetitions, sanitizePrefs, matchesSearch,
  isSoloOk, isTeamOk, isFreeComp, DEFAULT_PREFS,
} from '../src/utils/competitionFilters.js';

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

const DAY = 86400000;
const NOW = Date.UTC(2026, 9, 9, 12);
const inDays = (d) => new Date(NOW + d * DAY).toISOString();
const comp = (id, extra) => ({
  id, title: `Comp ${id}`, orgName: 'Some College', circuit: 'Others', category: 'case', subTracks: [],
  sourcePlatform: 'unstop', minTeam: 1, maxTeam: 4, isFree: true, fee: 'Free', deadline: inDays(5),
  registeredCount: 10, prizes: '₹10,000 Prize Pool', ...extra,
});

const LIST = [
  comp(1, { title: 'Finance Case', circuit: 'DU Circuit', subTracks: ['finance'] }),
  comp(2, { title: 'Strategy Case', circuit: 'IIM / IIT', subTracks: ['strategy'], isFree: false, fee: 'Paid' }),
  comp(3, { title: 'AI Hackathon', category: 'hackathon', subTracks: ['hack_ai'], minTeam: 2, maxTeam: 4 }),
  comp(4, { title: 'Web Hackathon', category: 'hackathon', subTracks: ['hack_dev'], circuit: 'Corporate', sourcePlatform: 'devpost' }),
  comp(5, { title: 'Solo Quiz', category: 'quiz', minTeam: 1, maxTeam: 1, registeredCount: 500 }),
  comp(6, { title: 'Chess Open', category: 'other' }),
  comp(7, { title: 'Closed Case', deadline: inDays(-1) }),
  comp(8, { title: 'MBA Case (PG)', isPGOnly: true }),
  // InsideKampus listings are postgraduate-only unless they say undergraduates can enter
  comp(9, { title: 'Undergraduate Strategy Challenge', sourcePlatform: 'inside_iim', circuit: 'Corporate' }),
];
const opts = { now: NOW };
const ids = (list) => list.map(c => c.id).sort((a, b) => a - b).join(',');
const run = (prefs, extra = {}) => filterCompetitions(LIST, prefs, { ...opts, ...extra });

console.log('\n🧭 Base visibility');
assert(ids(run(DEFAULT_PREFS)) === '1,2,3,4,5,6,9', 'Closed and PG-only listings are hidden for undergraduates', ids(run(DEFAULT_PREFS)));
assert(ids(run(DEFAULT_PREFS, { isPostgrad: true })).includes('8'), 'Postgraduates see PG-only listings');

console.log('\n🏛️  Circuits, categories, platforms');
assert(ids(run({ selectedCircuits: ['du'] })) === '1', 'DU circuit');
assert(ids(run({ selectedCircuits: ['du', 'iim-iit-premier', 'corporate-global', 'others'] })) === '1,2,3,4,5,6,9', 'All circuits ticked = no circuit filter');
assert(ids(run({ selectedTracks: ['hackathon'] })) === '3,4', 'Hackathons');
assert(!run({ selectedTracks: ['case', 'hackathon', 'quiz'] }).some(c => c.category === 'other'), 'Uncategorised listings never appear under a category filter');
assert(run(DEFAULT_PREFS).some(c => c.category === 'other'), 'Uncategorised listings stay in the full list');
assert(ids(run({ selectedPlatforms: ['inside_campus'] })) === '9', 'InsideIIM rows count as InsideKampus');
assert(ids(run({ selectedPlatforms: ['devpost'] })) === '4', 'Devpost platform');

console.log('\n🎯 Sub-tracks narrow only their own category');
assert(ids(run({ selectedTracks: ['case'], selectedSubTracks: ['finance'] })) === '1', 'Case > Finance');
assert(ids(run({ selectedTracks: ['case', 'hackathon'], selectedSubTracks: ['finance'] })) === '1,3,4', 'Case > Finance keeps every hackathon', ids(run({ selectedTracks: ['case', 'hackathon'], selectedSubTracks: ['finance'] })));
assert(ids(run({ selectedTracks: ['case', 'hackathon'], selectedSubTracks: ['finance', 'hack_ai'] })) === '1,3', 'One sub-track in each category');
assert(sanitizePrefs({ selectedTracks: ['quiz'], selectedSubTracks: ['finance'] }).selectedSubTracks.length === 0, 'A sub-track whose category is not selected is dropped');

console.log('\n👥 Participation & 💸 fee');
assert(isSoloOk(comp(0, { minTeam: 1, maxTeam: 4 })) && isTeamOk(comp(0, { minTeam: 1, maxTeam: 4 })), 'A 1-4 member competition is both "Solo OK" and "Team"');
assert(!isSoloOk(comp(0, { minTeam: 2, maxTeam: 4 })), 'Minimum team of 2 is not "Solo OK"');
assert(!isTeamOk(comp(0, { minTeam: 1, maxTeam: 1 })), 'Solo-only is not "Team"');
assert(ids(run({ teamFilter: 'solo' })) === '1,2,4,5,6,9', '"Solo OK" includes flexible team sizes', ids(run({ teamFilter: 'solo' })));
assert(ids(run({ feeFilter: 'paid' })) === '2', 'Paid filter');
assert(ids(run({ feeFilter: 'free' })).split(',').length === 6, 'Free filter');
assert(isFreeComp({ fee: 'Paid' }) === false && isFreeComp({ isFree: true, fee: 'Paid' }) === true, 'isFree wins over the fee label');

console.log('\n🔢 Live facet counts');
const counts = facetCounts(LIST, { selectedCircuits: ['du'] }, opts);
assert(counts.tracks.case === 1 && !counts.tracks.hackathon, 'Category counts respect the active circuit filter', JSON.stringify(counts.tracks));
assert(counts.circuits.du === 1 && counts.circuits['iim-iit-premier'] === 1, 'A facet\'s own options ignore that facet (so ticking more adds results)', JSON.stringify(counts.circuits));
const sub = facetCounts(LIST, { selectedTracks: ['case', 'hackathon'] }, opts).subTracks;
assert(sub.finance === 1 && sub.hack_ai === 1, 'Sub-track counts', JSON.stringify(sub));
const totalsAgree = ['du', 'iim-iit-premier', 'corporate-global', 'others']
  .every(k => (counts.circuits[k] || 0) === run({ selectedCircuits: [k] }).length);
assert(totalsAgree, 'Every circuit count equals the results you get by ticking it');

console.log('\n🔎 Search');
assert(matchesSearch(comp(0, { orgName: 'Hansraj College, Delhi University (DU)' }), 'du'), '"du" matches a DU college');
assert(!matchesSearch(comp(0, { title: 'Product Teardown', orgName: 'IIM Bangalore', circuit: 'IIM / IIT' }), 'du'), '"du" does not match inside "Product"');
assert(matchesSearch(comp(0, { title: 'Global AI Hackathon' }), 'ai hack'), 'Every word must match the start of a word');
assert(matchesSearch(comp(0, { circuit: 'DU Circuit' }), 'du circuit'), 'Circuit names are searchable');

console.log('\n↕️  Sorting');
const sorted = sortCompetitions(run(DEFAULT_PREFS), 'popular');
assert(sorted[0].id === 5, 'Most registered first');
const titles = sortCompetitions([comp(1, { title: ' Zebra' }), comp(2, { title: 'apple' })], 'title-asc').map(c => c.id).join(',');
assert(titles === '2,1', 'Title sort ignores stray spaces and case');

console.log('\n💾 Saved preferences');
const legacy = sanitizePrefs({ circ: ['iim-iit-bschool'], disc: ['quiz'], team: 'solo', fee: 'free', sort: 'popular', selectedPlatforms: ['inside_iim', 'institutional'] });
assert(legacy.selectedCircuits[0] === 'iim-iit-premier' && legacy.selectedTracks[0] === 'quiz' && legacy.teamFilter === 'solo' && legacy.sortBy === 'popular', 'Old saved formats are migrated');
assert(legacy.selectedPlatforms.join(',') === 'inside_campus', 'Removed platform ids are dropped');
assert(sanitizePrefs({ sortBy: 'nonsense', teamFilter: 'x' }).sortBy === 'closing-soonest', 'Unknown values fall back to defaults');

console.log(`\n${failed === 0 ? '🎉' : '⚠️'} Filters: ${total - failed}/${total} passed`);
if (failed > 0) process.exit(1);
