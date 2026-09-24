# Handoff: OneStop Team Finder (standalone page)

## Overview
Redesign of `src/components/TeamFinderScreen.jsx` (+ `PostSquadModal.jsx`). Team Finder becomes a standalone page with the same shell as Browse (`CompetitionsPage.jsx`): back button + title header, a sticky filter card on the left, results grid on the right. Listings are split into **My listings** and **Other listings**. Cards are rebuilt to lead with the competition, show spots open, the lead + college, a link to the competition, and WhatsApp.

## About the design files
`Team Finder v2.dc.html` is a **design reference built in HTML** (open it directly in a browser; `support.js` must sit beside it). It is not production code. Recreate it in the existing React app using its patterns: CSS variables from `src/index.css`, icons from `src/components/icons.jsx`, `ThemeToggle`, the Browse page's filter-sidebar markup/CSS (`.cc-*` classes in `CompetitionsPage.css`), and the existing Firestore data hooks. All styling in the reference is inline for prototyping only.

The mock data (`POSTS`, `OWN`, `COMPS`, `ME`) at the top of the `<script data-dc-script>` block shows the data shape each view needs.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii and states are final and match the OneStop light theme. Dark theme: map every hex below to its token (table in *Design tokens*) and it will follow the existing night palette.

---

## Screen: Team finder page

### Layout
- Page padding `24px clamp(16px, 3vw, 32px) 32px`; content `max-width: 1480px; margin: 0 auto`; vertical gap 18px.
- **Header**: flex, space-between, wraps. Bottom border `1px solid --border`, padding-bottom 16px.
  - Left: 36×36 back button (1px border, radius 8, white bg; hover border → `--text-primary`) + title block.
  - Title `h1` 25px / 700 / letter-spacing −0.02em: **"Team finder"**.
  - Subtitle 14px `--text-secondary`, line-height 1.45: *"Find a squad for any competition, or post your own. Message the lead on WhatsApp before or after you request."*
  - Right: **Post a squad** primary button (38px tall, radius 9, `--primary` bg, plus icon 16px, 14px/600; hover `#0C33CC`), then `ThemeToggle` (icon-only, 38×38) and the notifications bell (38×38, red count badge `#E11D48`), same as Browse.
- **Body**: CSS grid `minmax(216px, 256px) minmax(0, 1fr)`, gap 18px, `align-items: start`.

### Filter sidebar (left)
Card: white, `1px solid --border`, radius 12, padding `16px 16px 18px`, `position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow-y: auto`, gap 16px between blocks. Blocks after the first two are separated by `border-top: 1px solid #F0EFEB` + `padding-top: 15px`.

1. **Header row**: "Filters" 15px/600 + blue count pill (active filter count, hidden when 0) · "Clear all" 13px/500 `--text-tertiary`, hover `--primary`.
2. **Your Browse filter** callout: bg `#F9F9F7`, border `#EFEEEA`, radius 9, padding `10px 11px`. Title "Your Browse filter" 12px/600 `--text-secondary`; right link "Apply" (12px/600 `--primary`) → becomes "Applied" in `--text-tertiary` when the current category+circuit selection equals the user's saved Browse filter. Body 12px `--text-tertiary`: "{categories} · {circuits}. Apply it to see squads for the competitions you're already tracking." Clicking Apply copies the saved Browse categories + circuits into this page's filters.
3. **Quick checkboxes** (no heading): "Matches my skills", "Lead from my college ({college})".
4. **Categories**: Case Comps, Hackathons, Writing & Research, Quizzes, Simulations, Debates (same list as Browse). Heading row: label 13px/600 + "All" link (blue when group has a selection, grey otherwise; clears the group).
5. **Circuits**: DU Circuit, IIMs, IITs & Premier, Corporate & Global, Others.
6. **Skills needed**: the `SKILLS` list from `initialData.js`; first 5 shown, then "Show all 10" / "Show fewer" link (12px/600 blue).
7. **Open spots** segmented control: Any · 1 left · 2+.
8. **Competition closes** segmented control: Any · This week · This month.

Checkbox row: full-width button, padding 5px 0, gap 9px, 13px text (600 when checked, 500 otherwise). Box 16×16, radius 4, border 1.5px `#CFCDC7`; checked → bg + border `--primary`, white 11px check icon. Right-aligned count 12px `--text-tertiary` = number of results that option would return **given all other active filters** (faceted count; blank when 0).

