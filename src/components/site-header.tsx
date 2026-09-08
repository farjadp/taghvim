// ============================================================================
// Source: src/components/site-header.tsx
// Version: 0.9.5 — 2026-09-08
// Why: Minimal header for secondary pages. Three links only: help, about and
//      changelog. Contact and the AshaVid link live inside /about now.
// Env / Deps: Server component; the home page has its own richer header.
// ============================================================================

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SettingsMenu } from "./settings-menu";

// `active` highlights the current secondary page in the nav
export function SiteHeader({ active }: { active?: "help" | "about" | "contact" | "changelog" }) {
  return (
    <header className="border-b border-line bg-surface/80">
      <div className="mx-auto flex min-h-20 max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="تقویم، صفحهٔ اصلی" className="flex items-center gap-2.5 text-forest">
          <Image src="/icon.svg" width={36} height={36} alt="" unoptimized className="size-9 shrink-0" />
          <span className="text-xl font-extrabold">تقویم<span className="mr-1 text-clay">.</span></span>
        </Link>
        <nav aria-label="صفحات" className="flex items-center gap-5 text-xs font-medium sm:gap-7 sm:text-sm">
          <Link
            href="/help"
            className={active === "help" ? "text-forest" : "text-muted hover:text-forest"}
          >
            راهنما
          </Link>
          <Link
            href="/about"
            className={active === "about" ? "text-forest" : "text-muted hover:text-forest"}
          >
            درباره ما
          </Link>
          <Link
            href="/changelog"
            className={active === "changelog" ? "text-forest" : "text-muted hover:text-forest"}
          >
            تغییرات
          </Link>
          <SettingsMenu />
        </nav>
      </div>
    </header>
  );
}
