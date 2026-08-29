import type { AppState } from '../types';
import { DEFAULT_THREADS } from './defaults';

const KEY = 'personal-progress-tracker/v1';

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { threads: DEFAULT_THREADS, entries: {} };
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.threads || !parsed.entries) {
      return { threads: DEFAULT_THREADS, entries: {} };
    }
    return parsed;
  } catch {
    return { threads: DEFAULT_THREADS, entries: {} };
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full / disabled — swallow so UI keeps working
  }
}
