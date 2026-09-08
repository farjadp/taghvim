// ============================================================================
// Source: src/lib/view.test.ts
// Version: 0.9.0 — 2026-09-08
// Why: Verify strict view preferences, safe legacy migration and restricted storage.
// Env / Deps: Vitest; injectable in-memory Storage methods.
// ============================================================================

import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_VIEW, VIEW_KEY, readView, saveView, type ViewPreferences } from './view';

const LEGACY_KEY = 'taghvim-scope';
const custom: ViewPreferences = { religious: true, state: false, world: false, memorial: false };

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const calls: string[] = [];
  return {
    values, calls,
    getItem(key: string) { calls.push(`get:${key}`); return values.get(key) ?? null; },
    setItem(key: string, value: string) { calls.push(`set:${key}`); values.set(key, value); },
    removeItem(key: string) { calls.push(`remove:${key}`); values.delete(key); },
  };
}

const denied = () => { throw new Error('Storage unavailable'); };
afterEach(() => vi.unstubAllGlobals());

describe('view preferences', () => {
  it('exports the four defaults and stable key, with fresh fallback objects', () => {
    expect(VIEW_KEY).toBe('taghvim-view');
    expect(DEFAULT_VIEW).toEqual({ religious: false, state: false, world: true, memorial: true });
    const store = storage();
    const first = readView(() => store);
    expect(first).toEqual(DEFAULT_VIEW);
    expect(first).not.toBe(DEFAULT_VIEW);
    first.world = false;
    expect(readView(() => store)).toEqual(DEFAULT_VIEW);
    expect(store.values.size).toBe(0);
  });

  it.each(Array.from({ length: 16 }, (_, mask) => ({
    religious: Boolean(mask & 1), state: Boolean(mask & 2), world: Boolean(mask & 4), memorial: Boolean(mask & 8),
  })))('round trips every valid four-boolean record: %j', (view) => {
    const store = storage();
    saveView(view, () => store);
    expect(JSON.parse(store.values.get(VIEW_KEY)!)).toEqual(view);
    expect(readView(() => store)).toEqual(view);
  });

  it.each([
    '', '{', 'null', '[]', '[true,false,true,true]', 'true', '1', '"all"', '{}',
    ...Object.keys(custom).map((missing) => JSON.stringify(Object.fromEntries(Object.entries(custom).filter(([key]) => key !== missing)))),
    JSON.stringify({ ...custom, extra: true }),
    JSON.stringify({ ...custom, scope: 'all' }),
    ...Object.keys(custom).flatMap((key) => [0, 1, 'true', null, [], {}].map((value) => JSON.stringify({ ...custom, [key]: value }))),
  ])('rejects invalid new records without falling back to legacy: %s', (raw) => {
    const store = storage({ [VIEW_KEY]: raw, [LEGACY_KEY]: 'all' });
    expect(readView(() => store)).toEqual(DEFAULT_VIEW);
    expect(store.values.get(VIEW_KEY)).toBe(raw);
    expect(store.values.get(LEGACY_KEY)).toBe('all');
    expect(store.calls).toEqual([`get:${VIEW_KEY}`]);
  });

  it.each(['secular', 'all'])('migrates %s by writing the new record before removing legacy', (scope) => {
    const store = storage({ [LEGACY_KEY]: scope });
    const expected = { religious: scope === 'all', state: scope === 'all', world: true, memorial: true };
    expect(readView(() => store)).toEqual(expected);
    expect(JSON.parse(store.values.get(VIEW_KEY)!)).toEqual(expected);
    expect(store.values.has(LEGACY_KEY)).toBe(false);
    expect(store.calls).toEqual([`get:${VIEW_KEY}`, `get:${LEGACY_KEY}`, `set:${VIEW_KEY}`, `remove:${LEGACY_KEY}`]);
  });

  it.each(['', 'unknown', 'ALL', '"all"', 'religious'])('ignores unknown legacy values: %s', (scope) => {
    const store = storage({ [LEGACY_KEY]: scope });
    expect(readView(() => store)).toEqual(DEFAULT_VIEW);
    expect(store.values.has(VIEW_KEY)).toBe(false);
    expect(store.values.get(LEGACY_KEY)).toBe(scope);
  });

  it('gives valid new preferences precedence without touching legacy', () => {
    const store = storage({ [VIEW_KEY]: JSON.stringify(custom), [LEGACY_KEY]: 'all' });
    expect(readView(() => store)).toEqual(custom);
    expect(store.calls).toEqual([`get:${VIEW_KEY}`]);
    expect(store.values.get(LEGACY_KEY)).toBe('all');
  });

  it.each([VIEW_KEY, LEGACY_KEY])('falls back when reading %s throws', (blockedKey) => {
    const store = storage({ [LEGACY_KEY]: 'all' });
    const getItem = store.getItem.bind(store);
    store.getItem = (key) => key === blockedKey ? denied() : getItem(key);
    expect(readView(() => store)).toEqual(DEFAULT_VIEW);
    expect(store.values.get(LEGACY_KEY)).toBe('all');
    expect(store.values.has(VIEW_KEY)).toBe(false);
  });

  it('retains legacy and returns defaults when migration write fails', () => {
    const store = storage({ [LEGACY_KEY]: 'all' });
    store.setItem = denied;
    expect(readView(() => store)).toEqual(DEFAULT_VIEW);
    expect(store.values.get(LEGACY_KEY)).toBe('all');
    expect(store.values.has(VIEW_KEY)).toBe(false);
    expect(store.calls).not.toContain(`remove:${LEGACY_KEY}`);
  });

  it('returns defaults if legacy removal throws, retaining the successful new write', () => {
    const store = storage({ [LEGACY_KEY]: 'all' });
    store.removeItem = denied;
    expect(readView(() => store)).toEqual(DEFAULT_VIEW);
    expect(store.values.get(LEGACY_KEY)).toBe('all');
    expect(JSON.parse(store.values.get(VIEW_KEY)!)).toEqual({ religious: true, state: true, world: true, memorial: true });
    expect(readView(() => store)).toEqual({ religious: true, state: true, world: true, memorial: true });
  });

  it('guards injected storage acquisition for reads and saves', () => {
    expect(readView(denied)).toEqual(DEFAULT_VIEW);
    expect(() => saveView(custom, denied)).not.toThrow();
  });

  it('guards browser localStorage acquisition inside the catch boundary', () => {
    vi.stubGlobal('window', Object.defineProperty({}, 'localStorage', { get: denied }));
    expect(readView()).toEqual(DEFAULT_VIEW);
    expect(() => saveView(custom)).not.toThrow();
  });

  it('uses browser storage by default and does not require window on the server', () => {
    const store = storage();
    vi.stubGlobal('window', { localStorage: store });
    saveView(custom);
    expect(readView()).toEqual(custom);
    vi.stubGlobal('window', undefined);
    expect(readView()).toEqual(DEFAULT_VIEW);
    expect(() => saveView(custom)).not.toThrow();
  });

  it('swallows save write failures without removing legacy or overwriting a saved view', () => {
    const store = storage({ [LEGACY_KEY]: 'all', [VIEW_KEY]: JSON.stringify(DEFAULT_VIEW) });
    store.setItem = denied;
    expect(() => saveView(custom, () => store)).not.toThrow();
    expect(store.values.get(LEGACY_KEY)).toBe('all');
    expect(JSON.parse(store.values.get(VIEW_KEY)!)).toEqual(DEFAULT_VIEW);
  });

  it('guards serialization errors before any write', () => {
    const store = storage({ [LEGACY_KEY]: 'all' });
    const view = Object.defineProperty({ ...custom }, 'toJSON', { value: denied });
    expect(() => saveView(view, () => store)).not.toThrow();
    expect(store.values.has(VIEW_KEY)).toBe(false);
    expect(store.values.get(LEGACY_KEY)).toBe('all');
  });
});
