// ============================================================================
// Source: src/components/dates-tool.tsx
// Version: 0.3.0 — 2026-09-09
// Why: The visitor's own birthdays and anniversaries: add, list by nearness,
//      remove, and export to their own calendar as an .ics.
// Env / Deps: lib/dates owns the arithmetic, lib/date-tools parses the fields so
//      Persian and Arabic-Indic digits work; the caller owns the list and its
//      persistence, so the calendar grid and this tool always agree.
//      Nothing here reaches a network.
// ============================================================================

"use client";

import { useState } from "react";
import { ArrowLeft, CalendarPlus, Download, Info, Trash2 } from "lucide-react";
import { fa, formatDate, MONTHS } from "@/lib/calendar";
import { parseNumericInput } from "@/lib/date-tools";
import {
  addDate, buildDatesFile, DATES_NOTICE, MAX_TITLE, removeDate,
  upcomingDates, type Anniversary, type DateKind, type UpcomingDate,
} from "@/lib/dates";

const KINDS: { value: DateKind; label: string }[] = [
  { value: "birthday", label: "تولد" },
  { value: "anniversary", label: "سالگرد" },
];

const EMPTY = { title: "", kind: "birthday" as DateKind, day: "", month: "1", year: "" };

// «فردا» and «امروز» read better than «۱ روز» and «۰ روز», and only there.
function whenLabel(item: UpcomingDate): string {
  if (item.days === 0) return "امروز";
  if (item.days === 1) return "فردا";
  return `${fa(item.days)} روز دیگر`;
}

// «۳۵ ساله می‌شود» for a person, «۳۵مین سال» for an event. Same arithmetic, different sentence.
function yearsLabel(item: UpcomingDate): string | null {
  if (item.years === null) return null;
  if (item.entry.kind === "birthday") return item.days === 0 ? `${fa(item.years)} ساله شد` : `${fa(item.years)} ساله می‌شود`;
  return `${fa(item.years)}مین سال`;
}

/**
 * Controlled on purpose. The calendar grid marks the same days this tool edits, and when the
 * tool owned the list privately the grid did not hear about an addition until a reload — which
 * a separate page hid, and a tab beside the calendar does not.
 */