Segmented control: track bg `#F6F6F4`, border `#EFEEEA`, radius 8, padding 3, gap 3. Segment: flex 1, radius 6, padding 5px 4px, 12px. Active: white bg, `0 1px 2px rgba(0,0,0,0.08)`, 600 `--text-primary`; inactive: transparent, 500 `--text-secondary`. Group label above: 12px/600 `--text-tertiary`.

### Results column (right)
**Toolbar** (flex, wrap, gap 10, every control 40px tall, radius 10, white, 1px border):
- **Tabs** segmented: "My listings" · "Other listings", each with a count pill (active: `--primary` bg / white text; inactive: `#E7E6E2` / `--text-secondary`; 11px/700). Active tab bg `#F2F1ED`, 600. **Default tab: Other listings.**
- **Search** (flex `1 1 240px`, min 210px): search icon 16px + input, placeholder "Search competitions, leads, colleges or skills". Matches competition title, host, lead name, lead college, needed skills.
- **Sort** select: "Sort:" label + Newest / Closing soonest / Most spots open.

**Status row** (gap 8, wraps): 7px green dot `#17A34A` · text 13px `--text-secondary`, `white-space: nowrap`:
- Other: "Showing {n} squads looking for teammates"
- Mine: "{n} listings you lead or applied to"
- Followed by removable chips for each active filter: bg `rgba(15,63,254,0.07)`, text `--primary`, border `rgba(15,63,254,0.20)`, radius 20, padding `3px 8px 3px 10px`, 12px/600, trailing 11px ×.

**Grid**: `repeat(auto-fill, minmax(min(300px, 100%), 1fr))`, gap 14.

**Other listings** = squads by others that are `open` or `full`, one ungrouped grid.
**My listings** = two titled groups (title 15px/700 + grey count pill `#E7E6E2`):
- "Posted by you": squads the current user leads.
- "Squads you applied to": others' squads where the user is `requested` or `accepted`.
Filters and search apply to both tabs.

---

## Component: Squad card
White, `1px solid --border`, radius 12, padding `16px 17px 17px`, flex column gap 12, whole card clickable (opens detail panel; own listings open the review modal). Hover: border `#D6D4CE`. Buttons inside stop propagation.

Top to bottom:

1. **Meta row** (space-between):
   - Left, gap 5: **Category tag**: bg `#F2F1ED`, `--text-primary`, radius 6, padding `3px 8px`, 12px/600, with a 6×6 radius-2 color square before the text. Category colors: Case Comps `#0F3FFE`, Hackathons `#7C3AED`, Writing & Research `#D97706`, Quizzes `#DB2777`, Simulations `#0891B2`, Debates `#17A34A`. **Circuit tag**: transparent, `1px solid --border`, `--text-secondary`, radius 6, padding `2px 8px`, 12px/500, ellipsis.
   - Right: **Registration deadline** = the *competition's* registration close, in **hours**: clock icon 13px + "{h}h left to register", 12px/600. Color: `#DC2626` if h < 6, `#B45309` if h < 24, `#15803D` otherwise. `h = round((deadline - now) / 3600000)`.
2. **Competition title** `h3` 16px/700, line-height 1.3, letter-spacing −0.01em, `text-wrap: pretty`.
3. **Host row** (space-between): host name 12px `--text-secondary` (ellipsis) · **"View competition"** link 12px/600 `--primary` + external-link icon 12px, opens the Unstop URL in a new tab.
4. **Lead's note** 13px `--text-secondary`, line-height 1.5, clamped to 2 lines.
5. **Spots + skills**:
   - Row: one 8px dot per team slot (filled `--primary` for taken seats incl. lead, hollow `1.5px solid #CFCDC7` for open) + "{open} of {total} open" 12px/700 (or "{total} of {total} filled" in `--text-tertiary`). Right side (not on own cards): green fit hint `#15803D` 11px/600 with check icon: "You fit" if user has every needed skill, else "{m} of {n} match you". Hidden when 0 matches.
   - **Needed-skill tags**: only the skills the host listed as needed, all in the same highlighted style: bg `rgba(15,63,254,0.07)`, text `--primary`, border `rgba(15,63,254,0.20)`, radius 6, padding `3px 8px`, 12px/500. If none listed: one neutral tag "All skills welcome" (white, `--border`, `--text-secondary`).
