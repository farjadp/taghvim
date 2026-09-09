// ============================================================================
// Source: src/app/help/page.tsx
// Version: 0.9.16 — 2026-09-09
// Why: One page that answers "how do I do X" for everything the app actually
//      does. Every control it names is quoted from the interface verbatim, so
//      a renamed button is a documentation bug, not a wording preference.
// Env / Deps: Server component. lib/ics for the feed name and its caveat, so
//      the subscription warning cannot drift from the feed's own description.
// ============================================================================

import type { Metadata } from "next";
import { breadcrumbStructuredData, pageMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FEED_NAME } from "@/lib/ics";
import { RELEASES } from "@/lib/changelog";
import { FeedbackPanel } from "@/components/feedback-panel";

export const metadata: Metadata = pageMetadata({
  title: "راهنما | تقویم",
  description: "چطور از تقویم استفاده کنی: گشتن در ماه‌ها، مناسبت‌ها، اوقات شرعی، ابزارهای تاریخ، نصب روی گوشی و افزودن به تقویم گوگل و اپل.",
  path: "/help",
});

// Each entry becomes a section and a row in the contents list, so the two can
// never fall out of step.
const SECTIONS = [
  {
    id: "calendar",
    title: "گشتن در تقویم",
    steps: [
      "برای رفتن به ماه دیگر، دو فلش کنار نام ماه را بزن؛ «امروز» تو را به ماه جاری برمی‌گرداند.",
      "برای پریدن به یک ماه یا سال مشخص، از دو فهرست بازشوی زیر نام ماه استفاده کن. بازهٔ پشتیبانی‌شده سال ۱۲۰۰ تا ۱۶۰۰ شمسی است.",
      "با کلیدهای جهت‌نما می‌توانی بین روزها حرکت کنی؛ چون صفحه راست‌چین است، فلش چپ به روز بعد می‌رود.",
      "زیر عدد هر روز، دو عدد کوچک هست: میلادی و قمری. راهنمای پایین تقویم همین را می‌گوید.",
    ],
  },
  {
    id: "events",
    title: "کم و زیاد کردن مناسبت‌ها",
    steps: [
      "زیر تقویم، کنار کلمهٔ «نمایش:»، چهار کلید هست: مذهبی، دولتی، جهانی، یادبود. هر کدام را جدا می‌شود روشن یا خاموش کرد.",
      "«ملی و فرهنگی» کلید ندارد و همیشه نمایش داده می‌شود؛ نوروز، یلدا، چهارشنبه‌سوری و مناسبت‌های فرهنگی در همین دسته‌اند.",
      "خاموش کردن یک دسته، هم مناسبت‌هایش را از فهرست برمی‌دارد و هم رنگ تعطیلی‌اش را از خانهٔ آن روز. پس هیچ روزی رنگی نمی‌ماند که نتوانی دلیلش را ببینی.",
      "انتخاب تو در همان مرورگر ذخیره می‌شود و دفعهٔ بعد همان‌طور باز می‌شود.",
    ],
  },
  {
    id: "prayer",
    title: "دیدن اوقات شرعی",
    steps: [
      "کلید «مذهبی» را در راهنمای زیر تقویم روشن کن. پنل اوقات شرعی پایین صفحه ظاهر می‌شود و یک پیوند هم در نوار بالا اضافه می‌شود.",
      "شهرت را از فهرست بالای همان پنل انتخاب کن؛ دوازده شهر ایران در دسترس است.",
      "محاسبه با روش تهران انجام می‌شود و تقریبی است؛ توضیحش زیر همان پنل نوشته شده.",
    ],
  },
  {
    id: "tools",
    title: "تبدیل تاریخ، فاصله و سن",
    steps: [
      "در بخش «ابزارهای تاریخ» سه زبانه هست: تبدیل تاریخ، فاصلهٔ تاریخ‌ها و محاسبهٔ سن.",
      "برای تبدیل، اول تقویم مبدأ را انتخاب کن، بعد تاریخ را وارد کن؛ نتیجه هم‌زمان در هر سه تقویم نشان داده می‌شود.",
      "فاصلهٔ تاریخ‌ها تعداد روزهای بین دو تاریخ را می‌دهد و محاسبهٔ سن، سن را از تاریخ تولد.",
    ],
  },
  {
    id: "clocks",
    title: "ساعت شهرهای دیگر",
    steps: [
      "ساعت تهران همیشه در بالای صفحه است و جایش عوض نمی‌شود.",
      "اگر منطقهٔ زمانی دستگاهت با تهران فرق داشته باشد، ساعت خودت خودکار زیر آن اضافه می‌شود.",
      "تا دو شهر دلخواه هم می‌توانی اضافه کنی؛ کنار هر کدام اختلافش با تهران و اگر روزش فرق کند، برچسب دیروز یا فردا نوشته می‌شود.",
    ],
  },
  {
    id: "display",
    title: "پوسته، قلم و اندازه",
    steps: [
      "چرخ‌دندهٔ نوار بالا («تنظیمات نمایش») سه چیز را تغییر می‌دهد: پوسته، اندازهٔ قلم و قلم.",
      "پوسته سه حالت دارد: خودکار، روشن، تیره. «خودکار» از تنظیمات دستگاه پیروی می‌کند.",
      "پنج قلم فارسی هست: وزیرمتن، شبنم، ساحل، ایران‌سنس و ایران‌یکان. فقط قلمی که انتخاب می‌کنی دانلود می‌شود.",
      "اندازهٔ قلم کل صفحه را بزرگ و کوچک می‌کند، نه فقط متن‌ها را.",
    ],
  },
  {
    id: "install",
    title: "نصب روی صفحهٔ خانهٔ گوشی",
    steps: [
      "در آی‌فون: سایت را در Safari باز کن، دکمهٔ اشتراک‌گذاری را بزن و «Add to Home Screen» را انتخاب کن.",
      "در اندروید: در Chrome منوی سه‌نقطه را باز کن و «Add to Home screen» یا «Install app» را بزن.",
      "بعد از آن تقویم با آیکن خودش و بدون نوار مرورگر باز می‌شود. برای دیدن تقویم هنوز به اینترنت نیاز داری.",
    ],
  },
  {
    id: "subscribe",
    title: "افزودن به تقویم گوگل و اپل",
    steps: [
      "در تقویم گوگل: از منوی «تقویم‌های دیگر» گزینهٔ «از طریق نشانی وب» را بزن و نشانی زیر را بگذار.",
      "در آی‌فون: تنظیمات ← برنامه‌ها ← تقویم ← حساب‌ها ← افزودن حساب ← دیگر ← افزودن تقویم اشتراکی.",
      "بعد از آن، تقویم خودش هر چند وقت یک‌بار فهرست را تازه می‌کند و اگر تاریخی اصلاح شود، خودبه‌خود اصلاح می‌شود.",
    ],
  },
  {
    id: "bridges",
    title: "پل‌های تعطیلات",
    steps: [
      "زیر تقویم، ردیف «پل‌های تعطیلات» سه بازهٔ بعدی را نشان می‌دهد که با گرفتن حداکثر دو روز مرخصی به دست‌کم چهار روز تعطیلی پیوسته می‌رسند. بازه‌های بدون مرخصی هم هستند.",
      "هر روزِ بازه یک خانه است؛ خانه‌های خط‌چین روزهای مرخصی‌اند و زیر آن‌ها نام روز نوشته شده.",
      "پیوند پایین همان ردیف به صفحهٔ کامل می‌رود: بالای صفحه سال‌نماست — دوازده ماه در یک نگاه با تعطیلات، پل‌ها و روزهای مرخصی رنگ‌شده — و زیر آن همهٔ پل‌های امسال و سال بعد، یکی‌یکی.",
      "فقط تعطیلاتِ دسته‌های روشن حساب می‌شوند. با پیش‌فرض، مذهبی و دولتی خاموش‌اند و بیشتر پل‌ها نوروزند؛ کلید «مذهبی» را روشن کنی، بقیه هم می‌آیند. فقط جمعه تعطیل هفتگی حساب شده، پنجشنبه نه.",
    ],
  },
  {
    id: "memorial",
    title: "یادبود جاویدنامان",
    steps: [
      "در هر بار باز شدن صفحه، نام و عکس یکی از جان‌باختگان شناسایی‌شدهٔ ۱۸ و ۱۹ دی نشان داده می‌شود، با پیوند به صفحهٔ او در فهرست منبع.",
      "اگر نمی‌خواهی این بخش را ببینی، کلید «یادبود» را در راهنمای زیر تقویم خاموش کن.",
    ],
  },
  {
    id: "feedback",
    title: "گزارش اشکال یا پیشنهاد",
    steps: [
      "یکی از دو دکمهٔ زیر را بزن؛ برنامهٔ ایمیلت با سؤال‌های آماده باز می‌شود و تو فقط جواب می‌دهی.",
      "برای گزارش اشکال، نسخه و نشانی صفحه و مرورگرت هم پایین نامه نوشته شده تا لازم نباشد دنبالشان بگردی. اگر نمی‌خواهی بفرستی، همان چند خط را پاک کن.",
      "فرمی روی سایت نیست: ایمیل مستقیم به خودمان می‌رسد و از هیچ سرویس واسطه‌ای رد نمی‌شود.",
    ],
  },
] as const;

