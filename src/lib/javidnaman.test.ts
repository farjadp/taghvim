// ============================================================================
// Source: src/lib/javidnaman.test.ts
// Version: 0.4.0 — 2026-09-09
// Why: Guards the memorial snapshot's shape and the random picker.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { JAVIDNAMAN, JAVIDNAMAN_NOTICE, personUrl, photoUrl, pickPerson } from './javidnaman';

describe('javidnaman snapshot', () => {
  // A broken sync must fail loudly here, not render an empty box in production
  it('carries a large, well-formed list', () => {
    expect(JAVIDNAMAN.count).toBe(JAVIDNAMAN.people.length);
    expect(JAVIDNAMAN.people.length).toBeGreaterThan(1000);
    expect(JAVIDNAMAN.source).toMatch(/^https:\/\/javidnaman\.iranintl\.com\//);
    expect(JAVIDNAMAN.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const person of JAVIDNAMAN.people) {
      expect(person.id.length).toBeGreaterThan(5);
      expect(person.name.trim().length).toBeGreaterThan(1);
      expect(person.age === null || Number.isInteger(person.age)).toBe(true);
    }
    expect(new Set(JAVIDNAMAN.people.map((person) => person.id)).size).toBe(JAVIDNAMAN.people.length);
  });

  // The source types some names with Arabic ي/ى/ك: wrong final form, and a
  // Persian search for the same name never matches. sync-javidnaman folds them.
  it('carries no Arabic letters where Persian ones belong', () => {
    const arabic = JAVIDNAMAN.people.filter((person) => /[\u064a\u0649\u0643]/.test(person.name + (person.place ?? '')));
    expect(arabic.map((person) => person.name)).toEqual([]);
  });

  it('picks deterministically for a given random source and covers both ends', () => {
    expect(pickPerson(() => 0)).toBe(JAVIDNAMAN.people[0]);
    expect(pickPerson(() => 0.999999)).toBe(JAVIDNAMAN.people.at(-1));
    // Math.random never returns 1, but a sloppy injected source must not go out of bounds
    expect(pickPerson(() => 1)).toBe(JAVIDNAMAN.people.at(-1));
  });

  it('builds source URLs with the id escaped', () => {
    expect(photoUrl('abc')).toBe('https://d1fwhlqkr1vj82.cloudfront.net/image/abc?width=288');
    expect(photoUrl('a b', 48)).toBe('https://d1fwhlqkr1vj82.cloudfront.net/image/a%20b?width=48');
    expect(personUrl('x/y')).toBe('https://javidnaman.iranintl.com/memorial/x%2Fy');
  });

  it('discloses the source and the identified-only coverage', () => {
    expect(JAVIDNAMAN_NOTICE).toContain('جاویدنامان');
    expect(JAVIDNAMAN_NOTICE).toContain('شناسایی‌شده');
  });
});
