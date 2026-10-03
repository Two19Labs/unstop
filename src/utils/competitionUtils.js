// Pure helpers shared by the app and scripts/*_test.js

export function isSoloCompetition(comp) {
  if (!comp) return false;
  if (comp.isSolo === true) return true;
  if (comp.maxTeam !== undefined && comp.maxTeam !== null && Number(comp.maxTeam) <= 1) return true;
  if (comp.team && typeof comp.team === 'string') {
    const t = comp.team.toLowerCase().trim();
    if (t.includes('solo') || t.includes('individual') || t === '1' || t === '1 member' || t === '1 person') {
      return true;
    }
  }
  if (comp.teamSizeDisplay && typeof comp.teamSizeDisplay === 'string') {
    const td = comp.teamSizeDisplay.toLowerCase().trim();
    if (td.includes('solo') || td.includes('individual') || td === '1' || td === '1 member' || td === '1 person') {
      return true;
    }
  }
  return false;
}
