// ============================================================================
// Source: src/app/page.tsx
// Version: 0.3.0 — 2026-09-07
// Why: Home route. Renders the calendar app with a server-side timestamp so
//      the first paint already shows the correct Tehran day.
// Env / Deps: Forced dynamic so the timestamp is never cached at build time.
// ============================================================================

import { CalendarApp } from "@/components/calendar-app";
import { pickPerson } from "@/lib/javidnaman";
import { listBackgrounds } from "@/lib/backgrounds";

// Never statically cache: the initial timestamp must be the request time.
export const dynamic = "force-dynamic";

export default function Page() {
  // Picked per request on the server: the memorial shows a different name on every load
  return <CalendarApp initialNow={new Date().toISOString()} person={pickPerson()} backgrounds={listBackgrounds()} />;
}
