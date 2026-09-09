// ============================================================================
// Source: src/components/bridges-page.tsx
// Version: 0.1.0 — 2026-09-09
// Why: The full list of holiday bridges for one Persian year, with a year
//      switch. The home page shows three; this is where the rest live.
// Env / Deps: lib/bridges; the visitor's group switches from lib/view, read
//      after hydration exactly as the app shell does, so the list here can never
//      disagree with the calendar on the home page.
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { fa, fromCalendar, monthLength, toCalendar } from "@/lib/calendar";
import { findBridges } from "@/lib/bridges";
import { DEFAULT_VIEW, readView, type ViewPreferences } from "@/lib/view";
import { BridgeCard, BridgesEmpty, BridgesNotice } from "./bridges-panel";

// The label follows the app's own wording for the switches under the calendar.
const GROUP_LABELS: { key: keyof ViewPreferences; label: string }[] = [
  { key: "religious", label: "مذهبی" },
  { key: "state", label: "دولتی" },
];

export function BridgesPage({ initialNow }: { initialNow: string }) {
  const thisYear = toCalendar(new Date(initialNow)).year;
  const [year, setYear] = useState(thisYear);
  // Defaults match server rendering; the stored switches arrive after hydration.
  const [preferences, setPreferences] = useState<ViewPreferences>(DEFAULT_VIEW);
  useEffect(() => { setPreferences(readView()); }, []);

  const bridges = findBridges(
    fromCalendar({ year, month: 1, day: 1 }),
    fromCalendar({ year, month: 12, day: monthLength(year, 12) }),
    preferences,
  );
  const free = bridges.filter((bridge) => bridge.leave.length === 0).length;
  const off = GROUP_LABELS.filter(({ key }) => !preferences[key]).map(({ label }) => label);

  return (
    <section aria-labelledby="bridges-title" className="rounded-[1.75rem] border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
        <h2 id="bridges-title" className="text-lg font-semibold">سال {fa(year)}</h2>
        <div className="flex gap-1" role="group" aria-label="انتخاب سال">
          {[thisYear, thisYear + 1].map((value) => (
            <button key={value} aria-pressed={year === value} onClick={() => setYear(value)}
              className={`rounded-lg px-3 py-1.5 text-[0.6875rem] transition-colors ${year === value ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>
              {fa(value)}
            </button>
          ))}
        </div>
      </div>
      <p data-testid="bridges-summary" className="px-6 pt-4 text-xs leading-6 text-muted">
        {fa(bridges.length)} پل در این سال، {fa(free)} تا بدون مرخصی.
        {off.length > 0 && ` دسته‌های ${off.join(" و ")} خاموش‌اند؛ تعطیلات آن‌ها حساب نشده. کلیدها زیر تقویم صفحهٔ اصلی است.`}
      </p>
      {bridges.length === 0 ? <BridgesEmpty /> : (
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
          {bridges.map((bridge, index) => <BridgeCard key={index} bridge={bridge} />)}
        </div>
      )}
      <BridgesNotice />
    </section>
  );
}
