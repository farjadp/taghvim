// ============================================================================
// Source: next.config.ts
// Version: 0.9.24 — 2026-09-10
// Why: Two things only. `www.taghv.im` already points at the same Railway
//      service, so once Railway holds a certificate for it the host must land
//      on the apex rather than serve a second copy of the site. And the site
//      asks browsers to remember it is HTTPS-only.
// Env / Deps: The redirect cannot rescue a visitor today — TLS fails before any
//      HTTP request is made, so `www` must be added as a custom domain in
//      Railway first. This is the other half of that fix, not a substitute.
// ============================================================================

import type { NextConfig } from "next";

const config: NextConfig = {
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
          // One year, apex only. NOT `includeSubDomains` yet: www.taghv.im has no
          // certificate of its own, and HSTS removes the click-through on a
          // certificate warning — so covering it now would turn today's skippable
          // warning into a wall. Add it once Railway serves www. And never
          // `preload`: that goes into a browser-baked list and does not come back.
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
    ];
  },
};

export default config;
