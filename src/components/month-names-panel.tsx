// ============================================================================
// Source: src/components/month-names-panel.tsx
// Version: 0.1.0 — 2026-09-10
// Why: Where each month name came from and what it meant. Shown only while the
//      older names are switched on: the switch renames two months, and this is
//      the page that says which two and why.
// Env / Deps: lib/month-names. Rendered by calendar-app beside the memorial and
//      prayer panels, which appear on the same terms.
// ============================================================================

import { MONTH_NAMES } from "@/lib/month-names";

export function MonthNamesPanel() {
  return (
    <section aria-labelledby="month-names-title" className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-6 py-4">
        <h3 id="month-names-title" className="text-sm font-semibold">نام ماه‌ها</h3>
        <p className="mt-1 text-[0.6875rem] leading-5 text-muted">
          هر دوازده نام از اوستا آمده‌اند و در فارسی میانه ساییده شده‌اند. دو تا صورت کهن جداگانه دارند و همان دو تا عوض شده‌اند؛
          بقیه همین حالا هم اوستایی‌اند. برای برگرداندن، کلید «نام ماه‌ها» را در تنظیمات نمایش روی «امروزی» بگذار.
        </p>
      </div>
      <ul className="divide-y divide-line">
        {MONTH_NAMES.map((month) => (
          <li key={month.modern} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-6 py-3">
            <span className="min-w-20 text-xs font-medium text-ink">
              {month.older ?? month.modern}
            </span>
            {month.older && <span className="text-[0.625rem] text-muted">امروز: {month.modern}</span>}
            <span className="min-w-28 text-[0.6875rem] text-forest">{month.avestan}</span>
            <span className="flex-1 text-[0.6875rem] text-muted">{month.meaning}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
