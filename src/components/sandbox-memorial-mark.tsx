// ============================================================================
// Source: src/components/sandbox-memorial-mark.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX. A full lion-and-sun is heraldry — a mane, a face and a sword —
//      and at 13px inside a list row it is a smudge. These are three readings
//      of it as line art, shown at every size the app draws an icon, and in the
//      row they would actually live in. Throwaway.
// Env / Deps: icons/iran-marks, and the memorial colour tokens from globals.css.
// ============================================================================

"use client";

import { CrownMark, FlagMark, SunMark } from "./icons/iran-marks";
import { categoryInk, categoryTint } from "@/lib/date-categories";

const MARKS = [
  { id: "sun", name: "الف · خورشید", mark: SunMark,
    note: "نیمهٔ خورشیدِ شیر و خورشید. تنها بخشی که کوچک هم خوانا می‌ماند." },
  { id: "flag", name: "ب · پرچم", mark: FlagMark,
    note: "سه نوار پرچم با خورشید در نوار میانی. در ۱۳ پیکسل نوارها به هم می‌چسبند." },
  { id: "crown", name: "پ · تاج", mark: CrownMark,
    note: "نماد شاهنشاهی به‌صورت سایه‌نما. کمترین جزئیات، بیشترین خوانایی در اندازهٔ کوچک." },
];

const SIZES = [13, 18, 24, 32, 48];

export function SandboxMemorialMark() {
  const style = { color: categoryInk("memorial"), backgroundColor: categoryTint("memorial") };
  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-lg font-medium text-ink">نشان جاویدنامان</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        شیر و خورشیدِ کامل نشان نجابتی است با یال و چهره و شمشیر؛ در ۱۳ پیکسل — اندازه‌ای که داخل ردیف فهرست
        استفاده می‌شود — به یک لکه تبدیل می‌شود. این سه برداشت خطی‌اند، در همهٔ اندازه‌هایی که اپ آیکن می‌کشد.
      </p>

      <div className="mt-8 space-y-8">
        {MARKS.map(({ id, name, mark: Mark, note }) => (
          <section key={id} className="rounded-2xl border border-line p-5">
            <h2 className="text-sm font-medium text-ink">{name}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">{note}</p>
            <div className="mt-4 flex flex-wrap items-end gap-6">
              {SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <span style={{ color: categoryInk("memorial") }}><Mark size={size} /></span>
                  <span className="text-[0.625rem] text-muted tabular-nums">{size}px</span>
                </div>
              ))}
            </div>
            {/* The row it would actually live in */}
            <div className="mt-5 flex items-baseline gap-3 border-t border-line pt-4">
              <span className="min-w-20 text-sm leading-6 font-medium tabular-nums text-forest">۴ روز دیگر</span>
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center self-start rounded-md" style={style}>
                <Mark size={13} />
              </span>
              <span className="flex-1 text-xs leading-6">
                <span className="font-medium">ندا آقاسلطان</span>
                <span className="block text-[0.625rem] text-muted">۳۰ خرداد ۱۴۰۵ · ۱۶مین سال</span>
              </span>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted">
        الان «الف» پیش‌فرض است. هرکدام را خواستی بگو تا جایگزین شود؛ بقیه و همین صفحه حذف می‌شوند.
      </p>
    </main>
  );
}
