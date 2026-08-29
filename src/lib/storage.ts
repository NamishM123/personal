import type { AppState, DayEntry, Thread } from '../types';
import { DEFAULT_THREADS } from './defaults';

const KEY = 'personal-progress-tracker/v2';
const OLD_KEY = 'personal-progress-tracker/v1';

/** Best-effort migration of v1 (manual tag) entries into v2 shape. */
function migrateV1(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(raw) as {
      threads: Thread[];
      entries: Record<string, { date: string; narrative: string }>;
    };
    if (!parsed.threads || !parsed.entries) return null;
    const threads: Thread[] = (parsed.threads ?? []).map((t) => ({
      ...t,
      aliases: (t as unknown as { aliases?: string[] }).aliases ?? [],
      defaultAmount:
        (t as unknown as { defaultAmount?: number }).defaultAmount ??
        (t.unit === 'minutes' ? 30 : t.unit === 'percent' ? 100 : 1),
    }));
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
      if (parsed.threads && parsed.entries) return parsed;
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
