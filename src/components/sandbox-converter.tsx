// ============================================================================
// Source: src/components/sandbox-converter.tsx
// Version: 0.1.0 — 2026-10-09
// Why: SANDBOX for typing a date in words in «تبدیل تاریخ» — level 2 of the
//      screen-reader roadmap: one text field instead of a field, a list and a
//      field. Three variants, each measured live (height, tab stops) under it.
//      Unlinked and noindex. Delete with app/sandbox/converter once Farjad has picked.
// Env / Deps: lib/calendar. The parser here is a draft; the chosen variant
//      moves it into lib/date-tools with tests.
// ============================================================================

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { addDays, dateNumbers, fa, formatDate, fromCalendar, GREGORIAN_MONTHS_FA, MONTHS, toCalendar, type CalendarKind } from "@/lib/calendar";
import { MONTH_NAMES } from "@/lib/month-names";

const KINDS: { value: CalendarKind; label: string }[] = [{ value: "persian", label: "خورشیدی" }, { value: "gregorian", label: "میلادی" }, { value: "islamic", label: "قمری محاسباتی" }];
const ISLAMIC_MONTHS = ["محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه"];
const ENGLISH_MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const KIND_LABEL: Record<CalendarKind, string> = { persian: "خورشیدی", gregorian: "میلادی", islamic: "قمری" };
const EXAMPLE = "مثلاً ۱۵ خرداد ۱۴۰۶، ۲۵ دسامبر ۲۰۲۶، ۱ رمضان، ۱۴۰۶/۳/۱۵ یا فردا";

// --- the draft parser ------------------------------------------------------

// Letters and digits folded to one form: Persian and Arabic-Indic digits to Latin, Arabic
// ي/ك to Persian, and no spaces or ZWNJ, so «ربیع الاول» and «ربیع‌الاول» are one word.
const fold = (text: string) => text.toLowerCase()
  .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
  .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
  .replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[أإآ]/g, "ا");
const compact = (text: string) => fold(text).replace(/[\s‌]/g, "");

type Name = { key: string; kind: CalendarKind; month: number };
const NAMES: Name[] = [
  ...MONTH_NAMES.flatMap((m, i) => [m.modern, ...(m.older ? [m.older] : [])].map((name) => ({ key: compact(name), kind: "persian" as const, month: i + 1 }))),
  ...GREGORIAN_MONTHS_FA.map((name, i) => ({ key: compact(name), kind: "gregorian" as const, month: i + 1 })),
  ...ENGLISH_MONTHS.map((name, i) => ({ key: name, kind: "gregorian" as const, month: i + 1 })),
  ...ISLAMIC_MONTHS.map((name, i) => ({ key: compact(name), kind: "islamic" as const, month: i + 1 })),
].sort((a, b) => b.key.length - a.key.length); // longest first: «مهر» before «مه», «امرداد» before «مرداد»

const RELATIVE: [string, number][] = [["پسفردا", 2], ["پریروز", -2], ["امروز", 0], ["فردا", 1], ["دیروز", -1]];

type Parsed = { date: Date; kind: CalendarKind; read: string } | { error: string } | null;

