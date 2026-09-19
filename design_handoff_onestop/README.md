# Handoff: OneStop — competition discovery + team finder

## Overview

OneStop is an undergraduate-focused discovery layer over Unstop listings, plus a peer team finder. Students filter competitions, save filters that alert them on the home page when new listings match, bookmark listings, and find or post squads for team events. Acceptance into a squad unlocks a WhatsApp handshake.

This handoff covers a full redesign of the existing app (`onestop-two19.vercel.app`) onto the Two19 Labs brand.

## About the design files

The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these designs in the target codebase's existing environment** (the current app is React 18 + Vite + Supabase with vanilla CSS on `--bg/--surface/--ink/--primary` tokens) using its established patterns.

`OneStop.dc.html` is authored in a component format whose logic lives in a `class Component` block and whose markup uses `{{ value }}` holes with `<sc-for>` / `<sc-if>` control flow. Read it as a spec: the logic class shows the exact state shape and derived values, the template shows the exact markup and inline styles. Do not port the format itself — reimplement as ordinary React components.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, and interaction states. Recreate pixel-accurately using the codebase's existing libraries. All demo data (12 listings, 6 squad posts, 5 applications) is placeholder — replace with the real Unstop ingestion and Supabase tables.

## Design tokens

### Color

| Token | Hex | Use |
|---|---|---|
| Canvas | `#F6F6F4` | App background |
| Surface | `#FFFFFF` | Cards, sidebar, inputs, drawers |
| Surface sunken | `#F9F9F7` | Prize strip inside cards |
| Surface muted | `#F2F1ED` | Active nav row, tag chips, hover fills |
| Ink | `#1A1A19` | Primary text, secondary buttons, toasts |
| Ink secondary | `#55534D` | Body copy inside cards, inactive nav labels |
| Ink muted | `#75736C` | Labels, meta, counts, captions |
| Line | `#E7E6E2` | All 1px borders |
| Line light | `#F0EFEB` | Row dividers inside cards |
| Line lighter | `#EFEEEA` | Logo tile borders, segmented-control border |
| Divider dot | `#C9C7C1` | `·` separators in card meta |
| Checkbox border | `#CFCDC7` | Unchecked checkbox |
| Card hover border | `#D6D4CE` | Browse card hover |
| Primary (Lab Blue) | `#0F3FFE` | Primary buttons, active chips, badges, urgency, links |
| Primary hover | `#0C33CC` | Apply-button hover |
| Primary tint 7% | `rgba(15,63,254,0.07)` | Skill chips on squad cards, match-toggle fill |
| Primary tint 8% | `rgba(15,63,254,0.08)` | Urgent deadline pill fill, free-entry tint base |
| Primary tint 35% | `rgba(15,63,254,0.35)` | Urgent deadline pill border |
| Success | `#17A34A` | Live-sync dot |
| Success text | `#15803D` | "Free entry", "Accepted" |
| Success tint | `rgba(23,163,74,0.08)` / border `rgba(23,163,74,0.30–0.35)` | Free-entry and accepted pills |
| Scrim | `rgba(26,26,25,0.35)` | Modal and drawer overlay |

Lab Blue `#0F3FFE` is from the Two19 Labs brand guidelines. Keep it as the only accent; do not introduce red for urgency — urgency reads as blue here.

### Typography

Archivo (Google Fonts), weights 400/500/600/700. Antialiased.

| Role | Size | Weight | Other |
|---|---|---|---|
| Page title (h1) | 25px | 700 | `letter-spacing: -0.02em` |
| Card title — Browse | 17px | 700 | `letter-spacing: -0.01em`, `line-height: 1.3` |
| Section heading (h2) | 15px | 600 | |
| Card title — squads/rows | 15px | 600 | `line-height: 1.35` |
| Stat number | 25px | 700 | `letter-spacing: -0.02em` |
| Drawer title | 20px | 700 | `letter-spacing: -0.02em`, `line-height: 1.25` |
| Body / input | 14px | 400–500 | |
| Nav item | 14px | 500 (600 active) | |
| Meta, filter labels, buttons (small) | 13px | 500–600 | |
| Caption, counts, chips | 12px | 500–600 | |
| Badge, tag, checkbox mark | 11px | 600–700 | |

All multi-line headings use `text-wrap: pretty`. All pills, chips, counts and buttons use `white-space: nowrap`.

### Spacing, radius, shadow

