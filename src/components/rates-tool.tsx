// ============================================================================
// Source: src/components/rates-tool.tsx
// Version: 0.2.0 — 2026-10-09
// Why: «نرخ ارز» as a tab in the tools box (variant C, Farjad's pick of 7 Oct):
//      three headline rates as cards, the rest as a list, each with its change
//      since the channel's previous post. Each rate is also one spoken sentence
//      (name, price, unit, change) with the drawn parts hidden from screen
//      readers: in DOM order they read the change before the price.
// Env / Deps: lib/rates (types and notice only). Renders a snapshot the server
//      already read; makes no request. The site only — the extension and the apps
//      make no network request and never render this tab.
// ============================================================================

"use client";

import { ArrowDown, ArrowUp, Clock3 } from "lucide-react";
import { addDays, dayKey, fa, formatDate } from "@/lib/calendar";
import { RATES_NOTICE, type Rate, type RatesSnapshot } from "@/lib/rates";
import { useMonthNames } from "./month-names-context";

const HEADLINE = ["usd", "eur", "emami"];

// Persian digits with the Persian thousands separator; the global prices keep two decimals
function money(value: number) {
  return fa(value.toLocaleString("en-US", { maximumFractionDigits: 2 })).replace(/,/g, "٬").replace(".", "٫");
}

const unitLabel = (rate: Rate) => (rate.unit === "usd" ? "دلار" : "تومان");

// «دلار آمریکا: ۲۶۴٬۲۰۰ تومان، ۵۰۰ افزایش نسبت به نرخ قبلی» — what a screen reader says for one rate
function spoken(rate: Rate): string {
  const base = `${rate.label}: ${money(rate.value)} ${unitLabel(rate)}`;
  if (rate.prev === null) return base;
  const diff = Math.round((rate.value - rate.prev) * 100) / 100;
  if (diff === 0) return `${base}، بدون تغییر`;
  return `${base}، ${money(Math.abs(diff))} ${diff > 0 ? "افزایش" : "کاهش"} نسبت به نرخ قبلی`;
}

function Change({ rate }: { rate: Rate }) {
  if (rate.prev === null) return null;
  const diff = Math.round((rate.value - rate.prev) * 100) / 100;
  if (diff === 0) return <span className="text-[0.625rem] text-muted">بدون تغییر</span>;
  const up = diff > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  // Forest up, clay down: direction, not good or bad — a rising dollar is nobody's good news
  return <span className={`inline-flex items-center gap-0.5 text-[0.625rem] tabular-nums ${up ? "text-forest" : "text-clay"}`}><Icon size={11} strokeWidth={2} aria-hidden /><span className="sr-only">{up ? "افزایش" : "کاهش"}</span>{money(Math.abs(diff))}</span>;
}

// «امروز، ساعت ۱۸:۴۵», «دیروز، …» or the date — the age of a price is part of the price
function Updated({ at, now }: { at: Date; now: Date }) {
  const months = useMonthNames();
  const time = fa(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at));
  const day = dayKey(at) === dayKey(now) ? "امروز" : dayKey(at) === dayKey(addDays(now, -1)) ? "دیروز" : formatDate(at, "persian", false, months);
  return <span className="inline-flex items-center gap-1"><Clock3 size={12} aria-hidden />آخرین نرخ: {day}، ساعت {time}</span>;
}

export function RatesTool({ snapshot, now }: { snapshot: RatesSnapshot; now: Date }) {
  const headline = HEADLINE.map((id) => snapshot.rates.find((rate) => rate.id === id)).filter((rate): rate is Rate => !!rate);
  const rest = snapshot.rates.filter((rate) => !HEADLINE.includes(rate.id));
  return <div data-testid="rates">
    <div className="grid gap-3 sm:grid-cols-3">
      {headline.map((rate) => <div key={rate.id} className="rounded-xl border border-line px-4 py-3"><p className="sr-only">{spoken(rate)}</p><div aria-hidden="true"><p className="text-[0.6875rem] text-muted">{rate.label}</p><p className="mt-1 text-xl font-medium tabular-nums">{money(rate.value)}</p><div className="mt-1 flex items-center justify-between"><span className="text-[0.625rem] text-muted">{unitLabel(rate)}</span><Change rate={rate} /></div></div></div>)}
    </div>
    <ul className="mt-4 grid gap-x-6 text-xs sm:grid-cols-2">{rest.map((rate) => <li key={rate.id} className="flex items-center justify-between gap-3 border-b border-line py-2"><span className="sr-only">{spoken(rate)}</span><span aria-hidden="true">{rate.label}</span><span aria-hidden="true" className="flex items-center gap-2"><Change rate={rate} /><span className="font-medium tabular-nums">{money(rate.value)}</span><span className="w-8 text-[0.625rem] text-muted">{unitLabel(rate)}</span></span></li>)}</ul>
    {/* No «منبع» link line: Farjad removed it on 7 Oct; the notice below says only «a public Telegram channel», by name nowhere */}
    <p className="mt-4 text-[0.625rem] text-muted"><Updated at={new Date(snapshot.at)} now={now} /></p>
    <p className="mt-3 text-[0.625rem] leading-6 text-muted">{RATES_NOTICE}</p>
  </div>;
}
