import type { AppState, DayEntry, Thread } from '../types';
import { DEFAULT_THREADS } from './defaults';

const KEY = 'personal-progress-tracker/v2';
const OLD_KEY = 'personal-progress-tracker/v1';

const DEFAULTS_BY_ID = new Map(DEFAULT_THREADS.map((t) => [t.id, t]));

/** Fill in aliases/defaultAmount from DEFAULT_THREADS if the stored thread is missing them. */
function hydrateThread(t: Thread): Thread {
  const seeded = DEFAULTS_BY_ID.get(t.id);
  const aliases =
    Array.isArray(t.aliases) && t.aliases.length > 0
      ? t.aliases
      : (seeded?.aliases ?? []);
  const defaultAmount =
    typeof t.defaultAmount === 'number'
      ? t.defaultAmount
      : (seeded?.defaultAmount ??
        (t.unit === 'minutes' ? 30 : t.unit === 'percent' ? 100 : 1));
  return { ...t, aliases, defaultAmount };
}

function hydrateEntries(entries: Record<string, DayEntry>): Record<string, DayEntry> {
  const out: Record<string, DayEntry> = {};
  for (const [k, v] of Object.entries(entries)) {
    out[k] = {
      date: v.date ?? k,
      narrative: v.narrative ?? '',
      dismissed: Array.isArray(v.dismissed) ? v.dismissed : [],
    };
  }
  return out;
}

/** Best-effort migration of v1 (manual tag) entries into v2 shape. */
function migrateV1(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(raw) as {
      threads: Thread[];
      entries: Record<string, { date: string; narrative: string }>;
    };
    if (!parsed.threads || !parsed.entries) return null;
    const threads = (parsed.threads ?? []).map(hydrateThread);
    const entries: Record<string, DayEntry> = {};
    for (const [k, v] of Object.entries(parsed.entries)) {
      entries[k] = { date: v.date, narrative: v.narrative ?? '', dismissed: [] };
    }
    return { threads, entries };
  } catch {
    return null;
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.threads && parsed.entries) {
        return {
          threads: parsed.threads.map(hydrateThread),
          entries: hydrateEntries(parsed.entries),
        };
      }
    }
    const oldRaw = localStorage.getItem(OLD_KEY);
    if (oldRaw) {
      const migrated = migrateV1(oldRaw);
      if (migrated) return migrated;
    }
  } catch {
    // fall through
  }
  return { threads: DEFAULT_THREADS, entries: {} };
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full / disabled — swallow so UI keeps working
  }
}