- Page padding `26px 30px 48px`; sidebar padding `20px 14px`.
- Card padding `16–18px`; list-row padding `14–15px 18px`.
- Stack gaps: page sections `16–20px`, card internals `11–14px`, chip rows `6–9px`.
- Radius: cards/modals `12px` (modal `14px`), inputs and buttons `8–10px`, nav rows `9px`, logo tiles `8–10px`, tag chips `6px`, pills/chips `20px`, checkbox `4px`.
- Shadows: only one — `0 1px 2px rgba(26,26,25,0.10)` on the selected segment of a segmented control. Everything else is hairline borders.

## Layout shell

CSS grid, `grid-template-columns: 234px minmax(0, 1fr)`, min-height 100vh.

**Sidebar** (`#FFFFFF`, right border `#E7E6E2`, flex column, gap 20px):
1. Logo image, height 26px, `align-self: flex-start`, margin `2px 8px 0`.
2. Single nav list, gap 2px: Home, Browse, Bookmarks, Team finder, Requests. Each row is a full-width button, `padding: 9px 12px`, radius 9px, label left and optional count badge right. Active: background `#F2F1ED`, color `#1A1A19`, weight 600. Inactive: transparent, `#55534D`, weight 500, hover `#F2F1ED`. Badge: radius 20px, `padding: 1px 7px`, 11px/700 — blue `#0F3FFE` on white for Home (new matches) and Requests (pending applicants), grey `#E7E6E2` on `#55534D` for Bookmarks (count).
3. `margin-top: auto` profile button: 30px circular avatar (`#E7E6E2` fill, initials 11px/700 `#55534D`), name 13px/600, `College · Batch` 11px `#75736C`. Active state background `#F2F1ED`.

## Screens

### 1. Home

Purpose: the alert surface — what's new since last visit and what needs a response.

- **Header**: `Hi {firstName}` (h1) + one-line summary — `{n} new competitions matched your saved filters since you last looked.` or `Nothing new against your saved filters today.`
- **Stat tiles**: `repeat(auto-fit, minmax(146px, 1fr))`, gap 12px. Each: white card, padding `15px 17px`, label 12px `#75736C`, value 25px/700 (blue when non-zero for "New for you" and "Applicants waiting", otherwise ink). Tiles: New for you · Closing in 72h · Applicants waiting · Your requests out.
- **"Needs your response"** (only when incoming pending applications exist): white card, header row with h2 + "All requests" secondary button. Each row is `34px | 1fr | auto` grid, gap 13px: competition logo tile, applicant `Name · College · Batch` 14px/600 with `Competition · skill, skill` beneath in 13px `#75736C`, then Accept (blue) and Decline (bordered) buttons. Shows at most 2.
- **"Saved filters"**: white card, header row with h2 + "Add new". Each row clickable (hover `#FAFAF8`), `1fr | auto`: filter name 14px/600, a badge (`{n} new` blue filled, or `No change` bordered grey), the rule line `{description} · {n} open` in 13px `#75736C`, then a row with a 26px logo tile and `Closing soonest: {title} — {n} days`. Right-side `×` button stops alerting. Clicking a row navigates to Browse with that filter applied.
- Empty state when no saved filters: "No saved filters yet" + "Set filters in Browse and save them — new matches show up here."

### 2. Browse (and Bookmarks — same view)

Purpose: find competitions; Bookmarks is the same layout scoped to saved items, reachable from the sidebar or the tab.

- **Header**: title (`Browse` / `Bookmarks`) + subline. Browse: "Undergraduate-eligible only. MBA-only, PG-exclusive and expired listings are purged." Bookmarks: "{n} saved · bookmarks stay until you remove them".
- **Source strip**: white card, radius 10px, padding `11px 14px`, flex row gap 11px — a blue `UNSTOP ONLY` badge (radius 5px, `padding: 3px 8px`, 11px/700, `letter-spacing: 0.04em`) and 13px `#55534D` copy: "Curated for undergraduate eligibility, synced directly from Unstop. External opportunities are not shown."
- **Two-column body**: `grid-template-columns: 252px minmax(0, 1fr)`, gap 16px, `align-items: start`.