6. **Footer** (`margin-top: auto`, `border-top: 1px solid #F0EFEB`, padding-top 12, gap 12):
   - **Lead row**: 32px avatar circle (initial; `--primary` bg / white; own card: `#F2F1ED` / `--text-secondary` and name "You") · name 13px/600 · "{college} · {year}" 12px `--text-tertiary` · right: status badge or "{posted}" 12px grey.
     Badges (radius 20, padding `2px 9px`, 11px/700): Requested (`#F9F9F7`/`#E7E6E2`/`--text-secondary`), You're in (`rgba(23,163,74,0.08)`/`rgba(23,163,74,0.30)`/`#15803D`), Full & Closed (`#F2F1ED`/`#E7E6E2`/`--text-tertiary`), own with pending: "{n} new" (`--primary` bg, white).
   - **Actions** (gap 8, buttons radius 9, padding `9px 12px`, 13px/600):

| State | Buttons |
|---|---|
| open | **WhatsApp** (secondary: white, `--border`, WhatsApp glyph `#25D366` 15px) + **Request to join** (primary, flex 1) |
| requested | WhatsApp + **"Requested · Withdraw"** (flex 1, `#F9F9F7` bg, clock icon, `--text-secondary`; hover text `#DC2626`), which sets the state back to open |
| accepted | **"Message {leadFirst} on WhatsApp"** (flex 1, `#17A34A` bg, white; hover `#15803D`) |
| full | "Squad full" static block (`#F2F1ED`, `--text-tertiary`, centered) |
| own | **Review {n} requests** (primary, flex 1; when 0 pending: secondary "Manage team") + **Edit** + **Close** / **Reopen** (secondary) |

WhatsApp links: `https://wa.me/91{number}?text=…` (existing logic in TeamFinderScreen). The design shows WhatsApp **before** acceptance. Confirm with product; this exposes the lead's number to everyone. If not wanted, hide the secondary WhatsApp button for `open`/`requested`.

---

## Squad detail panel (click a card)
Right-side sheet, `width: min(480px, 100%)`, full height, white, left border; backdrop `rgba(26,26,25,0.35)` closes it.
- Top bar: "Squad · posted {posted}" 12px/600 grey + 32×32 close button.
- Body (padding 20, gap 24): 44px host-initials tile + title 19px/700 + host 13px; meta line "{category} · Teams of {n} · {deadline}" + "View on Unstop" link. Sections with 11px/600 uppercase grey labels (letter-spacing 0.03em): **From the lead** (14px, lh 1.55), **Team** (bordered list; lead row with "Lead" tag; open slots as dashed-circle rows "Open spot / Could be you" on `#F9F9F7`), **Looking for** (needed-skill tags + "You have m of n"), **{Lead} brings** (neutral outline tags).
- Sticky footer by state: Request to join (full width) + helper "{Lead} sees your profile and a short note. Your number is shared only if you're accepted." · Requested: grey bar "Request sent. Waiting on {Lead}." + Withdraw · Accepted: green "Message {Lead} on WhatsApp" + "You're on the team. The rest of the squad can see your number." · Full: grey notice.

