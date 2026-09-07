# Taghvim — Agent Guidelines

## Product

Persian-language, RTL calendar web app inspired by `time.ir`, with a modern Iranian visual identity.

- Live at `https://taghv.im`. Repository: `https://github.com/farjadp/taghvim`.
- No accounts, authentication, advertising, or backend database.
- **Memorial panel.** The slot under the tools that used to hold prayer times shows one random person from the javidnaman list (`src/data/javidnaman.json`, ~3,200 identified names from javidnaman.iranintl.com). The pick happens on the server per request in `app/page.tsx`. Photos are hot-linked from the source CDN with `referrerPolicy="no-referrer"`; nothing is stored locally. Refresh the snapshot with `npm run sync:javidnaman` and commit the JSON. The line «اینجا پیش‌تر اوقات شرعی را اعلام می‌کردیم.» is deliberate — keep it.
- **Changelog.** `/changelog` renders `src/lib/changelog.ts`. Add a release entry in the same commit that ships the change, newest first, with the commit instant as an ISO string carrying an offset. `status: 'ready'` means committed but not deployed; flip it to `'live'` when it is pushed to taghv.im. A unit test enforces the ordering and forbids a `ready` release below a `live` one. The «در راه» list is explicitly not a promise — keep it that way.
- **Zodiac.** The side card names the sign of the current Persian month. This is a lookup, not astronomy: the Solar Hijri months map one to one onto the signs, which is why the Afghan calendar names its months حمل، ثور، جوزا. Glyphs are lucide's `Zodiac*` SVG icons via `components/zodiac-icon`; never the Unicode characters, which render as colour emoji on some systems. Keep `ZODIAC_SHORT_NOTICE` beside the sign and never add horoscope content.
- **Second clocks.** Tehran is and stays the main clock in the hero, and the second clocks now sit under it in the same card. The block may show the visitor's own time, added automatically only when their IANA zone differs from Tehran by offset, plus up to two cities they pick from `ZONES` in `src/lib/clocks.ts` (persisted as `taghvim-clocks`). A visitor on Tehran time with no cities chosen sees one quiet add link and nothing else. Never move the Tehran clock out of the hero or make a second clock the primary one. The hero must not clip its own overflow, because the city picker opens out of it; the sun drawing is clipped by its own wrapper instead, and the clock block sits at `z-20` so the footnote under it cannot swallow the picker's clicks.
- **Display settings.** A gear in both headers opens theme (auto/light/dark), font size (14/16/18px root) and font family (Vazirmatn, Shabnam, Sahel — all self-hosted, OFL). Stored as `taghvim-theme`, `taghvim-size`, `taghvim-font`; applied as `data-theme` / `data-size` / `data-font` on `<html>` by an inline boot script in `app/layout.tsx` before first paint. Every colour must be a token from `globals.css` — never `bg-white`, never a hex literal in a component — because each token has a dark counterpart and axe runs in both themes. Text sizes are rem, never px, so the size setting scales them.
- **Secular by default.** (Shown on the site as «پیش‌فرض ایران عزیز»; that is the label Farjad chose, do not rename it back.) State occasions (`category: 'state'`), lunar religious holidays and the prayer-times panel are hidden until the visitor turns on the «مناسبت‌های مذهبی و دولتی» switch in the header. The choice persists in `localStorage` as `taghvim-scope`. Never move an event between `iran` and `state` without a reason in the commit message.
- Approved design: warm light surfaces, deep green, restrained clay accents, locally hosted Vazirmatn typography; a matching dark palette; the memorial box is the one deliberately dark surface in light mode.
- Logo source: `src/app/icon.svg`, a sunrise/calendar-page mark. The header references `/icon.svg`, and Next.js uses the same asset as the browser icon. Do not duplicate its geometry.
- Stack: Next.js App Router, TypeScript, React 19 functional components, Tailwind CSS v4. No inline styling.

## Commands

