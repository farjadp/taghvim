# Taghvim — Agent Guidelines

## Product

Persian-language, RTL calendar web app inspired by `time.ir`, with a modern Iranian visual identity.

- No accounts, authentication, advertising, or backend database.
- Approved design: warm light surfaces, deep green, restrained clay accents, locally hosted Vazirmatn typography.
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
npx playwright install chromium          # one-time Chromium install for E2E
```

Run unit tests, typecheck, build, and relevant browser tests before completing any change.

## Date and data invariants

- Calendar instants are interpreted as civil dates in `Asia/Tehran`, never the host machine's timezone.
- Civil-date conversions return UTC noon. Supported range: Persian years 1200–1600 inclusive.
- Month grids start on Saturday and include adjacent-month padding. Out-of-range boundary padding is disabled in the UI and must not be passed to range-validated helpers.
- Lunar dates use `islamic-civil`, not Iranian observational dates. Preserve the visible computational-calendar notice.
- Events are a curated selection of recurring fixed Persian/Gregorian events, not the full official calendar. Unverified lunar religious holidays are deliberately excluded. Preserve coverage warnings and never present this dataset as complete.
- Prayer times use Adhan's Tehran method with city coordinates. Jafari midnight is the midpoint between sunset and the next day's fajr. Preserve approximation/method notices.
- The live clock uses the device clock in Tehran time, not NTP synchronization.
- Only the selected city is persisted in browser localStorage. Access is guarded for restricted-storage environments.
- Calendar cells and tool tabs support RTL arrow-key navigation. Preserve keyboard behavior and midnight rollover regression tests.

## Code style

- TypeScript over JavaScript.
- Functional React components only.
- Tailwind classes only — no inline styles.
- Keep the app Persian and RTL.
- Do not add account/auth/database functionality.
- Preserve all date and data disclaimers.
- Do not stop unrelated servers, especially the process on port 3000.

## Project structure

```
src/
├── app/                 # Next.js App Router: layout, page, globals.css, icon.svg
├── components/          # UI panels: today, calendar, events, tools, prayer
└── lib/                 # calendar, events, prayer, date-tools (each with .test.ts)
tests/
└── calendar.spec.ts     # Playwright E2E
```