export function parseDateText(text: string, now: Date): Parsed {
  if (!text.trim()) return null;
  const flat = compact(text);
  for (const [word, offset] of RELATIVE) if (flat === word) {
    const date = addDays(now, offset);
    return { date, kind: "persian", read: `${text.trim()}: ${formatDate(date, "persian", true)}` };
  }
  // An explicit calendar word wins over a guess
  const named: CalendarKind | null = /میلادی|gregorian/.test(flat) ? "gregorian" : /قمری|هجری|islamic/.test(flat) ? "islamic" : /شمسی|خورشیدی/.test(flat) ? "persian" : null;
  const numbers = (fold(text).match(/\d+/g) ?? []).map(Number);
  const name = NAMES.find((n) => flat.includes(n.key));
  let kind: CalendarKind;
  let day: number, month: number, year: number | undefined;
  if (name) {
    kind = name.kind;
    month = name.month;
    if (numbers.length === 0 || numbers.length > 2) return { error: "روز را هم بنویس، مثلاً «۱۵ خرداد»." };
    const big = numbers.find((n) => n > 31);
    day = numbers.find((n) => n <= 31) ?? NaN;
    year = big ?? (numbers.length === 2 ? numbers.find((n) => n !== day) : undefined);
  } else {
    if (numbers.length !== 3) return { error: `تاریخ را نشناختم. ${EXAMPLE}.` };
    // y/m/d when the first number cannot be a day, else d/m/y
    [year, month, day] = numbers[0] > 31 ? numbers : [numbers[2], numbers[1], numbers[0]];
    // A numeric year past 1700 is Gregorian; otherwise Persian unless a word said قمری
    kind = named ?? (year > 1700 ? "gregorian" : "persian");
  }
  if (named && name && named !== name.kind) return { error: `«${text.trim()}» هم ماه ${KIND_LABEL[name.kind]} دارد و هم کلمهٔ ${KIND_LABEL[named]}.` };
  const thisYear = toCalendar(now, kind).year;
  try {
    const date = fromCalendar({ year: year ?? thisYear, month, day }, kind);
    // Gregorian read back in Persian words, as a Persian voice would say it
    const g = toCalendar(date, "gregorian");
    const said = kind === "gregorian" ? `${fa(g.day)} ${GREGORIAN_MONTHS_FA[g.month - 1]} ${fa(g.year)}` : formatDate(date, kind);
    return { date, kind, read: `خوانده شد: ${said} (${KIND_LABEL[kind]})${year === undefined ? "، امسال" : ""}` };
  } catch {
    return { error: "این تاریخ وجود ندارد یا بیرون از بازهٔ ۱۲۰۰ تا ۱۶۰۰ خورشیدی است." };
  }
}

// --- shared pieces -----------------------------------------------------------

// The value after the visitor has stopped typing for `ms`: a live region that changed on
// every keystroke would make a screen reader talk over the typing.
function useSettled<T>(value: T, ms = 700): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

function Result({ date }: { date: Date | null }) {
  return <div className="rounded-xl bg-paper px-5 py-3">
    {date ? KINDS.map((item) => <div key={item.value} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3 last:border-0"><span className="text-[0.6875rem] text-muted">{item.label}</span><div className="text-left"><p className="text-sm font-semibold tabular-nums" dir="ltr">{dateNumbers(date, item.value)}</p><p className="mt-1 text-[0.625rem] text-muted">{formatDate(date, item.value)}</p></div></div>)
      : <div className="flex h-full min-h-44 flex-col items-center justify-center gap-3 text-center"><ArrowLeftRight size={28} strokeWidth={1.3} className="text-forest" /><p className="text-xs leading-6 text-muted">معادل شمسی، میلادی و قمری اینجا می‌آید.</p></div>}
  </div>;
}

// The spoken summary of a result, for the live region
const spokenResult = (date: Date) => {
  const g = toCalendar(date, "gregorian");
  return `خورشیدی ${formatDate(date, "persian", true)}، میلادی ${fa(g.day)} ${GREGORIAN_MONTHS_FA[g.month - 1]} ${fa(g.year)}، قمری ${formatDate(date, "islamic")}`;
};

function TextField({ id, value, onChange, onEnter, parsed }: { id: string; value: string; onChange: (v: string) => void; onEnter?: () => void; parsed: Parsed }) {
  return <div>
    <label htmlFor={id} className="mb-2 block text-sm font-medium">تاریخ را بنویس</label>
    <input id={id} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter?.(); } }} autoComplete="off" aria-describedby={`${id}-hint`} className="field" />
    <p id={`${id}-hint`} className="mt-2 text-[0.625rem] leading-5 text-muted">{EXAMPLE}</p>
    {parsed && "read" in parsed && <p className="mt-1 text-[0.6875rem] text-forest">{parsed.read}</p>}
    {parsed && "error" in parsed && <p className="mt-1 text-[0.6875rem] text-clay">{parsed.error}</p>}
  </div>;
}

