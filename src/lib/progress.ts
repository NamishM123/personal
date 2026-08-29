import type { AppState, Thread } from '../types';
import { weekKeys } from './date';

export function dayTotal(state: AppState, threadId: string, dateKey: string): number {
  const entry = state.entries[dateKey];
  if (!entry) return 0;
  return entry.tags
    .filter((t) => t.threadId === threadId)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function weekTotal(state: AppState, threadId: string, refDate: Date = new Date()): number {
  return weekKeys(refDate).reduce((sum, k) => sum + dayTotal(state, threadId, k), 0);
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
