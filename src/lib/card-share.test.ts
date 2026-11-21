// ============================================================================
// Source: src/lib/card-share.test.ts
// Version: 0.1.0 — 2026-11-20
// Why: «ذخیره شد» is only true when the browser download ran; the app must never say it.
// Env / Deps: Vitest, fake routes.
// ============================================================================

import { describe, expect, it, vi } from 'vitest';
import { cardNote, deliverCard, type CardRoutes } from './card-share';

function routes(over: Partial<CardRoutes> = {}): CardRoutes {
  return { canWebShare: false, webShare: vi.fn(() => Promise.resolve()), native: vi.fn(() => Promise.resolve('unavailable' as const)), isNative: false, download: vi.fn(), ...over };
}

describe('deliverCard', () => {
  it('site with no share: downloads and says saved', async () => {
    const r = routes();
    expect(await deliverCard(r)).toBe('saved');
    expect(r.download).toHaveBeenCalled();
  });
  it('web share first, and the native route is not tried', async () => {
    const r = routes({ canWebShare: true });
    expect(await deliverCard(r)).toBe('shared');
    expect(r.native).not.toHaveBeenCalled();
  });
  it('a dismissed web sheet is cancelled; another failure falls through to the download', async () => {
    expect(await deliverCard(routes({ canWebShare: true, webShare: () => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' })) }))).toBe('cancelled');
    const r = routes({ canWebShare: true, webShare: () => Promise.reject(new Error('boom')) });
    expect(await deliverCard(r)).toBe('saved');
  });
  it('app: native sheet opens, no download, result opened', async () => {
    const r = routes({ isNative: true, native: () => Promise.resolve('shared') });
    expect(await deliverCard(r)).toBe('opened');
    expect(r.download).not.toHaveBeenCalled();
  });
  it('app with no native route: unavailable, never the dead blob link, never saved', async () => {
    const r = routes({ isNative: true });
    expect(await deliverCard(r)).toBe('unavailable');
    expect(r.download).not.toHaveBeenCalled();
  });
  it('a native rejection propagates', async () => {
    await expect(deliverCard(routes({ isNative: true, native: () => Promise.reject(new Error('disk')) }))).rejects.toThrow('disk');
  });
});

describe('cardNote', () => {
  it('says saved only for saved', () => {
    expect(cardNote('saved')).toBe('تصویر ذخیره شد.');
    for (const r of ['shared', 'opened', 'cancelled', 'unavailable'] as const) expect(cardNote(r)).not.toContain('ذخیره');
    expect(cardNote('opened')).toBe('');
    expect(cardNote('unavailable')).toBe('فرستادن تصویر در این نسخهٔ برنامه ممکن نشد.');
  });
});
