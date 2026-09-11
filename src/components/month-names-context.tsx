// ============================================================================
// Source: src/components/month-names-context.tsx
// Version: 0.1.0 — 2026-09-10
// Why: One answer to «what are the months called right now» for every component
//      that writes one. MONTHS is read in a dozen places; threading a boolean to
//      all of them would put the same conditional in each.
// Env / Deps: Defaults to MONTHS with no provider, so the extension, a test and
//      any future caller render the modern names rather than crashing.
// ============================================================================

"use client";

import { createContext, useContext } from "react";
import { MONTHS } from "@/lib/calendar";
import { monthNames } from "@/lib/month-names";

const MonthNamesContext = createContext<string[]>(MONTHS);

export function MonthNamesProvider({ avestan, children }: { avestan: boolean; children: React.ReactNode }) {
  return <MonthNamesContext.Provider value={monthNames(avestan)}>{children}</MonthNamesContext.Provider>;
}

/** The twelve names as the visitor has asked to see them. */
export function useMonthNames(): string[] {
  return useContext(MonthNamesContext);
}
