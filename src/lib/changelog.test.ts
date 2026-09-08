// ============================================================================
// Source: src/lib/changelog.test.ts
// Version: 0.9.1 — 2026-09-08
// Why: Keeps the changelog honest: parseable instants, newest-first order,
//      unique descending versions, one 'live' block of history, and a 'ready'
//      badge that cannot survive a version bump — it lied on the live site once.
// Env / Deps: Vitest; reads package.json to tie the newest release to the build.
// ============================================================================

import { readFileSync } from 'node:fs';
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

  // 0.9.0 shipped to taghv.im while still marked 'ready', so the site told every
  // visitor the release was not published yet. The ordering rule above passed,
  // because it only forbids a 'ready' BELOW a 'live'. These two close that gap.
  it('marks at most one release ready, and only the newest one', () => {
    const ready = RELEASES.filter((release) => release.status === 'ready');
    expect(ready.length).toBeLessThanOrEqual(1);
    if (ready.length === 1) expect(RELEASES[0]).toBe(ready[0]);
  });

  it('keeps package.json on the newest release version', () => {
    // A version bump means the build that carries it is the one being deployed,
    // so the release it belongs to must already be described here.
    const pkg: unknown = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    const version = (pkg as { version?: unknown }).version;
    expect(version).toBe(RELEASES[0].version);
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
