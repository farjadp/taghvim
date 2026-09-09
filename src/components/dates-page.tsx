// ============================================================================
// Source: src/components/dates-page.tsx
// Version: 0.1.0 — 2026-09-09
// Why: The card that wraps DatesTool on /dates, and the one place that owns
//      «now» on that page.
// Env / Deps: A client island because the list lives in localStorage. `now` is
//      taken on mount rather than on the server, so the page can stay static.
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { DatesTool } from "./dates-tool";

export function DatesPage() {
  // Not passed down from the server: this page renders nothing date-dependent until the
  // browser's own list arrives anyway, so it can be static and take the clock on mount.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);
  return (
    <section aria-label="تاریخ‌های من" className="rounded-[1.75rem] border border-line bg-surface p-5 sm:p-7">
      {now === null ? <p className="py-10 text-center text-xs text-muted">…</p> : <DatesTool now={now} />}
    </section>
  );
}
