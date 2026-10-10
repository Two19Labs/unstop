// scripts/classification_test.js
// Regression tests for how listings are labelled: category, sub-tracks, circuit and undergraduate eligibility.
// Cases in fixtures/classification_cases.json are real Unstop records with hand-checked expectations.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyOpportunity, extractSubTracks, normalizeTitle, makeSummary, parseUnstopDate } from '../api/competitions.js';
import { classifyCircuit, matchesKeyword } from '../src/data/circuitKeywords.js';
import { isEligibleForUndergrad } from '../src/utils/eligibilityUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

console.log('\n🏷️  Category & sub-track classification (real Unstop records)');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'classification_cases.json'), 'utf8'));
for (const { item, expectCategory, subTracks } of cases) {
  const { category } = classifyOpportunity(item);
  assert(category === expectCategory, `"${item.title}" is ${expectCategory}`, `got ${category}`);
  if (subTracks) {
    const got = extractSubTracks(item, category);
    for (const st of subTracks.has || []) assert(got.includes(st), `"${item.title}" has sub-track ${st}`, `got [${got.join(', ')}]`);
    for (const st of subTracks.lacks || []) assert(!got.includes(st), `"${item.title}" does not have sub-track ${st}`, `got [${got.join(', ')}]`);
  }
}

console.log('\n🧩 Broad tags never decide a category on their own');
const treasureOnly = {
  title: 'Shark Tank Summit',
  type: 'competitions',
  subtype: 'general_competition',
  workfunction: [{ name: 'Quizzes & Treasure Hunt' }],
  filters: [{ name: 'Engineering Students', type: 'eligible' }],
};
assert(classifyOpportunity(treasureOnly).category === 'case', '"Quizzes & Treasure Hunt" work function does not make a pitch event a quiz');
assert(classifyOpportunity({ title: 'Mystery Event 2026', type: 'competitions', subtype: 'general_competition' }).category === 'other', 'Unknown events are uncategorised, never Case by default');
assert(extractSubTracks({ title: 'Grand Finance Case Challenge' }, 'hackathon').length === 0, 'Sub-tracks only come from the listing\'s own category');
assert(extractSubTracks({ title: 'Annual Hackathon' }, 'hackathon').length === 0, 'No default sub-track when nothing matches');

console.log('\n🏛️  Circuits (Premier list decisions)');
const CIRCUITS = [
  ['CHRIST (Deemed to be University) Delhi NCR', 'IIM / IIT'],
  ['Vellore Institute of Technology (VIT), Vellore', 'IIM / IIT'],
  ['VIT Bhopal University', 'IIM / IIT'],
  ['VIT-AP University', 'IIM / IIT'],
  ['Vidyalankar Institute of Technology (VIT), Mumbai', 'Others'],
  ['Symbiosis Institute of Technology (SIT), Pune', 'IIM / IIT'],
  ['Symbiosis Institute of Management Studies (SIMS), Pune', 'IIM / IIT'],
  ['Manipal Institute of Technology (MIT), Manipal', 'Others'],
  ['Manipal University (MU), Jaipur', 'Others'],
  ['Amity School of Engineering & Technology (AMITY), Noida', 'Others'],
  ['Indian Institute of Technology (IIT), Guwahati', 'IIM / IIT'],
  ['Department of Management Studies, IIT (BHU) Varanasi', 'IIM / IIT'],
  ['Shri Ram College of Commerce (SRCC), University of Delhi', 'DU Circuit'],
  ['Atma Ram Sanatan Dharma College (ARSD), University of Delhi (DU), New Delhi', 'DU Circuit'],
  ['Sun Pharmaceutical Industries Ltd.', 'Corporate'],
  ['TVS Motor Company', 'Corporate'],
  ['Learnix Labs', 'Corporate'],
  ['IES University, Bhopal', 'Others'],
];
for (const [org, expected] of CIRCUITS) {
  const got = classifyCircuit(org, '');
  assert(got === expected, `${org} → ${expected}`, `got ${got}`);
}
assert(matchesKeyword('christ (deemed to be university) delhi', 'christ (deemed to be university)'), 'Keywords ending in punctuation match mid-string');
assert(!matchesKeyword('community unit', 'nit'), '"nit" does not match inside other words');

console.log('\n🎓 Undergraduate eligibility');
assert(!isEligibleForUndergrad({ title: 'Feed Forward Case Challenge (PG) - Aahara Parva 2026' }), '"(PG)" in the title hides it from undergraduates');
assert(!isEligibleForUndergrad({ title: 'RiDE Ideathon (PG) - TVS Motor' }), '"(PG)" edition is postgraduate-only');
assert(isEligibleForUndergrad({ title: 'Feed Forward Case Challenge (UG) - Aahara Parva 2026' }), '"(UG)" edition stays visible');
assert(isEligibleForUndergrad({ title: 'National Business Quiz 2026' }), 'Ordinary listings stay visible');

console.log('\n🧹 Text helpers');
assert(normalizeTitle('HackNC 2026') === normalizeTitle('HackNC'), 'Same event with and without the year de-duplicates');
assert(normalizeTitle('CFA Institute Research Challenge 2026-2027') === normalizeTitle('CFA Institute Research Challenge'), 'Year ranges are ignored when de-duplicating');
assert(normalizeTitle('Robo Race') !== normalizeTitle('Robo Soccer'), 'Different events stay distinct');
const summary = makeSummary('<p><strong>Round 1</strong>&nbsp;is online &amp; free.</p>' + ' word'.repeat(80));
assert(summary.startsWith('Round 1 is online & free.') && summary.length <= 201 && summary.endsWith('…'), 'Summaries are plain text, decoded and trimmed to ~200 characters', summary);

assert(parseUnstopDate('2026-10-09 12:37:52 GMT+0530') === '2026-10-09T07:07:52.000Z', 'Unstop approved_date (GMT+0530) parses to the right instant', parseUnstopDate('2026-10-09 12:37:52 GMT+0530'));
assert(parseUnstopDate('2026-10-01T12:34:56.123456+00:00') === '2026-10-01T12:34:56.123Z', 'Supabase created_at parses');
assert(parseUnstopDate(null) === null && parseUnstopDate('not a date') === null, 'Missing or bad post times become null');

console.log(`\n${failed === 0 ? '🎉' : '⚠️'} Classification: ${total - failed}/${total} passed`);
if (failed > 0) process.exit(1);