function ThreeFields({ kind, setKind, value, setValue }: { kind: CalendarKind; setKind: (k: CalendarKind) => void; value: { day: string; month: string; year: string }; setValue: (v: { day: string; month: string; year: string }) => void }) {
  const names = kind === "persian" ? MONTHS : kind === "gregorian" ? GREGORIAN_MONTHS_FA : ISLAMIC_MONTHS;
  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">تقویم مبدأ</p><select aria-label="تقویم مبدأ" value={kind} onChange={(e) => setKind(e.target.value as CalendarKind)} className="rounded-lg border border-line bg-paper px-3 py-2 text-xs">{KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select></div>
    <div className="grid grid-cols-[.8fr_1.35fr_1fr] gap-3">
      <label className="block text-xs text-muted"><span className="mb-2 block">روز</span><input aria-label="روز" inputMode="numeric" value={value.day} onChange={(e) => setValue({ ...value, day: e.target.value })} className="field tabular-nums" /></label>
      <label className="block text-xs text-muted"><span className="mb-2 block">ماه</span><select aria-label="ماه" value={value.month} onChange={(e) => setValue({ ...value, month: e.target.value })} className="field">{names.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}</select></label>
      <label className="block text-xs text-muted"><span className="mb-2 block">سال</span><input aria-label="سال" inputMode="numeric" value={value.year} onChange={(e) => setValue({ ...value, year: e.target.value })} className="field tabular-nums" /></label>
    </div>
  </>;
}

const fieldsFor = (date: Date, kind: CalendarKind) => { const p = toCalendar(date, kind); return { day: String(p.day), month: String(p.month), year: String(p.year) }; };
const fromFields = (v: { day: string; month: string; year: string }, kind: CalendarKind) => fromCalendar({ day: Number(fold(v.day)), month: Number(v.month), year: Number(fold(v.year)) }, kind);

function Submit({ children = "تبدیل کن" }: { children?: React.ReactNode }) {
  return <button type="submit" className="flex h-12 items-center justify-center gap-5 rounded-xl bg-forest-deep px-6 text-xs font-medium text-white">{children}<ArrowLeft size={16} /></button>;
}

// --- the three variants ------------------------------------------------------

// Now — the form as it ships, for the baseline numbers.
function VariantNow({ now }: { now: Date }) {
  const [kind, setKind] = useState<CalendarKind>("persian");
  const [fields, setFields] = useState(fieldsFor(now, "persian"));
  const [result, setResult] = useState<Date | null>(null);
  return <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr]">
    <form noValidate onSubmit={(e) => { e.preventDefault(); try { setResult(fromFields(fields, kind)); } catch { setResult(null); } }}>
      <ThreeFields kind={kind} setKind={(k) => { setKind(k); setFields(fieldsFor(now, k)); }} value={fields} setValue={setFields} />
      <div className="mt-5 flex justify-end"><Submit /></div>
    </form>
    <div aria-live="polite"><Result date={result} /></div>
  </div>;
}

// A — today's form untouched, with a text field above it that fills the three fields.
function VariantA({ now }: { now: Date }) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<CalendarKind>("persian");
  const [fields, setFields] = useState(fieldsFor(now, "persian"));
  const [result, setResult] = useState<Date | null>(null);
  const parsed = parseDateText(text, now);
  useEffect(() => {
    if (parsed && "date" in parsed) { setKind(parsed.kind); setFields(fieldsFor(parsed.date, parsed.kind)); }
  }, [text]);
  return <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr]">
    <form noValidate onSubmit={(e) => { e.preventDefault(); try { setResult(fromFields(fields, kind)); } catch { setResult(null); } }}>
      <TextField id="a-text" value={text} onChange={setText} parsed={parsed} onEnter={() => { try { setResult(fromFields(fields, kind)); } catch { setResult(null); } }} />
      <p className="my-4 text-center text-[0.625rem] text-muted">یا</p>
      <ThreeFields kind={kind} setKind={(k) => { setKind(k); setFields(fieldsFor(now, k)); }} value={fields} setValue={setFields} />
      <div className="mt-5 flex justify-end"><Submit /></div>
    </form>
    <div aria-live="polite"><Result date={result} /></div>
  </div>;
}

// B — one text field and nothing else; the answer follows the typing.
function VariantB({ now }: { now: Date }) {
  const [text, setText] = useState("");
  const parsed = parseDateText(text, now);
  const settled = useSettled(parsed && "date" in parsed ? parsed.date.toISOString() : "");
  return <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr]">
    <div><TextField id="b-text" value={text} onChange={setText} parsed={parsed} /></div>
    <div>
      <Result date={parsed && "date" in parsed ? parsed.date : null} />
      <p className="sr-only" aria-live="polite">{settled && spokenResult(new Date(settled))}</p>
    </div>
  </div>;
}

