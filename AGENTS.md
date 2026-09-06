# Taghvim

## Product
- Persian-language, RTL calendar web app. No accounts, authentication, advertising, or backend database.
- Approved design: warm light surfaces, deep green, restrained clay accents, locally hosted Vazirmatn typography.
- Logo source: `src/app/icon.svg`, a sunrise/calendar-page mark. The header references `/icon.svg`, and Next.js uses the same asset as the browser icon; do not duplicate its geometry.
- Next.js App Router, TypeScript, React functional components, Tailwind CSS. No inline styling.

## Commands
- `npm install` to restore dependencies; versions are pinned in package-lock.json.
- `npm run dev -- --port 3100` for local development. Port 3000 was occupied by another application during setup; do not stop unrelated servers.
- `npm test` runs Vitest unit tests.
- `npm run typecheck` checks TypeScript.
- `npm run build` verifies the production build.
- `npm run test:e2e` runs Chromium desktop/mobile Playwright tests on port 3100. Install Chromium with `npx playwright install chromium` if absent.
- Run unit tests, typecheck, build, and relevant browser tests before completing changes.

## Date and data invariants
- Calendar instants are interpreted as civil dates in `Asia/Tehran`, never the host machine's timezone.
- Civil-date conversions return UTC noon. Supported range: Persian years 1200–1600 inclusive.
- Month grids start on Saturday and include adjacent-month padding. Out-of-range boundary padding is disabled in the UI and must not be passed to range-validated helpers.
- Lunar dates use `islamic-civil`, not Iranian observational dates. Preserve the visible computational-calendar notice.
- Events are a curated selection of recurring fixed Persian/Gregorian events, not the full official calendar. Unverified lunar religious holidays are deliberately excluded. Preserve coverage warnings and do not present this dataset as complete.
- Prayer times use Adhan's Tehran method with city coordinates. Jafari midnight is the midpoint between sunset and the next day's fajr. Preserve approximation/method notices.
- The live clock uses the device clock in Tehran time, not NTP synchronization.
- Only the selected city is persisted in browser localStorage. Access is guarded for restricted-storage environments.
- Calendar dates and tool tabs support RTL arrow-key navigation. Preserve keyboard behavior and midnight rollover regression tests.
