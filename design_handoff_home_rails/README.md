# Handoff: OneStop Home — filter-driven rails

## Overview

Redesign of the OneStop home page (`src/components/HomeScreen.jsx`). The old home was a stack of
summary panels: greeting, four stat tiles, "Needs your response", saved-filter alert list, "Active
Browse Filter", "Closing within 72 hours", and an "UNSTOP ONLY" banner. All of that is removed
except the greeting.

The new home is three horizontal card rails, driven by the user's auto-saved Browse filter:

1. **Bookmarks** — every saved competition, soonest deadline first. Filters do NOT apply here.
2. **Top competitions** — matches the saved Browse filter, closing soonest first.
3. **Top squads** — open teams recruiting for filtered competitions.

Each rail shows 3 cards and a "More →" button at the far right of its header. Cards are the same
visual language as the Browse and Team Finder grids, so the rails read as a preview of those pages.

A filter strip sits above the rails showing the active Browse filter chips, with "Edit in Browse"
and "Clear".

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing intended
look and behavior, not production code to copy. The task is to **recreate these designs inside the
existing OneStop React app** using its established patterns: plain React function components,
inline `style` objects plus the existing CSS files, the icon set in `src/components/icons.jsx`, and
the data already flowing through `App.jsx`.

Do not port the HTML prototype markup or its templating constructs. Read the prototypes for
layout, measurements, and copy; write idiomatic components in the app.

Prototype files use a template syntax where `{{ x }}` is a value hole and `<sc-for list>` /
`<sc-if value>` are loop and conditional wrappers. In React these become `.map()` and `&&`.

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, and copy are final. Recreate pixel-perfectly
using the app's existing tokens (`src/index.css`) — every value below already exists there or in
`BrowseScreen.jsx` / `TeamFinderScreen.jsx`.

## Target files

| File | Change |
| --- | --- |
| `src/components/HomeScreen.jsx` | Replace the whole body with the new layout. The old sections are deleted. |
| `src/components/HomeScreen.css` (if present) | Add rail scroll styling; remove rules for deleted sections. |
| `src/App.jsx` | No structural change. Home needs the same props Browse and Team Finder already receive: the saved filter object, the competitions list, the posts/squads list, and the bookmark set. |
| `src/components/icons.jsx` | Reuse `BookmarkIcon`, `ExternalLinkIcon`, `ZapIcon`. No new icons. |

Existing helpers to reuse rather than reimplement: `initialsOf()` and `describeFilter()` from
`src/data/initialData.js`.

## Screens / Views

### Home (single screen)

**Purpose:** on landing, the user sees what they saved, what matches their filter, and which teams
need members — with one click through to the full page for each.

**Page layout**

- Shell: CSS grid, `grid-template-columns: 236px minmax(0, 1fr)`. Left column is the existing
  `Sidebar` — unchanged.
- `<main>`: `padding: 26px 0 48px`, flex column, `gap: 26px`. Note the **zero horizontal padding**
  — rails must bleed to the viewport edge so cards can scroll out. Every non-rail block instead
  carries its own `padding: 0 30px` (or `margin: 0 30px`).
- Background: `#F6F6F4`.

**1. Greeting**

- Wrapper: `padding: 0 30px`.
- `<h1>`: "Hi {firstName}", `font-size: 25px`, `font-weight: 700`, `letter-spacing: -0.02em`,
  `color: #1A1A19`, no margin.
- Subline `<p>`: `margin: 7px 0 0`, `font-size: 14px`, `color: #75736C`, `text-wrap: pretty`.
  Copy: `"{N} competitions and {M} squads match your Browse filter — case · du circuit · free entry."`
  (filter labels lowercased, joined with ` · `). If no filter is saved, use
  `"{N} competitions and {M} squads open right now."`

**2. Filter strip** (hidden when no filter is saved)

- Card: `margin: 0 30px`, `background: #FFFFFF`, `border: 1px solid #E7E6E2`,
  `border-radius: 12px`, `padding: 12px 16px`, flex row, `align-items: center`, `gap: 11px`,
  `flex-wrap: wrap`.
- Label: "Your Browse filter", `font-size: 12px`, `font-weight: 600`, `color: #75736C`,
  `white-space: nowrap`.
- Chips: flex row, `gap: 6px`, wrap. Each chip `background: #0F3FFE`, `color: #FFFFFF`,
  `border-radius: 20px`, `padding: 5px 12px`, `font-size: 12px`, `font-weight: 500`, nowrap.
  One chip per active filter facet (discipline, circuit, free-entry, etc.).
