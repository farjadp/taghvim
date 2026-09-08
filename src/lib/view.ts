// ============================================================================
// Source: src/lib/view.ts
// Version: 0.9.0 — 2026-09-08
// Why: Persist independent event groups and memorial visibility with safe legacy migration.
// Env / Deps: Browser localStorage (taghvim-view; migrates taghvim-scope), guarded for SSR.
// ============================================================================

import { DEFAULT_GROUPS, type EventGroups } from './events';

export type ViewPreferences = EventGroups & { memorial: boolean };
export const DEFAULT_VIEW: ViewPreferences = { ...DEFAULT_GROUPS, memorial: true };
export const VIEW_KEY = 'taghvim-view';

type StorageGetter = () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const LEGACY_KEY = 'taghvim-scope';
const VIEW_FIELDS = ['religious', 'state', 'world', 'memorial'] as const;

function isView(value: unknown): value is ViewPreferences {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  // A complete record is required; partial or future schemas must not silently change choices.
  return Object.keys(record).length === VIEW_FIELDS.length
    && VIEW_FIELDS.every((key) => Object.hasOwn(record, key) && typeof record[key] === 'boolean');
}

export function readView(getStorage?: StorageGetter): ViewPreferences {
  try {
    // Both browser acquisition and injected getters can throw in restricted environments.
    const storage = getStorage ? getStorage() : window.localStorage;
    const raw = storage.getItem(VIEW_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      // Even corrupt new data takes precedence over legacy: do not overwrite it by migrating.
      return isView(parsed) ? parsed : { ...DEFAULT_VIEW };
    }
    const scope = storage.getItem(LEGACY_KEY);
    if (scope === 'secular' || scope === 'all') {
      // Both old scopes showed world events and the memorial. Only state/religious differed.
      const migrated: ViewPreferences = {
        religious: scope === 'all', state: scope === 'all', world: true, memorial: true,
      };
      // Do not use saveView here: its swallowed write errors must never permit legacy deletion.
      storage.setItem(VIEW_KEY, JSON.stringify(migrated));
      storage.removeItem(LEGACY_KEY);
      return migrated;
    }
  } catch {
    // Failed reads or migration steps leave the UI usable with an independent default object.
  }
  return { ...DEFAULT_VIEW };
}

export function saveView(view: ViewPreferences, getStorage?: StorageGetter): void {
  try {
    const storage = getStorage ? getStorage() : window.localStorage;
    storage.setItem(VIEW_KEY, JSON.stringify(view));
  } catch {
    // Keep the in-memory choice usable when acquisition, serialization or persistence fails.
  }
}
