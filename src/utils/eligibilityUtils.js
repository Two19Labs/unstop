// src/utils/eligibilityUtils.js
// Rock-solid eligibility classification to guarantee Postgraduate/MBA-only competitions
// never leak into Undergraduate views across any screen or rail.

export const MBA_EXCLUSION_PATTERN = /\b(mba\s+only|pgdm\s+only|postgraduate\s+only|post-graduate\s+only|mba\s+students\s+only|only\s+for\s+mba|only\s+mba|mba\s+graduate|mba\s+graduates|pre-mba|b-school\s+only|only\s+b-school|mba\s+track|for\s+mba\s+students|for\s+pgdm\s+students|executive\s+mba|1st\s+year\s+mba|2nd\s+year\s+mba|pgp\s+only|only\s+pgp|full-time\s+mba|first\s+year\s+mba|second\s+year\s+mba|two-year\s+mba|premier\s+b-schools|eligible\s+b-schools|participating\s+b-schools|1st\s+year\s+students\s+of\s+2-year|2nd\s+year\s+students\s+of\s+2-year|management\s+students\s+only|open\s+only\s+to\s+b-school|open\s+to\s+b-school\s+students|open\s+to\s+mba\s+students|b-school\s+students\s+and\s+corporate|cummins\s+redefine|mahindra\s+war\s+room|godrej\s+loud|aditya\s+birla\s+group\s+stratos|itc\s+interrobang|hul\s+l\.i\.m\.e\.|marico\s+over\s+the\s+wall|asian\s+paints\s+canvas|colgate\s+transcend|india's\s+most\s+employable\s+mba)\b/i;

export const UG_AFFIRMATIVE_PATTERN = /\b(undergraduate|undergrad|undergraduates|ug\s+only|only\s+for\s+ug|ug\s+students|all\s+collegiate|all\s+college\s+students|open\s+to\s+all\s+students|all\s+students\s+eligible|b\.tech|bba|b\.com|bcom|bachelor|bachelors|b\.sc|bsc|b\.a\b|engineering\s+students)\b/i;

/**
 * Returns true if a competition is legitimately eligible for undergraduate students.
 * Returns false if it is exclusively for Postgraduate / MBA / B-School students.
 */
export function isEligibleForUndergrad(comp) {
  if (!comp) return false;

  // 1. Explicit boolean / target flags
  if (comp.isUndergradEligible === false) return false;
  if (comp.isPGOnly === true) return false;
  if (comp.targetLevel === 'pg') return false;

  // 2. Platform check: InsideKampus & InsideIIM are dedicated MBA/B-School platforms
  const platform = (comp.sourcePlatform || comp.source_platform || '').toLowerCase();
  const host = (comp.host || comp.orgName || comp.host_institution || comp.organizer || '').toLowerCase();
  const isInsideCampus = platform === 'inside_campus' || platform === 'inside_iim' ||
    /\binside(iim|kampus)\b/i.test(host);

  const title = (comp.title || '').toLowerCase();
  const desc = (comp.desc || comp.description || comp.raw_scraped_text || '').toLowerCase();
  const fullText = `${title} ${host} ${desc}`;

  if (isInsideCampus) {
    // InsideKampus is exclusively PG/MBA unless it explicitly affirms undergraduate eligibility
    if (!UG_AFFIRMATIVE_PATTERN.test(fullText)) {
      return false;
    }
  }

  // 3. Text pattern check for MBA / PG exclusivity
  if (MBA_EXCLUSION_PATTERN.test(fullText)) {
    if (!UG_AFFIRMATIVE_PATTERN.test(fullText)) {
      return false;
    }
  }

  // 4. Structured filters check (from Unstop)
  if (Array.isArray(comp.filters)) {
    const filterNames = comp.filters.map(f => (typeof f === 'string' ? f : (f.name || '')).toLowerCase().trim());
    const hasUG = filterNames.some(f => f.includes('undergraduate') || f.includes('engineering') || f.includes('arts') || f.includes('bachelor'));
    const hasPG = filterNames.some(f => f.includes('postgraduate') || f.includes('mba'));
    if (hasPG && !hasUG) {
      return false;
    }
  }

  // 5. Structured registration eligibility payload (from Unstop)
  let regnEligibility = comp.regnRequirements?.eligibility;
  if (typeof regnEligibility === 'string') {
    try {
      regnEligibility = JSON.parse(regnEligibility);
    } catch (e) {}
  }
  if (regnEligibility && typeof regnEligibility === 'object') {
    const bSchools = Array.isArray(regnEligibility.bSchools) ? regnEligibility.bSchools : [];
    const engineering = Array.isArray(regnEligibility.engineering) ? regnEligibility.engineering : [];
    const arts = Array.isArray(regnEligibility.arts) ? regnEligibility.arts : [];

    const extractCourses = (arr) => arr.map(c => (typeof c === 'string' ? c : (c?.course || '')).toLowerCase()).filter(Boolean);
    const bSchoolCourses = extractCourses(bSchools);
    const hasUgInBschool = bSchoolCourses.some(c => c.includes('bba') || c.includes('bcom') || c.includes('bms') || c.includes('bhm'));
    const hasPgInBschool = bSchoolCourses.some(c => c.includes('mba') || c.includes('pgdm') || c.includes('exec') || c.includes('phd'));

    if (bSchools.length > 0 && engineering.length === 0 && arts.length === 0) {
      if (hasPgInBschool && !hasUgInBschool) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Returns true if the user's profile indicates they are a Postgraduate / MBA student.
 */
export function checkIsPostgraduate(profile) {
  if (!profile) return false;
  const ed = (profile.education_level || '').toLowerCase().trim();
  const yr = (profile.year || profile.batch || '').toUpperCase().trim();
  return ed === 'postgraduate' || yr.startsWith('PG') || yr.includes('MBA') || yr.includes('MASTERS');
}