- Hint: "Every row below follows it", `font-size: 12px`, `color: #75736C`.
- Right group: `margin-left: auto`, flex, `gap: 8px`.
  - "Edit in Browse" — `border: 1px solid #E7E6E2`, `border-radius: 8px`, `background: #FFFFFF`,
    `color: #1A1A19`, `padding: 7px 12px`, `font-size: 13px`, `font-weight: 500`.
    Hover `background: #F2F1ED`. Navigates to Browse with the filter applied.
  - "Clear" — borderless, `color: #75736C`, `padding: 7px 4px`, `font-size: 13px`,
    `font-weight: 500`. Hover `color: #0F3FFE`. Clears the saved filter; rails fall back to
    unfiltered lists.

**3. Rail section (×3, identical structure)**

Section wrapper: flex column, `gap: 13px`.

Header row: `padding: 0 30px`, flex, `align-items: center`, `gap: 10px`, containing —

- `<h2>` title: `font-size: 16px`, `font-weight: 700`, `letter-spacing: -0.01em`, `color: #1A1A19`.
- Count badge:
  - Bookmarks: `background: #E7E6E2`, `color: #55534D`.
  - Competitions and Squads: `background: #0F3FFE`, `color: #FFFFFF`, text `"{total} match"`.
  - Both: `border-radius: 20px`, `padding: 2px 9px`, `font-size: 11px`, `font-weight: 700`, nowrap.
- Sort note, `font-size: 12px`, `color: #75736C`, nowrap:
  - Bookmarks: "Soonest deadline first · filters don't apply"
  - Competitions: "Closing soonest first"
  - Squads: "Recruiting now"
- "More →" button: `margin-left: auto`, `border: 1px solid #E7E6E2`, `border-radius: 9px`,
  `background: #FFFFFF`, `color: #1A1A19`, `padding: 8px 13px`, `font-size: 13px`,
  `font-weight: 600`, nowrap. Hover `background: #F2F1ED`.
  Targets: Bookmarks → Bookmarks screen; Competitions → Browse (filter applied);
  Squads → Team Finder (filter applied).

Rail track: `display: flex`, `gap: 14px`, `overflow-x: auto`,
`scroll-snap-type: x proximity`, `padding: 4px 30px 14px`, `align-items: stretch`.
The `4px` top and `14px` bottom padding give room for card hover borders and the scrollbar; the
`30px` sides align the first card with the header.

Scrollbar styling (webkit), applied via a `.rail` class:

```css
.rail::-webkit-scrollbar { height: 8px; }
.rail::-webkit-scrollbar-track { background: #EFEEEA; border-radius: 20px; }
.rail::-webkit-scrollbar-thumb { background: #D6D4CE; border-radius: 20px; }
.rail::-webkit-scrollbar-thumb:hover { background: #C0BEB7; }
```

## Cards

All three card types share: `background: #FFFFFF`, `border: 1px solid #E7E6E2`,
`border-radius: 12px`, flex column, `scroll-snap-align: start`, and hover
`border-color: #D6D4CE` (border color only — no lift, no shadow).

### Bookmark card — `flex: 0 0 268px; width: 268px; padding: 14px 15px 15px; gap: 11px`

1. Top row: `display: grid`, `grid-template-columns: 34px minmax(0, 1fr) auto`,
   `align-items: start`, `gap: 10px`.
   - Host avatar: `34px` square, `border-radius: 8px`, `border: 1px solid #EFEEEA`,
     `background: #F2F1ED`, `color: #55534D`, centered initials, `font-size: 11px`,
     `font-weight: 700`. Initials from `initialsOf(host)`.
   - Host name: `font-size: 12px`, `font-weight: 500`, `color: #55534D`, `line-height: 1.35`,
     `padding-top: 2px`, `text-wrap: pretty`.
   - Remove button (`×`): `28px` square, `border: 1px solid #E7E6E2`, `border-radius: 8px`,
     `background: #F2F1ED`, `color: #1A1A19`, `font-size: 13px`, `line-height: 1`,
     `title="Remove bookmark"`. Hover `background: #E7E6E2`. Un-bookmarks and removes the card
     from the rail.
2. Title `<h3>`: `font-size: 15px`, `font-weight: 700`, `line-height: 1.3`,
   `letter-spacing: -0.01em`, `text-wrap: pretty`, `color: #1A1A19`.
