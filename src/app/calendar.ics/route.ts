// ============================================================================
// Source: src/app/calendar.ics/route.ts
// Version: 0.9.4 — 2026-09-08
// Why: Serves the subscription feed at /calendar.ics. A visitor adds the URL
//      once to Google or Apple Calendar and Iranian occasions appear inside
//      the calendar they already use, refreshing on their client's schedule.
// Env / Deps: lib/ics builds the string. Revalidated daily; the contents only
//      change when the curated events do. The URL must never change — every
//      subscriber is bound to it, and a rename silently empties their calendar.
// ============================================================================

import { buildFeed } from "@/lib/ics";

export const revalidate = 86400;

export function GET(): Response {
  return new Response(buildFeed(new Date()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="taghvim.ics"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
