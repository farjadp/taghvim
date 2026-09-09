// ============================================================================
// Source: src/components/sandbox-bridges.tsx
// Version: 0.1.0 — 2026-09-09
// Why: SANDBOX. Three presentations of the holiday-bridges panel, side by side,
//      each measured, so the layout is chosen off numbers rather than description.
// Env / Deps: lib/bridges over the real event data. Delete this file and
//      src/app/sandbox/bridges/page.tsx to drop the idea; nothing else imports them.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, Info, TriangleAlert } from "lucide-react";
import { dayKey, fa, formatDate, fromCalendar, MONTHS, toCalendar, WEEKDAYS, weekdayIndex } from "@/lib/calendar";
import { ALL_GROUPS, DEFAULT_GROUPS, type EventGroups } from "@/lib/events";
import { BRIDGES_NOTICE, findBridges, type Bridge } from "@/lib/bridges";

// Single letters, because slicing WEEKDAYS gives «سه‌» — a name cut mid zero-width joiner.
const WEEKDAY_INITIALS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// «۸ روز» is the headline; the price is the second line, never the first.
const lengthLabel = (bridge: Bridge) => `${fa(bridge.length)} روز پیوسته`;
const priceLabel = (bridge: Bridge) => bridge.leave.length === 0
  ? "بدون مرخصی"
  : `با ${fa(bridge.leave.length)} روز مرخصی`;
const rangeLabel = (bridge: Bridge) => `${formatDate(bridge.start)} تا ${formatDate(bridge.end)}`;
const leaveLabel = (bridge: Bridge) => bridge.leave
  .map((day) => `${WEEKDAYS[weekdayIndex(day)]} ${fa(toCalendar(day).day)} ${MONTHS[toCalendar(day).month - 1]}`)
  .join(" و ");

function Warning() {
  return (
    <span className="inline-flex items-center gap-1 text-[0.625rem] text-clay">
      <TriangleAlert size={11} />ممکن است یک روز جابه‌جا شود
    </span>
  );
}

// الف · one line per bridge. The cheapest layout, and the only one that fits a sidebar.
function VariantList({ bridges }: { bridges: Bridge[] }) {
  return (
    <div className="flex flex-col">
      {bridges.map((bridge, index) => (
        <div key={index} className="flex items-baseline gap-3 border-b border-line py-3 last:border-0">
          <span className="min-w-14 text-xl leading-6 font-medium tabular-nums text-forest">{fa(bridge.length)}</span>
          <span className="flex-1 text-xs leading-6">
            <span className="font-medium">{rangeLabel(bridge)}</span>
            <span className="text-muted"> · {priceLabel(bridge)}</span>
            {bridge.leave.length > 0 && <span className="block text-[0.625rem] text-muted">مرخصی: {leaveLabel(bridge)}</span>}
            <span className="block text-[0.625rem] text-muted">{bridge.titles.join(" · ")}</span>
            {bridge.uncertain && <Warning />}
          </span>
        </div>
      ))}
    </div>
  );
}

// ب · one strip per bridge: every day drawn, so the shape of the run is visible and the
// leave days sit where they actually fall.
function VariantStrip({ bridges }: { bridges: Bridge[] }) {
  return (
    <div className="flex flex-col gap-4">
      {bridges.map((bridge, index) => {
        const days = Array.from({ length: bridge.length }, (_, offset) => {
          const date = new Date(bridge.start.getTime() + offset * 86_400_000);
          const isLeave = bridge.leave.some((day) => day.getTime() === date.getTime());
          return { date, isLeave };
        });
        return (
          <div key={index} className="rounded-2xl bg-paper p-4">
            <p className="text-sm font-medium">{lengthLabel(bridge)} <span className="text-muted">· {priceLabel(bridge)}</span></p>
            <div className="mt-3 flex gap-1" dir="rtl">
              {days.map(({ date, isLeave }, dayIndex) => (
                <span key={dayIndex} className={`flex h-11 flex-1 flex-col items-center justify-center rounded-lg text-[0.625rem] tabular-nums ${isLeave ? "border border-dashed border-clay text-clay" : "bg-leaf text-forest"}`}>
                  <span className="text-xs font-medium">{fa(toCalendar(date).day)}</span>
                  <span>{WEEKDAY_INITIALS[weekdayIndex(date)]}</span>
                </span>
              ))}
            </div>
            <p className="mt-3 text-[0.625rem] leading-5 text-muted">{bridge.titles.join(" · ")}</p>
            {bridge.uncertain && <Warning />}
          </div>
        );
      })}
    </div>
  );
}

