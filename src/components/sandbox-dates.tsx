// ============================================================================
// Source: src/components/sandbox-dates.tsx
// Version: 0.1.0 — 2026-09-09
// Why: SANDBOX. Where the personal dates live: a sixth tool tab or a page of
//      their own, and whether the calendar carries a mark for them. The list
//      is real and writes to real localStorage, so what is added here is what
//      would be there afterwards.
// Env / Deps: lib/dates and the real DatesTool and CalendarPanel. Delete this
//      file, src/app/sandbox/dates/page.tsx and CalendarPanel's `marked` prop
//      to drop the sandbox; lib/dates.ts and dates-tool.tsx stand alone.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Cake, CalendarRange, Timer, Trash2 } from "lucide-react";
import { fa, toCalendar } from "@/lib/calendar";
import { DEFAULT_GROUPS } from "@/lib/events";
import { DATES_KEY, datesOn, readDates, type Anniversary } from "@/lib/dates";
import { DatesTool } from "./dates-tool";
import { CalendarPanel } from "./calendar-panel";

function Measured({ children, onHeight }: { children: React.ReactNode; onHeight: (value: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const report = useRef(onHeight);
  report.current = onHeight;
  // Re-measured after every render and on resize; ResizeObserver never fires in the headless
  // browser these numbers get read in.
  const measure = () => { if (ref.current) report.current(Math.round(ref.current.getBoundingClientRect().height)); };
  useEffect(measure);
  useEffect(() => { window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={ref}>{children}</div>;
}

// The real tools box's chrome, so the sixth tab is judged at its real width and not described.
function ToolsFrame({ children }: { children: React.ReactNode }) {
  const tabs = [
    { label: "تعطیلات پیوسته", icon: CalendarRange },
    { label: "روزشمار", icon: Timer },
    { label: "تبدیل تاریخ‌ها", icon: ArrowLeftRight },
    { label: "فاصلهٔ دو تاریخ", icon: Timer },
    { label: "محاسبهٔ سن", icon: Cake },
    { label: "تاریخ‌های من", icon: Cake },
  ];
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
        <h2 className="text-lg font-semibold">ابزارهای تاریخ</h2>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-paper p-1">
          {tabs.map(({ label, icon: Icon }, index) => (
            <span key={label} className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2.5 text-[0.625rem] sm:px-4 sm:text-xs ${index === tabs.length - 1 ? "bg-surface font-medium text-forest shadow-xs" : "text-muted"}`}>
              <Icon size={14} />{label}
            </span>
          ))}
        </div>
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}

// What /dates would look like: the secondary-page shell, same as /bridges.
function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border border-line bg-surface px-5 py-8 sm:px-8">
      <h2 className="text-3xl font-extrabold text-forest sm:text-4xl">تاریخ‌های من</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
        تولدها و سالگردهایی که می‌خواهی در تقویم شمسی جلوی چشمت باشند. فقط در همین مرورگر ذخیره
        می‌شوند و به جایی فرستاده نمی‌شوند.
      </p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

export function SandboxDates({ initialNow }: { initialNow: string }) {
  const now = new Date(initialNow);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [dates, setDates] = useState<Anniversary[]>([]);
  const [marks, setMarks] = useState(true);
  const [view, setView] = useState(() => toCalendar(now));
  // The calendar preview has to see what the tool wrote, and the tool owns its own state, so
  // the sandbox re-reads storage on every change rather than lifting that state out of it.
  useEffect(() => {
    const read = () => setDates(readDates());
    read();
    const timer = setInterval(read, 500);
    window.addEventListener("storage", read);
    return () => { clearInterval(timer); window.removeEventListener("storage", read); };
  }, []);

  const height = (key: string) => fa(heights[key] ?? 0);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-8">
      <h1 className="text-sm font-semibold">سندباکس · تاریخ‌های من</h1>
      <p className="mt-1 max-w-3xl text-[0.6875rem] leading-5 text-muted">
        فهرست واقعی است و در همین مرورگر ذخیره می‌شود (کلید <code>{DATES_KEY}</code>) — چیزی که
        اینجا اضافه کنی، بعداً هم هست. دو چیدمان یکی هستند و یک فهرست را نشان می‌دهند؛ فقط قابشان
        فرق می‌کند — و چون در واقعیت فقط یکی از آن‌ها ساخته می‌شود، اینجا هر بار که فهرست عوض
        شود هر دو دوباره خوانده می‌شوند تا یکی بمانند.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-[0.6875rem] text-muted">{fa(dates.length)} تاریخ ذخیره‌شده</span>
        {dates.length > 0 && (
          <button onClick={() => { window.localStorage.removeItem(DATES_KEY); setDates([]); location.reload(); }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.6875rem] text-muted hover:bg-paper hover:text-clay">
            <Trash2 size={13} />پاک کردن همه (فقط برای آزمایش)
          </button>
        )}
      </div>

      <h2 className="mt-8 mb-2 text-xs font-semibold">الف · زبانهٔ ششم در باکس ابزارها</h2>
      <Measured onHeight={(value) => setHeights((current) => (current["الف"] === value ? current : { ...current, "الف": value }))}>
        <ToolsFrame><DatesTool key={dates.length} now={now} /></ToolsFrame>
      </Measured>
      <p className="mt-2 text-[0.625rem] text-clay">قد: {height("الف")} پیکسل · نوار زبانه‌ها شش‌تایی می‌شود</p>

      <h2 className="mt-10 mb-2 text-xs font-semibold">ب · صفحهٔ جدا، با یک پیوند از ابزارها</h2>
      <Measured onHeight={(value) => setHeights((current) => (current["ب"] === value ? current : { ...current, "ب": value }))}>
        <PageFrame><DatesTool key={dates.length} now={now} /></PageFrame>
      </Measured>
      <p className="mt-2 text-[0.625rem] text-clay">قد: {height("ب")} پیکسل · نوار زبانه‌ها دست‌نخورده می‌ماند</p>

      <h2 className="mt-10 mb-2 text-xs font-semibold">ج · نشان روی تقویم — مستقل از الف و ب</h2>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[0.6875rem] text-muted">نشان:</span>
        {([[true, "روشن"], [false, "خاموش"]] as const).map(([value, label]) => (
          <button key={label} aria-pressed={marks === value} onClick={() => setMarks(value)}
            className={`rounded-lg px-3 py-1.5 text-[0.6875rem] ${marks === value ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>{label}</button>
        ))}
        <span className="text-[0.625rem] text-muted">
          {dates.length === 0 ? "اول بالا یک تاریخ اضافه کن تا نشانش را ببینی." : "نقطهٔ سبز بالا-چپِ خانه."}
        </span>
      </div>
      <div className="lg:max-w-[62%]">
        <CalendarPanel year={view.year} month={view.month} today={now} selected={now} groups={DEFAULT_GROUPS}
          memorial={false} showMemorialSwitch={false} onToggleView={() => {}} onSelect={() => {}}
          onNavigate={(delta) => setView((current) => ({ ...current, month: ((current.month - 1 + delta + 12) % 12) + 1 }))}
          onToday={() => setView(toCalendar(now))} onJump={(year, month) => setView({ year, month, day: 1 })}
          marked={marks ? (date) => datesOn(dates, date).length > 0 : undefined} />
      </div>
    </div>
  );
}
