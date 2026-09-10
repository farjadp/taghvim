// ============================================================================
// Source: src/components/sandbox-reminder-categories.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX. Thirteen categories for lib/dates, each with an icon, a light
//      and a dark colour pair, and a line saying what belongs in it — shown in
//      both themes with every contrast ratio worked out, because a colour that
//      looks fine on white can be unreadable on the dark surface.
// Env / Deps: Colours are literal hex here on purpose: a sandbox should not
//      write tokens into globals.css before the set is chosen. Icons are lucide,
//      all confirmed present in the installed version. Throwaway.
// ============================================================================

"use client";

import { useState } from "react";
import {
  Banknote, BookOpen, Briefcase, Cake, Droplet, Dumbbell, Flower2, Heart,
  House, PartyPopper, Plane, ShoppingBag, Stethoscope, type LucideIcon,
} from "lucide-react";

// How often the thing comes round. Today lib/dates knows ONE of these: 'yearly',
// on a Persian day and month. The other two need a field that does not exist yet.
type Rhythm = "yearly" | "monthly" | "once";

const RHYTHM_LABEL: Record<Rhythm, string> = {
  yearly: "سالانه",
  monthly: "ماهانه",
  once: "یک‌بار",
};

type Category = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  rhythm: Rhythm;
  light: { ink: string; tint: string };
  dark: { ink: string; tint: string };
};

const SURFACE = { light: "#ffffff", dark: "#1a2420" };

const CATEGORIES: Category[] = [
  { id: "birthday", label: "تولد", hint: "تولد آدم‌ها؛ سن هم حساب می‌شود", icon: Cake, rhythm: "yearly",
    light: { ink: "#8a5a12", tint: "#fdf1dc" }, dark: { ink: "#e8bd77", tint: "#33290f" } },
  { id: "love", label: "عاشقانه‌ها", hint: "روزی که شروع شد، و هر سالی که از آن گذشت", icon: Heart, rhythm: "yearly",
    light: { ink: "#a9435c", tint: "#fce7ec" }, dark: { ink: "#f0a0b4", tint: "#3a1f27" } },
  { id: "memorial", label: "جاویدنام‌ها", hint: "کسانی که نبودنشان هم تاریخ دارد", icon: Flower2, rhythm: "yearly",
    light: { ink: "#3d5a4e", tint: "#e6ece8" }, dark: { ink: "#a9c4b6", tint: "#24312b" } },
  { id: "joy", label: "خوشحالی", hint: "هر روزی که دلت می‌خواهد دوباره بیاید", icon: PartyPopper, rhythm: "yearly",
    light: { ink: "#5f6d1a", tint: "#eff2dc" }, dark: { ink: "#c2d17a", tint: "#262c12" } },
  { id: "period", label: "پریود", hint: "شروع دوره، با یادآوری چند روز قبلش", icon: Droplet, rhythm: "monthly",
    light: { ink: "#a03a3a", tint: "#fbe6e6" }, dark: { ink: "#ef9c9c", tint: "#38201f" } },
  { id: "instalment", label: "قسط", hint: "وام، اجاره، اشتراک — هر چیزی که سررسید دارد", icon: Banknote, rhythm: "monthly",
    light: { ink: "#8a5230", tint: "#f7e9df" }, dark: { ink: "#e0a880", tint: "#33251b" } },
  { id: "shopping", label: "خرید", hint: "چیزی که باید بخری، تا روزش یادت بماند", icon: ShoppingBag, rhythm: "once",
    light: { ink: "#1f6b6b", tint: "#e0f0ef" }, dark: { ink: "#7fc9c4", tint: "#14312f" } },
  { id: "work", label: "قرار کاری", hint: "جلسه، مصاحبه، تحویل پروژه", icon: Briefcase, rhythm: "once",
    light: { ink: "#3a5480", tint: "#e6ecf7" }, dark: { ink: "#9db6e0", tint: "#1e2838" } },
  { id: "travel", label: "سفر", hint: "پرواز، قطار، روزی که راه می‌افتی", icon: Plane, rhythm: "once",
    light: { ink: "#2b6591", tint: "#e2eef7" }, dark: { ink: "#90c1e4", tint: "#172a38" } },
  { id: "health", label: "سلامت", hint: "نوبت دکتر، دارو، آزمایش", icon: Stethoscope, rhythm: "once",
    light: { ink: "#2f6b45", tint: "#e3f0e7" }, dark: { ink: "#8ecfa5", tint: "#17301f" } },
  { id: "study", label: "درس و آزمون", hint: "امتحان، ددلاین، ثبت‌نام", icon: BookOpen, rhythm: "once",
    light: { ink: "#6a4a8c", tint: "#efe8f7" }, dark: { ink: "#bfa4dd", tint: "#2a2136" } },
  { id: "sport", label: "ورزش", hint: "تمرین، مسابقه، روزی که نباید بپیچانی", icon: Dumbbell, rhythm: "once",
    light: { ink: "#96541f", tint: "#fbeadb" }, dark: { ink: "#e6ac77", tint: "#35261a" } },
  { id: "home", label: "خانه", hint: "تعمیر، قبض، کارهایی که همیشه عقب می‌افتند", icon: House, rhythm: "once",
    light: { ink: "#5c6a61", tint: "#eceeea" }, dark: { ink: "#b0bfb6", tint: "#262e29" } },
];

