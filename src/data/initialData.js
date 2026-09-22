// src/data/initialData.js -> Constants & Utilities for OneStop (Zero mock/fake data)

export const SKILLS = [
  "Finance modelling",
  "Deck design",
  "Market research",
  "Frontend",
  "Backend",
  "ML / Data",
  "Copywriting",
  "Public speaking",
  "Valuation",
  "Design"
];

export const DISCIPLINES = [
  "Case",
  "Hackathon",
  "Simulation",
  "Writing",
  "Quiz",
  "Debate & MUN"
];

export const CIRCUITS = [
  "DU Circuit",
  "IIM / IIT",
  "Corporate"
];

export const TEAM_TYPES = [
  { id: "any", label: "All" },
  { id: "solo", label: "Solo" },
  { id: "team", label: "Teams (2+)" }
];

export const FEE_OPTIONS = [
  { id: "any", label: "All" },
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" }
];

export const SORT_OPTIONS = [
  { value: "deadline", label: "Sort: Closing soonest" },
  { value: "popular", label: "Sort: Most registrations" },
  { value: "new", label: "Sort: Recently added" }
];

export function initialsOf(host = "") {
  const skip = { "&": 1, "and": 1, "company": 1, "college": 1, "of": 1, "institute": 1, "university": 1 };
  const words = host.split(/[\s.]+/).filter(w => w && !skip[w.toLowerCase()]);
  if (words.length === 0) return "··";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map(w => w.charAt(0)).join("").toUpperCase();
}

export function soloOk(item) {
  if (!item || !item.team) return false;
  const teamStr = String(item.team).trim();
  return teamStr.charAt(0) === "1" || teamStr.toLowerCase().includes("solo");
}

export function describeFilter(f = {}) {
  const parts = [];
  if (f.disc && f.disc.length) parts.push(f.disc.join(" + "));
  if (f.circ && f.circ.length) parts.push(f.circ.join(" + "));
  if (f.team && f.team !== "any") parts.push(f.team === "solo" ? "solo allowed" : "teams of 2+");
  if (f.fee && f.fee !== "any") parts.push(f.fee === "free" ? "free entry" : "paid entry");
  if (f.win && f.win !== "any") parts.push("closes within " + (f.win === "3" ? "72 hours" : f.win + " days"));
  return parts.length ? parts.join(" · ") : "Everything open";
}

export function filterName(f = {}) {
  if (f.disc && f.disc.length) return f.disc.join(" + ") + (f.circ && f.circ.length ? " · " + f.circ[0] : "");
  if (f.circ && f.circ.length) return f.circ.join(" + ");
  return "Everything open";
}

export function matchListing(item, f = {}) {
  if (!item) return false;
  if (f.disc && f.disc.length && !f.disc.includes(item.discipline)) return false;
  if (f.circ && f.circ.length && !f.circ.includes(item.circuit)) return false;
  if (f.win && f.win !== "any" && item.days > Number(f.win)) return false;
  if (f.team === "solo" && !soloOk(item)) return false;
  if (f.team === "team" && soloOk(item)) return false;
  if (f.fee === "free" && item.fee !== "Free") return false;
  if (f.fee === "paid" && item.fee === "Free") return false;
  if (f.q && f.q.trim()) {
    const hay = `${item.title || ""} ${item.host || ""} ${item.discipline || ""} ${item.circuit || ""}`.toLowerCase();
    if (!hay.includes(f.q.trim().toLowerCase())) return false;
  }
  return true;
}

export function isMockPost(p) {
  if (!p) return true;
  const id = String(p.id || '');
  // Strictly filter legacy template dummy IDs from designer mockup
  if (/^p[1-9]\d*$/.test(id) || ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].includes(id)) return true;
  return false;
}

export function isMockApp(a) {
  if (!a) return true;
  const id = String(a.id || '');
  // Strictly filter legacy template dummy app IDs
  if (/^ap[1-9]\d*$/.test(id) || ['ap1', 'ap2', 'ap3', 'ap4', 'ap5'].includes(id)) return true;
  return false;
}

export function isMockAlert(a) {
  if (!a) return true;
  const id = String(a.id || '');
  return /^a[1-9]$/.test(id);
}

export function isMockBookmark(b) {
  if (typeof b === 'number' && b <= 50) return true;
  if (typeof b === 'string' && /^\d+$/.test(b) && Number(b) <= 50) return true;
  return false;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDeadlineDateTime(deadlineStr) {
  if (!deadlineStr) return null;
  const d = new Date(deadlineStr);
  if (isNaN(d.getTime())) return null;

  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;

  return `${day} ${month}, ${hours}:${minutesStr} ${ampm}`;
}

export function formatDeadlineCountdown(deadlineStr, fallbackRemainText, fallbackDays) {
  if (deadlineStr) {
    const d = new Date(deadlineStr);
    const now = Date.now();
    const diffMs = d.getTime() - now;
    if (!isNaN(diffMs)) {
      if (diffMs <= 0) return 'Ending soon';
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);

      if (days >= 2) return `${days} days left`;
      if (days === 1) return '1 day left';
      if (totalHours >= 1) return `${totalHours} ${totalHours === 1 ? 'hour' : 'hours'} left`;
      if (totalMinutes > 0) return `${totalMinutes} ${totalMinutes === 1 ? 'min' : 'mins'} left`;
      return 'Ending soon';
    }
  }
  if (fallbackRemainText && fallbackRemainText !== 'Ongoing') {
    return fallbackRemainText;
  }
  if (fallbackDays !== undefined && fallbackDays !== null) {
    return fallbackDays === 1 ? '1 day left' : `${fallbackDays} days left`;
  }
  return fallbackRemainText || 'Ongoing';
}