export function DatesTool({ now, dates, ready, onChange }: {
  now: Date;
  dates: Anniversary[];
  // False until the browser's list has been read; an empty state before that would tell
  // someone with ten dates that they have none.
  ready: boolean;
  onChange: (next: Anniversary[]) => void;
}) {
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState("");
  const commit = onChange;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      // parseNumericInput, not Number: people type Persian digits, and `Number("۱۳")` is NaN.
      // Every other tool in this box already parses input this way.
      commit(addDate(dates, {
        title: draft.title,
        kind: draft.kind,
        month: parseNumericInput(draft.month),
        day: parseNumericInput(draft.day),
        year: draft.year.trim() === "" ? null : parseNumericInput(draft.year),
      }));
      setDraft({ ...EMPTY, kind: draft.kind });
      setError("");
    } catch (thrown) {
      setError(thrown instanceof RangeError ? thrown.message : "ذخیره نشد.");
    }
  }

  // Built in the browser from the browser's own list; there is no server that could serve it.
  function download() {
    const blob = new Blob([buildDatesFile(dates, now)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "taghvim-dates.ics";
    link.click();
    URL.revokeObjectURL(url);
  }

  const upcoming = upcomingDates(dates, now);

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_1.1fr]">
      <form noValidate onSubmit={submit}>
        <label className="block text-xs text-muted">
          <span className="mb-2 block">عنوان</span>
          <input aria-label="عنوان" maxLength={MAX_TITLE} autoComplete="off" value={draft.title}
            onChange={(event) => { setDraft({ ...draft, title: event.target.value }); setError(""); }}
            placeholder="تولد مریم" className="field" />
        </label>
        <div className="mt-4 grid grid-cols-[.8fr_1.35fr_1fr] gap-3">
          <label className="block text-xs text-muted"><span className="mb-2 block">روز</span>
            <input aria-label="روز" inputMode="numeric" autoComplete="off" maxLength={2} value={draft.day}
              onChange={(event) => { setDraft({ ...draft, day: event.target.value }); setError(""); }} className="field tabular-nums" /></label>
          <label className="block text-xs text-muted"><span className="mb-2 block">ماه</span>
            <select aria-label="ماه" value={draft.month} onChange={(event) => { setDraft({ ...draft, month: event.target.value }); setError(""); }} className="field">
              {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
            </select></label>
          <label className="block text-xs text-muted"><span className="mb-2 block">سال (اختیاری)</span>
            <input aria-label="سال" inputMode="numeric" autoComplete="off" maxLength={4} value={draft.year}
              onChange={(event) => { setDraft({ ...draft, year: event.target.value }); setError(""); }} className="field tabular-nums" /></label>
        </div>
        <div className="mt-4 flex gap-1" role="group" aria-label="نوع">
          {KINDS.map(({ value, label }) => (
            <button key={value} type="button" aria-pressed={draft.kind === value} onClick={() => setDraft({ ...draft, kind: value })}
              className={`rounded-lg px-3 py-1.5 text-[0.6875rem] transition-colors ${draft.kind === value ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.625rem] text-muted">سال را ندانی هم اشکالی ندارد؛ فقط سن نشان داده نمی‌شود.</p>
          <button type="submit" className="flex h-12 items-center justify-center gap-5 rounded-xl bg-forest-deep px-6 text-xs font-medium text-white transition-colors hover:bg-[#173d30]">افزودن<ArrowLeft size={16} /></button>
        </div>
        {error && <p role="alert" className="mt-3 text-xs leading-6 text-clay">{error}</p>}
      </form>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">تاریخ‌های تو</p>
          {dates.length > 0 && (
            <button type="button" onClick={download} className="flex items-center gap-1.5 text-xs font-medium text-forest hover:underline">
              <Download size={14} />افزودن به تقویم خودت
            </button>
          )}
        </div>
        {/* Before the browser has been read there is nothing truthful to show, and an empty
            state would flash «هیچ تاریخی» at someone who has ten. */}
        {!ready ? <p className="py-8 text-center text-xs text-muted">…</p> : upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-paper py-10 text-center">
            <CalendarPlus size={26} strokeWidth={1.3} className="text-forest" />
            <p className="text-xs leading-6 text-muted">هنوز تاریخی اضافه نکرده‌ای.<br />عنوان و روز و ماه را بنویس و «افزودن» را بزن.</p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {upcoming.map((item) => (
              <li key={item.entry.id} className="flex items-baseline gap-3 border-b border-line py-3.5 last:border-0">
                <span className="min-w-20 text-sm leading-6 font-medium tabular-nums text-forest">{whenLabel(item)}</span>
                <span className="flex-1 text-xs leading-6">
                  <span className="font-medium">{item.entry.title}</span>
                  {/* The full date of the next occurrence says the day and the month already;
                      repeating them beside it was noise, and the two ran together for a
                      screen reader. */}
                  <span className="block text-[0.625rem] text-muted">
                    {formatDate(item.date, "persian", true)}
                    {yearsLabel(item) && <> · {yearsLabel(item)}</>}
                  </span>
                </span>
                <button type="button" onClick={() => commit(removeDate(dates, item.entry.id))}
                  aria-label={`حذف ${item.entry.title}`} className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-paper hover:text-clay">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-5 rounded-lg bg-paper p-3 text-[0.625rem] leading-6 text-muted">
          <summary className="flex cursor-pointer items-center gap-1.5"><Info size={13} />این تاریخ‌ها کجا ذخیره می‌شوند</summary>
          <p className="pt-2">{DATES_NOTICE}</p>
        </details>
      </div>
    </div>
  );
}
