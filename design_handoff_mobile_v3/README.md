# Handoff: OneStop mobile v3

## Overview
Mobile-first pass over every OneStop screen: Home, Browse, Squads (Team finder), Inbox (was Requests), Profile and the competition detail panel. Target viewport is 390 × 844; rules apply at `max-width: 480px` (and `768px` where the app already switches to mobile nav).

**Do not change the desktop layout.** Every change below goes inside the existing mobile media queries or behind the mobile nav breakpoint.

## About the design files
`OneStop Mobile v3.dc.html` is a **design reference built in HTML**, not production code. Recreate it in the existing React + CSS codebase (`src/components/*.jsx` / `*.css`, tokens in `src/index.css`) using its current components and patterns. Open the file in a browser to view it; it needs `support.js` and `assets/` next to it. `OneStop Mobile - current.dc.html` shows the app as it shipped before this pass, for comparison.

## Fidelity
High-fidelity. Colors, sizes, spacing and copy are final. Use existing CSS variables where one matches the hex listed here.

---

## Global changes (all screens)

### App background
- Canvas on mobile: `#F3EFE6` (warm cream), replacing `#F6F6F4`. Cards stay `#FFFFFF`. Inset panels inside cards that used `#F6F6F4` also become `#F3EFE6`.

### Top bar (identical on every screen)
- Height 60px, background `#FFFFFF`, bottom border `1px solid #E7E6E2`, sticky top, `padding: 0 12px 0 16px`.
- Left: OneStop logo (`public/onestop-logo.png`), height 24px.
- Right: theme toggle, then notifications bell, `gap: 8px`. Each is 40 × 40, radius 10px, `1px solid #E7E6E2`, white bg, 18px icon, color `#1A1A19`.
- Bell badge: top/right −5px, 18px tall, min-width 18px, `#E11D48`, white 10px/700 text, `2px solid #FFFFFF` border.
- **Remove the hamburger menu and its drawer on mobile.** The bottom nav covers the same destinations.

### Page titles
- Remove the big page header blocks (h1 + description) on Browse, Squads, Inbox and Profile. Content starts directly under the top bar with `padding-top: 12px`.

### Bottom nav
- Rename **Requests → Inbox** (label and `aria-label`). Icon unchanged. Other tabs unchanged.

### Consistency rules
- Card radius: **12px everywhere** (Browse cards were 16px, Profile sections 14px).
- Card text minimum **12px** (was 10.5–11.5px for host, prize, team size, deadline, registrations, countdown, fee tag, skill tags, status labels). Exceptions: notification/nav badges and avatar initials.
- Card action buttons: **44px tall** (Apply, Squad up, Find Teammates, Request to join, Accept, Decline, Chat, Remove).
- Apply buttons: `#0F3FFE` background and border, white text (OneStop blue, same as other primary buttons).

---

## Screens

### 1. Home
**Greeting block** — `padding: 0 14px` (was 30px), column, `gap: 12px`.
- "Good evening, Riya": 22px/700, −0.02em.
- College line, CSS grid `13px | 1fr`, column gap 6px, 12.5px, line-height 1.35:
  - Row 1: graduation-cap icon (13px, `#0F3FFE`) + full college name (`#55534D`, 500, **wraps, no ellipsis**).
  - Row 2 (column 2): "UG 2nd Year" in `#75736C`.
- Stats: **no box**. A single wrapping row, `gap: 4px 16px`, baseline-aligned. Each item: number 14px/700 + label 12.5px/500 `#75736C`, gap 5px. Copy: **4** new today · **3** squads for you · **2** requests. The "2" is `#0F3FFE`, the others `#1A1A19`.

