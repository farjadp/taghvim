// ============================================================================
// Source: src/components/site-header.tsx
// Version: 0.9.35 — 2026-09-11
// Why: Minimal header for secondary pages: four links — download, help, about,
//      changelog — and the display settings. Contact and the AshaVid link live
//      inside /about.
//      On a phone the four links fold into one «صفحه‌ها» button, a native
//      <details> with no script — Farjad's pick (C) of 11 Sep from a sandbox of
//      three. In one row they did not fit: every page with this header
//      scrolled sideways, 60px at 320 wide, 20 at 360, 5 at 375, measured on
//      taghv.im. From sm up the links sit in a row exactly as before. The
//      current page is marked with aria-current as well as colour.
// Env / Deps: Server component; the home page has its own richer header.
// ============================================================================

import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { SettingsMenu } from "./settings-menu";

type SecondaryPage = "download" | "help" | "about" | "contact" | "changelog";

const LINKS: readonly { href: string; label: string; page: SecondaryPage }[] = [
  { href: "/download", label: "دریافت", page: "download" },
  { href: "/help", label: "راهنما", page: "help" },
  { href: "/about", label: "درباره ما", page: "about" },
  { href: "/changelog", label: "تغییرات", page: "changelog" },
];

// `active` highlights the current secondary page in the nav
export function SiteHeader({ active }: { active?: SecondaryPage }) {
  const links = (className: string) =>
    LINKS.map(({ href, label, page }) => (
      <Link
        key={href}
        href={href}
        aria-current={active === page ? "page" : undefined}
        className={`${className} ${active === page ? "text-forest" : "text-muted hover:text-forest"}`}
      >
        {label}
      </Link>
    ));

  return (
    <header className="border-b border-line bg-surface/80">
      <div className="mx-auto flex min-h-20 max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="تقویم، صفحهٔ اصلی" className="flex shrink-0 items-center gap-2.5 text-forest">
          <Image src="/icon.svg" width={36} height={36} alt="" unoptimized className="size-9 shrink-0" />
          <span className="text-xl font-extrabold">تقویم<span className="mr-1 text-clay">.</span></span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-7">
          <nav aria-label="صفحات" className="hidden items-center gap-7 text-sm font-medium sm:flex">
            {links("")}
          </nav>
          <details className="relative sm:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted [&::-webkit-details-marker]:hidden">
              صفحه‌ها <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <nav aria-label="صفحات" className="absolute left-0 z-20 mt-2 flex w-44 flex-col rounded-xl border border-line bg-surface p-2 text-sm shadow-lg">
              {links("rounded-lg px-3 py-2")}
            </nav>
          </details>
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}
