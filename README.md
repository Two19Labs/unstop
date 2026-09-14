# Unstop Case Competition Radar & Universal Squad Finder

A high-performance, noise-filtered Case Competition Aggregator and Cross-College Teammate Matching Platform. 

- **Competition Radar:** Direct, live Unstop sync tailored for **Undergraduate Eligibility**, eliminating MBA-only, PG-only, school-only, and expired listings.
- **Universal Squad Finder:** One-click team recruitment engine allowing any college student (SRCC, IITs, IIMs, BITS, NMIMS, Christ, etc.) to recruit teammates or join squads for case competitions and hackathons.

---

## ⚡ Key Features

### 🏆 Competition Radar
- **Direct Live Unstop Sync:** Reverse-engineers Unstop's public search endpoint across 29 batch queries (DU Circuit, IIMs, IITs, top B-schools, and corporate challenges).
- **Strict Undergrad Eligibility Gate:** Automatically discards MBA-only, PG-only, and school-only competitions using tag detection and nested eligibility JSON parsing.
- **Circuit Intelligence:** Categorizes competitions into DU Circuit, IIMs & IITs, and Premier Corporates (L'Oréal, Tata, HUL, McKinsey, etc.).
- **Cumulative Prize Calculator:** Accurately sums prize tiers into verified cash pools (e.g. `₹50,000 Cash Pool`).
- **Urgency Chips:** Live 30-second countdown with visual urgency tags (🔴 <48h, 🟡 3–6d, 🟢 7+d).
- **Zero External Icon Dependencies:** 100% inline SVGs to guarantee zero bundler chunk collisions.

### 👥 Universal Squad Finder
- **1-Click Competition Bridge:** Clicking *"Find Teammates"* on any competition card automatically opens the Squad creation modal prefilled with the competition's name, host, and link.
- **Universal Student Identity:** Works for any college/university, degree/major, and academic year.
- **Business & Tech Skill Taxonomy:** Financial Modeling, Deck Design, GTM Strategy, Pitching, Python, Fullstack Web, AI/ML, Figma UI/UX, and Policy Research.
- **Application & Host Review Dashboard:** Applicants submit a pitch note with their WhatsApp number. Hosts accept or decline candidates with automatic spot decrementing.
- **1-Click WhatsApp Launch:** Direct `https://wa.me/91...` integration with pre-filled invitations upon acceptance.
- **Dual Persistence:** Instant offline functionality via browser `localStorage` + production-ready Supabase PostgreSQL real-time sync.

---

## 🛠️ Project Structure

```
unstop/
├── api/
│   └── competitions.js       # Unstop scraper, concurrency chunker, undergrad filter
├── src/
│   ├── components/
│   │   ├── CaseCompsPage.jsx # Competition Radar dashboard
│   │   ├── CaseCompsPage.css # Radar styling & responsive system
│   │   ├── TeamFinderPage.jsx# Universal Squad Finder component
│   │   └── TeamFinderPage.css# Squad Finder styling & modals
│   ├── App.jsx               # App shell, navigation bar, and theme toggle
│   └── main.jsx              # React 18 bootstrap
├── schema.sql                # Supabase PostgreSQL schema with RLS & Realtime
├── index.html                # HTML entry point with typography preloads
├── vite.config.js            # Vite config with dev API proxy middleware
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed

### Installation
```bash
git clone https://github.com/Two19Labs/unstop.git
cd unstop
npm install
```

### Development
Start the local development server (with live Unstop API middleware):
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
```

---

## 🗄️ Database Setup (Optional)
To enable multi-user real-time squad synchronization across devices:
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL script from [`schema.sql`](./schema.sql) in the Supabase SQL Editor.
3. Pass your Supabase client instance to `<TeamFinderPage supabase={supabase} />` in `App.jsx`.

---

## 📄 License & Attribution
All competition names, logos, and trademarks belong to their respective organizers and hosting platforms. This platform aggregates publicly available event notices to assist undergraduate students in discovering collegiate opportunities. All applications are completed directly on [Unstop](https://unstop.com).