3. Prize strip: `background: #F9F9F7`, `border: 1px solid #EFEEEA`, `border-radius: 9px`,
   `padding: 8px 10px`. Text `font-size: 12px`, `font-weight: 600`, `color: #1A1A19`,
   `line-height: 1.35`, `text-wrap: pretty` — **must wrap, never truncate**; prize is a primary
   decision signal and long strings clip at this width.
4. Meta row: `justify-content: space-between`. Left = discipline, `font-size: 12px`,
   `color: #75736C`. Right = deadline pill (see **Deadline pill**).
5. "Apply on Unstop" — `margin-top: auto`, full width, `border: 1px solid #0F3FFE`,
   `border-radius: 9px`, `background: #0F3FFE`, `color: #FFFFFF`, `padding: 9px 12px`,
   centered, `font-size: 13px`, `font-weight: 600`. Hover `background: #0C33CC`,
   `border-color: #0C33CC`. Opens `item.unstopUrl` in a new tab
   (`target="_blank" rel="noopener noreferrer"`).

### Competition card — `flex: 0 0 302px; width: 302px; padding: 16px 17px 17px; gap: 13px`

1. Host row: grid `40px minmax(0, 1fr)`, `gap: 11px`. Avatar `40px`, `border-radius: 9px`, same
   colors as above, `font-size: 12px`. Host name `font-size: 13px`, `font-weight: 500`,
   `color: #55534D`, `line-height: 1.35`, `padding-top: 2px`.
2. Title `<h3>`: `font-size: 17px`, `font-weight: 700`, `line-height: 1.3`,
   `letter-spacing: -0.01em`, `text-wrap: pretty`.
3. Prize strip: `background: #F9F9F7`, `border: 1px solid #EFEEEA`, `border-radius: 9px`,
   `padding: 9px 11px`, `justify-content: space-between`, `gap: 10px`.
   - Prize text: `font-size: 13px`, `font-weight: 600`, `color: #1A1A19`, wraps (see above).
   - Fee badge, `flex: none`, `border-radius: 6px`, `padding: 3px 8px`, `font-size: 11px`,
     `font-weight: 600`, nowrap:
     - Free: `border: 1px solid rgba(23,163,74,0.30)`, `background: rgba(23,163,74,0.08)`,
       `color: #15803D`, text "Free entry".
     - Paid: `border: 1px solid #E7E6E2`, `background: #FFFFFF`, `color: #55534D`,
       text `"{fee} entry"`.
4. Team/mode row: `font-size: 12px`, `color: #55534D`, `gap: 9px`, separated by a `·` in
   `color: #C9C7C1`. E.g. "2–4 members · Online".
5. Footer row: `justify-content: space-between`. Left = `"{registeredCount} registered"`,
   `font-size: 12px`, `color: #75736C`, locale-formatted `en-IN`. Right = deadline pill.
6. Action row: `margin-top: auto`, flex, `gap: 8px`.
   - "Apply on Unstop" — `flex: 1`, same blue button spec as the bookmark card but
     `padding: 10px 12px`, nowrap. Opens `unstopUrl` in a new tab.
   - "Squad up" — `border: 1px solid #E7E6E2`, `border-radius: 9px`, `background: #FFFFFF`,
     `color: #1A1A19`, `padding: 10px 12px`, `font-size: 13px`, `font-weight: 600`, nowrap.
     Hover `background: #F2F1ED`. Opens the existing squad-up / find-teammates flow for that
     competition (same handler Browse uses).

### Squad card — `flex: 0 0 302px; width: 302px; padding: 16px 17px 17px; gap: 12px`

1. Top row: `justify-content: space-between`, `gap: 8px`.
   - Spots pill: `border-radius: 20px`, `padding: 2px 9px`, `font-size: 11px`,
     `font-weight: 700`, `letter-spacing: 0.02em`, nowrap.
     - 1 spot left: `background: rgba(15,63,254,0.08)`, `border: 1px solid rgba(15,63,254,0.35)`,
       `color: #0F3FFE`.
     - 2+: `background: rgba(15,63,254,0.07)`, `border: 1px solid rgba(15,63,254,0.20)`,
       `color: #0F3FFE`.
     - Text: `"1 spot left"` / `"{n} spots left"`.
   - Posted time: `font-size: 12px`, `color: #75736C`.
2. Lead row: flex, `gap: 10px`.
   - Avatar: `38px` circle, `background: #0F3FFE`, `color: #FFFFFF`, first initial,
     `font-size: 13px`, `font-weight: 700`.
   - Name: `font-size: 14px`, `font-weight: 700`, `color: #1A1A19`, followed by a `6px` circle in
     `#16A34A` (online indicator; render only when the lead is actually online).
   - Meta line: `"{college} · {gradYear}"`, `font-size: 12px`, `color: #75736C`, `margin-top: 1px`.