**Filter rail** (white card, padding `16px 16px 18px`, gap 18px):
- Header row: "Filters" (15px/600) + "Clear all" text button (`#75736C`, hover blue).
- Two checkbox groups — **Circuits** then **Categories** — each separated by a `#F0EFEB` top border with 15px padding. Group header: label 13px/600 + an "All" text button (blue when that group has selections, otherwise `#75736C`) that clears the group. Each item is a full-width button row, gap 9px: 16px checkbox (radius 4px; checked = blue fill, white `✓` 11px/700; unchecked = white with `#CFCDC7` border), label 13px (600 when checked), right-aligned count 12px `#75736C`.
- Two segmented controls — **Participation** (All / Solo / Teams (2+)) and **Entry fee** (All / Free / Paid). Label 12px/600 `#75736C`; track `#F6F6F4` with `#EFEEEA` border, radius 8px, 3px padding, 3px gap; each segment `flex: 1`, radius 6px, 12px type; selected segment white with the 1px shadow and weight 600.

**Results column** (gap 14px):
- Toolbar row: search input (`flex: 1`, min-width 210px, radius 10px, placeholder "Search competitions, hosts, prizes…"); an All / Bookmarked tab pair (white track, radius 10px, each tab with a count pill — active tab `#F2F1ED` with blue pill, inactive transparent with grey pill); a native `<select>` sort — Closing soonest / Most registrations / Recently added.
- Status line: 7px green dot + `Showing {n} opportunities · {filter description}`, with a right-aligned text button "Save filter & alert me" (blue) that becomes "Filter saved" (`#75736C`) once the current filter is stored.
- **Card grid**: `repeat(auto-fill, minmax(288px, 1fr))`, gap 14px. Card: white, radius 12px, padding `16px 17px 17px`, flex column gap 13px, hover border `#D6D4CE`, whole card opens the detail drawer.
  1. Top row `40px | 1fr | auto`: 40px logo tile (radius 9px, `#EFEEEA` border, contained image or initials on `#F2F1ED`), host name 13px/500 `#55534D`, 30px bookmark button (`+` / `×`, filled `#F2F1ED` when bookmarked) — `stopPropagation`.
  2. Title 17px/700.
  3. Prize strip: `#F9F9F7` on `#EFEEEA`, radius 9px, padding `9px 11px` — prize 13px/600 truncating with ellipsis, and an entry badge on the right (`Free entry` in green tint, or `₹200 entry` bordered grey).
  4. Meta row 12px `#55534D`: participation (`Solo / individual` or `3–4 members`) `·` format.
  5. Footer row: `{n} registered` 12px `#75736C` left, deadline pill right (`2 days left`; ≤3 days uses blue tint + blue border + blue text, otherwise white with `#E7E6E2` border and `#55534D` text).
  6. Actions: "Apply on Unstop" (blue, `flex: 1`, hover `#0C33CC`) and, on team-only listings, "Find teammates" (bordered) which routes to Team finder.
- Empty state card: "Nothing matches all of that" / "Drop a filter and try again." On the Bookmarked tab with filters active: "No bookmarks match these filters" / "Clear a filter to see the rest of your bookmarks."

### 3. Competition detail drawer

Right-side overlay: scrim `rgba(26,26,25,0.35)`, panel `min(460px, 100%)`, full height, white, scrollable, left border `#E7E6E2`. Close on scrim click or `×`; panel click stops propagation.

- Header bar: `{Discipline} · {Circuit}` 13px/600 `#75736C` + 30px `×` button.
- Body: 46px logo tile, then title 20px/700, host 13px `#75736C`, description 14px/1.55 `#55534D`.
- Fact table: rows `108px | 1fr`, padding `12px 20px`, divider `#F0EFEB` — Host, Circuit, Team size, Format, Prize, Entry, Closes in.
- Footer actions stacked, gap 9px: "Post a squad for this" (blue), bookmark toggle (bordered), "Open on Unstop" (bordered link), then a 12px `#75736C` note — "{n} squads are already looking for teammates on this." or "No squads posted for this yet — post one and applicants come to you."

### 4. Team finder

Purpose: find a squad to join, or post one.

- Header row: title + subline ("Squads looking for undergrad teammates. Once a lead accepts you, WhatsApp opens in one click.") and a blue "Post a squad" button.
- **Filter card** (white, padding `14px 16px`, gap 12px):
  - Row 1: search input (placeholder "Search by competition, college or skill") + scope tabs on a `#F6F6F4` track — All squads / Open spots / My posts, each with a count pill, selected segment white with the 1px shadow.
  - Row 2 (top border): "Skill needed" label + pill chips, one per skill that appears in at least one live post.
  - Row 3: "Category" label + pill chips, one per discipline present in live posts.
  - Row 4 (top border): a "Matches my skills" checkbox-chip (15px checkbox inside a pill; active pill = blue tint fill + blue border) filtering to posts wanting a skill on the user's profile; the live count `{n} squads`; and a right-aligned "Clear all".
  - Chip style throughout: radius 20px, `padding: 6px 13px`, 13px/500 — selected = blue fill, white text; unselected = white, `#E7E6E2` border, ink text.
