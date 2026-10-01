# Handoff: "What is OneStop?" walkthrough v3 (animated tour)

## Overview
Redesign of `src/components/WalkthroughModal.jsx` (opened from the sidebar "What is OneStop?" button and `ProfileScreen`). Goes from 5 static, text-heavy slides to **6 short slides** whose right-hand pane is a **self-playing demo**: real platform components animate, and a fake cursor moves and clicks through each feature. Slides auto-advance like a video; the active dot doubles as a progress bar.

## About the design files
`What is OneStop v3.dc.html` is a **design reference built in HTML** (open it directly in a browser; it needs `support.js` beside it). It is not production code. Rebuild it inside the existing React + Vite app using its patterns: `WalkthroughModal.jsx/.css`, the design tokens in `src/index.css`, `icons.jsx`, `InstitutionLogo`, `OneStopLogo`. `What is OneStop - current.dc.html` recreates today's modal, for comparison.

## Fidelity
**High-fidelity.** Every preview card is copied from the live component's markup and CSS. In production, **render the real components (or shared presentational versions of them) with mock props**. Don't fork the styles; that way the previews stay in sync with the platform.

| Slide | Real source to reuse |
|---|---|
| 1 filters | `CompetitionsPage.jsx` unified filter card (`.cc-filter-card.cc-unified-filter-card`, CompetitionsPage.css 567–885, sub-pills 3031+) |
| 2 browse | `HomeScreen.jsx` applied-prefs row (`.home-applied-*`) + Top competitions rail card (inline styles ~1806–2005, `getUrgencyConfig`, `.card-urgency-*`) |
| 3 bookmarks | `BookmarkRoundTrackerCard.jsx/.css`, `closing-soon` theme |
| 4 team finder | `HomeScreen.jsx` Top squads card, "Request to join" → "Requested  -  pending" states |
| 5 requests | `RequestsScreen.jsx/.css` row: pending (Chat / Decline / Accept) → accepted (Chat / WhatsApp) |
| 6 profile | `HomeScreen.jsx` header identity + KPIs (mobile labels: "new today", "squads for you", "requests") |

---

## Modal shell (changes vs current)
- Max width **660px** (was 760). Radius 14, border `--line`, same shadow as today.
- Header: padding `10px 18px`, bg `--surface-sunken`, bottom border `--line`. Left: `OneStopLogo height={20}` only. **Remove the "/ TOUR" tag.** Right: "`{n} of 6`" (12px/600 `--ink-muted`) + close button (unchanged).
- Body: grid `repeat(auto-fit, minmax(240px, 1fr))`, gap 20, padding `18px 20px 16px`, min-height 330, align-items center. Stacks to one column on mobile.
- Footer: padding `10px 18px`, bg `--surface-sunken`, top border.
  - Left: dots.
  - Right: buttons in this order:
    - **Skip**: ghost, 13px/600 `--ink-muted`.
    - **Back**: secondary, 13/600, hidden on the first slide.
    - **Next**: primary, 13.5/600, ArrowRightIcon. On the last slide it's labelled **"Set up profile"**.

### Text pane
- Badge: plain text, 13px/600 `--primary` (no pill).
- Title: 25px/700, line-height 1.15, letter-spacing −0.025em, `text-wrap: balance`, `--ink`.
- Description: 14.5px/400, line-height 1.5, `--ink-secondary`, max-width 300px, `text-wrap: pretty`.
- Gap 8px between the three.
- Copy is **all lowercase** (matches the "soonest deadlines first" style). Keep it platform-neutral: don't call out Unstop by name.

### Visual pane
- `position: relative`, min-height 300, contents centered.
- Previews render inside a wrapper with **`zoom: 0.78`**, so the real components keep their true px values and are just scaled down.
- The fake cursor and click ripple sit in this pane, outside the zoom, absolutely positioned with `pointer-events: none`.
- Cards keep a fixed width (`flex: none`) so text never re-wraps.

## Slides & copy (verbatim)
| # | badge | title | description |
|---|---|---|---|
| 1 | filters | tell us what you're into | pick circuits, categories, sub-tracks and fee. counts update as you go. |
| 2 | browse | every competition that fits, in one place | pulled from every major platform and campus portal. undergrad-only, nothing expired, soonest deadlines first. |
| 3 | bookmarks | every round, counted down | bookmark a competition and we track each round's deadline, not just registration. |
| 4 | team finder | find teammates from any college | post a squad or request to join one. see the skills each squad needs upfront. |
| 5 | requests | accepted? whatsapp them, or chat here | open whatsapp in one tap, or keep it on onestop chat if you'd rather not share your number. |
| 6 | profile | add your college, get your feed | set your college, year and skills. we hide what you can't enter and show squads that need you. |

