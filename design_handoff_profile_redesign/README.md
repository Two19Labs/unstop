# Handoff: Profile Screen Redesign (OneStop)

## Overview
Redesign of the individual profile screen (`#profile`) in OneStop. It replaces `src/components/ProfileScreen.jsx` + `ProfileScreen.css`. The app shell (Sidebar, top-right ThemeToggle + NotificationCenter, Footer) is **unchanged**.

Summary of changes vs. current:
- Layout flipped: **live squad-lead card is a sticky left rail**; editable sections stack on the right.
- **Academic Standing = two dropdowns** ("UG or PG", then "Year") instead of the 6-button radio grid.
- **24h edit cooldown removed** from the UI entirely (banner, disabled states, locked button label).
- **Profile Readiness card removed.** **Cloud Sync card removed.** Replaced by an **Account** card (Change password / Sign out / Delete account).
- Save bar only appears when there are unsaved changes (dark sticky bar with Discard + Save changes).
- Emoji removed throughout; gradient avatar and gradient bar removed; header sync pill removed.
- Section order: Personal & Campus → Academic Standing → Skills.

## About the Design Files
`Profile v2.dc.html` is a **design reference built in HTML** — a working prototype showing intended look and behavior, not production code. Recreate it in the existing codebase (React 18 + Vite, vanilla CSS with the tokens in `src/index.css`), following existing patterns: a `ProfileScreen.jsx` + `ProfileScreen.css` pair, CSS classes using `var(--*)` tokens, and dark-mode rules under `[data-theme='dark']`. Keep using `SearchableCollegeSelect` for the college field, `SKILLS` from `data/initialData.js`, and icons from `components/icons.jsx`.

`Profile - current.dc.html` is a recreation of today's screen for before/after comparison.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii are final. All values map to existing tokens in `src/index.css` (listed below). Dark mode was not mocked — apply the existing dark token equivalents.

## Layout

Page container (inside `.onestop-screen-content`): flex column, `gap: 22px`, `max-width: 1120px`.

1. **Header** — unchanged from current: h1 "Profile" (26px/700, letter-spacing -0.02em, `--ink`), subtitle 14px `--ink-muted`, margin-top 6px: "Squad leads see this when you apply. Skills drive what gets recommended to you." Keep `padding-right: 96px` (clears top-right actions). **Remove the Cloud Synced / Guest Mode pill.**

2. **Main grid** — `display:grid; gap:24px; align-items:start`
   - `> 1320px` viewport: `grid-template-columns: 340px minmax(0,1fr)`
   - `1181–1320px`: `300px minmax(0,1fr)`
   - `≤ 1180px`: single column; the rail becomes `display:grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr))` so the preview card and Account card sit side by side above the form; rail is not sticky.
   - (Breakpoints account for the 236px sidebar + 60px main padding.)

### Left rail (`<aside>`)
Flex column, `gap:14px`, `align-items:stretch` (both cards full rail width), `position:sticky; top:24px` on wide screens.

**A. Squad Lead preview card**
- Card: bg `--surface`, `1px solid --line`, radius 14px, shadow `0 2px 8px rgba(26,26,25,0.05)`, overflow hidden.
- Top strip: padding `12px 18px`, bg `--surface-sunken`, bottom border `1px solid --line-light`. Left: "SQUAD LEAD VIEW" 11px/700 uppercase, letter-spacing 0.04em, `--ink-muted`. Right: pulsing 6px dot `#16A34A` (keep existing `pulse-dot` keyframes, 2s infinite) + "Live Preview" 11px/600 `--success-text`.
- Body: padding `22px 18px 18px`, flex column gap 18px.
  - Identity block (flex column, align start, gap 12px):
    - Avatar 64×64 circle, solid `--primary`, white initials 22px/700 (use `initialsOf(name)`).
    - Name 19px/700, letter-spacing -0.02em, line-height 1.2, `--ink`. Fallback "Your Name". Wraps (no ellipsis).
    - College 13px `--ink-secondary`, line-height 1.35. Fallback "Select your college". No emoji.
    - Standing pill: 11px/600, padding 3px 9px, radius 20px. Text: `"{UG|PG} {1st..4th} Year · Undergraduate"` or `"… · MBA / PG"`. UG: bg `--surface-muted`, text `--ink`, border `--line`. PG: bg `#EEF2FF`, text `--primary`, border `rgba(15,63,254,0.25)`.
  - Skills block (gap 8px): label "HIGHLIGHTED SKILLS (n)" 11px/700 uppercase, letter-spacing 0.03em, `--ink-muted`. Tags: bg `--surface-muted`, border `--line`, radius 12px, padding 3px 9px, 12px/500 `--ink`, wrap gap 6px. Empty state: "No skills selected yet" 12px italic `#9C9A94`.
  - **WhatsApp missing notice — only shown when phone is empty** (nothing is shown when phone exists): padding 11px 12px, radius 9px, bg `--surface-sunken`, border `--line-lighter`; WhatsAppIcon 16px; title "WhatsApp number missing" 12px/600 `#B45309`; desc "Add your WhatsApp number so squad leads can immediately message you." 11px `--ink-muted`.
