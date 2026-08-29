import type { AppState, Thread } from '../types';
import { weekKeys } from './date';
import { parseNarrative } from './parse';

/** Contributions per (dateKey, threadId), computed on demand from narratives. */
export function detectionsForDay(state: AppState, dateKey: string) {
  const entry = state.entries[dateKey];
  if (!entry) return [];
  const dismissed = new Set(entry.dismissed ?? []);
  return parseNarrative(entry.narrative, state.threads).filter(
    (d) => !dismissed.has(d.key),
  );
}

export function dayTotal(state: AppState, threadId: string, dateKey: string): number {
  return detectionsForDay(state, dateKey)
    .filter((d) => d.threadId === threadId)
    .reduce((s, d) => s + d.amount, 0);
}

export function weekTotal(
  state: AppState,
  threadId: string,
  refDate: Date = new Date(),
): number {
  return weekKeys(refDate).reduce(
    (s, k) => s + dayTotal(state, threadId, k),
    0,
  );
}

/** Per-day amounts for the current week — array of 7 numbers, Mon..Sun. */
export function weekDaily(
  state: AppState,
  threadId: string,
  refDate: Date = new Date(),
): number[] {
  return weekKeys(refDate).map((k) => dayTotal(state, threadId, k));
}

export function dailyGoal(thread: Thread): number {
  return thread.weeklyGoal / 7;
}

export function pct(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, (value / goal) * 100));
}

export function formatAmount(value: number, unit: Thread['unit']): string {
  if (unit === 'minutes') {
    if (value >= 60) {
      const h = Math.floor(value / 60);
      const m = Math.round(value % 60);
      return m === 0 ? `${h}h` : `${h}h ${m}m`;
    }
    return `${Math.round(value)}m`;
  }
  if (unit === 'percent') return `${Math.round(value)}%`;
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}`;
}