(Use curly apostrophes ’ in production.)

---

## Animation system
Each slide has a local clock `t` (ms), which resets to 0 on slide change. The prototype ticks every 40ms; use `requestAnimationFrame` in production. All UI state is **derived from `t`**, so a slide loops cleanly.

```js
SCRIPTS = [
  { len: 7200, steps: [{at:1300,cue:'du'},{at:2500,cue:'case'},{at:3700,cue:'fin'},{at:4900,cue:'free'}] },
  { len: 8000, steps: [] },                                   // browse: scroll only
  { len: 5000, steps: [{at:2400,cue:'open'}] },
  { len: 5000, steps: [{at:2000,cue:'join'}] },
  { len: 6800, steps: [{at:1900,cue:'accept'},{at:3400,cue:'wa',hover:true},{at:4600,cue:'chat',hover:true}] },
  { len: 5000, steps: [{at:2600,cue:'req',hover:true}] },
]
```

### Cursor
- **Targets:** elements tagged `data-cue="…"`. Measure them with `getBoundingClientRect()` relative to the visual pane, aiming at x = left + min(width × 0.5, 40) and y = top + height × 0.55.
- **Start position:** pane (88% width, 96% height).
- **Movement:** for each step, travel to the target during `[at−850, at−120]` with easeInOutCubic.
- **Fade:** opacity 0→1 over the first 300ms; fades out over 300ms starting 1100ms after the last step.
- **Click** (steps without `hover`):
  - The cursor scales to 0.85 for 240ms.
  - The target gets `transform: scale(0.94)` for 240ms (0.12s ease).
  - A ripple appears at the cursor tip: 28px circle, `rgba(15,63,254,0.25)`, scale 0.4→1.5 and opacity 1→0 over 480ms.
