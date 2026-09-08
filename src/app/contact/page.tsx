// ============================================================================
// Source: src/app/contact/page.tsx
// Version: 0.2.0 — 2026-09-07
// Why: Static contact page: AshaVid and personal links.
// Env / Deps: Server component; no form, no backend.
// ============================================================================

import type { Metadata } from "next";
import { breadcrumbStructuredData, pageMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Mail, Phone, MapPin, Globe, Link as LinkIcon, AtSign, Send, Building2, ArrowUpLeft } from "lucide-react";

export const metadata: Metadata = pageMetadata({
  title: "تماس با ما | تقویم",
  description: "راه‌های ارتباطی با تیم تقویم و مشخصات برنامه‌نویس.",
  path: "/contact",
});

// Sections: company contact, social links, related sites
export default function ContactPage() {
  return (
    <>
      <SiteHeader active="contact" />
      <StructuredData data={breadcrumbStructuredData("تماس با ما", "/contact")} />
      <main className="mx-auto max-w-[820px] px-5 pt-12 pb-16 sm:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">تماس با ما</h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            برای سؤال، پیشنهاد یا همکاری دربارهٔ تقویم، از راه‌های زیر در دسترس هستیم.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="mb-5 text-lg font-semibold text-ink">راه‌های ارتباطی</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ContactCard icon={<Mail size={20} />} title="ایمیل" href="mailto:farjad@ashavid.ca" label="farjad@ashavid.ca" />
            <ContactCard icon={<Phone size={20} />} title="تلفن / واتساپ" href="tel:+14376611674" label="+1 (437) 661-1674" ltr />
            <ContactCard icon={<MapPin size={20} />} title="موقعیت" label="تورنتو، کانادا" />
            <ContactCard
              icon={<Building2 size={20} />}
              title="شرکت"
              href="https://www.ashavid.ca"
              label="اشاویید — ashavid.ca"
              external
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-5 text-lg font-semibold text-ink">شبکه‌های اجتماعی</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SocialCard icon={<LinkIcon size={20} />} title="لینکدین" href="https://www.linkedin.com/in/farjadpourmohammad/" label="Farjad Pourmohammad" />
            <SocialCard icon={<Send size={20} />} title="تلگرام" href="https://t.me/Heros_Journey" label="@Heros_Journey" />
            <SocialCard icon={<AtSign size={20} />} title="اینستاگرام" href="https://instagram.com/FarjadTalks" label="@FarjadTalks" />
            <SocialCard icon={<Globe size={20} />} title="یوتیوب" href="https://youtube.com/@FarjadTalks" label="@FarjadTalks" />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-5 text-lg font-semibold text-ink">برنامه‌نویس</h2>
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-forest">فرجاد پورمحمد</h3>
                <p className="mt-1 text-xs text-muted">مهندس نرم‌افزار × مشاور</p>
                <p className="mt-4 max-w-md text-sm leading-7 text-muted">
                  مهندس و مشاور در حوزهٔ محصول و فناوری، با تمرکز روی ساخت نرم‌افزارهایی که
                  مقیاس‌پذیر و امن هستند. بنیان‌گذار اشاویید.
                </p>
              </div>
              <a
                href="https://farjadp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-leaf px-4 py-2.5 text-xs font-medium text-forest hover:bg-leaf/70"
              >
                <Globe size={14} />
                وب‌سایت شخصی
                <ArrowUpLeft size={12} className="opacity-60" />
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-sand px-6 py-7">
          <h2 className="mb-2 text-base font-semibold text-forest">پروژه‌های مرتبط</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="https://www.ashavid.ca" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-xs text-ink hover:bg-leaf">
              <span>اشاویید — تحول دیجیتال و فناوری</span>
              <ArrowUpLeft size={14} className="text-muted" />
            </a>
            <a href="https://farjadp.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-xs text-ink hover:bg-leaf">
              <span>فرجاد پورمحمد — وب‌سایت شخصی</span>
              <ArrowUpLeft size={14} className="text-muted" />
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

// Contact row with an optional LTR value (phone, email) and external-link handling
function ContactCard({ icon, title, label, href, ltr, external }: {
  icon: React.ReactNode;
  title: string;
  label: string;
  href?: string;
  ltr?: boolean;
  external?: boolean;
}) {
  const content = (
    <>
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-leaf text-forest">{icon}</div>
      <h3 className="mb-1 text-sm font-semibold text-ink">{title}</h3>
      <p className={`text-xs text-muted ${ltr ? "" : ""}`} dir={ltr ? "ltr" : undefined}>{label}</p>
    </>
  );
  if (!href) return <div className="rounded-xl border border-line bg-surface p-5">{content}</div>;
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="rounded-xl border border-line bg-surface p-5 transition-colors hover:border-forest/30 hover:bg-leaf/40"
    >
      {content}
    </a>
  );
}

// Compact social-profile link tile
function SocialCard({ icon, title, label, href }: {
  icon: React.ReactNode;
  title: string;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-forest/30 hover:bg-leaf/40"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-leaf text-forest">{icon}</div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="truncate text-xs text-muted" dir="ltr">{label}</p>
      </div>
    </a>
  );
}