// WCAG 2.1 relative luminance and contrast. Worked out, not eyeballed: a tint
// that reads well on white can bury its own text on the dark surface.
function luminance(hex: string): number {
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  const ratio = (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  return Math.round(ratio * 100) / 100;
}

function Ratio({ value, floor }: { value: number; floor: number }) {
  const ok = value >= floor;
  return <span className={ok ? "text-ink" : "font-medium text-clay"}>
    {value.toFixed(2)}{ok ? "" : ` ✗ زیر ${floor}`}
  </span>;
}

function Chip({ category, theme }: { category: Category; theme: "light" | "dark" }) {
  const colours = category[theme];
  const Icon = category.icon;
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ backgroundColor: colours.tint }}>
      <Icon size={18} style={{ color: colours.ink }} aria-hidden />
      <div className="min-w-0">
        <div className="text-[0.8125rem] font-medium" style={{ color: colours.ink }}>{category.label}</div>
        <div className="truncate text-[0.6875rem]" style={{ color: colours.ink, opacity: 0.75 }}>{category.hint}</div>
      </div>
    </div>
  );
}

function ThemeColumn({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className="space-y-2 rounded-2xl p-4" style={{ backgroundColor: SURFACE[theme] }}>
      <p className="pb-1 text-xs" style={{ color: theme === "light" ? "#5c6a61" : "#9fb0a6" }}>
        {theme === "light" ? "روشن" : "تیره"}
      </p>
      {CATEGORIES.map((category) => <Chip key={category.id} category={category} theme={theme} />)}
    </div>
  );
}

export function SandboxReminderCategories() {
  const [showNumbers, setShowNumbers] = useState(true);
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-lg font-medium text-ink">دسته‌های یادآور — رنگ، آیکن و متن</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        سیزده دسته برای <code className="text-ink">lib/dates</code>، که امروز فقط دو تا دارد: تولد و سالگرد.
        هر دسته یک آیکن، یک جفت رنگ برای هر پوسته، و یک خط که می‌گوید چه چیزی داخلش می‌رود.
        نسبت کنتراست هر جفت پایین‌تر حساب شده — رنگی که روی سفید خوب است می‌تواند روی سطح تیره متنش را دفن کند.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <ThemeColumn theme="light" />
        <ThemeColumn theme="dark" />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">اعداد و ریتم</h2>
        <button type="button" onClick={() => setShowNumbers((v) => !v)} className="text-xs text-forest underline">
          {showNumbers ? "پنهان کن" : "نشان بده"}
        </button>
      </div>
      {showNumbers && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-right text-xs">
            <thead className="text-muted">
              <tr className="border-b border-line">
                <th className="py-2 font-normal">دسته</th>
                <th className="py-2 font-normal">ریتم</th>
                <th className="py-2 font-normal">امروز پشتیبانی می‌شود؟</th>
                <th className="py-2 font-normal">متن روی تینت — روشن</th>
                <th className="py-2 font-normal">متن روی تینت — تیره</th>
                <th className="py-2 font-normal">آیکن روی سطح — روشن</th>
                <th className="py-2 font-normal">آیکن روی سطح — تیره</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((category) => (
                <tr key={category.id} className="border-b border-line/60">
                  <td className="py-2 text-ink">{category.label}</td>
                  <td className="py-2 text-muted">{RHYTHM_LABEL[category.rhythm]}</td>
                  <td className="py-2">
                    {category.rhythm === "yearly"
                      ? <span className="text-ink">بله</span>
                      : <span className="font-medium text-clay">نه — فیلد تکرار لازم دارد</span>}
                  </td>
                  <td className="py-2"><Ratio value={contrast(category.light.ink, category.light.tint)} floor={4.5} /></td>
                  <td className="py-2"><Ratio value={contrast(category.dark.ink, category.dark.tint)} floor={4.5} /></td>
                  <td className="py-2"><Ratio value={contrast(category.light.ink, SURFACE.light)} floor={3} /></td>
                  <td className="py-2"><Ratio value={contrast(category.dark.ink, SURFACE.dark)} floor={3} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 space-y-2 rounded-xl border border-line bg-paper p-4 text-xs leading-relaxed text-muted">
        <p className="font-medium text-ink">چیزی که این ساندباکس نشان نمی‌دهد و باید تصمیم بگیری</p>
        <p>
          امروز <code className="text-ink">lib/dates</code> فقط تکرار سالانه روی روز و ماه شمسی می‌شناسد.
          از این سیزده تا، چهار تا با همان مدل کار می‌کنند. نه تای دیگر ماهانه یا یک‌باره‌اند و به فیلدی نیاز دارند که وجود ندارد.
        </p>
        <p>
          جملهٔ سن هم به دسته بند است: «۳۵ ساله می‌شود» فقط برای تولد درست است، «۳۵مین سال» برای عاشقانه‌ها و جاویدنام‌ها،
          و برای خرید و قسط اصلاً جمله‌ای لازم نیست.
        </p>
        <p>
          پریود از بقیه جداست: چرخه است نه تاریخ ثابت، و حساس‌ترین چیزی است که این اپ تا حالا ذخیره کرده.
          همان جملهٔ <code className="text-ink">DATES_NOTICE</code> اینجا کافی نیست.
        </p>
      </div>
    </main>
  );
}
