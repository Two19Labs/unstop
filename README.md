# OneStop 🎯

> **The Unified Undergraduate Opportunity Hub & Squad Finder**
> *An engineering initiative by Two19 Labs (two19labs.in)*

**OneStop** is a high-speed opportunity engine aggregating active collegiate competitions, hackathons, and challenges in real time across **Unstop**, **Devfolio**, **Devpost**, and **Codeforces**. It strictly purges MBA-only/postgraduate restrictions, categorizes opportunities by discipline and collegiate circuit, and connects students with batchmates through an integrated **Squad Finder** with 1-click WhatsApp handshakes.

---

## ⚡ Key Highlights

- **Multi-Platform Real-Time Ingestion**:
  - 🏛️ **Unstop**: 35+ targeted search queries across DU, Tier-1 b-schools, engineering institutes, and corporate flagships.
  - 💻 **Devfolio**: Real-time integration with India's premier collegiate hackathons (SSCBS HackCBS, IITs, BITS, IIITs, ETHIndia).
  - 🌐 **Devpost**: Global flagship hackathons backed by Google Cloud, AWS, Microsoft, and premier global universities.
  - ⚡ **Codeforces**: Real-time competitive programming contest tracking with live start countdowns.
- **Platform Source Filters**: Instant 1-click filtering by source (`All Platforms`, `Unstop`, `Devfolio`, `Devpost`, `Codeforces`) with dynamic counts.
- **Strict Undergrad Filtering**: Eliminates MBA-only, PG-exclusive, and expired listings.
- **Collegiate Circuit Tagging**: Instant filters for **DU Circuit** (SRCC, SSCBS, Hindu, Hansraj, etc.), **IIM / IIT Tier-1 Premier**, and **Corporate & Global Flagships** (McKinsey, Bain, BCG, L'Oréal, HUL, etc.).
- **Discipline Tracks**: Case Competitions 📊, Hackathons & Dev 💻, Simulations & Auctions 📈, Writing & Research ✍️, Quizzes 🧠, Debates & MUN 🗣️, Competitive Programming ⚡.
- **Squad Finder Handshake**: Pre-fills competition details directly when clicking "Squad Up" and provides 1-click WhatsApp handshakes when teammates are accepted.
- **Zero-Setup Offline Fallback**: Works immediately out of the box using `localStorage` if Supabase credentials are not provided.
- **Zero-Dependency SVG Icons**: Clean, standalone icon library with zero external runtime footprint.

---

## 🛠️ Tech Stack

- **Frontend**: React 18+, Vite
- **Styling**: Vanilla CSS with Two19 Labs design tokens (`--bg`, `--surface`, `--ink`, `--primary`) supporting Light & Dark themes
- **API Ingestion Engine**: Parallel multi-source ingestion (`Promise.allSettled`) via Vercel Serverless Function & Vite Dev Server Middleware (`/api/competitions`)
- **Caching**: 15-minute in-memory deduplication & edge cache
- **Auth / Database**: Supabase with automatic `localStorage` offline fallback

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The Vite dev server will serve the React frontend and proxy the `/api/competitions` multi-source ingestion engine.

### 3. Production Build
```bash
npm run build
```

---

## 📄 License
MIT © Two19 Labs