3. Competition block: `border-top: 1px solid #F0EFEB`, `padding-top: 10px`.
   - Eyebrow "Competing in": `font-size: 11px`, `font-weight: 600`, `color: #75736C`,
     `text-transform: uppercase`.
   - Competition title `<h3>`: `margin: 3px 0 0`, `font-size: 15px`, `font-weight: 700`,
     `line-height: 1.35`, `text-wrap: pretty`.
   - Host: `font-size: 12px`, `color: #55534D`, `margin-top: 4px`.
4. Skills block: label "Teammates needed with:", `font-size: 11px`, `font-weight: 600`,
   `color: #75736C`. Chips below, `gap: 5px`, wrap:
   `background: rgba(15,63,254,0.08)`, `color: #0F3FFE`, `border-radius: 6px`, `padding: 3px 8px`,
   `font-size: 11px`, `font-weight: 600`, nowrap.
5. Footer: `margin-top: auto`, `padding-top: 10px`, `border-top: 1px solid #F0EFEB`.
   Full-width "Request to join" — blue button spec, `padding: 10px 14px`. Fires the existing
   join-request flow (`ApplyModal`). When the squad is full, the button should follow whatever
   Team Finder already does for full squads.

### Deadline pill (competitions + bookmarks)

`border-radius: 20px`, `font-size: 12px`, `font-weight: 600`, nowrap.

- ≤ 3 days: `border: 1px solid rgba(15,63,254,0.35)`, `background: rgba(15,63,254,0.08)`,
  `color: #0F3FFE`.
- \> 3 days: `border: 1px solid #E7E6E2`, `background: #FFFFFF`, `color: #55534D`.
- Padding: `4px 10px` on competition cards, `3px 9px` on bookmark cards.
- Text: `"1 day left"` / `"{n} days left"`.

## Interactions & Behavior

- **Rails scroll horizontally** with `scroll-snap-type: x proximity` and
  `scroll-snap-align: start` per card. Trackpad and shift+wheel work natively. No arrow buttons —
  if keyboard access is needed, make the track focusable and map ←/→ to
  `scrollBy({ left: ±316, behavior: 'smooth' })`.
- **"More →"** navigates to the corresponding full page, carrying the saved filter for the
  competitions and squads rails.
- **Bookmark `×`** un-bookmarks immediately and removes the card. Cards after it slide left; no
  confirmation. Consider the app's existing toast/undo pattern if one exists.
- **"Apply on Unstop"** opens `unstopUrl` in a new tab. It should also fire whatever
  applied/clicked tracking Browse already fires.
- **"Squad up"** and **"Request to join"** reuse the existing modals — no new flows.
- **Filter changes elsewhere propagate here.** Changing the filter in Browse and returning to Home
  re-filters both the competitions and squads rails. Bookmarks are never filtered.
- Hover states are the only motion. No entrance animations, no transforms on the cards.

## Empty states

Each rail needs one. Keep them inside the rail track as a single full-width panel:
`background: #FFFFFF`, `border: 1px dashed #D6D4CE`, `border-radius: 12px`, `padding: 22px`,
message `font-size: 13px`, `color: #75736C`, with a blue text action.

- No bookmarks: "Nothing saved yet. Bookmark a competition and it shows up here." → "Browse competitions"
- No filter matches: "No competitions match your filter." → "Edit in Browse"
- No squads: "No squads recruiting for these competitions yet." → "Post a squad"

## State Management

Home is presentational. It needs, from `App.jsx`:

| Prop | Purpose |
| --- | --- |
| `user` | First name for the greeting |
| `savedFilter` | Active auto-saved Browse filter; drives chips, subline, and both filtered rails |
| `competitions` | Full competition list; Home filters + sorts by `days` ascending |
| `squads` / `posts` | Open team posts; Home filters to those whose competition passes the filter, sorted by recency |
| `bookmarks` | Bookmarked ids or items; Home sorts by `days` ascending |
| `onNavigate(screen, opts)` | "More →" and empty-state actions |
| `onToggleBookmark(id)` | Bookmark `×` |
| `onSquadUp(competition)` | "Squad up" |
| `onRequestJoin(squad)` | "Request to join" |

Home holds no local state beyond what a rail needs for scroll position. Slice with
`.slice(0, 3)` — keep the count as a named constant (`CARDS_PER_RAIL = 3`) since it was the main
thing tuned during design review.

