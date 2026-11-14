// ============================================================================
// Source: next.config.ts
// Version: 0.9.26 — 2026-11-13
// Why: Three things only. `www.taghv.im` already points at the same Railway
//      service, so once Railway holds a certificate for it the host must land
//      on the apex rather than serve a second copy of the site. And the site
//      asks browsers to remember it is HTTPS-only. And the image optimizer
//      is switched off: every <Image> already passes `unoptimized`, so
//      /_next/image served nothing of ours and was only attack surface.
// Env / Deps: Railway holds a certificate for www.taghv.im since 10 Sep, so the
//      redirect is live the moment this deploys. Until then www serves a second
//      copy of the site — verified: 200, no redirect.
// ============================================================================

import type { NextConfig } from "next";

const config: NextConfig = {
  // The three <Image> uses (header, footer, app shell) all draw /icon.svg and
  // already pass `unoptimized`. Turning it off globally means the optimizer
  // endpoint answers nothing, so the day someone adds `remotePatterns` they
  // have to turn it back on here on purpose — the place its advisories (SVG
  // RCE, SSRF) live.
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.taghv.im" }],
        destination: "https://taghv.im/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // One year, subdomains included. `includeSubDomains` was deliberately held
          // back until Railway issued a certificate for www.taghv.im on 10 Sep —
          // HSTS removes the click-through on a certificate warning, so covering a
          // host that had none would have turned a skippable warning into a wall.
          // Any future subdomain must therefore serve valid HTTPS from its first day.
          // Still never `preload`: that goes into a browser-baked list and does not
          // come back.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default config;
