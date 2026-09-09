// ============================================================================
// Source: extension/src/new-tab.tsx
// Version: 0.9.21 — 2026-09-09
// Why: The new-tab shell: today, the month grid and the day's occasions on
//      one screen. Every panel is the site's own component imported from
//      ../../src; only this arrangement is the extension's. The clock,
//      midnight rollover and month state mirror components/calendar-app.
// Env / Deps: localStorage of the extension's own origin. The site's saved
//      settings do not carry over — a chrome-extension:// page cannot read
//      taghv.im's storage — so the same keys start from the same defaults.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { ArrowUpLeft } from "lucide-react";
import { dayKey, shiftMonth, toCalendar } from "@/lib/calendar";
import { DEFAULT_VIEW, readView, saveView, type ViewPreferences } from "@/lib/view";
import { CalendarPanel } from "@/components/calendar-panel";
import { EventsPanel } from "@/components/events-panel";
import { SettingsMenu } from "@/components/settings-menu";
import { TodayHero } from "@/components/today-panel";

export function NewTab() {
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [view, setView] = useState(() => toCalendar(new Date()));
  // Same keys and the same guarded reader as the site; this origin's own copy.
  const [preferences, setPreferences] = useState<ViewPreferences>(DEFAULT_VIEW);
  const followingToday = useRef(true);
  const initialNow = useRef(new Date().toISOString());

  useEffect(() => { setPreferences(readView()); }, []);

  function toggleView(key: keyof ViewPreferences) {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    saveView(next);
  }

  // A new tab can stay open across midnight; the same rollover the site does.
  useEffect(() => {
    let lastDay = dayKey(new Date());
    let lastMinute = -1;
    function update() {
      const actual = new Date();
      const minute = Math.floor(actual.getTime() / 60_000);
      if (minute === lastMinute) return;
      lastMinute = minute;
      const currentDay = dayKey(actual);
      if (currentDay !== lastDay && followingToday.current) {
        setSelected(actual);
        setView(toCalendar(actual));
      }
      lastDay = currentDay;
      setNow(actual);
    }
    update();
    const timer = setInterval(update, 1000);
    window.addEventListener("focus", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);

  function select(date: Date) {
    followingToday.current = dayKey(date) === dayKey(new Date());
    setSelected(date);
    setView(toCalendar(date));
  }
  function today() {
    const date = new Date();
    setNow(date);
    select(date);
  }
  function navigate(delta: number) {
    followingToday.current = false;
    setView({ ...shiftMonth(view.year, view.month, delta), day: 1 });
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line bg-surface/80">
        <div className="mx-auto flex min-h-14 max-w-[1400px] items-center justify-between gap-4 px-5">
          <span className="flex items-center gap-2.5 text-forest">
            <img src="./icon.svg" width={32} height={32} alt="" className="size-8 shrink-0" />
            <span className="text-xl font-extrabold">تقویم<span className="mr-1 text-clay">.</span></span>
          </span>
          <nav aria-label="پیوندها" className="flex items-center gap-5 text-xs">
            {/* Links the person clicks, not requests the page makes. The
                report link goes to the site rather than opening a mail app
                from here: the new tab is not where someone wants a compose
                window, and /help#feedback explains the options first. */}
            <a href="https://taghv.im/help#feedback" className="text-muted hover:text-forest">
              گزارش اشکال
            </a>
            <a href="https://taghv.im" className="flex items-center gap-1 text-muted hover:text-forest">
              taghv.im
              <ArrowUpLeft size={12} className="opacity-60" />
            </a>
            <SettingsMenu />
          </nav>
        </div>
      </header>

      {/* Right column (first in RTL): today and the day's occasions; left: the month.
          `min-h-0` lets the events list scroll inside its column instead of
          pushing the whole tab past the fold. */}
      <main id="main" className="mx-auto grid min-h-0 w-full max-w-[1400px] flex-1 gap-5 p-5 lg:grid-cols-[1fr_1.5fr]">
        <div className="flex min-h-0 flex-col gap-5">
          <TodayHero now={now} initialNow={initialNow.current} groups={preferences} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <EventsPanel year={view.year} month={view.month} selected={selected} groups={preferences} onSelect={select} />
          </div>
        </div>
        <CalendarPanel
          year={view.year}
          month={view.month}
          today={now}
          selected={selected}
          groups={preferences}
          memorial={false}
          showMemorialSwitch={false}
          onToggleView={toggleView}
          onSelect={select}
          onNavigate={navigate}
          onToday={today}
          onJump={(year, month) => { followingToday.current = false; setView({ year, month, day: 1 }); }}
        />
      </main>
    </div>
  );
}
