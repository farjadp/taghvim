// ============================================================================
// Source: src/app/manifest.ts
// Version: 0.9.1 — 2026-09-08
// Why: Lets the site be added to a phone's home screen with its own icon and
//      no browser chrome. This is the manifest only — there is no service
//      worker, so the calendar still needs a connection. Do not describe it
//      as offline anywhere until one exists.
// Env / Deps: Next serves this at /manifest.webmanifest and links it from
//      every page. Icons come from scripts/build-icons.mjs.
// ============================================================================

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "تقویم · روزها را بهتر ببین",
    short_name: "تقویم",
    description: "تاریخ امروز به شمسی، میلادی و قمری، با مناسبت‌ها و ابزارهای تاریخ.",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Both match --color-paper, so the launch screen and the status bar are the
    // same cream the page opens on rather than a flash of white.
    background_color: "#f7f8f4",
    theme_color: "#f7f8f4",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
