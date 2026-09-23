# Handoff: Competitions loading screen

Replace the current `SectionLoadingWidget` (bordered strip with uppercase badge, ticker, Skip button, gradient ring, italic quote) and the six skeleton cards below it with one centred loading card.

Visual reference: `Competitions Loading.dc.html` (open in a browser).

## What it looks like

A single card in the main column, under the search/sort bar:

- White card (`--surface`), 1px `--border`, 12px radius, padding `60px 20px`, content centred.
- 48px spinning ring (3px `--border` track, `--primary` top segment, 0.8s linear), with the OneStop icon (`OneStopLogo variant="icon"`, 22px tall) sitting still in the centre.
- 14px gap, then title: 1.05rem / 800 / `--ink`.
- 4px gap, then one line: 0.84rem / 1.45 line-height / `--ink-dim`, max-width 440px.
- Fades out and lifts 4px over 220ms when done.
- No badge, no ticker, no Skip button, no skeleton cards.

## Quote rule

- Each loading screen shows **exactly one** quote, picked at random on mount, and keeps it until it dismisses. No rotation.
- Every new loading screen (next mount) picks a new random quote.
- Browse uses `BROWSE_PUNS` from `FunLoadingScreen.jsx` (unchanged).
- `showPuns={false}` falls back to the plain `subtitle`.

## Copy

| State | Title | Fallback subtitle |
|---|---|---|
| Browse | Fetching live competitions from Unstop... | Pulling direct listings across DU, IIMs, IITs & premier colleges |
| Bookmarked | Syncing your saved competitions... | Checking deadlines on everything you bookmarked |

## Tasks

1. Replace `src/components/SectionLoadingWidget.jsx` with `handoff/SectionLoadingWidget.jsx`.
2. Replace `src/components/SectionLoadingWidget.css` with `handoff/SectionLoadingWidget.css`. (It keeps `.skeleton-box` + `skeletonShimmer`, which other files may import through this stylesheet.)
3. In `src/components/CompetitionsPage.jsx`, in the block commented `Competitions Section Loading` (~line 1420), replace the whole `cc-section-loading-wrapper` div with:

```jsx
{(showFetchingScreen || loading) ? (
  <SectionLoadingWidget
    headline={bookmarkedOnly ? 'Syncing your saved competitions...' : 'Fetching live competitions from Unstop...'}
    subtitle={bookmarkedOnly ? 'Checking deadlines on everything you bookmarked' : 'Pulling direct listings across DU, IIMs, IITs & premier colleges'}
    customPuns={BROWSE_PUNS}
    minDurationMs={1800}
    isReady={!loading}
    onComplete={() => setShowFetchingScreen(false)}
  />
) : fetchError ? (
```

   Remove the `badge` and `tickerItems` props (no longer accepted) and the six `<CompCardSkeleton />` in that block. Leave `CompCardSkeleton` defined if used elsewhere; delete it if not.
4. Search for other usages of `SectionLoadingWidget` (e.g. Team Finder with `SQUAD_PUNS`) and drop `badge`, `tickerItems`, `allowSkip` there; pass a fitting `headline`/`subtitle`.
5. Check dark mode: all colours are tokens from `src/index.css`, so it should adapt without extra CSS.

## Behaviour kept from the old widget

- Stays up for at least `minDurationMs` (1800ms) and until `isReady` is true, then fades out (220ms) and calls `onComplete`.
- `role="status"` + `aria-live="polite"` added for screen readers.