**Section headers** (Bookmarks, Top competitions, Top squads) — `padding: 0 14px`, column, gap 4–6px.
- Row: h2 17px/700 + count pill (Bookmarks: `#F2F1ED`/`#55534D`; others: `#0F3FFE`/white; 11px/700, radius 20px, `2px 9px`) + "See all →" pushed right (13.5px/600 `#0F3FFE`, 44px tap height via negative margin).
- Sub-line 12.5px `#75736C`, **lowercase**:
  - Bookmarks: "soonest deadlines first"
  - Top competitions: horizontally scrolling row: "closing soonest" · filter chips (Case Comps, DU Circuit, Free entry; 12px/600, `rgba(15,63,254,0.07)` bg, `rgba(15,63,254,0.20)` border, radius 999px) · "Edit" link.
  - Top squads: "recruiting for competitions you follow"
- Remove the trailing "More competitions / Explore all" card from the Top competitions rail. "See all" replaces it.

**Rails** — horizontal scroll, `gap: 12px`, `padding: 4px 14px 14px`, scroll-snap start.
- Bookmark cards: **268px** wide (same as desktop compact), `padding: 13px 14px 14px`, `gap: 9px`.
- Top competition and Top squad cards: **318px** wide.

### 2. Browse
Header block (replaces the title/description/"Unstop only" badge), column, `gap: 10px`:
1. Search row, `gap: 8px`: search field (flex 1, 44px, white, `1px solid #E7E6E2`, radius 10px, 16px input text so iOS doesn't zoom, placeholder "Search competitions, colleges, prizes") + filter button 44 × 44 (active state: `rgba(15,63,254,0.07)` bg, `#0F3FFE` border and icon, count badge 18px `#0F3FFE`).
2. Count + sort row: green dot + "**24** competitions" (13px `#55534D`) on the left; sort button "Closing soonest ▾" (13px/600) on the right.
3. Active filter chips, horizontally scrolling: 30px tall, radius 999px, blue tint, each with an × (20px hit area); trailing "Clear all".

Cards: radius 12px, text ≥12px, buttons 44px, Apply in `#0F3FFE`.

### 3. Squads (Team finder)
Header block, column, `gap: 10px`:
1. Segmented tabs, 44px, white, `1px solid #E7E6E2`, radius 10px, 3px inner padding. Active tab `#F2F1ED` bg, 600 weight, count pill `#0F3FFE`/white; inactive `#55534D`, count pill `#E7E6E2`. Labels: "Other listings 6", "My listings 4".
2. Search row (placeholder "Search competitions, leads or skills") + filter button (inactive style).
3. "**6** squads recruiting" + sort "Newest ▾".

Floating action button: "+ Post a squad", `right: 14px; bottom: 72px` (above the bottom nav), 48px tall, radius 999px, `#0F3FFE`, white 14px/600, shadow `0 6px 18px rgba(15,63,254,0.32), 0 2px 4px rgba(26,26,25,0.12)`.

**Squad card** (same size as competition cards, ~282px tall): white, `1px solid #E7E6E2`, radius 12px, `padding: 16px 17px 17px`, `gap: 10px`. Top to bottom:
1. Meta row: category color square (6px, radius 2px) + category + "·" + circuit (12px/600 `#55534D`, circuit 500 and ellipsis) | deadline on the right with clock icon, 12px/600, red `#DC2626` when under 24h, else `#15803D`.
2. Competition title 16px/700, 2-line clamp; host 12.5px `#75736C`, one line.
3. Spots panel: `#F3EFE6` bg, radius 10px, `padding: 8px 12px`, `gap: 7px`.
   - Dots (9px circles, filled `#0F3FFE`, empty white with `1.5px solid #CFCDC7`) + "2 of 4 open" 13px/700 | "✓ You fit" 12px/600 `#15803D` if applicable.
   - Skill tags on **one line only** (white bg, `#0F3FFE` text, `1px solid rgba(15,63,254,0.20)`, radius 6px, 12px). Overflow collapses into a "+N" tag (white, `#55534D`, `1px solid #E7E6E2`). No skills → "All skills welcome".
4. Team row, top border `1px solid #F0EFEB`, `padding-top: 10px`: 28px avatar (`#0F3FFE`, initials 11px/700) + "**Lead name** · College, Year" (12.5px, one line, ellipsis) | posted time 12px `#75736C`.
5. Actions: WhatsApp icon button 42 × 42 (white, border, green logo) + "Request to join" flex 1, 42px, `#0F3FFE`. Full squad → single grey "Squad full" block (`#F2F1ED`/`#75736C`).
- The lead's note is **not shown on the card**. It appears in the detail view.

### 4. Inbox (was Requests)
- No page header. Starts with the existing "To my squads (3) / Sent by me (2)" tabs.
- Request row actions (all 44px, radius 10px, 13.5px):
  - **Pending:** [chat icon button 44 × 44] [Decline, outlined grey, flex 1] [Accept, `#0F3FFE`, flex 1].
  - **Accepted:** [Chat, flex 1] [Remove, `rgba(239,68,68,0.08)` bg, `rgba(239,68,68,0.4)` border, `#DC2626` text].
- **Chat routing:** if the applicant saved a WhatsApp number, the chat button opens WhatsApp (green WhatsApp logo; accepted state is a green `#16A34A` "Chat on WhatsApp" button). If not, it opens in-platform chat (blue chat-bubble icon; accepted state is a `#0F3FFE` "Chat" button). The in-platform chat screen is not designed yet; stub the route.
- Skill tags and status labels at 12px.

### 5. Profile
- No page header.
- Section order: **profile card → Personal & Campus Information → Academic Standing → Skills & Capabilities → Account**. Account (change password, sign out, delete) moves to the bottom.
- Profile card: remove the "SQUAD LEAD VIEW / ● Live Preview" strip. Card padding 18px.
- Form sections: radius 12px, `padding: 16px`, `gap: 14px`. Heading row is title (15px/700) with a one-line lowercase description beside it (12.5px `#75736C`, wraps under on narrow widths):
  - Personal & Campus Information: "shown on your squad applications"
  - Academic Standing: "sets which competitions you're eligible for"
  - Skills & Capabilities: "squad leads recruit by these"
- WhatsApp number hint: "optional. shared only once you're accepted into a squad. skip it and you'll chat on OneStop instead."

### 6. Competition detail
- Close × button 40 × 40 (was 30), 18px glyph.
- Action stack, top to bottom:
  1. **Apply on Unstop**: full width, 48px, `#0F3FFE`, white 15px/600, external-link icon, radius 10px. Opens the Unstop listing in a new tab.
  2. Row, `gap: 8px`: "Post a squad" (flex 1, 44px, white bg, `#0F3FFE` border and text, 600) + "Bookmark" (flex 1, 44px, white, `1px solid #E7E6E2`, 500).
  3. Existing helper line ("1 squad is already looking for teammates on this.").
- The old separate "Open on Unstop" button is removed (merged into Apply).

---

## State
- `inboxRequest.hasWhatsApp: boolean` decides the chat button variant and target.
- Squad card: `wantShown` / `+N` overflow is computed from available width (one line of tags). A CSS-only alternative is fine: `flex-wrap: nowrap; overflow: hidden` plus a measured "+N".
- Home stats read from existing counts (new-today matches, squads matching skills, incoming requests).

## Design tokens used
- Blue (primary/Apply): `#0F3FFE`
- Ink `#1A1A19`, secondary `#55534D`, muted `#75736C`
- Border `#E7E6E2`, hairline `#F0EFEB`, chip grey `#F2F1ED`
- Mobile canvas `#F3EFE6`, card `#FFFFFF`
- Success `#15803D` / `#16A34A`, danger `#DC2626`, badge red `#E11D48`, WhatsApp `#25D366`
- Radii: cards 12px, inputs/buttons 10px, tags 6px, pills 999px
- Tap target minimum 44px
- Font: Archivo (existing)

## Assets
- `assets/onestop-logo.png` (from `public/onestop-logo.png`)
- Icons are inline Lucide-style SVGs matching `src/components/icons.jsx`

## Files
- `OneStop Mobile v3.dc.html`: final design, screens 3a–3f
- `OneStop Mobile - current.dc.html`: before state
- `support.js`, `assets/`: needed to open the HTML files locally
