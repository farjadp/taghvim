// ============================================================================
// Source: src/components/tools-panel.tsx
// Version: 0.9.16 — 2026-09-09
// Why: Date tools: continuous holidays, countdown, conversion, distance, age.
//      «تعطیلات پیوسته» is the first tab and the default one. «تاریخ‌های من» is
//      third rather than last: on a phone the strip scrolls, and a tab nobody
//      scrolls to is the page it replaced.
// Env / Deps: Input parsing accepts Persian, Arabic-Indic and Latin digits.
//      The first two tabs read the visitor's event groups, so the panel takes
//      them; the other three do not care.
// ============================================================================

"use client";

import { useState } from "react";
import { ArrowLeft, ArrowLeftRight, CalendarHeart, CalendarRange, Cake, Hourglass, Timer } from "lucide-react";
import { type CalendarKind, dateNumbers, daysBetween, fa, formatDate, fromCalendar, toCalendar } from "@/lib/calendar";
import { useMonthNames } from "./month-names-context";
import { elapsedAge, parseNumericInput } from "@/lib/date-tools";
import { type EventGroups } from "@/lib/events";
import { type Anniversary } from "@/lib/dates";
import { BridgesTool } from "./bridges-tool";
import { CountdownTool } from "./countdown-tool";
import { DatesTool } from "./dates-tool";

export type ToolTab = "bridges" | "countdown" | "dates" | "convert" | "distance" | "age";
// What the tools box opens on. «تعطیلات پیوسته» answers a question the other tools do not:
// not «what is this date» but «when can I actually take time off».
export const DEFAULT_TOOL: ToolTab = "bridges";
// The keys a URL hash may name, so `/#dates` opens that tool.
export const TOOL_TABS: ToolTab[] = ["bridges", "countdown", "dates", "convert", "distance", "age"];
type DateInput = { year: string; month: string; day: string };
const KINDS: { value: CalendarKind; label: string }[] = [{ value: "persian", label: "خورشیدی" }, { value: "gregorian", label: "میلادی" }, { value: "islamic", label: "قمری محاسباتی" }];
const GREGORIAN_MONTHS = ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];
const ISLAMIC_MONTHS = ["محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه"];
const INVALID_DATE = "تاریخ معتبر نیست. روز، ماه و سال را بررسی کنید؛ بازهٔ پشتیبانی‌شده ۱۲۰۰ تا ۱۶۰۰ خورشیدی است.";

// Date → three input strings in Persian digits, for pre-filling a form
function inputDate(date: Date, kind: CalendarKind = "persian"): DateInput {
  const parts = toCalendar(date, kind);
  return { year: String(parts.year), month: String(parts.month), day: String(parts.day) };
}
// Three input strings → Date, throwing a Persian RangeError on bad input
function parseDate(value: DateInput, kind: CalendarKind = "persian") {
  return fromCalendar({ year: parseNumericInput(value.year), month: parseNumericInput(value.month), day: parseNumericInput(value.day) }, kind);
}

function DateFields({ value, onChange, kind = "persian", prefix = "" }: { value: DateInput; onChange: (value: DateInput) => void; kind?: CalendarKind; prefix?: string }) {
  const months = useMonthNames();
  const names = kind === "persian" ? months : kind === "gregorian" ? GREGORIAN_MONTHS : ISLAMIC_MONTHS;
  return <div className="grid grid-cols-[.8fr_1.35fr_1fr] gap-3">
    <label className="block text-xs text-muted"><span className="mb-2 block">روز</span><input aria-label={`${prefix}روز`} inputMode="numeric" autoComplete="off" maxLength={2} value={value.day} onChange={(event) => onChange({ ...value, day: event.target.value })} className="field tabular-nums" /></label>
    <label className="block text-xs text-muted"><span className="mb-2 block">ماه</span><select aria-label={`${prefix}ماه`} value={value.month} onChange={(event) => onChange({ ...value, month: event.target.value })} className="field">{names.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}</select></label>
    <label className="block text-xs text-muted"><span className="mb-2 block">سال</span><input aria-label={`${prefix}سال`} inputMode="numeric" autoComplete="off" maxLength={4} value={value.year} onChange={(event) => onChange({ ...value, year: event.target.value })} className="field tabular-nums" /></label>
  </div>;
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return <button type="submit" className="flex h-12 items-center justify-center gap-5 rounded-xl bg-forest-deep px-6 text-xs font-medium text-white transition-colors hover:bg-[#173d30]">{children}<ArrowLeft size={16} /></button>;
}

