# Firefox / AMO — build instructions for reviewers

**English, on purpose.** Everything else in this repository is Persian; this
file is what an addons.mozilla.org reviewer reads, so it is not.

## What this add-on is

It replaces the new tab page with a Persian (Jalali) calendar: today's date in
the Jalali, Gregorian and Hijri calendars, a live Tehran clock, the current
month, and the occasions falling on each day.

It requests **no permissions and no host permissions**, registers **no
background script and no content script**, keeps the default MV3 CSP, and
makes **no network request of any kind** — every font, icon and piece of data
is in the package. Preferences (theme, font, which occasion sets are shown)
are stored in `localStorage` and never leave the browser.

## Reproducing the uploaded package

```
node 26.7.0          # any Node 20+ works; this is what the upload was built on
npm 11.19.0

npm ci
npm run build:extension:firefox
```

The result is `extension/dist-firefox/`, byte-for-byte the contents of the
uploaded ZIP. `npm run package:extension` is what produced the upload: it runs
the build, zips `extension/dist-firefox` from the inside (so `manifest.json`
is at the archive root), and runs `addons-linter` — a non-zero error count
fails the build rather than the submission.

## Why the source is bundled

`extension/src/new-tab.tsx` is the only file that belongs to the extension.
The calendar itself is imported from `src/lib` and `src/components` — the same
TypeScript the website at <https://taghv.im> is built from — so the extension
and the site cannot drift apart. Vite compiles and minifies that into one JS
file and one CSS file. The unminified source is the `-source.zip` accompanying
the upload, and the command above rebuilds it.

## The two manifests

`extension/manifest.json` is the Chrome manifest and the base for both builds.
`extension/manifest.firefox.json` holds only what Firefox needs differently —
the `browser_specific_settings.gecko` block — and deletes `offline_enabled`,
a Chrome-apps leftover. `extension/vite.config.ts` merges them; a `null` in
the delta deletes the key. There is no second hand-maintained manifest to
fall out of step.

## Known linter warnings

| Warning | Why it is there |
| --- | --- |
| `UNSAFE_VAR_ASSIGNMENT` ×2 | Both are inside React DOM's minified runtime — its `dangerouslySetInnerHTML` branch and its `<script>` element factory. Neither is reachable from this extension's code: nothing in `src/` uses `dangerouslySetInnerHTML`. |
| `KEY_FIREFOX_ANDROID_UNSUPPORTED_BY_MIN_VERSION` | No `gecko_android` block is declared, because `chrome_url_overrides.newtab` is not supported on Firefox for Android. The add-on is desktop-only by design. |

`strict_min_version` is `140.0`: that is the floor for
`data_collection_permissions`, which is how the add-on declares that it
collects nothing.

## Checks that run on every build

- `npm test` — the manifest is MV3, asks for no permissions, keeps the default
  CSP, names icons that exist, and carries the same version as `package.json`;
  the Firefox delta has a gecko id, a minimum version, a `none` data-collection
  declaration, and no Chrome-only keys.
- `npm run build:extension:firefox` — `scripts/check-extension.mjs` reads the
  built package and fails on any permission, any custom CSP, any `fetch`,
  `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`, `eval` or
  `new Function` in the bundle, any external URL in the JS or CSS, any inline
  script in the HTML, and any stylesheet `url()` that does not exist on disk.
- `npx playwright test --project=firefox` — loads the built page in Firefox
  with every origin but its own blocked, asserts it paints the correct Tehran
  date, and runs an axe accessibility audit over it.