- **Look:** dark arrow (#1A1A19 fill, 1.4px white stroke) with `drop-shadow(0 2px 3px rgba(0,0,0,.25))`. The path is in the HTML.

### Auto-advance & dots
- When `t ≥ len`, go to the next slide. The last slide loops. Controlled by an `autoAdvance` prop (default true).
- Next / Back / dots / ← → keys still work, and each resets `t`.
- Dots are 8×8 with radius 4:
  - Past: solid `--primary`.
  - Future: `--line`.
  - Active: 24px wide, track `rgba(15,63,254,.18)`, inner fill `--primary` at width `t/len × 100%`. The width change animates over 0.25s `cubic-bezier(.16,1,.3,1)`.
- Suggest pausing on hover or when the tab is hidden, and respecting `prefers-reduced-motion` (show the end state, no cursor).

### Per-slide state over time
1. **Filters.** Filter card is 268px wide. It shows Circuits, Categories (Case Comps, Hackathons, Quizzes, Debates) and Entry Fee; Platforms is omitted for space.
   - t≥1300: DU Circuit checked. Checkbox becomes `#1c4980`; the Circuits count badge shows 1.
   - t≥2500: Case Comps checked; its sub-track tray appears (Finance & Valuation, Strategy & Consulting, Marketing & Brand, B-Plan & Pitch).
   - t≥3700: "Finance & Valuation" pill active (`#0F3FFE` bg, white text, ✓).
   - t≥4900: Entry Fee segmented control switches All → Free.
   - Header badge = number of active picks. "Reset All" shows once at least one pick is active.
   - Sample counts: DU 48, IIMs/IITs 36, Corporate 72, Others 58, Case 64, Hackathons 41, Quizzes 27, Debates 22. In production, use real `metrics`.
2. **Browse.**
   - Applied-prefs chips fade and slide up in sequence (6px → 0, 0.25s each, at 150/330/510/690/870ms): sort badge "Closing soonest", then filter chips "DU Circuit", "Case Comps", "Free", then the "Edit in Browse" link.
   - The card list fades in at 900ms. It's a single column of 302px rail cards in a 360px-tall window with a top/bottom fade mask (`transparent 0 → #000 4% … 88% → transparent`).
   - From t=1300 to 7300 it scrolls to the bottom with easeInOutCubic (translateY by gridHeight − windowHeight).
   - 10 cards (data below). Urgency card themes follow `.card-urgency-red/yellow/blue`.
3. **Bookmarks.**
   - Round tracker in `closing-soon` theme: "ROUND 2 OF 3", "Closing soon" badge, round title "Executive Case Deck & Pitch", "Due 12 Oct, 11:59 PM", a live ⏱ countdown in `Xh MMm SSs`, and "→ Next: National Grand Finale · 20 Oct".
   - The button `#155EEF` turns hover `#0E4ED3` between t 1700 and 2900; click at 2400.
   - **Label is "Open Portal"** (rename from "Open Unstop" in the real component too).
4. **Team finder.** Squad card: "1 spot left", "2h ago", Devanshi K. (SRCC · UG 3rd Year), skill chips. Click at 2000 changes "Request to join" to the disabled "Requested  -  pending" state.
5. **Requests.**
   - Starts pending: grey "Pending" badge, buttons Chat / Decline / Accept.
   - Click Accept at 1900: badge becomes green "Accepted"; buttons become Chat / WhatsApp.
   - Cursor hovers WhatsApp at 3400, then Chat at 4600 (Chat fills `#0F3FFE` with white text from t > 4400).
   - Two caption lines sit below the card (12px `--ink-muted`, each with a 6px dot). Opacity 0.35 before accept, 1 after:
     - ● blue: **chat** stays on onestop, no number shared
     - ● green: **whatsapp** opens a direct chat with the context prefilled
6. **Profile.**
   - "Good evening, Aarav", grad-cap icon, "SRCC · UG 2nd Year".
   - KPIs count up from 0 to 12 / 4 / 2 over 1100ms each, starting at 300 / 450 / 600ms.
   - The cursor hovers the "requests" KPI at 2600 (opacity 0.75 between t 2300 and 3800).

## Sample data (browse cards)
All cards: Free Entry, Apply + Squad up buttons.

| initials | host | title | prize | team | ends | regs | pill | urgency |
|---|---|---|---|---|---|---|---|---|
| SR | Shri Ram College of Commerce (SRCC) | SRCC Business Conclave Case Challenge 2026 | ₹1,50,000 Prize Pool | 1–3 Members | 12 Oct, 11:59 PM | 3,240 | 10 days left | blue |
| SS | Shaheed Sukhdev College of Business Studies | SSCBS Consulting Case Challenge | ₹1,00,000 | 1–4 | 3 Oct, 11:59 PM | 2,410 | 18h left | yellow |
| KM | Kirori Mal College | KMC Finance Case Showdown | ₹50,000 | 1–3 | 2 Oct, 6:00 PM | 1,920 | 4h left | red |
| HC | Hindu College | Hindu Case Clash 2026 | ₹75,000 | 2–4 | 7 Oct | 1,180 | 5 days left | blue |
| HR | Hansraj College | Hansraj Strategy Summit Case Comp | ₹60,000 | 2–3 | 8 Oct | 860 | 6 days left | blue |
| SC | St. Stephen's College | Stephen's Policy Case Competition | ₹45,000 | 1–3 | 11 Oct | 780 | 9 days left | blue |
| SV | Sri Venkateswara College | Venky Valuation Case Cup | ₹55,000 | 1–3 | 13 Oct | 1,050 | 11 days left | blue |
| LS | Lady Shri Ram College for Women | LSR Marketing Case Fiesta | ₹40,000 | 2–3 | 14 Oct | 640 | 12 days left | blue |
| MH | Miranda House | Miranda ESG Case Challenge | ₹35,000 | 2–4 | 16 Oct | 420 | 14 days left | blue |
| RC | Ramjas College | Ramjas B-Plan & Case Duel | ₹30,000 | 2–3 | 18 Oct | — ("Recently Listed") | 16 days left | blue |

Bookmark, squad and request slides all use the SRCC Business Conclave Case Challenge 2026.

## Assets
- `assets/onestop-logo.png` is the same file as `public/onestop-logo.png`. Use `OneStopLogo` in the app.
- College logos are hot-linked URLs, listed in `LOGOS` inside the HTML file. **For production, download them into `public/walkthrough/` (or the CDN)** rather than hot-linking. Render them via `InstitutionLogo`, which falls back to initials on error.
- Icons come from `src/components/icons.jsx`: Trophy, Users, Calendar, Flame, Clock, ExternalLink, ChevronDown, Check, Close, ArrowRight. The chat bubble and grad-cap SVGs are copied from RequestsScreen and HomeScreen.

## Tokens used (light theme; dark mode via existing `[data-theme='dark']` tokens)
- **Base:** `--surface #FFFFFF`, `--surface-sunken #F9F9F7`, `--surface-muted #F2F1ED`, `--ink #1A1A19`, `--ink-secondary #55534D`, `--ink-muted #75736C`, `--line #E7E6E2`, `--divider-dot #C9C7C1`.
- **Primary:** `--primary #0F3FFE`, `--primary-hover #0C33CC`.
- **Status:** success #16A34A; urgency yellow #F59E0B, red #EF4444; bookmark blue #155EEF.
- **Font:** Archivo (already loaded in `index.html`).
- **Radius:** 6 / 9 / 12 / 14 / 20.

## Files
- `What is OneStop v3.dc.html`: the final design (open in a browser).
- `What is OneStop - current.dc.html`: recreation of today's modal.
- `support.js`: runtime needed to open the .dc.html files.
