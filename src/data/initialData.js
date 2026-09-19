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