// Tab 1: convert a date from one calendar into the other two
function Converter({ now }: { now: Date }) {
  const [kind, setKind] = useState<CalendarKind>("persian");
  const [value, setValue] = useState(inputDate(now));
  const [result, setResult] = useState<Date | null>(null);
  const [error, setError] = useState("");
  function change(next: DateInput) { setValue(next); setResult(null); setError(""); }
  return <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr]">
    <form noValidate onSubmit={(event) => {
      event.preventDefault();
      try { setResult(parseDate(value, kind)); setError(""); }
      catch { setError(INVALID_DATE); setResult(null); }
    }}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium">تاریخ را در کدام تقویم وارد می‌کنی؟</p><select aria-label="تقویم مبدأ" value={kind} onChange={(event) => { const next = event.target.value as CalendarKind; setKind(next); change(inputDate(now, next)); }} className="rounded-lg border border-line bg-paper px-3 py-2 text-xs">{KINDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <DateFields value={value} kind={kind} onChange={change} />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[0.625rem] text-muted">تبدیل هم‌زمان به هر سه تقویم</p><SubmitButton>تبدیل کن</SubmitButton></div>
      {error && <p role="alert" className="mt-3 text-xs leading-6 text-clay">{error}</p>}
    </form>
    <div data-testid="conversion-result" aria-live="polite" className="rounded-xl bg-paper px-5 py-3">
      {result ? KINDS.map((item) => <div key={item.value} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3 last:border-0"><span className="text-[0.6875rem] text-muted">{item.label}</span><div className="text-left"><p className="text-sm font-semibold tabular-nums" dir="ltr">{dateNumbers(result, item.value)}</p><p className="mt-1 text-[0.625rem] text-muted">{formatDate(result, item.value)}</p></div></div>) : <div className="flex h-full min-h-44 flex-col items-center justify-center gap-3 text-center"><ArrowLeftRight size={28} strokeWidth={1.3} className="text-forest" /><p className="text-xs leading-6 text-muted">تاریخ را وارد کن و «تبدیل کن» را بزن.<br />معادل شمسی، میلادی و قمری اینجا می‌آید.</p></div>}
    </div>
    <p className="text-[0.625rem] leading-6 text-muted lg:col-span-2">تقویم قمری بر اساس روش محاسباتی است، نه رؤیت هلال؛ ممکن است با تقویم رسمی ایران متفاوت باشد.</p>
  </div>;
}

// Tab 2: whole days between two Persian dates (sign-aware)
function Distance({ now }: { now: Date }) {
  const [start, setStart] = useState(inputDate(now));
  const [end, setEnd] = useState(inputDate(now));
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState("");
  return <form noValidate onSubmit={(event) => {
    event.preventDefault();
    try { setResult(daysBetween(parseDate(start), parseDate(end))); setError(""); }
    catch { setError(INVALID_DATE); setResult(null); }
  }}>
    <div className="grid gap-6 sm:grid-cols-2"><fieldset><legend className="mb-4 text-sm font-medium">از تاریخ خورشیدی</legend><DateFields prefix="مبدأ " value={start} onChange={(value) => { setStart(value); setResult(null); setError(""); }} /></fieldset><fieldset><legend className="mb-4 text-sm font-medium">تا تاریخ خورشیدی</legend><DateFields prefix="مقصد " value={end} onChange={(value) => { setEnd(value); setResult(null); setError(""); }} /></fieldset></div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="text-[0.625rem] text-muted">روز شروع در فاصله شمرده نمی‌شود.</p><SubmitButton>محاسبهٔ فاصله</SubmitButton></div>
    {error && <p role="alert" className="mt-3 text-xs leading-6 text-clay">{error}</p>}
    {result !== null && <div role="status" className="mt-5 rounded-xl bg-leaf px-5 py-4 text-sm text-forest"><strong className="text-2xl tabular-nums">{fa(Math.abs(result))}</strong> روز {result < 0 ? "به عقب" : "فاصله"}<span className="mr-4 text-xs">{fa(Math.floor(Math.abs(result) / 7))} هفته و {fa(Math.abs(result) % 7)} روز</span></div>}
  </form>;
}

// Tab 3: elapsed age from a Persian birthday to today
function Age({ now }: { now: Date }) {
  const [value, setValue] = useState(inputDate(now));
  const [result, setResult] = useState<ReturnType<typeof elapsedAge> | null>(null);
  const [error, setError] = useState("");
  return <form noValidate onSubmit={(event) => {
    event.preventDefault();
    try {
      const birthday = parseDate(value);
      if (daysBetween(birthday, now) < 0) { setError("تاریخ تولد نمی‌تواند در آینده باشد."); setResult(null); return; }
      setResult(elapsedAge(birthday, now)); setError("");
    } catch { setError(INVALID_DATE); setResult(null); }
  }}>
    <div className="max-w-xl"><DateFields prefix="تولد " value={value} onChange={(next) => { setValue(next); setResult(null); setError(""); }} /></div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="text-[0.625rem] text-muted">سن تقویمی تا امروز، به وقت ایران</p><SubmitButton>محاسبهٔ سن</SubmitButton></div>
    {error && <p role="alert" className="mt-3 text-xs leading-6 text-clay">{error}</p>}
    {result && <p role="status" className="mt-5 rounded-xl bg-leaf px-5 py-5 text-lg font-medium text-forest">{fa(result.years)} سال و {fa(result.months)} ماه و {fa(result.days)} روز</p>}
  </form>;
}

// Tab strip supports RTL arrow keys: ArrowLeft advances, ArrowRight goes back
export function ToolsPanel({ now, tab, onTabChange, groups, dates, datesReady, onDatesChange, bridgesHref = "/bridges" }: { now: Date; tab: ToolTab; onTabChange: (tab: ToolTab) => void; groups: EventGroups; dates: Anniversary[]; datesReady: boolean; onDatesChange: (next: Anniversary[]) => void; bridgesHref?: string }) {
  const tabs = [
    { key: "bridges" as const, label: "تعطیلات پیوسته", icon: CalendarRange, description: "بازه‌هایی که با یکی دو روز مرخصی به چند روز تعطیلی پشت‌سرهم می‌رسند." },
    { key: "countdown" as const, label: "روزشمار", icon: Timer, description: "چند روز تا مناسبت‌های بعدی، و تا نوروز و یلدا." },
    { key: "dates" as const, label: "تاریخ‌های من", icon: CalendarHeart, description: "تولدها و سالگردها به تاریخ شمسی؛ فقط در مرورگر خودت می‌ماند." },
    { key: "convert" as const, label: "تبدیل تاریخ‌ها", icon: ArrowLeftRight, description: "یک تاریخ را وارد کن، معادلش را در هر سه تقویم بگیر." },
    { key: "distance" as const, label: "فاصلهٔ دو تاریخ", icon: Hourglass, description: "چند روز میان دو تاریخ خورشیدی فاصله است." },
    { key: "age" as const, label: "محاسبهٔ سن", icon: Cake, description: "از تاریخ تولد خورشیدی تا امروز، به سال و ماه و روز." },
  ];
  const active = tabs.find((item) => item.key === tab) ?? tabs[0];
  return <section id="tools" aria-label="ابزارهای تاریخ" className="mt-7 overflow-hidden rounded-[1.75rem] border border-line bg-surface">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-7"><h2 className="text-lg font-semibold">ابزارهای تاریخ</h2><div role="tablist" aria-label="انتخاب ابزار" className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-paper p-1">{tabs.map(({ key, label, icon: Icon }) => <button id={`tab-${key}`} key={key} role="tab" tabIndex={tab === key ? 0 : -1} aria-selected={tab === key} aria-controls="tool-content" onClick={() => onTabChange(key)} onKeyDown={(event) => {
      const index = tabs.findIndex((item) => item.key === key);
      const next = event.key === "ArrowLeft" ? (index + 1) % tabs.length : event.key === "ArrowRight" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault();
      onTabChange(tabs[next].key);
      document.getElementById(`tab-${tabs[next].key}`)?.focus();
    }} className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2.5 text-[0.625rem] transition-colors sm:px-4 sm:text-xs ${tab === key ? "bg-surface font-medium text-forest shadow-xs" : "text-muted hover:text-forest"}`}><Icon size={14} />{label}</button>)}</div></div>
    <div id="tool-content" role="tabpanel" aria-labelledby={`tab-${tab}`} className="p-5 sm:p-7">
      {/* One line saying what this tool answers, in the panel rather than in each tool, so
          all six read alike and a new one cannot ship without one. */}
      <p data-testid="tool-description" className="mb-5 text-sm font-medium">{active.description}</p>
      {tab === "bridges" ? <BridgesTool now={now} groups={groups} moreHref={bridgesHref} /> : tab === "countdown" ? <CountdownTool now={now} groups={groups} /> : tab === "dates" ? <DatesTool now={now} dates={dates} ready={datesReady} onChange={onDatesChange} /> : tab === "convert" ? <Converter now={now} /> : tab === "distance" ? <Distance now={now} /> : <Age now={now} />}</div>
  </section>;
}
