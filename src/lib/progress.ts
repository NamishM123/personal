import type { AppState, Detection, Thread } from '../types';
import { weekKeys } from './date';
import { parseNarrative } from './parse';
import { mergeDetections } from './merge';

const COURSEWORK_ID = 'coursework';

export function detectionsForDay(state: AppState, dateKey: string): Detection[] {
  const entry = state.entries[dateKey];
  if (!entry) return [];
  const dismissed = new Set(entry.dismissed ?? []);
  const rules = parseNarrative(entry.narrative, state.threads);
  const cached = entry.llmCache?.detections ?? [];
  const merged = mergeDetections(rules, cached);
  return merged.filter((d) => !dismissed.has(d.key));
}

/** Assignments completed on a specific day. */
export function assignmentsCompletedOn(state: AppState, dateKey: string): number {
  return state.entries[dateKey]?.completedAssignments?.length ?? 0;
}

/** Tasks credited to this thread that were completed on this date. */
function tasksCompletedForThreadOn(
  state: AppState,
  threadId: string,
  dateKey: string,
): number {
  const tasks = state.tasks ?? {};
  let n = 0;
  for (const t of Object.values(tasks)) {
    if (!t.done || !t.completedAt || t.threadId !== threadId) continue;
    if (t.completedAt.slice(0, 10) === dateKey) n += 1;
  }
  return n;
}

export function dayTotal(state: AppState, threadId: string, dateKey: string): number {
  const fromNarrative = detectionsForDay(state, dateKey)
    .filter((d) => d.threadId === threadId)
    .reduce((s, d) => s + d.amount, 0);

  const thread = state.threads.find((t) => t.id === threadId);
  const taskCount = tasksCompletedForThreadOn(state, threadId, dateKey);
  const perTask = thread?.defaultAmount ?? 1;
  const fromTasks = taskCount * perTask;

  const fromAssignments =
    threadId === COURSEWORK_ID ? assignmentsCompletedOn(state, dateKey) : 0;

  return fromNarrative + fromTasks + fromAssignments;
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