- **Card grid**: `repeat(auto-fill, minmax(300px, 1fr))`, gap 12px. Card: white, radius 12px, padding `17px 18px`, flex column gap 11px.
  1. Row: spots left (12px/600, blue when ≤1 left, otherwise `#55534D`) and posted time (12px `#75736C`).
  2. Row: 34px logo tile + competition title 15px/600 and the post description 13px/1.5 `#55534D`.
  3. "Looking for" label 11px/600 `#75736C` + skill chips (radius 6px, `rgba(15,63,254,0.07)` fill, blue 12px/500 text).
  4. Lead line 12px `#75736C` — `Name · College · Batch`, or `Your post · {filled} of {size} filled` when it's the user's.
  5. Action button (`margin-top: auto`): own post → "Manage applicants" (ink fill, routes to Requests); open → "Request to join" (blue, opens apply modal); requested → "Requested — pending" (disabled-looking bordered); accepted → "Open WhatsApp group" (ink fill).
- Empty state card: "No squads match these filters" / "Clear a filter, or post your own squad and let applicants come to you."

### 5. Post a squad (modal)

Centered modal, `min(460px, 100%)`, white, radius 14px, scrim as above. Header "Post a squad" 16px/600 + `×`. Fields, gap 14px: competition `<select>` (all listings), "Spots open" text input, "Skills you need" chip multi-select, "What you are building" textarea (3 rows, vertical resize only). Submit "Post squad" (blue, full width) — prepends a post owned by the user, closes, routes to Team finder, toasts "Squad posted", resets the draft.

### 6. Request to join (modal)

Centered modal, `min(440px, 100%)`. Header "Request to join" + `×`. Shows the competition title 14px/600 and `{lead} · {spots left}` 13px `#75736C`. One textarea, "Why you", placeholder "One or two lines — what you bring and any relevant past competitions." Note in 12px `#75736C`: "Your profile, college, batch and skills go with this request. WhatsApp number is shared only if the lead accepts." Submit "Send request" (blue) — sets that post to `requested`, appends an outgoing application, toasts "Request sent to {firstName}".

### 7. Requests

Purpose: manage applications in both directions.

- Header + subline "Applications to your squads, and the ones you have sent out."
- Two pill tabs: `To my squads ({n})` / `Sent by me ({n})` — active = blue fill.
- List card. Each row `1fr | auto`, `align-items: start`:
  - Incoming: applicant name 14px/600 + status pill; sub-line `College · Batch · applied to {competition}`; the pitch quoted with a 2px `#E7E6E2` left rule and 11px left padding; skill tags (`#F2F1ED`, radius 6px).
  - Outgoing: competition title as the heading; sub-line `Squad led by {lead}`; same pitch and tags.
  - Status pills: Pending (white, `#75736C`), Accepted (green tint fill, `#15803D`, green border), Declined (`#F2F1ED`, `#55534D`).
  - Actions: incoming pending → Accept (blue) + Decline (bordered); accepted (either direction) → "Open WhatsApp" (ink fill); outgoing pending → Withdraw (bordered, removes the row).
- Empty states: "No one has applied to your squads yet." / "You have not requested to join any squad yet."

### 8. Profile

Max-width 620px. Header + subline "Squad leads see this when you apply. Skills drive what gets recommended to you." Single white card: a `repeat(auto-fit, minmax(180px, 1fr))` field grid — Name, College, Course, Graduating batch; then "Skills" chip multi-select; then "WhatsApp number" with the caption "Shared only after a lead accepts you." Inputs: radius 9px, `#E7E6E2` border, `padding: 10px 12px`, 14px; focus border blue.

## Interactions & behavior