// ج · only the next one, in full, with the rest folded away. The quietest option, and the
// only one that cannot push the calendar down the page.
function VariantNext({ bridges }: { bridges: Bridge[] }) {
  const [next, ...rest] = bridges;
  if (!next) return <p className="py-8 text-center text-xs text-muted">با تنظیمات فعلی پلی پیدا نشد.</p>;
  return (
    <div>
      <p className="text-2xl font-medium text-forest">{lengthLabel(next)}</p>
      <p className="mt-1 text-sm">{rangeLabel(next)}</p>
      <p className="mt-1 text-xs text-muted">{priceLabel(next)}{next.leave.length > 0 && ` — ${leaveLabel(next)}`}</p>
      <p className="mt-2 text-[0.625rem] leading-5 text-muted">{next.titles.join(" · ")}</p>
      {next.uncertain && <Warning />}
      {rest.length > 0 && (
        <details className="mt-4 border-t border-line pt-3">
          <summary className="cursor-pointer text-xs text-muted">{fa(rest.length)} پل دیگر تا پایان سال</summary>
          <div className="pt-2"><VariantList bridges={rest} /></div>
        </details>
      )}
    </div>
  );
}

const VARIANTS = [
  { key: "الف", title: "فهرست فشرده", note: "یک سطر برای هر پل. تنها گزینه‌ای که در ستون کناری جا می‌شود.", render: VariantList },
  { key: "ب", title: "نوار روزها", note: "هر روزِ پل کشیده می‌شود؛ روز مرخصی با خط‌چین. شکل تعطیلی دیده می‌شود، ولی بلند است.", render: VariantStrip },
  { key: "ج", title: "فقط پل بعدی", note: "یکی کامل، بقیه تاشده. کوتاه‌ترین، و تنها گزینه‌ای که تقویم را پایین نمی‌راند.", render: VariantNext },
] as const;

// Measured after every render and again on every resize. A ResizeObserver would be the
// obvious tool and is deliberately not used: it never fires in the headless browser these
// numbers are read in, so it would report a confident zero.
function Measured({ children, onHeight }: { children: React.ReactNode; onHeight: (value: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const report = useRef(onHeight);
  report.current = onHeight;
  const measure = () => {
    if (ref.current) report.current(Math.round(ref.current.getBoundingClientRect().height));
  };
  useEffect(measure);
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref}>{children}</div>;
}

export function SandboxBridges() {
  const today = new Date();
  const year = toCalendar(today).year;
  const [groups, setGroups] = useState<EventGroups>(DEFAULT_GROUPS);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const bridges = findBridges(fromCalendar({ year, month: 1, day: 1 }), fromCalendar({ year, month: 12, day: 29 }), groups);
  // Compared as civil days in Tehran: a run that ends today is still today's news, whatever
  // the clock says.
  const upcoming = bridges.filter((bridge) => dayKey(bridge.end) >= dayKey(today));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-xl font-semibold">سندباکس · پل‌های تعطیلات</h1>
      <p className="mt-2 text-xs leading-6 text-muted">
        سه چیدمان، همان توکن‌ها و همان دادهٔ واقعی سال {fa(year)}. عدد زیر هر ستون قد اندازه‌گیری‌شدهٔ همان چیدمان است، نه تخمین.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {([["پیش‌فرض", DEFAULT_GROUPS], ["همهٔ دسته‌ها", ALL_GROUPS]] as const).map(([label, value]) => (
          <button key={label} aria-pressed={groups === value} onClick={() => setGroups(value)}
            className={`rounded-lg px-3 py-1.5 text-[0.6875rem] ${groups === value ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        {fa(bridges.length)} پل در کل سال · {fa(upcoming.length)} پل از امروز به بعد · از این‌ها {fa(upcoming.filter((bridge) => bridge.leave.length === 0).length)} تا بدون مرخصی
      </p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-3">
        {VARIANTS.map(({ key, title, note, render: Render }) => (
          <section key={key} className="flex min-w-0 flex-col rounded-[1.75rem] border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-sm font-semibold">{key} · {title}</h2>
              <CalendarRange size={16} className="text-forest" />
            </div>
            <div className="px-6 py-4">
              <Measured onHeight={(value) => setHeights((current) => (current[key] === value ? current : { ...current, [key]: value }))}>
                <Render bridges={upcoming} />
              </Measured>
            </div>
            <p className="border-t border-line px-6 py-3 text-[0.625rem] leading-5 text-muted">{note}</p>
            <p className="px-6 pb-4 text-[0.625rem] text-clay">قد اندازه‌گیری‌شده: {fa(heights[key] ?? 0)} پیکسل</p>
          </section>
        ))}
      </div>

      <details className="mt-8 rounded-lg bg-paper p-3 text-[0.625rem] leading-6 text-muted">
        <summary className="flex cursor-pointer items-center gap-1.5"><Info size={13} />دربارهٔ محاسبهٔ پل‌ها</summary>
        <p className="pt-2">{BRIDGES_NOTICE}</p>
      </details>
    </div>
  );
}
