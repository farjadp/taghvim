// ============================================================================
// Source: src/app/sitemap.ts
// Version: 0.9.1 — 2026-09-08
// Why: Tells crawlers the four pages that exist. Nothing here is generated
//      from the filesystem at request time; lib/routes is the list, and a unit
//      test fails if a page ships without being added to it.
// Env / Deps: lib/routes. Served at /sitemap.xml.
// ============================================================================

import type { MetadataRoute } from "next";
import { ROUTES, SITE_ORIGIN } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  // One instant for the whole file: these pages ship together, so per-page
  // timestamps would claim an accuracy the deploy does not have.
  const lastModified = new Date();
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_ORIGIN}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