- **Navigation**: single-page screen switch; opening any screen clears the open drawer.
- **Focus**: every input/select/textarea gets `outline: none; border-color: #0F3FFE` on focus.
- **Hover**: nav rows and secondary buttons → `#F2F1ED`; list rows → `#FAFAF8`; Browse cards → border `#D6D4CE`; Apply button → `#0C33CC`; text buttons → blue; drawer/modal close `×` → ink fill, white glyph.
- **Toast**: fixed, bottom 22px, centered, ink fill, white 13px/500, radius 10px, `padding: 12px 18px`, auto-dismiss after 2600ms, one timer reused (clear it on unmount). Messages: "Squad posted", "Request sent to {name}", "Request withdrawn", "Accepted — WhatsApp number shared", "Alert removed", "Already saved", "Saved — you will be alerted on new matches", "Opening WhatsApp…".
- **Bookmarking**: toggles from Browse cards and from the drawer; `stopPropagation` on the card button so it doesn't open the drawer.
- **Saving a filter**: stores the current discipline/circuit/window/participation/fee set; duplicates are rejected by comparing the human-readable description. Saved filters render on Home with a `fresh` count and the soonest-closing match.
- **WhatsApp handshake**: only exposed after an application reaches `accepted`. Wire to `https://wa.me/{number}` using the accepted party's stored number; it must not be readable before acceptance.
- No motion/transitions are specified beyond hover color changes — keep it still.

## State

Mirrors the current Supabase schema (`profiles`, `squad_posts`, `squad_applications`, `bookmarks`), plus a saved-filters table that does not exist yet.

```
screen            'home' | 'browse' | 'saved' | 'teams' | 'requests' | 'profile'
// browse filters
disc[], circ[]    string[]  multi-select
win               'any' | '3' | '7' | '14'
team              'any' | 'solo' | 'team'
fee               'any' | 'free' | 'paid'
q                 string
sort              'deadline' | 'popular' | 'new'
bookmarks         listingId[]
alerts            [{ id, disc[], circ[], win, team, fresh }]
// team finder filters
tq                string
tSkills[], tDisc[] string[]
tScope            'all' | 'open' | 'mine'
tMatch            boolean   // intersect post.want with profile.skills
// data
posts             [{ id, compId, spots, filled, size, posted, desc, want[], lead, mine, state }]
                  state: 'open' | 'requested' | 'accepted' | 'own'
apps              [{ id, postId, who, meta, skills[], pitch, status, dir }]
                  status: 'pending' | 'accepted' | 'rejected'; dir: 'in' | 'out'
reqTab            'in' | 'out'
openId            listingId | null      // detail drawer
postOpen          boolean               // post-a-squad modal
applyId           postId | null         // apply modal
pitch, draft      form buffers
profile           { name, college, batch, course, phone, skills[] }
toast             string | null
```

Derived per render: filtered + sorted listing list, per-filter alert hit counts and soonest match, sidebar badge counts, stat-tile values, "already saved" check, filter chip counts, and the team-finder visible post list.

### Data needed from the backend

- Listings: `title, host, circuit, discipline, daysToClose, prize, teamSize, mode, fee, description, tags[], registrationCount, logoUrl, unstopUrl`. Registration count and organiser logo are new requirements on the ingestion.
- Saved filters with a `fresh` counter — needs a per-user `last_seen_at` so new matches can be counted since the previous visit. This is the one genuinely new backend surface.
- Squad posts need `size`, `filled` and `want[]` to render spots and skill chips.

## Assets

- `logo-onestop.png` — the OneStop lockup, background removed, transparent PNG. Sidebar renders it at 26px height, width auto.
- **Organiser logos are not included.** Every listing currently carries `logo: null` and falls back to an initials tile (up to 2 letters derived from the host, skipping "&", "and", "of", "college", "company") on `#F2F1ED`. Wire real images by setting `logo` per listing from the Unstop payload, or by passing a `{ host: url }` map. Render them as a contained background/`<img>` on white inside the bordered tile so varied aspect ratios stay aligned. Sizes: 26px (Home alert), 34px (Home inbox, squad card), 38–40px (Browse card), 46px (drawer).
- Archivo from Google Fonts, weights 400;500;600;700.

## Brand notes

From the Two19 Labs brand guidelines: Lab Blue is `#0F3FFE`. The guidelines' display system (Archivo Black caps, Instrument Serif italic, Bone `#F2EFEA` canvas) is the marketing-site voice and is deliberately **not** used here — product UI runs on the quieter neutral canvas above with blue as a functional accent only. Two open items worth resolving separately: the guidelines define no dark mode (the current app has one; this redesign does not), and they forbid emoji (the current app uses emoji category labels; these are replaced by text labels and logo tiles).

## Files

- `OneStop.dc.html` — the full design: all six screens, both modals, the detail drawer, all filter logic and demo data.
- `logo-onestop.png` — transparent OneStop lockup used in the sidebar.