## Review requests modal (own listing)
Centered, `min(580px, 100%)`, max-height 90vh, radius 14, shadow `0 20px 40px rgba(0,0,0,0.25)`.
- Header: competition title 17px/700 + overlapping 22px avatar stack of the team (open seats dashed) + "{open} of {total} spots open". Close button.
- Underline tabs: Pending / Accepted / Declined with counts (active: 2px `--primary` underline, 600).
- Applicant card (radius 12, padding `14px 15px`): 36px initials avatar, name 14px/700, "{college} · {year}", right "Has m of n you need" green; pitch in a `#F9F9F7` box; skill tags (applicant skills that match the listing's needed skills in green `rgba(23,163,74,0.08)`/`#15803D`, others neutral `#F2F1ED`).
- Actions: Pending → **Accept** (primary) + **Decline** (secondary). Accepted → WhatsApp (green tint) + "Remove from squad" link. Declined → "Move back to pending".
- Empty copy per tab: "No pending requests / New requests show up here." · "Nobody accepted yet / Accept a request to add them to the team." · "Nothing declined / Requests you decline stay here in case you change your mind."

## Post a squad / Edit squad modal
Centered, `min(560px, 100%)`, max-height 92vh. Header "Post a squad" / "Edit squad" + "People apply with a short note. You pick who joins."
1. **Competition**: search input "Search competitions on Unstop" + up to 4 result rows (32px initials tile, title, "host · team size", deadline right). Selected row: `--primary` border, `rgba(15,63,254,0.07)` bg. Link "Not on Unstop?" swaps to manual fields: name / organiser / link (optional).
2. **Team size** (2–6) and **Open spots** (1 to size−1) steppers: bordered box, 34px `#F2F1ED` −/+ buttons, value 15px/700. Lowering size clamps open spots.
3. **Looking for** ("Pick up to 3") and **You bring** ("Helps people decide") pill toggles over SKILLS (selected: `--primary` fill, white).
4. **Note to applicants** (optional textarea, placeholder "What you're aiming for, how you'll work, when you meet.").
5. **WhatsApp number** with "+91" prefix, prefilled from profile; helper "Only shared with people you accept."
6. "Posting as {name} · {college} · {year}" strip with Edit link.
- Footer: "{open} open of {size}" grey · Cancel · **Post squad** / **Save changes**. On post, switch to My listings.

## Loading & empty
- **Loading**: 6 skeleton cards mirroring card anatomy, `#F2F1ED` blocks, `opacity 1 → 0.5 → 1` pulse, 1.4s ease-in-out infinite.
- **Empty** (dashed `#D6D4CE` border, radius 12, centered, padding 44/24): title 16px/700 + 13px grey body + buttons **Clear filters** (only if filters active) and **Post a squad**.
  - Mine, no filters: "Nothing here yet" / "Squads you post, and squads you request to join, show up here."
  - Otherwise: "No squads match these filters" / "Clear a filter, or post your own squad and let applicants come to you."

---

## State
```
tab: 'mine' | 'other'          // default 'other'
q: string; sort: 'newest'|'closing'|'spots'
filters: { match, myCollege: bool; cats, circuits, skills: string[]; spots: 'any'|'1'|'2'; closes: 'any'|'week'|'month' }
skillsExpanded: bool
detailId, reviewId: string|null; reviewTab: 'pending'|'accepted'|'declined'
postOpen: bool; editId: string|null; form: {...}
```
Per listing (from the viewer's perspective): `open | requested | accepted | full` for others; `own | closed` for the viewer's own. Needs from data: competition `{title, host, url, category, circuit, registrationDeadline, teamSize}`, listing `{lead, leadCollege, leadYear, postedAt, total, members[], want[], have[], note, whatsapp}`, applications `{name, college, year, skills[], pitch, status}`, and the user's saved Browse filter (`categories`, `circuits`) plus profile skills.

Filter logic: categories/circuits match the listing's competition; skills = listing needs any selected skill; "Matches my skills" = at least one needed skill is in the user's profile skills; spots "1 left" = exactly 1, "2+" = ≥2; closes by registration deadline ≤ 7 / ≤ 30 days.

## Design tokens (light) → `src/index.css`
| Hex | Token / use |
|---|---|
| `#F6F6F4` | `--bg` page |
| `#FFFFFF` | `--surface` cards |
| `#F9F9F7` | subtle surface / input bg |
| `#F2F1ED` | `--surface-hover`, neutral tags, avatars |
| `#E7E6E2` | `--border` |
| `#F0EFEB` | inner card dividers |
| `#D6D4CE` | hover border |
| `#CFCDC7` | checkbox / hollow dot border |
| `#1A1A19` | `--text-primary` |
| `#55534D` | `--text-secondary` |
| `#75736C` | `--text-tertiary` |
| `#0F3FFE` / `#0C33CC` | `--primary` / hover |
| `#17A34A` / `#15803D` | success / success text |
| `#B45309` | warning (deadline < 24h) |
| `#DC2626` | danger (deadline < 6h, withdraw hover) |
| `#25D366` | WhatsApp glyph |

Font: **Archivo** 400/500/600/700. Radii: 4 (checkbox), 6 (tags, segments), 8–9 (buttons, inputs), 10 (toolbar), 12 (cards), 14 (modals), 20/999 (pills). Overlay `rgba(26,26,25,0.35)`.

## Assets
- `logo-onestop.png`: from `src/assets/`.
- Icons are inline Lucide-style SVGs (search, sort, clock, external-link, check, x, plus, moon, bell, arrow-left). Use `icons.jsx` equivalents.
- WhatsApp glyph: the existing one in TeamFinderScreen.

## Files
- `Team Finder v2.dc.html`: the full interactive reference (filters, tabs, all card states, detail panel, review modal, post modal). Open in a browser; `support.js` must sit beside it.
- `support.js`: runtime for the reference file only. Don't port it.
- `logo-onestop.png`
