// ============================================================================
// Source: src/app/changelog/page.tsx
// Version: 0.5.0 — 2026-09-07
// Why: Public release history — what changed, when, and what is being looked
//      at next. Linked from the footer and the header of secondary pages.
// Env / Deps: Data from lib/changelog; dates rendered as Tehran civil time
//      through lib/calendar, like everywhere else in the app.
// ============================================================================

import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CircleDot, Compass, Rss } from "lucide-react";
import { fa, formatDate } from "@/lib/calendar";
import { CHANGE_LABELS, RELEASES, UPCOMING, UPCOMING_NOTICE, type ChangeKind } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "تغییرات | تقویم",
  description: "فهرست نسخه‌های تقویم با تاریخ و ساعت، و کارهایی که در دست بررسی‌اند.",
};

// Release times are shown in Tehran, to the minute, in Persian digits
const clock = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hour12: false });

// Each kind gets its own chip colour so the list scans without being read
const KIND_CLASS: Record<ChangeKind, string> = {
  added: "bg-leaf text-forest",
  changed: "bg-sand text-ink",
  fixed: "bg-holiday text-clay",
};

export default function ChangelogPage() {
  return (
    <>
      <SiteHeader active="changelog" />
      <main className="mx-auto max-w-[820px] px-5 pt-12 pb-16 sm:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">تغییرات</h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            هر چیزی که در تقویم عوض شده، با تاریخ و ساعتش — و پایین‌تر، کارهایی که در دست بررسی‌اند.
            ساعت‌ها به وقت ایران است.
          </p>
        </div>

        <ol className="space-y-8">
          {RELEASES.map((release) => {
            const date = new Date(release.at);
            return (
              <li key={release.version} className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-ink">{release.title}</h2>
                    <span className="rounded-md bg-paper px-2 py-1 text-[0.625rem] text-muted" dir="ltr">v{release.version}</span>
                  </div>
                  {/* 'ready' means committed and tested here, but not yet on taghv.im */}
                  {release.status === "ready" && (
                    <span className="flex items-center gap-1.5 rounded-md bg-sand px-2 py-1 text-[0.625rem] text-ink">
                      <CircleDot size={11} />
                      آمادهٔ انتشار
                    </span>
                  )}
                </div>
                <p className="mt-4 text-xs text-muted">
                  {formatDate(date, "persian", true)}
                  <span className="mx-2 text-line">·</span>
                  <time dateTime={release.at} className="tabular-nums">ساعت {clock.format(date)}</time>
                </p>
                <ul className="mt-4 space-y-3">
                  {release.changes.map((change, index) => (
                    <li key={index} className="flex flex-wrap items-start gap-2.5">
                      <span className={`mt-0.5 shrink-0 rounded-md px-2 py-1 text-[0.625rem] ${KIND_CLASS[change.kind]}`}>{CHANGE_LABELS[change.kind]}</span>
                      <span className="flex-1 text-sm leading-7 text-muted">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>

        <section className="mt-12 rounded-2xl bg-leaf px-6 py-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-forest"><Compass size={19} />در راه</h2>
          <ul className="mt-4 space-y-3">
            {UPCOMING.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-7 text-ink">
                <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-forest" />
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-forest/15 pt-4 text-[0.6875rem] leading-6 text-muted">{UPCOMING_NOTICE}</p>
        </section>

        <p className="mt-8 flex items-center gap-2 text-xs text-muted">
          <Rss size={14} />
          تعداد نسخه‌ها تا امروز: {fa(RELEASES.length)}
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