export default function HelpPage() {
  return (
    <>
      <SiteHeader active="help" />
      <StructuredData data={breadcrumbStructuredData("راهنما", "/help")} />
      <main className="mx-auto max-w-[980px] px-5 pt-12 pb-16 sm:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">راهنما</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            هر کاری که این تقویم می‌کند، و اینکه چطور انجامش بدهی. هیچ‌کدام از این‌ها حساب
            کاربری نمی‌خواهد و هر انتخابی که می‌کنی فقط در مرورگر خودت می‌ماند.
          </p>
        </div>

        {/* RTL: the first grid column is the right-hand one, and the contents list
            sits there. Order alone is not enough — the track widths follow the
            column, so listing 1fr first gave the 220px track to the article. */}
        <div className="gap-10 lg:grid lg:grid-cols-[220px_1fr] lg:items-start">
          <div className="order-2 space-y-10">
            {SECTIONS.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="mb-4 flex items-baseline gap-2.5 text-lg font-semibold text-ink">
                  <span className="text-sm font-normal tabular-nums text-muted">{toPersian(index + 1)}</span>
                  {section.title}
                </h2>
                <ol className="space-y-3 border-r border-line pr-5">
                  {section.steps.map((step) => (
                    <li key={step} className="text-sm leading-7 text-muted">{step}</li>
                  ))}
                </ol>
                {section.id === "feedback" && (
                  <div className="mt-5">
                    <FeedbackPanel version={RELEASES[0].version} />
                  </div>
                )}
                {section.id === "subscribe" && (
                  <div className="mt-4 space-y-3">
                    <p className="rounded-xl border border-line bg-paper px-4 py-3 text-sm font-medium break-all text-ink">
                      <bdi dir="ltr">https://taghv.im/calendar.ics</bdi>
                    </p>
                    <p className="text-sm leading-7 text-muted">
                      این فهرست {FEED_NAME} است.{" "}
                      <strong className="font-medium text-ink">تعطیلات مذهبی قمری در آن نیست</strong>، چون
                      تاریخشان بر پایهٔ رؤیت هلال تعیین می‌شود. برای برنامه‌ریزی آن تعطیلات به این
                      فهرست تکیه نکن.
                    </p>
                  </div>
                )}
              </section>
            ))}

            <section className="rounded-2xl bg-leaf px-6 py-7">
              <h2 className="text-base font-semibold text-forest">چیزی را پیدا نکردی؟</h2>
              <p className="mt-2 text-sm leading-7 text-ink">
                اگر جوابت اینجا نبود یا جایی از کار افتاده،{" "}
                <a href="#feedback" className="font-medium text-forest underline">همین‌جا گزارشش کن</a>. راه‌های
                دیگر ارتباط در{" "}
                <Link href="/contact" className="font-medium text-forest underline">صفحهٔ تماس</Link> است، و آنچه
                تا امروز ساخته و عوض شده در{" "}
                <Link href="/changelog" className="font-medium text-forest underline">صفحهٔ تغییرات</Link> فهرست شده است.
              </p>
            </section>
          </div>

          {/* Sticky on desktop, a plain list on phones where nothing is sticky */}
          <nav aria-label="فهرست راهنما" className="order-1 mb-10 lg:sticky lg:top-6 lg:mb-0">
            <h2 className="mb-3 text-xs font-semibold text-ink">در این صفحه</h2>
            <ol className="space-y-2">
              {SECTIONS.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="flex gap-2 text-xs leading-6 text-muted hover:text-forest">
                    <span className="tabular-nums">{toPersian(index + 1)}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

// The page numbers its own sections; lib/calendar's `fa` is for calendar values.
function toPersian(value: number): string {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}
