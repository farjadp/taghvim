// ============================================================================
// Source: src/components/sandbox-header.tsx
// Version: 0.1.0 — 2026-09-11
// Why: SANDBOX. The secondary pages' header does not fit a narrow phone: its
//      nav runs off the edge and every page with SiteHeader scrolls sideways —
//      measured on taghv.im, 60px at 320 wide, 20 at 360, 5 at 375. Three ways
//      out, next to the header as it is now. Desktop (sm and up) is the same in
//      all four; only the phone layout differs.
// Env / Deps: The real SettingsMenu, so the gear has its real width. Throwaway:
//      delete with app/sandbox/header once Farjad has picked.
// ============================================================================

import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { SettingsMenu } from "./settings-menu";

export type HeaderVariant = "now" | "a" | "b" | "c";
export const HEADER_VARIANTS: readonly HeaderVariant[] = ["now", "a", "b", "c"];

const LINKS = [
  ["/download", "دریافت"],
  ["/help", "راهنما"],
  ["/about", "درباره ما"],
  ["/changelog", "تغییرات"],
] as const;

function Logo() {
  return (
    <Link href="/" aria-label="تقویم، صفحهٔ اصلی" className="flex shrink-0 items-center gap-2.5 text-forest">
      <Image src="/icon.svg" width={36} height={36} alt="" unoptimized className="size-9 shrink-0" />
      <span className="text-xl font-extrabold">تقویم<span className="mr-1 text-clay">.</span></span>
    </Link>
  );
}

function Links({ className = "" }: { className?: string }) {
  return LINKS.map(([href, label]) => (
    <Link key={href} href={href} className={`text-muted hover:text-forest ${className}`}>{label}</Link>
  ));
}

export function SandboxHeader({ variant }: { variant: HeaderVariant }) {
  // As it is on taghv.im today.
  if (variant === "now") {
    return (
      <header className="border-b border-line bg-surface/80">
        <div className="mx-auto flex min-h-20 max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Logo />
          <nav aria-label="صفحات" className="flex items-center gap-5 text-xs font-medium sm:gap-7 sm:text-sm">
            <Links />
            <SettingsMenu />
          </nav>
        </div>
      </header>
    );
  }

  // A — the links scroll sideways inside their own strip; the page does not.
  // The gear leaves the nav so it can never scroll out of reach.
  if (variant === "a") {
    return (
      <header className="border-b border-line bg-surface/80">
        <div className="mx-auto flex min-h-20 max-w-[1240px] items-center justify-between gap-3 px-5 py-4 sm:gap-4 sm:px-8">
          <Logo />
          <nav aria-label="صفحات" className="flex min-w-0 items-center gap-5 overflow-x-auto text-xs font-medium whitespace-nowrap [scrollbar-width:none] sm:gap-7 sm:text-sm">
            <Links />
          </nav>
          <div className="shrink-0"><SettingsMenu /></div>
        </div>
      </header>
    );
  }

  // B — on a phone the links drop to a second row under the mark and share its
  // full width; the gear stays beside the mark. From sm up, one row as now.
  if (variant === "b") {
    return (
      <header className="border-b border-line bg-surface/80">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4 sm:min-h-20 sm:flex-nowrap sm:px-8">
          <Logo />
          <div className="sm:order-last"><SettingsMenu /></div>
          <nav aria-label="صفحات" className="order-last flex w-full items-center justify-between text-xs font-medium sm:order-none sm:ms-auto sm:w-auto sm:justify-start sm:gap-7 sm:text-sm">
            <Links />
          </nav>
        </div>
      </header>
    );
  }

  // C — on a phone the links fold into one «صفحه‌ها» button; no JavaScript,
  // a native <details>. From sm up, the links are shown as now.
  return (
    <header className="border-b border-line bg-surface/80">
      <div className="mx-auto flex min-h-20 max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3 sm:gap-7">
          <nav aria-label="صفحات" className="hidden items-center gap-7 text-sm font-medium sm:flex">
            <Links />
          </nav>
          <details className="relative sm:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted [&::-webkit-details-marker]:hidden">
              صفحه‌ها <ChevronDown size={14} />
            </summary>
            <nav aria-label="صفحات" className="absolute left-0 z-10 mt-2 flex w-40 flex-col rounded-xl border border-line bg-surface p-2 text-sm shadow-lg">
              <Links className="rounded-lg px-3 py-2" />
            </nav>
          </details>
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}
