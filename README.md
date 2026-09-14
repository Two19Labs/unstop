# Arena 🏆

> **Live Collegiate Competitions & Squad Finder Hub**

Arena is a standalone web platform that aggregates active collegiate opportunities directly from Unstop, filters strictly for undergraduates across all Indian and global universities, categorizes competitions by circuit and discipline, and connects students with batchmates through a built-in **Squad Finder** with WhatsApp handshakes.

---

## ⚡ Key Highlights

- **Real-Time Unstop Ingestion**: Scrapes 35+ targeted search queries across DU, Tier-1 b-schools, engineering institutes, and corporate flagships.
- **Strict Undergrad Filtering**: Eliminates MBA-only, PG-exclusive, and dead listings.
- **Circuit Tagging**: Instant filters for **DU Circuit** (SRCC, SSCBS, Hindu, Hansraj, etc.), **IIM / IIT Tier-1 Premier**, and **Corporate & Global Flagships** (McKinsey, Bain, BCG, L'Oréal, HUL, etc.).
- **Discipline Tracks**: Case Competitions 📊, Hackathons 💻, Simulations & Auctions 📈, Writing & Research ✍️, Quizzes 🧠, Debates & MUN 🗣️.
- **Squad Finder Handshake**: Pre-fills competition details directly when clicking "Squad Up" and provides 1-click WhatsApp handshakes when teammates are accepted.
- **Zero-Setup Offline Fallback**: Works immediately out of the box using `localStorage` if Supabase credentials are not provided.
- **Zero-Dependency SVG Icons**: Eliminates external icon package mismatches.

---

## 🛠️ Tech Stack

- **Framework**: React 18+ & Vite
- **Styling**: Vanilla CSS with design tokens (`--bg`, `--surface`, `--ink`, `--primary`) supporting Light & Dark themes
- **API & Middleware**: Vercel Serverless Function / Vite Dev Server Middleware (`/api/competitions`)
- **Database / Auth**: Supabase with automatic `localStorage` offline fallback

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
Open [http://localhost:5173](http://localhost:5173) in your browser. The Vite dev server will automatically serve both the React frontend and the `/api/competitions` API proxy.

### 3. Production Build
```bash
npm run build
```

---

## 📄 License
MIT
