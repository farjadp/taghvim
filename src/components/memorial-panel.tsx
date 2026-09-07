// ============================================================================
// Source: src/components/memorial-panel.tsx
// Version: 0.3.0 — 2026-09-07
// Why: The box that replaced prayer times in the default view: one randomly
//      chosen person from the javidnaman list, with photo, age, place and a
//      link to their page on the source site. A new name on every request.
// Env / Deps: Person is picked on the server (app/page.tsx) so the HTML and the
//      hydrated tree agree. Photo is a plain <img> hot-linked with no referrer.
// ============================================================================

"use client";

import { useState } from "react";
import { ArrowUpLeft, Flame, Info, MapPin } from "lucide-react";
import { fa, formatDate } from "@/lib/calendar";
import { JAVIDNAMAN, JAVIDNAMAN_NOTICE, personUrl, photoUrl, type Person } from "@/lib/javidnaman";

// Persian-digit count with the Persian thousands separator
const count = (value: number) => fa(value).replace(/\B(?=(\d{3})+(?!\d))/g, "٬").replace(/(?<=[۰-۹])(?=(?:[۰-۹]{3})+(?![۰-۹]))/g, "٬");

export function MemorialPanel({ person }: { person: Person }) {
  // If the CDN is unreachable (or the record has no photo) fall back to a quiet placeholder
  const [broken, setBroken] = useState(false);
  const showPhoto = person.photo && !broken;
  const details = [person.age !== null && `${fa(person.age)} ساله`, person.place].filter(Boolean).join(" · ");
  const updated = formatDate(new Date(`${JAVIDNAMAN.fetchedAt}T12:00:00Z`));
  return <section id="memorial" data-testid="memorial" aria-label="یادبود جاویدنامان" className="mt-7 rounded-[1.75rem] border border-line bg-white px-5 py-6 sm:px-7">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">جاویدنامان انقلاب ملی ایرانیان</h2><p className="mt-1 text-[11px] text-muted">جان‌باختگان ۱۸ و ۱۹ دی، به دست حکومت جمهوری اسلامی</p></div><span className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-xs text-clay"><Flame size={16} />یکی از {count(JAVIDNAMAN.count)} نام</span></div>
    <div className="mt-6 flex items-center gap-5 sm:gap-7">
      {/* Photo: 112px square like the source's "md" size; placeholder keeps the layout when absent */}
      {showPhoto
        ? <img src={photoUrl(person.id, 288)} alt={`عکس ${person.name}`} width={112} height={112} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="size-24 shrink-0 rounded-2xl border border-line object-cover sm:size-28" />
        : <div aria-hidden="true" className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-leaf text-forest sm:size-28"><Flame size={28} strokeWidth={1.4} /></div>}
      <div className="min-w-0">
        <p data-testid="memorial-name" className="text-2xl font-semibold leading-snug sm:text-3xl">{person.name}</p>
        {details && <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><MapPin size={14} />{details}</p>}
        <a href={personUrl(person.id)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:underline">صفحهٔ او در جاویدنامان<ArrowUpLeft size={14} /></a>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><p className="text-xs text-muted">هر بار که این صفحه باز می‌شود، یک نام دیگر.</p><span className="text-[10px] text-muted">منبع: ایران اینترنشنال · به‌روزرسانی {updated}</span></div>
    <details className="mt-3 text-[10px] leading-6 text-muted"><summary className="flex cursor-pointer items-center gap-1.5"><Info size={13} />دربارهٔ این فهرست</summary><p className="pt-2">{JAVIDNAMAN_NOTICE}</p></details>
    <p className="mt-3 text-[10px] text-muted">اینجا پیش‌تر اوقات شرعی را اعلام می‌کردیم.</p>
  </section>;
}