```bash
npm install                              # restore dependencies (pinned in package-lock.json)
npm run dev -- --port 3100               # local development; port 3000 is occupied, do not stop it
npm test                                 # Vitest unit tests
npm run typecheck                        # TypeScript check
npm run build                            # production build
npm run test:e2e                         # Playwright desktop/mobile tests on port 3100
npm run sync:javidnaman                  # refresh src/data/javidnaman.json from the source site (manual, needs network)
npx playwright install chromium          # one-time Chromium install for E2E
```

Run unit tests, typecheck, build, and relevant browser tests before completing any change.

## Date and data invariants

- Calendar instants are interpreted as civil dates in `Asia/Tehran`, never the host machine's timezone.
- Civil-date conversions return UTC noon. Supported range: Persian years 1200–1600 inclusive.
- Month grids start on Saturday and include adjacent-month padding. Out-of-range boundary padding is disabled in the UI and must not be passed to range-validated helpers.
- Lunar dates use `islamic-civil`, not Iranian observational dates. Preserve the visible computational-calendar notice.
- Events are a curated selection of recurring fixed Persian/Gregorian events plus lunar religious holidays computed via `islamic-civil`, not the full official calendar. Lunar holidays may differ from Iranian observational sightings by ±1 day. Preserve coverage warnings and never present this dataset as complete.
- `eventsForDate(date, scope)` is the single source of truth for both the grid shading and the event list. In `'secular'` scope, state and religious rows are removed entirely — including their holiday flag — so the grid never shades a day it cannot explain.
- `OFFICIAL_LUNAR_OVERRIDES` pins lunar holidays to official Persian dates per year. It currently covers three dates in 1405 only.
- Prayer times use Adhan's Tehran method with city coordinates. Jafari midnight is the midpoint between sunset and the next day's fajr. Preserve approximation/method notices.
- The live clock uses the device clock in Tehran time, not NTP synchronization.
- `src/data/javidnaman.json` is a committed snapshot, not a database: the app never fetches the source at build or request time. The snapshot's `count` and `fetchedAt` are shown in the UI, so a stale snapshot is visible, not hidden.
- Persisted localStorage keys: `taghvim-city`, `taghvim-scope`, `taghvim-theme`, `taghvim-size`, `taghvim-font`, `taghvim-clocks`. Every access is guarded for restricted-storage environments.
- Calendar cells and tool tabs support RTL arrow-key navigation. Preserve keyboard behavior and midnight rollover regression tests.

## Code style

- Every code file (`.ts`, `.tsx`, `.mjs`, `.css`) starts with the header block below and carries inline comments on non-obvious logic. Bump `Version` in the header when the file's behaviour changes.

  ```ts
  // ============================================================================
  // Source: src/lib/events.ts
  // Version: 0.2.0 — 2026-09-07
  // Why: One or two lines on what this file is for.
  // Env / Deps: What it depends on or persists.
  // ============================================================================
  ```

- TypeScript over JavaScript.
- Functional React components only.
- Tailwind classes only — no inline styles. Colours only via the tokens in `globals.css` (`surface`, `paper`, `ink`, `muted`, `line`, `forest` for text, `forest-deep` for backgrounds, `leaf`, `clay`, `sand`, `holiday`, `memorial-*`).
- Keep the app Persian and RTL.
- Do not add account/auth/database functionality.
- Preserve all date and data disclaimers.
- Do not stop unrelated servers, especially the process on port 3000.

## Project structure

```
src/
├── app/                 # Next.js App Router: layout, page, globals.css, icon.svg
├── components/          # UI panels: today, calendar, events, tools, prayer
├── app/changelog/       # public release history
├── data/                # javidnaman.json snapshot (generated by scripts/sync-javidnaman.mjs)
└── lib/                 # calendar, events, prayer, date-tools, javidnaman (each with .test.ts)
scripts/
└── sync-javidnaman.mjs  # manual refresh of the memorial snapshot
tests/
└── calendar.spec.ts     # Playwright E2E
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
