// ============================================================================
// Source: src/app/support/page.tsx
// Version: 0.9.37 — 2026-09-11
// Why: «حمایت از ما», reached from the footer. Only ways that work today:
//      telling others, a GitHub star, reporting, and code. Farjad chose
//      GitHub Sponsors and Ko-fi as well on 11 Sep, but neither account exists
//      yet — add them here when they do, never as a link to nowhere. Never a
//      payment route under Iranian jurisdiction.
// Env / Deps: Static server component; SiteHeader/SiteFooter like /about.
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, Bug, GitPullRequest, Share2, Star } from "lucide-react";
import { breadcrumbStructuredData, pageMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = pageMetadata({
  title: "حمایت از ما | تقویم",
  description: "چطور از تقویم حمایت کنی: معرفی به دیگران، ستاره در گیت‌هاب، گزارش اشکال و مشارکت در کد.",
  path: "/support",
});

const REPO = "https://github.com/farjadp/taghvim";

export default function SupportPage() {
  return (
    <>
      <SiteHeader />
      <StructuredData data={breadcrumbStructuredData("حمایت از ما", "/support")} />
      <main className="mx-auto max-w-[820px] px-5 pt-12 pb-16 sm:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">حمایت از ما</h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            تقویم رایگان است، تبلیغ ندارد و حساب کاربری نمی‌خواهد. این چند کار به ادامه‌اش کمک می‌کند.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Way icon={<Share2 size={20} />} title="به دیگران معرفی کن">
            تقویم تبلیغ نمی‌کند و فقط دست‌به‌دست پیدا می‌شود. نشانی‌اش را بفرست: <span dir="ltr">taghv.im</span>
          </Way>
          <Way icon={<Star size={20} />} title="در گیت‌هاب ستاره بده" action={{ href: REPO, label: "کد تقویم در گیت‌هاب", external: true }}>
            ستاره‌ها کمک می‌کنند پروژه در گیت‌هاب بیشتر دیده شود.
          </Way>
          <Way icon={<Bug size={20} />} title="اشکال را گزارش کن" action={{ href: "/help#feedback", label: "گزارش اشکال یا پیشنهاد" }}>
            تاریخی اشتباه است، مناسبتی جا افتاده یا چیزی کار نمی‌کند؟ هر گزارش خوانده می‌شود.
          </Way>
          <Way icon={<GitPullRequest size={20} />} title="در کد مشارکت کن" action={{ href: REPO, label: "مخزن پروژه", external: true }}>
            کد تقویم باز است. اصلاح یا قابلیت تازه را با pull request بفرست. برای تغییر بزرگ، اول
            از راه گزارش پیشنهاد خبر بده.
          </Way>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

// One way to help: icon, title, a sentence, and an optional link
function Way({ icon, title, action, children }: {
  icon: React.ReactNode;
  title: string;
  action?: { href: string; label: string; external?: boolean };
  children: React.ReactNode;
}) {
  const linkClass = "mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:underline";
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-leaf text-forest">{icon}</div>
      <h2 className="mb-1.5 text-sm font-semibold text-ink">{title}</h2>
      <p className="text-xs leading-6 text-muted">{children}</p>
      {action && (action.external ? (
        <a href={action.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {action.label}
          <ArrowUpLeft size={12} className="opacity-60" />
        </a>
      ) : (
        <Link href={action.href} className={linkClass}>{action.label}</Link>
      ))}
    </section>
  );
}
