// ============================================================================
// Source: src/lib/rates-server.ts
// Version: 0.1.0 — 2026-10-07
// Why: Reads @sarafha_rate's public preview page on the SERVER, at most once per
//      read slot (five fixed Tehran hours a day, on the first visit after each).
//      The visitor's browser never reaches Telegram, so the privacy statement's
//      one external request is still the memorial photo.
// Env / Deps: Global fetch. In-memory cache: a restart forgets it and the next
//      visit reads the channel again.
// ============================================================================

import { isFresh, parseChannelPage, RATES_CHANNEL, slotKey, type RatesSnapshot } from './rates';

const PREVIEW_URL = `https://t.me/s/${RATES_CHANNEL}`;

const state: { snapshot: RatesSnapshot | null; slot: string | null; failedAt: number; inflight: Promise<void> | null } = { snapshot: null, slot: null, failedAt: 0, inflight: null };
const RETRY_AFTER_MS = 10 * 60_000;

async function read(slot: string) {
  try {
    const response = await fetch(PREVIEW_URL, { cache: 'no-store', signal: AbortSignal.timeout(5_000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; taghv.im)' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const snapshot = parseChannelPage(await response.text());
    if (!snapshot) throw new Error('no rates post on the page');
    state.snapshot = snapshot;
    state.slot = slot;
  } catch (error) {
    // Keep the last good snapshot; it is hidden once stale anyway
    state.failedAt = Date.now();
    console.error('[rates] read failed:', error instanceof Error ? error.message : error);
  } finally {
    state.inflight = null;
  }
}

// The rates to render now, or null. A due read never delays a page that already
// has something to show: it runs in the background and the next visit gets it.
export async function getRates(now = new Date()): Promise<RatesSnapshot | null> {
  const slot = slotKey(now);
  const due = state.slot !== slot && Date.now() - state.failedAt > RETRY_AFTER_MS;
  if (due && !state.inflight) state.inflight = read(slot);
  if (!state.snapshot && state.inflight) await state.inflight;
  return state.snapshot && isFresh(state.snapshot, now) ? state.snapshot : null;
}
