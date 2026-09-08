// ============================================================================
// Source: src/app/robots.ts
// Version: 0.9.1 — 2026-09-08
// Why: Allows every crawler everywhere and points at the sitemap. There is
//      nothing private to exclude: no accounts, no user data, no admin path.
// Env / Deps: lib/routes for the origin. Served at /robots.txt.
// ============================================================================

import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/routes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
