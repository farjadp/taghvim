// ============================================================================
// Source: src/components/dates-tool.tsx
// Version: 0.5.0 — 2026-09-10
// Why: The visitor's own dates: add under one of fourteen categories and one of
//      three rhythms, list by nearness, remove, and export as an .ics.
// Env / Deps: lib/dates owns the arithmetic, lib/date-tools parses the fields so
//      Persian and Arabic-Indic digits work; the caller owns the list and its
//      persistence, so the calendar grid and this tool always agree.
//      Nothing here reaches a network.
// ============================================================================

"use client";

import { useState } from "react";
import { ArrowLeft, CalendarPlus, Download, Info, Trash2 } from "lucide-react";
import { fa, formatDate } from "@/lib/calendar";
import { useMonthNames } from "./month-names-context";
import { parseNumericInput } from "@/lib/date-tools";
import {
  addDate, buildDatesFile, DATES_NOTICE, MAX_TITLE, removeDate,
  upcomingDates, type Anniversary, type UpcomingDate,
} from "@/lib/dates";
import {
  CATEGORIES, categoryOf, DEFAULT_CATEGORY, REPEATS,
  type CategoryId, type Repeat,
} from "@/lib/date-categories";
import { CategoryIcon, categoryStyle } from "./date-category-icon";

const EMPTY = {
  title: "",
  category: DEFAULT_CATEGORY as CategoryId,
  repeat: "yearly" as Repeat,
  day: "",
  month: "1",
  year: "",
};

// «فردا» and «امروز» read better than «۱ روز» and «۰ روز», and only there.
function whenLabel(item: UpcomingDate): string {
  if (item.days === 0) return "امروز";
  if (item.days === 1) return "فردا";
  return `${fa(item.days)} روز دیگر`;
}

// «۳۵ ساله می‌شود» for a person, «۳۵مین سال» for a date being marked, nothing at all for an
// instalment — the category decides, because a sentence about an age it does not have reads
// as a bug. lib/date-categories owns that rule; the .ics export reads the same one.
function yearsLabel(item: UpcomingDate): string | null {
  if (item.years === null) return null;
  const age = categoryOf(item.entry.category).age;
  if (age === "none") return null;
  if (age === "age") return item.days === 0 ? `${fa(item.years)} ساله شد` : `${fa(item.years)} ساله می‌شود`;
  return `${fa(item.years)}مین سال`;
}

/**
 * Controlled on purpose. The calendar grid marks the same days this tool edits, and when the
 * tool owned the list privately the grid did not hear about an addition until a reload — which
 * a separate page hid, and a tab beside the calendar does not.
 */
export function DatesTool({ now, dates, ready, onChange, notice = DATES_NOTICE }: {
  now: Date;
  dates: Anniversary[];
  // False until the browser's list has been read; an empty state before that would tell
  // someone with ten dates that they have none.
  ready: boolean;
  onChange: (next: Anniversary[]) => void;
  // The extension keeps its own list on its own origin and has to say so.
  notice?: string;
}) {
  const months = useMonthNames();
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState("");
  const commit = onChange;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      // parseNumericInput, not Number: people type Persian digits, and `Number("۱۳")` is NaN.
      // Every other tool in this box already parses input this way.
      const monthly = draft.repeat === "monthly";
      commit(addDate(dates, {
        title: draft.title,
        category: draft.category,
        repeat: draft.repeat,
        // A monthly thing has no month and no year: it happens on a day, every month.
        month: monthly ? null : parseNumericInput(draft.month),
        day: parseNumericInput(draft.day),
        year: monthly || draft.year.trim() === "" ? null : parseNumericInput(draft.year),
      }));
      setDraft({ ...EMPTY, category: draft.category, repeat: draft.repeat });
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
        <div className={`mt-4 grid gap-3 ${draft.repeat === "monthly" ? "grid-cols-1" : "grid-cols-[.8fr_1.35fr_1fr]"}`}>
          <label className="block text-xs text-muted"><span className="mb-2 block">روز</span>
            <input aria-label="روز" inputMode="numeric" autoComplete="off" maxLength={2} value={draft.day}
              placeholder="۱۲" onChange={(event) => { setDraft({ ...draft, day: event.target.value }); setError(""); }} className="field tabular-nums" /></label>
          {draft.repeat !== "monthly" && <>
            <label className="block text-xs text-muted"><span className="mb-2 block">ماه</span>
              <select aria-label="ماه" value={draft.month} onChange={(event) => { setDraft({ ...draft, month: event.target.value }); setError(""); }} className="field">
                {months.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
              </select></label>
            <label className="block text-xs text-muted"><span className="mb-2 block">{draft.repeat === "once" ? "سال" : "سال (اختیاری)"}</span>
              <input aria-label="سال" inputMode="numeric" autoComplete="off" maxLength={4} value={draft.year}
                placeholder={draft.repeat === "once" ? "۱۴۰۵" : "۱۳۷۰"}
                onChange={(event) => { setDraft({ ...draft, year: event.target.value }); setError(""); }} className="field tabular-nums" /></label>
          </>}
        </div>
        <label className="mt-4 block text-xs text-muted">
          <span className="mb-2 block">دسته</span>
          {/* A select, not a row of chips: fourteen of them would run out of the box, which
              is exactly the bug 0.9.24 fixed one row above this one. */}
          <select aria-label="دسته" value={draft.category} className="field"
            onChange={(event) => {
              const category = categoryOf(event.target.value);
              // Changing the category moves the rhythm with it — an instalment is monthly,
              // a flight happens once — and the visitor can still override it below.
              setDraft({ ...draft, category: category.id, repeat: category.repeat });
              setError("");
            }}>
            {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
        </label>
        <p className="mt-2 flex items-center gap-2 text-[0.625rem] leading-5 text-muted">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md" style={categoryStyle(draft.category)}>
            <CategoryIcon id={draft.category} size={13} />
          </span>
          {categoryOf(draft.category).hint}
        </p>
        <div className="mt-4 flex flex-wrap gap-1" role="group" aria-label="تکرار">
          {REPEATS.map(({ value, label, hint }) => (
            <button key={value} type="button" title={hint} aria-pressed={draft.repeat === value}
              onClick={() => { setDraft({ ...draft, repeat: value }); setError(""); }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[0.6875rem] transition-colors ${draft.repeat === value ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.625rem] leading-5 text-muted">
            {draft.repeat === "monthly" ? "فقط روز را بنویس — عددی بین ۱ تا ۳۱. ماهی که کمتر از آن روز دارد، به آخرین روزش می‌افتد."
              : draft.repeat === "once" ? "روز، ماه و سال هر سه لازم‌اند؛ سال شمسی، مثل ۱۴۰۵. این تاریخ فقط یک بار می‌آید."
              : "روز و ماه لازم‌اند. سال شمسی اختیاری است — ننویسی هم ذخیره می‌شود، فقط سن نشان داده نمی‌شود."}
          </p>
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
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center self-start rounded-md"
                  style={categoryStyle(item.entry.category)} title={categoryOf(item.entry.category).label}>
                  <CategoryIcon id={item.entry.category} size={13} />
                </span>
                <span className="flex-1 text-xs leading-6">
                  <span className="font-medium">{item.entry.title}</span>
                  {/* The full date of the next occurrence says the day and the month already;
                      repeating them beside it was noise, and the two ran together for a
                      screen reader. */}
                  <span className="block text-[0.625rem] text-muted">
                    {formatDate(item.date, "persian", true)}
                    {item.entry.repeat === "monthly" && <> · هر ماه</>}
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
          <p className="pt-2">{notice}</p>
        </details>
      </div>
    </div>
  );
}