Sorting: competitions and bookmarks by `days` ascending (deadline soonest first); squads by posted
recency. The full totals in the count badges come from the **unsliced** filtered lists — the badge
reports how many exist, the rail shows three.

## Design Tokens

All of these already exist in `src/index.css`.

**Colors**

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#F6F6F4` | Page background |
| Surface | `#FFFFFF` | Cards, sidebar, buttons |
| Surface sunken | `#F9F9F7` | Prize strip |
| Surface muted | `#F2F1ED` | Avatars, active nav, hover |
| Border | `#E7E6E2` | Card and button borders |
| Border light | `#F0EFEB` | In-card dividers |
| Border subtle | `#EFEEEA` | Avatar and prize-strip borders |
| Border hover | `#D6D4CE` | Card hover border, dashed empty state |
| Ink | `#1A1A19` | Primary text |
| Ink secondary | `#55534D` | Secondary text |
| Ink muted | `#75736C` | Labels, meta |
| Divider dot | `#C9C7C1` | `·` separators |
| Accent | `#0F3FFE` | Primary buttons, chips, urgency |
| Accent hover | `#0C33CC` | Primary button hover |
| Accent wash | `rgba(15,63,254,0.08)` | Urgency pills, skill chips |
| Accent wash soft | `rgba(15,63,254,0.07)` | Multi-spot pill |
| Accent border | `rgba(15,63,254,0.35)` | Urgency pill border |
| Accent border soft | `rgba(15,63,254,0.20)` | Multi-spot pill border |
| Success | `#15803D` | "Free entry" text |
| Success wash | `rgba(23,163,74,0.08)` | "Free entry" background |
| Success border | `rgba(23,163,74,0.30)` | "Free entry" border |
| Online | `#16A34A` | Lead online dot |

**Typography** — Archivo, weights 400/500/600/700.

| Role | Size / weight | Extras |
| --- | --- | --- |
| Page title | 25px / 700 | `letter-spacing: -0.02em` |
| Rail title | 16px / 700 | `letter-spacing: -0.01em` |
| Competition card title | 17px / 700 | `line-height: 1.3`, `letter-spacing: -0.01em` |
| Bookmark / squad comp title | 15px / 700 | `line-height: 1.3`–`1.35` |
| Lead name | 14px / 700 | |
| Body, buttons | 13px / 500–600 | |
| Meta, pills | 12px / 500–600 | |
| Badges, chips, eyebrows | 11px / 600–700 | uppercase on eyebrows |

**Spacing** — `4, 5, 6, 8, 9, 10, 11, 13, 14, 16, 17, 26, 30`px. Rail gap `14px`;
section gap `26px`; page gutter `30px`.

**Radii** — `6px` chips/badges · `8px` small buttons and avatars · `9px` primary buttons,
prize strip, large avatars · `12px` cards · `20px` pills · `50%` circular avatars.

**Shadows** — none. The design is flat; borders carry all separation.

**Card widths** — `302px` competitions and squads, `268px` bookmarks. Fixed, not responsive.

## Responsive behavior

Desktop-first, matching the rest of the app. The rails degrade acceptably on narrow viewports
because they already scroll. Below ~900px the sidebar should collapse the way it does elsewhere in
the app; card widths stay fixed.

## Assets

- `logo-onestop.png` — already in the app at `src/assets/logo-onestop.png`. Included here only so
  the prototypes render.
- No new icons. Reuse `BookmarkIcon`, `ExternalLinkIcon`, `ZapIcon` from
  `src/components/icons.jsx`.
- Host logos are initial-based avatars generated with `initialsOf()` — no image assets.

## Data note

The prototypes contain sample competitions, squads, and bookmarks (DU-circuit case comps, Tata
Crucible, Brandstorm, etc.) purely so the layout has something to render. **Do not ship any of it.**
Every card must come from the live Unstop-synced data already in `App.jsx`.

## Files

| File | What it is |
| --- | --- |
| `OneStop Home - horizontal.dc.html` | The design to build — three rails, 3 cards each, "More →" per rail |
| `OneStop Home.dc.html` | Earlier column variant of the same content. Reference only, do not build |
| `OneStop Home — current.dc.html` | Recreation of the existing home page, for before/after comparison |
| `logo-onestop.png` | Logo used by the prototypes |

Open the HTML files directly in a browser. In `OneStop Home - horizontal.dc.html`, the markup is
the template at the top of the file and the sample data is the `Component` class below it.
