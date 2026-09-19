// src/data/initialData.js
// High-fidelity starter dataset and utility functions matching OneStop design handoff specification

export const INITIAL_COMPETITIONS = [
  {
    id: 1,
    title: "Ambition 2026 — Flagship Case Championship",
    host: "SRCC",
    circuit: "DU Circuit",
    logo: null,
    discipline: "Case",
    days: 2,
    prize: "₹2,00,000",
    team: "3–4",
    mode: "On-campus, Delhi",
    fee: "Free",
    desc: "The flagship case championship of the DU circuit. Three elimination rounds with a live jury from consulting and industry.",
    tags: ["Case", "Team of 3–4", "Delhi"],
    regs: 1054,
    unstopUrl: "https://unstop.com/competitions"
  },
  {
    id: 2,
    title: "Code Chakra 3.0",
    host: "IIT Delhi",
    circuit: "IIM / IIT",
    logo: null,
    discipline: "Hackathon",
    days: 8,
    prize: "₹1,50,000",
    team: "2–4",
    mode: "36-hour, hybrid",
    fee: "Free",
    desc: "Thirty-six hours, four tracks, hardware bench on site. Shipping something that runs matters more than the pitch.",
    tags: ["Hackathon", "36 hours", "Hybrid"],
    regs: 383,
    unstopUrl: "https://unstop.com/hackathons"
  },
  {
    id: 3,
    title: "Quantum Quiz Open",
    host: "SSCBS",
    circuit: "DU Circuit",
    logo: null,
    discipline: "Quiz",
    days: 3,
    prize: "₹40,000",
    team: "1–2",
    mode: "On-campus, Delhi",
    fee: "₹100",
    desc: "Open general and business quiz. Written prelims followed by a stage final. Solo entries allowed.",
    tags: ["Quiz", "Solo or pair"],
    regs: 76,
    unstopUrl: "https://unstop.com/quizzes"
  },
  {
    id: 4,
    title: "Ascend Case Challenge",
    host: "McKinsey & Company",
    circuit: "Corporate",
    logo: null,
    discipline: "Case",
    days: 11,
    prize: "Interview fast-track",
    team: "3",
    mode: "Online, national",
    fee: "Free",
    desc: "Corporate flagship whose shortlist feeds the summer recruitment funnel. Penultimate-year undergraduates eligible.",
    tags: ["Case", "Corporate", "Fast-track"],
    regs: 2140,
    unstopUrl: "https://unstop.com/competitions"
  },
  {
    id: 5,
    title: "Trading Titans — Market Simulation",
    host: "Hansraj College",
    circuit: "DU Circuit",
    logo: null,
    discipline: "Simulation",
    days: 6,
    prize: "₹75,000",
    team: "2",
    mode: "On-campus, Delhi",
    fee: "₹200",
    desc: "Live mock-market simulation across three trading sessions, with a sealed-bid auction deciding final standings.",
    tags: ["Simulation", "Team of 2"],
    regs: 167,
    unstopUrl: "https://unstop.com/competitions"
  },
  {
    id: 6,
    title: "Brandstorm Undergraduate Track",
    host: "L'Oréal",
    circuit: "Corporate",
    logo: null,
    discipline: "Case",
    days: 14,
    prize: "Global final berth",
    team: "3",
    mode: "Online, global",
    fee: "Free",
    desc: "Product and brand innovation brief judged on consumer insight and go-to-market feasibility.",
    tags: ["Case", "Brand", "Global"],
    regs: 1806,
    unstopUrl: "https://unstop.com/competitions"
  },
  {
    id: 7,
    title: "The Editorial Prize",
    host: "Kirori Mal College",
    circuit: "DU Circuit",
    logo: null,
    discipline: "Writing",
    days: 4,
    prize: "₹25,000 + publication",
    team: "1",
    mode: "Submission only",
    fee: "Free",
    desc: "Long-form essay and research submission on a set theme, blind-reviewed by faculty and working journalists.",
    tags: ["Writing", "Solo"],
    regs: 136,
    unstopUrl: "https://unstop.com/competitions"
  },
  {
    id: 8,
    title: "Delhi Model United Nations 2026",
    host: "Miranda House",
    circuit: "DU Circuit",
    logo: null,
    discipline: "Debate & MUN",
    days: 9,
    prize: "₹60,000 pool",
    team: "1–2",
    mode: "On-campus, Delhi",
    fee: "₹850",
    desc: "Six committees including a crisis council. Delegate applications reviewed on written position papers.",
    tags: ["MUN", "Delhi"],
    regs: 248,
    unstopUrl: "https://unstop.com/competitions"
  },
  {
    id: 9,
    title: "BOLD Analytics Sprint",
    host: "Bain & Company",
    circuit: "Corporate",
    logo: null,
    discipline: "Hackathon",
    days: 17,
    prize: "Internship offers",
    team: "2–3",
    mode: "Online, national",
    fee: "Free",
    desc: "A data sprint on an anonymised commercial dataset, judged on modelling rigour and clarity of recommendation.",
    tags: ["Data", "Corporate"],
    regs: 912,
    unstopUrl: "https://unstop.com/competitions"
  },
  {
    id: 10,
    title: "Startup Sprint On-Campus",
    host: "Hindu College",
    circuit: "DU Circuit",
    logo: null,
    discipline: "Case",
    days: 5,
    prize: "₹1,00,000 seed",
    team: "3–5",
    mode: "On-campus, Delhi",
    fee: "Free",
    desc: "On-campus qualifier for the national social-enterprise track. Teams pitch a venture with a working prototype.",
    tags: ["Startup", "Pitch", "Seed"],
    regs: 431,
    unstopUrl: "https://unstop.com/competitions"
  },
  {
    id: 11,
    title: "Finlit Valuation Olympiad",
    host: "NMIMS",
    circuit: "Corporate",
    logo: null,
    discipline: "Simulation",
    days: 12,
    prize: "₹50,000",
    team: "2",
    mode: "Online, national",
    fee: "Free",
    desc: "Two rounds of company valuation against a live comparables set, with a defence in front of sell-side analysts.",
    tags: ["Finance", "Valuation"],
    regs: 208,
    unstopUrl: "https://unstop.com/competitions"
  },
  {
    id: 12,
    title: "Parliamentary Debate Invitational",
    host: "Ramjas College",
    circuit: "DU Circuit",
    logo: null,
    discipline: "Debate & MUN",
    days: 20,
    prize: "₹35,000",
    team: "2",
    mode: "On-campus, Delhi",
    fee: "₹500",
    desc: "Asian parliamentary format across five preliminary rounds and open breaks to semifinals.",
    tags: ["Debate", "Delhi"],
    regs: 95,
    unstopUrl: "https://unstop.com/competitions"
  }
];

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

