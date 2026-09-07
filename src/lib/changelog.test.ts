// ============================================================================
// Source: src/lib/changelog.test.ts
// Version: 0.5.0 — 2026-09-07
// Why: Keeps the changelog honest: parseable instants, newest-first order,
//      unique descending versions, and at most one 'live' block of history.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { CHANGE_LABELS, RELEASES, UPCOMING, UPCOMING_NOTICE } from './changelog';
import { toCalendar } from './calendar';

describe('changelog', () => {
  it('has parseable instants that the calendar can render', () => {
    for (const release of RELEASES) {
      const date = new Date(release.at);
      expect(Number.isNaN(date.getTime())).toBe(false);
      expect(() => toCalendar(date)).not.toThrow();
      // An offset must be explicit, or the instant means different things per host
      expect(release.at).toMatch(/(Z|[+-]\d{2}:\d{2})$/);
    }
  });

  it('is ordered newest first with unique versions', () => {
    const times = RELEASES.map((release) => new Date(release.at).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(new Set(RELEASES.map((release) => release.version)).size).toBe(RELEASES.length);
  });

  it('never marks an older release ready while a newer one is live', () => {
    const firstLive = RELEASES.findIndex((release) => release.status === 'live');
    expect(firstLive).toBeGreaterThanOrEqual(0);
    // Everything from the first live release downwards must also be live
    for (const release of RELEASES.slice(firstLive)) expect(release.status).toBe('live');
  });

  it('every release describes at least one labelled change', () => {
    for (const release of RELEASES) {
      expect(release.title.trim().length).toBeGreaterThan(1);
      expect(release.changes.length).toBeGreaterThan(0);
      for (const change of release.changes) {
        expect(CHANGE_LABELS[change.kind]).toBeTruthy();
        expect(change.text.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('lists upcoming work without promising dates', () => {
    expect(UPCOMING.length).toBeGreaterThan(0);
    expect(UPCOMING_NOTICE).toContain('قول');
  });
});
