// ============================================================================
// Source: src/lib/view.ts
// Version: 0.10.0 — 2026-09-10
// Why: Persist independent event groups, memorial visibility and the Avestan
//      month names, with safe legacy migration.
// Env / Deps: Browser localStorage (taghvim-view; migrates taghvim-scope), guarded for SSR.
// ============================================================================

import { DEFAULT_GROUPS, type EventGroups } from './events';

export type ViewPreferences = EventGroups & { memorial: boolean; avestan: boolean };
export const DEFAULT_VIEW: ViewPreferences = { ...DEFAULT_GROUPS, memorial: true, avestan: false };
export const VIEW_KEY = 'taghvim-view';

type StorageGetter = () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const LEGACY_KEY = 'taghvim-scope';
// The four this record has always carried. A stored record must still have all of
// them: partial or unrecognised data must not silently change someone's choices.
const REQUIRED_FIELDS = ['religious', 'state', 'world', 'memorial'] as const;
// Added later. A record written before them is COMPLETE, not corrupt — treating it
// as corrupt would reset the event groups of everyone who ever set one, which is
// what a strict key count did when `avestan` was added on 10 Sep.
const OPTIONAL_FIELDS = ['avestan'] as const;

function isView(value: unknown): value is Partial<ViewPreferences> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const known = new Set<string>([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);
  if (!Object.keys(record).every((key) => known.has(key))) return false;
  if (!REQUIRED_FIELDS.every((key) => Object.hasOwn(record, key) && typeof record[key] === 'boolean')) return false;
  return OPTIONAL_FIELDS.every((key) => !Object.hasOwn(record, key) || typeof record[key] === 'boolean');
}

/** A validated record, with anything added since it was written filled from the default. */
function complete(stored: Partial<ViewPreferences>): ViewPreferences {
  return { ...DEFAULT_VIEW, ...stored };
}

export function readView(getStorage?: StorageGetter): ViewPreferences {
  try {
    // Both browser acquisition and injected getters can throw in restricted environments.
    const storage = getStorage ? getStorage() : window.localStorage;
    const raw = storage.getItem(VIEW_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      // Even corrupt new data takes precedence over legacy: do not overwrite it by migrating.
      return isView(parsed) ? complete(parsed) : { ...DEFAULT_VIEW };
    }
    const scope = storage.getItem(LEGACY_KEY);
    if (scope === 'secular' || scope === 'all') {
      // Both old scopes showed world events and the memorial. Only state/religious differed.
      const migrated: ViewPreferences = {
        religious: scope === 'all', state: scope === 'all', world: true, memorial: true, avestan: false,
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