export const INITIAL_POSTS = [
  {
    id: "p1",
    compId: 1,
    spots: 2,
    filled: 2,
    size: 4,
    posted: "6h ago",
    desc: "Two rounds cleared here last year. Want someone who can hold a model together under time pressure.",
    want: ["Finance modelling", "Deck design"],
    lead: "Ananya R. · SSCBS · 2027",
    leadPhone: "+91 98111 22334",
    mine: false,
    state: "open"
  },
  {
    id: "p2",
    compId: 2,
    spots: 1,
    filled: 3,
    size: 4,
    posted: "1d ago",
    desc: "Building on an offline-first stack. Hardware track, so bench time matters more than polish.",
    want: ["Frontend", "ML / Data"],
    lead: "Dev M. · Hansraj · 2028",
    leadPhone: "+91 98765 43210",
    mine: false,
    state: "accepted"
  },
  {
    id: "p3",
    compId: 6,
    spots: 2,
    filled: 1,
    size: 3,
    posted: "2d ago",
    desc: "Going after the personal-care brief. Need someone comfortable running primary research on campus.",
    want: ["Market research", "Copywriting"],
    lead: "Ishita K. · Hindu · 2027",
    leadPhone: "+91 99100 88776",
    mine: false,
    state: "open"
  },
  {
    id: "p4",
    compId: 5,
    spots: 1,
    filled: 1,
    size: 2,
    posted: "3d ago",
    desc: "Derivatives-heavy sessions. Looking for one partner who has traded a sim before.",
    want: ["Valuation"],
    lead: "Rohan S. · SRCC · 2027",
    leadPhone: "+91 98101 23456",
    mine: false,
    state: "requested"
  },
  {
    id: "p5",
    compId: 9,
    spots: 1,
    filled: 2,
    size: 3,
    posted: "4d ago",
    desc: "Dataset is retail transactions. Need a third who can turn the model into a story for non-technical judges.",
    want: ["ML / Data", "Public speaking"],
    lead: "Meher J. · KMC · 2028",
    leadPhone: "+91 98990 11223",
    mine: false,
    state: "open"
  },
  {
    id: "p6",
    compId: 10,
    spots: 2,
    filled: 3,
    size: 5,
    posted: "5h ago",
    desc: "Pitching a campus logistics pilot. Prototype exists, need help on unit economics and the deck.",
    want: ["Finance modelling", "Design"],
    lead: "You",
    leadPhone: "+91 98711 00210",
    mine: true,
    state: "own"
  }
];

export const INITIAL_APPLICATIONS = [
  {
    id: "ap1",
    postId: "p6",
    who: "Nikhil V.",
    meta: "Hansraj · 2028",
    phone: "+91 98111 99887",
    skills: ["Finance modelling", "Valuation"],
    pitch: "Built the unit-economics model for our Ashoka pitch last term — happy to own the P&L sheet end to end.",
    status: "pending",
    dir: "in"
  },
  {
    id: "ap2",
    postId: "p6",
    who: "Sara Q.",
    meta: "LSR · 2027",
    phone: "+91 98222 77665",
    skills: ["Design", "Deck design"],
    pitch: "I design decks for our commerce society. Can turn the prototype screens into something a jury reads in ten seconds.",
    status: "pending",
    dir: "in"
  },
  {
    id: "ap3",
    postId: "p6",
    who: "Aman T.",
    meta: "SRCC · 2029",
    phone: "+91 98333 55443",
    skills: ["Market research"],
    pitch: "First competition, but I ran the campus survey for our department fest — 400 responses.",
    status: "rejected",
    dir: "in"
  },
  {
    id: "ap4",
    postId: "p4",
    who: "You",
    meta: "Trading Titans — Market Simulation",
    phone: "+91 98711 00210",
    skills: ["Valuation"],
    pitch: "Traded the SSCBS sim twice, finished third. Comfortable with options pricing.",
    status: "pending",
    dir: "out"
  },
  {
    id: "ap5",
    postId: "p2",
    who: "You",
    meta: "Code Chakra 3.0",
    phone: "+91 98711 00210",
    skills: ["Frontend"],
    pitch: "React and offline sync. Can own the client while you two take the hardware bench.",
    status: "accepted",
    dir: "out"
  }
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

export const INITIAL_ALERTS = [
  { id: "a1", disc: ["Case"], circ: ["DU Circuit"], win: "7", team: "any", fresh: 4 },
  { id: "a2", disc: ["Hackathon"], circ: [], win: "any", team: "any", fresh: 1 },
  { id: "a3", disc: [], circ: ["Corporate"], win: "14", team: "any", fresh: 0 }
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