// C — B, with today's three fields one click away for whoever prefers them.
function VariantC({ now }: { now: Date }) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<CalendarKind>("persian");
  const [fields, setFields] = useState(fieldsFor(now, "persian"));
  const [fromForm, setFromForm] = useState<Date | null>(null);
  const parsed = parseDateText(text, now);
  const typed = parsed && "date" in parsed ? parsed.date : null;
  const shown = typed ?? fromForm;
  const settled = useSettled(shown ? shown.toISOString() : "");
  return <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr]">
    <div>
      <TextField id="c-text" value={text} onChange={(v) => { setText(v); setFromForm(null); }} parsed={parsed} />
      <details className="mt-4 rounded-xl border border-line px-4 py-3">
        <summary className="cursor-pointer text-xs text-muted">وارد کردن با روز، ماه و سال</summary>
        <form noValidate className="mt-4" onSubmit={(e) => { e.preventDefault(); setText(""); try { setFromForm(fromFields(fields, kind)); } catch { setFromForm(null); } }}>
          <ThreeFields kind={kind} setKind={(k) => { setKind(k); setFields(fieldsFor(now, k)); }} value={fields} setValue={setFields} />
          <div className="mt-4 flex justify-end"><Submit /></div>
        </form>
      </details>
    </div>
    <div>
      <Result date={shown} />
      <p className="sr-only" aria-live="polite">{settled && spokenResult(new Date(settled))}</p>
    </div>
  </div>;
}

// --- measurement frame ---------------------------------------------------------

function Measured({ id, title, summary, keys, children }: { id: string; title: string; summary: string; keys: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ height: 0, stops: 0 });
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setM({
      height: Math.round(node.getBoundingClientRect().height),
      // Tab stops a keyboard user crosses with the box closed
      stops: [...node.querySelectorAll<HTMLElement>("input, select, button, summary, a[href]")].filter((el) => el.offsetParent !== null && (el.tagName === "SUMMARY" || !el.closest("details:not([open])"))).length,
    });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <section aria-labelledby={`${id}-title`} className="mb-10">
    <h2 id={`${id}-title`} className="mb-1 text-base font-semibold text-ink">{title}</h2>
    <p className="mb-3 text-xs leading-6 text-muted">{summary}</p>
    <div ref={ref} className="rounded-[1.75rem] border border-line bg-surface p-5 sm:p-7">{children}</div>
    <dl data-testid={`measure-${id}`} className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[0.6875rem] text-muted">
      <div><dt className="inline">ارتفاع: </dt><dd className="inline tabular-nums">{fa(m.height)}px</dd></div>
      <div><dt className="inline">ایستگاه Tab: </dt><dd className="inline tabular-nums">{fa(m.stops)}</dd></div>
      <div><dt className="inline">برای «۱۵ خرداد ۱۴۰۶»: </dt><dd className="inline">{keys}</dd></div>
    </dl>
  </section>;
}

export function SandboxConverter() {
  // Fixed so the three start equal; the real tab uses the live clock.
  const [now] = useState(() => new Date());
  return <>
    <Measured id="now" title="امروز — همان که روی سایت است" summary="برای مقایسه. صفحه‌خوان پنج کنترل جدا می‌شنود: تقویم، روز، ماه (فهرست ۱۲تایی)، سال، دکمه." keys="Tab به روز، پاک کردن، ۱۵، Tab، انتخاب خرداد با فلش، Tab، ۱۴۰۶، Tab، Enter">
      <VariantNow now={now} />
    </Measured>
    <Measured id="a" title="A — یک خانهٔ اضافه، بالای فرم امروز" summary="فرم فعلی دست نمی‌خورد. هرچه در خانهٔ بالا بنویسی، تقویم و سه خانهٔ پایین را پر می‌کند؛ تبدیل همچنان با دکمه است." keys="نوشتن، بعد Enter">
      <VariantA now={now} />
    </Measured>
    <Measured id="b" title="B — فقط یک خانه" summary="سه خانه و فهرست تقویم حذف می‌شوند. تقویم از نام ماه فهمیده می‌شود و جواب همزمان با نوشتن می‌آید؛ صفحه‌خوان آن را وقتی می‌خواند که نوشتن ۰٫۷ ثانیه متوقف شده باشد." keys="فقط نوشتن">
      <VariantB now={now} />
    </Measured>
    <Measured id="c" title="C — یک خانه، و سه خانهٔ قدیمی زیر یک بازشو" summary="مثل B، ولی فرم فعلی پشت «وارد کردن با روز، ماه و سال» می‌ماند برای کسی که عادت دارد." keys="فقط نوشتن">
      <VariantC now={now} />
    </Measured>
  </>;
}
