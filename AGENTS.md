# Taghvim — Agent Guidelines

## Product

Persian-language, RTL calendar web app inspired by `time.ir`, with a modern Iranian visual identity.

- Live at `https://taghv.im`. Repository: `https://github.com/farjadp/taghvim`.
- No accounts, authentication, advertising, or backend database.
- **Memorial panel.** The slot under the tools that used to hold prayer times shows one random person from the javidnaman list (`src/data/javidnaman.json`, ~3,200 identified names from javidnaman.iranintl.com). The pick happens on the server per request in `app/page.tsx`. Photos are hot-linked from the source CDN with `referrerPolicy="no-referrer"`; nothing is stored locally. Refresh the snapshot with `npm run sync:javidnaman` and commit the JSON. The line «اینجا پیش‌تر اوقات شرعی را اعلام می‌کردیم.» is deliberate — keep it.
- **Changelog.** `/changelog` renders `src/lib/changelog.ts`. Add a release entry in the same commit that ships the change, newest first, with the commit instant as an ISO string carrying an offset. `status: 'ready'` means committed but not deployed; flip it to `'live'` when it is pushed to taghv.im. Unit tests enforce the ordering, forbid a `ready` release below a `live` one, allow at most one `ready` (and only as the newest entry), and tie `package.json`'s version to the newest release. None of them can know whether a deploy happened — 0.9.0 reached taghv.im still marked `ready` and told every visitor it was unpublished — so run `npm run check:live` after each deploy; it fails while production still renders the badge. The «در راه» list is explicitly not a promise — keep it that way.
- **Zodiac.** The side card names the sign of the current Persian month. This is a lookup, not astronomy: the Solar Hijri months map one to one onto the signs, which is why the Afghan calendar names its months حمل، ثور، جوزا. Glyphs are lucide's `Zodiac*` SVG icons via `components/zodiac-icon`; never the Unicode characters, which render as colour emoji on some systems. Keep `ZODIAC_SHORT_NOTICE` beside the sign and never add horoscope content.
- **Second clocks.** Tehran is and stays the main clock in the hero, and the second clocks now sit under it in the same card. The block may show the visitor's own time, added automatically only when their IANA zone differs from Tehran by offset, plus up to two cities they pick from `ZONES` in `src/lib/clocks.ts` (persisted as `taghvim-clocks`). A visitor on Tehran time with no cities chosen sees one quiet add link and nothing else. Never move the Tehran clock out of the hero or make a second clock the primary one. The hero must not clip its own overflow, because the city picker opens out of it; the sun drawing is clipped by its own wrapper instead, and the clock block sits at `z-20` so the footnote under it cannot swallow the picker's clicks.
- **Display settings.** A gear in both headers opens theme (auto/light/dark), font size (14/16/18px root) and font family (Vazirmatn, Shabnam, Sahel, IRANSansX, IRANYekanX — all self-hosted, none fetched from a third party). **They are not all OFL:** Vazirmatn, Shabnam and Sahel are; IRANSansX and IRANYekanX are commercial faces from fontiran.com that Farjad holds a licence for, committed under `src/app/fonts/` with their provenance in the README there. Never call the set OFL. The two commercial faces are variable (weight axis 100-1000), so one `woff2` covers every weight instead of five imports, and their packages' "FaNum" builds must never be used: those map Latin digits onto Persian glyphs and would break the Gregorian date and the LTR clock, which the app renders with real Latin digits. Stored as `taghvim-theme`, `taghvim-size`, `taghvim-font`; applied as `data-theme` / `data-size` / `data-font` on `<html>` by an inline boot script in `app/layout.tsx` before first paint. Every colour must be a token from `globals.css` — never `bg-white`, never a hex literal in a component — because each token has a dark counterpart and axe runs in both themes. Text sizes are rem, never px, so the size setting scales them.
- **Secular by default.** (Shown on the site as «پیش‌فرض ایران عزیز»; that is the label Farjad chose, do not rename it back.) `EventGroups` replaces the removed `EventScope`: religious and state default off, world defaults on, and national/cultural (`iran`) events always remain. The calendar legend is now a two-row control: its original key plus «نمایش:», a non-interactive «ملی و فرهنگی» pill, and independent «مذهبی»، «دولتی»، «جهانی»، «یادبود» switches. No header scope switch remains. Religious visibility also gates the prayer navigation link and panel. Memorial visibility is independent and defaults on; preserve its content verbatim. Never move an event between `iran` and `state` without a reason in the commit message.
- **Install, crawlers and icons.** `app/manifest.ts` makes the site addable to a phone's home screen with its own icon and no browser chrome. **There is no service worker, so it is not offline-capable — never describe it as offline until one exists.** `app/sitemap.ts` and `app/robots.ts` both read `src/lib/routes.ts`, which is the single list of public routes; a unit test walks `src/app` and fails when a `page.tsx` ships without being added there, and another checks `SITE_ORIGIN` against `metadataBase`. The PNG icons (`public/icon-192.png`, `public/icon-512.png`, `src/app/apple-icon.png`) are rendered from `src/app/icon.svg` by `npm run build:icons` and committed — iOS ignores the manifest and reads `apple-icon.png`. The manifest's `background_color` must stay equal to `--color-paper`; a test enforces it.
- **Why this calendar.** The launch thread asked eight times what makes this different from `time.ir`. The answer lives in `/about#why`, and the footer links to it on every page. Keep that link, and keep the answer on the page it points at rather than duplicating it.
- **Mobile order.** On phones `<main>` is a flex column and the calendar row carries `order-first`, so the month grid opens the page and the hero, the second calendars card, the tools, the memorial and the prayer panel follow it. Measured before the change: the first day cell sat at 1128px on the 664px screen Playwright's iPhone 13 uses. Use `order-first`, not a number — the tools, memorial and prayer panels take no className and keep the default order 0, so any positive value on the grid would push them above everything. At `lg` the container returns to `block`, order stops applying and the original margins take over, so the desktop layout is untouched; a browser test asserts both orders. The full month still does not always clear the fold — 670px against 664 at the default font size, more at «بزرگ» or in a six-row month — so do not describe it as guaranteed.
- **Subscription feed.** `/calendar.ics` serves an iCalendar feed built by `src/lib/ics.ts`, for people who add it once to Google or Apple Calendar. **The URL must never change** — every subscriber is bound to it, and a rename empties their calendar silently rather than erroring. It carries `category: 'iran'` only: state and religious occasions are excluded by product decision, and the religious ones are also the dates this project cannot promise, so the feed is named «مناسبت‌های ملی و فرهنگی ایران» and never «تعطیلات رسمی». Window is the current Persian year −1 to +3, rebuilt daily. UIDs are `year-month-day-slot@taghv.im` and must stay stable: a changing UID makes clients add duplicates on every refresh instead of updating. RFC 5545 line rules are enforced by unit tests — CRLF everywhere, no line over **75 octets** (not characters; Persian is two bytes each), and folds never inside a UTF-8 sequence.
- **Help page and footer.** `/help` is the one place that explains how to do things; it names controls by the exact label the interface shows, so renaming a button means updating it. Its section list and its contents nav come from one array, and a browser test asserts they match and that every entry points at a section that exists. Do not duplicate the how-to elsewhere: `/about#subscribe` keeps only the lunar caveat and links to `/help#subscribe`. **The footer is deliberately short** — brand line, three pages, four shortcuts. The maker, the company, the repository and the contact details live on `/about#links`; adding links back to the footer turns it into a sitemap. `/contact` still exists and is reached from `/about`, not from the footer or the header.
- **Social preview.** `public/og.png` is rendered by `npm run build:og` and committed. It uses **Chromium through Playwright, deliberately not `next/og`**: satori does not shape Arabic script, so «تقویم» comes out as disconnected letters. The image is declared in `app/layout.tsx` rather than left to the `app/opengraph-image.png` file convention, because that convention emits the image tags but not `og:image:alt` and ignored its `.alt.txt` sibling here. Keep the tokens in the script equal to `--color-paper`, `--color-forest` and `--color-clay`. One trap: `overflow` set on `<body>` propagates to the viewport and body computes to `visible`, so a bled decoration grew the document and pushed every block off the edge — the sunrise is clipped by its own wrapper instead.
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
npm run check:live                       # after every deploy: fails if production still shows «آمادهٔ انتشار»
npm run build:icons                      # regenerate the PNG app icons from src/app/icon.svg (commit the output)
npm run build:og                         # regenerate public/og.png, the social preview (commit the output)
npx playwright install chromium          # one-time Chromium install for E2E
```

Run unit tests, typecheck, build, and relevant browser tests before completing any change.

For an isolated worktree preview, use `npm run dev -- --port 3101` and `E2E_PORT=3101 npm run test:e2e`; the override prevents testing the main worktree's server on 3100.

## Date and data invariants

- Calendar instants are interpreted as civil dates in `Asia/Tehran`, never the host machine's timezone.
- Civil-date conversions return UTC noon. Supported range: Persian years 1200–1600 inclusive.
- Month grids start on Saturday and include adjacent-month padding. Out-of-range boundary padding is disabled in the UI and must not be passed to range-validated helpers.
- Lunar dates use `islamic-civil`, not Iranian observational dates. Preserve the visible computational-calendar notice.
- Events are a curated selection of recurring fixed Persian/Gregorian events plus lunar religious holidays computed via `islamic-civil`, not the full official calendar. Lunar holidays may differ from Iranian observational sightings by ±1 day. Preserve coverage warnings and never present this dataset as complete.
- `eventsForDate(date, groups = ALL_GROUPS)` is the single source of truth for both grid shading and the event list. A disabled group's rows disappear entirely, including holiday flags. `iran` always remains. The library default is inclusive; the UI passes its own preferences (religious/state off and world on by default).
- `OFFICIAL_LUNAR_OVERRIDES` pins lunar holidays to official Persian dates per year. It currently covers three dates in 1405 only.
- Prayer times use Adhan's Tehran method with city coordinates. Jafari midnight is the midpoint between sunset and the next day's fajr. Preserve approximation/method notices.
- The live clock uses the device clock in Tehran time, not NTP synchronization.
- `src/data/javidnaman.json` is a committed snapshot, not a database: the app never fetches the source at build or request time. The snapshot's `count` and `fetchedAt` are shown in the UI, so a stale snapshot is visible, not hidden.
- Persisted localStorage keys: `taghvim-city`, `taghvim-view`, `taghvim-theme`, `taghvim-size`, `taghvim-font`, `taghvim-clocks`. Every access is guarded for restricted-storage environments. `taghvim-view` is a strict four-boolean JSON object: `{"religious":false,"state":false,"world":true,"memorial":true}` by default. Corrupt, partial, extra-key or non-boolean data falls back to defaults. On first read without that key, migrate legacy `taghvim-scope`: `secular` maps to defaults; `all` enables religious/state too. Write the new record successfully before removing the old key. Storage exceptions never break rendering or in-memory switches.
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
