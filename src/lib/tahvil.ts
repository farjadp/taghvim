// ============================================================================
// Source: src/lib/tahvil.ts
// Version: 0.1.0 — 2026-09-10
// Why: The instant the Persian year turns — the moment of the March equinox —
//      asked for as «لحظه تحویل سال» (#14). jalaali-js knows which DAY Nowruz is;
//      it cannot know the instant, because it is an arithmetic cycle, not an
//      astronomical model.
// Env / Deps: None. Pure arithmetic on UTC instants; Tehran civil time is a fixed
//      +03:30 since Iran abolished daylight saving in 2022, so every year this
//      module can answer for is on one offset.
//
//      TWO SOURCES, and the difference matters to this audience:
//        official — the moment announced by the Calendar Centre of the Institute
//                   of Geophysics, University of Tehran. Iranians compare against
//                   it to the second; any other number reads as a bug here, however
//                   sound the astronomy.
//        computed — Meeus, Astronomical Algorithms ch.27: the mean equinox plus 24
//                   periodic terms, then ΔT to turn dynamical time into clock time.
//                   Good to within a minute, NOT to the second. It is shown only for
//                   years with no official figure, and only to the minute.
// ============================================================================

export type Precision = 'second' | 'minute';

export type Tahvil = {
  // The Persian year that begins at this instant
  year: number;
  instant: Date;
  source: 'official' | 'computed';
  // How far the figure can be trusted. A computed moment is never shown with seconds.
  precision: Precision;
};

// Announced by the Geophysics Calendar Centre, as reported at the time of each
// announcement. 1406 was published to the minute only; its seconds are not guessed.
// Each value is the Tehran clock time written as UTC (Tehran = UTC+03:30).
const OFFICIAL: Record<number, { utc: string; precision: Precision }> = {
  1403: { utc: '2024-03-20T03:06:26Z', precision: 'second' },
  1404: { utc: '2025-03-20T09:01:30Z', precision: 'second' },
  1405: { utc: '2026-03-20T14:45:59Z', precision: 'second' },
  1406: { utc: '2027-03-20T20:24:00Z', precision: 'minute' },
};

// Meeus table 27.C: amplitude, phase and rate for the periodic terms (degrees).
const TERMS: [number, number, number][] = [
  [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186],
  [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443],
  [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513],
  [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
  [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417],
  [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029],
  [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756],
  [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074],
];

const RAD = Math.PI / 180;

// ΔT = TT − UT in seconds. Espenak & Meeus' polynomial for 2005–2050. It runs a
// few seconds high against the measured value for the mid-2020s, which is well
// inside the minute a computed moment is shown to.
function deltaT(gregorianYear: number): number {
  const t = gregorianYear - 2000;
  return 62.92 + 0.32217 * t + 0.005589 * t * t;
}

/** The March equinox of a Gregorian year, computed (Meeus ch.27), as a UTC instant. */
export function computeMarchEquinox(gregorianYear: number): Date {
  const y = (gregorianYear - 2000) / 1000;
  const jde0 = 2451623.80984 + 365242.37404 * y + 0.05169 * y ** 2 - 0.00411 * y ** 3 - 0.00057 * y ** 4;
  const t = (jde0 - 2451545.0) / 36525;
  const w = (35999.373 * t - 2.47) * RAD;
  const dl = 1 + 0.0334 * Math.cos(w) + 0.0007 * Math.cos(2 * w);
  const s = TERMS.reduce((sum, [a, b, c]) => sum + a * Math.cos((b + c * t) * RAD), 0);
  const jde = jde0 + (0.00001 * s) / dl;
  const jdUt = jde - deltaT(gregorianYear) / 86400;
  return new Date((jdUt - 2440587.5) * 86_400_000);
}

// A Persian year begins in the March of Gregorian year (persian + 621).
const gregorianOf = (persianYear: number) => persianYear + 621;

/** The moment a Persian year begins: the official figure where there is one. */
export function tahvilFor(persianYear: number): Tahvil {
  const official = OFFICIAL[persianYear];
  if (official) {
    return { year: persianYear, instant: new Date(official.utc), source: 'official', precision: official.precision };
  }
  return { year: persianYear, instant: computeMarchEquinox(gregorianOf(persianYear)), source: 'computed', precision: 'minute' };
}

/**
 * The coming turn, but only in its season: from 1 Esfand until the instant itself.
 * Farjad's pick for where the moment shows — one line under today's date in the hero,
 * seasonal, and gone the second the year has turned. `persian` is today's Persian date
 * as the page already reads it, so this never disagrees with the heading above it.
 */
export function seasonalTahvil(now: Date, persian: { year: number; month: number }): Tahvil | null {
  if (persian.month !== 12) return null;
  const coming = tahvilFor(persian.year + 1);
  return coming.instant.getTime() > now.getTime() ? coming : null;
}

/** The next moment the year turns, strictly after `now`. */
export function nextTahvil(now: Date, persianYearNow: number): Tahvil {
  const upcoming = tahvilFor(persianYearNow + 1);
  // `persianYearNow` can be read a moment before the turn itself; step past it.
  return upcoming.instant.getTime() > now.getTime() ? upcoming : tahvilFor(persianYearNow + 2);
}

const TEHRAN_OFFSET_MS = 3.5 * 3_600_000;

/** Hours, minutes and seconds on the Tehran clock at an instant. */
export function tehranClock(instant: Date): { hour: number; minute: number; second: number } {
  const shifted = new Date(instant.getTime() + TEHRAN_OFFSET_MS);
  return { hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes(), second: shifted.getUTCSeconds() };
}

/**
 * Whether the turn falls before noon on the Tehran clock. The rule of the Persian
 * calendar: before noon, that very day is 1 Farvardin; from noon on, 1 Farvardin is
 * the next day. It is why 1403 began on the morning of its own Nowruz and 1406 turns
 * at 23:54 on 29 Esfand.
 */
export function turnsBeforeNoon(instant: Date): boolean {
  return tehranClock(instant).hour < 12;
}
