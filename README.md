# Unstop Case Competition Radar

A high-performance, noise-filtered Case Competition & Hackathon Aggregator that pulls live, 100% verified opportunities directly from Unstop's public API.

Curated specifically for **Undergraduate Eligibility**, eliminating MBA-only, PG-only, school-only, and expired listings.

---

## ⚡ Key Features

- **Direct Live Unstop Sync:** Reverse-engineers Unstop's public search endpoint across 29 batch queries (DU Circuit, IIMs, IITs, top B-schools, and corporate challenges).
- **Strict Undergrad Eligibility Gate:** Automatically discards MBA-only, PG-only, and school-only competitions using tag detection and nested eligibility JSON parsing.
- **Circuit Intelligence:** Automatically categorizes competitions into:
  - 🎓 **DU Circuit:** SRCC, SSCBS, St. Stephen's, Hindu, Hansraj, LSR, etc.
  - 🏛️ **IIMs & IITs:** All 21 IIMs and 23 IITs.
  - 🏢 **Colleges & Corporates:** XLRI, MDI, ISB, FMS, L'Oréal Brandstorm, Tata Crucible, HUL L.I.M.E, etc.
- **Cumulative Prize Calculator:** Accurately sums prize tiers into verified cash pools (e.g. `₹50,000 Cash Pool`).
- **Real-Time Urgency Chips:** Live 30-second countdown with visual urgency tags:
  - 🔴 **High Urgency:** Closes in < 48 hours.
  - 🟡 **Medium Urgency:** Closes in 3–6 days.
  - 🟢 **Normal Urgency:** Closes in 7+ days.
- **1-Click Share:** Copies clean, formatted competition details and direct application link with emojis to clipboard.
- **Zero External Icon Dependencies:** 100% inline SVGs to guarantee zero bundler chunk collisions.
- **Zero Database Required:** Runs entirely client-side with `localStorage` for bookmarks and a high-speed API proxy.

---

## 🛠️ Project Structure

```
unstop/
├── api/
│   └── competitions.js       # Unstop scraper, concurrency chunker, undergrad filter
├── src/
│   ├── components/
│   │   ├── CaseCompsPage.jsx # Main dashboard with filters, search, countdown
│   │   └── CaseCompsPage.css # Design system tokens, light/dark theme, responsive grid
│   ├── App.jsx               # App shell with theme toggle
│   └── main.jsx              # React 18 bootstrap
├── index.html                # Entry HTML with typography preloads
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

## 📄 License & Attribution
All competition names, logos, and trademarks belong to their respective organizers and hosting platforms. This platform aggregates publicly available event notices to assist undergraduate students in discovering collegiate opportunities. All applications are completed directly on [Unstop](https://unstop.com).
