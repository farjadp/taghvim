// ============================================================================
// Source: src/components/sandbox-month-names.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX. @JustsayAlireza (#95) asked for the Avestan month names «in a
//      section, or separately, or renamed outright» — three placements, so here
//      are the three, with the same real data under each.
// Env / Deps: lib/month-names for the content, lib/calendar for the grid the
//      rename has to survive. Throwaway.
// ============================================================================

"use client";

import { useState } from "react";
import { MONTHS } from "@/lib/calendar";
import { MONTH_NAMES, monthNames, RENAMED } from "@/lib/month-names";

// A stand-in for the calendar header, close enough to judge a name in place.
function MonthStrip({ names, highlight }: { names: string[]; highlight: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {names.map((name, index) => (
        <span key={name} className={`rounded-md px-2 py-1 text-[0.6875rem] ${index === highlight ? "bg-leaf font-medium text-forest" : "text-muted"}`}>
          {name}
        </span>
      ))}
    </div>
  );
}

// الف — a switch beside theme and font: the names change, nothing is explained.
function VariantSwitch() {
  const [older, setOlder] = useState(true);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted">نام ماه‌ها</span>
        <div className="flex rounded-lg bg-paper p-0.5">
          {[["امروزی", false], ["اوستایی", true]].map(([label, value]) => (
            <button key={String(value)} type="button" aria-pressed={older === value} onClick={() => setOlder(value as boolean)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[0.6875rem] transition-colors ${older === value ? "bg-surface font-medium text-forest shadow-sm" : "text-muted hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <MonthStrip names={monthNames(older)} highlight={4} />
      <p className="text-[0.625rem] leading-5 text-muted">
        فقط دو نام عوض می‌شود: {RENAMED.map((month) => `${month.modern} ← ${month.older}`).join(" و ")}. بقیه همین حالا هم اوستایی‌اند.
      </p>
    </div>
  );
}

// ب — a section under the calendar: every name explained, nothing renamed.
function VariantSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">نام ماه‌ها از کجا آمده‌اند</p>
      <ul className="divide-y divide-line">
        {MONTH_NAMES.map((month) => (
          <li key={month.modern} className="flex items-baseline gap-3 py-2">
            <span className="min-w-16 text-xs font-medium text-ink">{month.modern}</span>
            <span className="min-w-24 text-[0.6875rem] text-forest">{month.avestan}</span>
            <span className="flex-1 text-[0.6875rem] text-muted">{month.meaning}</span>
            {month.older && <span className="shrink-0 rounded-md bg-leaf px-2 py-0.5 text-[0.625rem] text-forest">{month.older}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// پ — the name keeps its place and carries its meaning with it.
function VariantInline() {
  const [month, setMonth] = useState(4);
  const entry = MONTH_NAMES[month];
  return (
    <div className="space-y-3">
      <MonthStrip names={MONTHS} highlight={month} />
      <div className="flex flex-wrap gap-1">
        {MONTHS.map((name, index) => (
          <button key={name} type="button" onClick={() => setMonth(index)} className="rounded-md px-2 py-1 text-[0.625rem] text-muted hover:bg-paper">
            {name}
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-paper p-3">
        <p className="text-sm font-medium text-ink">
          {entry.modern}
          {entry.older && <span className="text-muted"> · {entry.older}</span>}
        </p>
        <p className="mt-1 text-[0.6875rem] leading-5 text-muted">
          از <span className="text-forest">{entry.avestan}</span> — {entry.meaning}
        </p>
      </div>
    </div>
  );
}

const VARIANTS = [
  { id: "switch", name: "الف · کلید کنار پوسته و قلم", body: <VariantSwitch />,
    what: "نام‌ها عوض می‌شوند، هیچ توضیحی داده نمی‌شود.",
    cost: "دو نام در کل تغییر می‌کند و باید در گرید، ابزارها، خروجی ics و تصویر روز هم عوض شود.",
    against: "کسی که نمی‌داند «امرداد» چیست، از این کلید چیزی یاد نمی‌گیرد." },
  { id: "section", name: "ب · بخش جدا زیر تقویم", body: <VariantSection />,
    what: "هر دوازده نام با ریشه و معنی‌اش. هیچ چیز تغییر نام نمی‌دهد.",
    cost: "یک بخش، صفر تغییر در بقیهٔ اپ.",
    against: "یک بخش دیگر روی صفحه‌ای که کامنت #42 و #61 می‌گویند از قبل بلند است." },
  { id: "inline", name: "پ · نام سر جایش، معنی همراهش", body: <VariantInline />,
    what: "ماه انتخاب‌شده معنی‌اش را زیر خودش می‌آورد؛ آن دو نام هم کنار هم دیده می‌شوند.",
    cost: "یک خط زیر سربرگ ماه.",
    against: "معنی فقط برای ماه جاری دیده می‌شود، نه همه با هم." },
];

export function SandboxMonthNames() {
  return (
    <main dir="rtl" className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-lg font-medium text-ink">نام ماه‌های اوستایی</h1>
      <div className="mt-3 max-w-3xl space-y-2 text-sm leading-relaxed text-muted">
        <p>
          کامنت #95 سه حالت پیشنهاد داده بود: «در یک بخش، یا به‌صورت جدا، یا کلاً تغییر نام». هر سه اینجاست، با یک دادهٔ مشترک.
        </p>
        <p className="rounded-xl border border-line bg-paper p-3 text-xs leading-6">
          <span className="font-medium text-ink">قبل از انتخاب:</span> دوازده نام امروزی <span className="text-ink">خودشان اوستایی‌اند</span> —
          فرسوده‌شده در فارسی میانه. اینجا هیچ تقویمی جایگزین نمی‌شود. فقط <span className="text-ink">دو ماه</span> صورت کهن متفاوت دارند،
          و فقط یکی‌شان معنی‌اش عوض می‌شود: الفِ «امرداد» نشانهٔ نفی است و بی‌مرگی معنی می‌دهد؛ بدون آن، واژه وارونهٔ خودش را می‌گوید.
          «اسفند ← سپندارمذ» صورت کامل‌تر همان نام است، نه تصحیح.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {VARIANTS.map((variant) => (
          <section key={variant.id} className="flex flex-col gap-4 rounded-2xl border border-line p-5">
            <header className="space-y-1">
              <h2 className="text-sm font-medium text-ink">{variant.name}</h2>
              <p className="text-[0.6875rem] leading-5 text-muted">{variant.what}</p>
            </header>
            <div className="flex-1">{variant.body}</div>
            <footer className="space-y-1 border-t border-line pt-3 text-[0.625rem] leading-5">
              <p className="text-muted"><span className="text-ink">هزینه:</span> {variant.cost}</p>
              <p className="text-clay"><span className="text-ink">علیهش:</span> {variant.against}</p>
            </footer>
          </section>
        ))}
      </div>
    </main>
  );
}
