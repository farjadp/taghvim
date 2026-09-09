// ============================================================================
// Source: src/components/occasions.tsx
// Version: 0.1.0 — 2026-09-09
// Why: One place that renders a list of occasion titles, so the mark on the
//      `state` category cannot be applied in one view and forgotten in another.
// Env / Deps: lib/events for the category; components/state-mark for the glyph.
// ============================================================================

import { Fragment } from "react";
import { type CalendarEvent } from "@/lib/events";
import { StateMark } from "./state-mark";

export function Occasions({ events, separator = " · " }: { events: CalendarEvent[]; separator?: string }) {
  return (
    <>
      {events.map((event, index) => (
        <Fragment key={`${event.title}-${index}`}>
          {index > 0 && separator}
          {/* The state's own commemorations are drawn behind the mark, everywhere they appear. */}
          {event.category === "state" && <><StateMark className="ml-1 text-clay" />{" "}</>}
          {event.title}
        </Fragment>
      ))}
    </>
  );
}