- Removed from current card: footer note, college emoji, contact box "ready" state.

**B. Account card**
- bg `--surface`, `1px solid --line`, radius 14px, overflow hidden. No shadow.
- Header: padding `14px 18px`, bottom border `--line-light`. "Account" 13px/700 `--ink`; below (gap 3px) "Signed in as {email}" 12px `--ink-muted`, single-line ellipsis.
- Action list: padding 6px, flex column. Each row is a button: flex, gap 10px, padding `9px 12px`, radius 8px, 13px/500, left-aligned; hover bg `--surface-muted`.
  1. `LockIcon` (15px, stroke `--ink-muted`) — "Change password"
  2. `LogOutIcon` (15px, stroke `--ink-muted`) — "Sign out" → existing `onSignOut`
  3. 1px divider `--line-light`, margin `6px`
  4. `AlertCircleIcon` (15px, currentColor) — "Delete account", color `--urgency-red` (#DC2626), hover bg `rgba(220,38,38,0.06)`
- Guest (not signed in): replace the card body with a single primary button "Sign in to Cloud Sync" (existing `onOpenAuthModal`) and the header subtitle "Sign in to sync your bookmarks, squad applications, and collegiate profile across all devices." (Not mocked; follow the same card styling.)
- **Change password / Delete account need new flows** (not designed). Recommended: Delete opens a confirm modal requiring the user to type their email. Change password → Supabase `updateUser({ password })` modal.

### Right column (`<form>`)
Flex column gap 18px, `min-width:0`.

Section card (all three): bg `--surface`, `1px solid --line`, radius 14px, padding `22px 24px`, flex column gap 18px, shadow `0 1px 2px rgba(26,26,25,0.04)`.
Section header: title 15px/700, letter-spacing -0.01em, `--ink`; subtitle 13px `--ink-muted`, line-height 1.45, 4px below. No header badges.
Labels: 12px/600 `--ink-secondary`, letter-spacing 0.01em, 6px above field.
Inputs/selects: `1px solid --line`, radius 9px, bg `--surface`, padding `10px 13px`, 14px `--ink`. Focus: border `--primary`, `box-shadow: 0 0 0 3px rgba(15,63,254,0.10)`.

**1. Personal & Campus Information**
- Subtitle: "Your collegiate identity displayed on squad applications and team invitations."
- Row: `grid; repeat(auto-fit, minmax(220px,1fr)); gap 14px` → Full Name input (placeholder "Your full name") | College / University (`SearchableCollegeSelect`, placeholder "Search college (e.g. SRCC, SSCBS, IIT)..."; restyle its input to match: radius 9px, 14px, border `--line`).
- WhatsApp Number: plain label (no icon), input `max-width:340px`, placeholder "+91 98••• ••210"; help text 12px `--ink-muted`: "Shared only after a squad lead accepts your application for the instant 1-click WhatsApp squad handshake."

**2. Academic Standing**
- Subtitle: "Configures competition eligibility across all national case challenges, hackathons, and corporate summits."
- Two native `<select>`s in a `grid; repeat(auto-fit, minmax(180px,1fr)); gap 14px; max-width 520px`:
  - **"UG or PG"**: options `UG · Undergraduate` (value `UG`), `PG · Postgraduate` (value `PG`).
  - **"Year"**: UG → `1st Year, 2nd Year, 3rd Year, 4th Year`; PG → `1st Year, 2nd Year`.
  - Style: `appearance:none`, right padding 36px, `ChevronDownIcon` 16px `--ink-muted` absolutely positioned `right:12px`, pointer-events none.
  - Changing level: if current year isn't valid for the new level (e.g. UG 4th → PG), reset year to `1st`.
- Eligibility line under the selects, 12px `--ink-secondary`, line-height 1.45, single sentence, no badge/icon:
  - UG: "You'll see undergrad-eligible competitions only. MBA/PG listings are hidden."
  - PG: "You'll see MBA & PG challenges plus all open competitions."

**3. Skills & Capabilities**
- Header row: title + subtitle "Choose skills that match your experience. Squad leads filter and recruit based on these tags." on the left; "{n} selected" 12px/600 `--ink-muted` on the right.
- Chips (fixed `SKILLS` list of 10), wrap gap 8px: radius 20px, padding `7px 14px`, 13px, nowrap.
  - Unselected: border `--line`, bg `--surface`, text `--ink`, 500.
  - Selected: border `--primary`, bg `rgba(15,63,254,0.07)` (`--primary-tint-7`), text `--primary`, 600, leading `CheckIcon` 13px (gap 6px). (Changed from the current solid-blue fill.)

**Save bar** (only rendered when dirty, or for 2.4s after save)
- `position:sticky; bottom:16px; z-index:20`, bg `#1A1A19` (`--ink`), radius 12px, padding `12px 14px 12px 20px`, shadow `0 8px 24px rgba(26,26,25,0.18)`, flex space-between.
- Dirty: text "You have unsaved changes" 13px/500 `#E7E6E2`; right: "Discard" ghost button (13px/500 `#E7E6E2`, padding 9px 14px, radius 8px, hover `rgba(255,255,255,0.08)`) + "Save changes" (bg `--primary`, hover `--primary-hover`, white 13px/600, padding 9px 18px, radius 8px, type submit).
- After save: bar shows `CheckIcon` + "Profile saved successfully" in `#4ADE80` for 2400ms, then disappears. Keep the existing global toast ("Profile updated") from `handleSaveProfile`.
- In dark mode use `--surface-muted` or similar elevated surface for the bar background.

## Interactions & State
- `name, college, level ('UG'|'PG'), yearNum ('1st'…'4th'), phone, skills[]` — form state, seeded from `profile`.
- Derive `year = \`${level} ${yearNum} Year\`` → matches existing `YEAR_OPTIONS` strings (`'UG 2nd Year'`, `'PG 1st Year'`, …). Parse incoming `profile.year`/`profile.batch` by splitting on spaces; keep the existing fallback logic (`education_level` includes "post" → PG 1st; else UG 2nd).
- `saved` snapshot = last persisted values. `dirty = any field !== saved` (skills compared as joined string). Discard restores the snapshot.
- Submit calls `onSaveProfile({ name, college, course:'', year, batch: year, education_level: level==='PG' ? 'postgraduate' : 'undergraduate', phone, skills })` — same payload shape as today.
- Preview card updates live from form state (not saved state). Sidebar profile tile shows saved state.
- **Remove** all `getProfileCooldown` usage, `cooldown` state, interval, disabled props, and the `supabase_profile_cooldown_update.sql` dependency from this screen (backend enforcement, if any, should also be dropped or relaxed — confirm with the team).
- **Remove** the readiness `useMemo`.

## Design Tokens used (from `src/index.css`)
`--canvas #F6F6F4` · `--surface #FFFFFF` · `--surface-sunken #F9F9F7` · `--surface-muted #F2F1ED` · `--ink #1A1A19` · `--ink-secondary #55534D` · `--ink-muted #75736C` · `--line #E7E6E2` · `--line-light #F0EFEB` · `--line-lighter #EFEEEA` · `--primary #0F3FFE` · `--primary-hover #0C33CC` · `--primary-tint-7 rgba(15,63,254,0.07)` · `--success #17A34A` · `--success-text #15803D` · `--urgency-red #DC2626` · `--urgency-yellow #B45309`
Extra literals: PG tint `#EEF2FF`, live dot `#16A34A`, WhatsApp green `#25D366`, empty-italic `#9C9A94`, saved-bar green `#4ADE80`.
Radii: 8px (buttons in bars/lists), 9px (inputs), 12px (tags, save bar), 14px (cards), 20px (pills/chips).
Font: Archivo (already loaded), weights 500/600/700.

## Assets
No new assets. Icons from `src/components/icons.jsx`: `WhatsAppIcon`, `CheckIcon`, `ChevronDownIcon`, `SearchIcon`, `CloseIcon`, `LockIcon`, `LogOutIcon`, `AlertCircleIcon`. Logo: existing `OneStopLogo`.

## Files
- `Profile v2.dc.html` — the new design (open in a browser; fully interactive).
- `Profile - current.dc.html` — faithful recreation of the current screen for comparison.
- `support.js`, `assets/onestop-logo.png` — needed only to open the HTML files locally.
- Target files to modify: `src/components/ProfileScreen.jsx`, `src/components/ProfileScreen.css` (and optionally `SearchableCollegeSelect.css` input radius/size).
