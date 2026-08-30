import type { Task } from '../types';

const STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'about',
  'into', 'onto', 'over', 'your', 'their', 'them', 'those', 'these',
  'today', 'tomorrow', 'a', 'an', 'of', 'in', 'on', 'to', 'my', 'me',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
]);

const COMPLETION_VERBS = [
  'finished', 'finish', 'done with', 'done', 'completed', 'complete',
  'submitted', 'submit', 'sent in', 'turned in', 'turned it in', 'wrapped up',
  'wrapped', 'knocked out', 'crossed off',
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function significantWords(title: string): string[] {
  return normalize(title)
    .split(' ')
    .filter((w) => w.length >= 4 && !STOP.has(w));
}

/**
 * Decide whether a task looks completed based on the journal narrative.
 * Strategy: (a) if 60%+ of the title's significant words appear in the
 * narrative, or (b) the full normalized title appears as a substring, count it
 * as a match. Bare mention doesn't require a completion verb — writing "went
 * to physics lecture" is enough for "Attend physics lecture".
 */
export function matchTaskInNarrative(narrative: string, task: Task): boolean {
  const hay = normalize(narrative);
  if (!hay) return false;
  const titleNorm = normalize(task.title);
  if (!titleNorm) return false;

  if (hay.includes(titleNorm)) return true;

  const words = significantWords(task.title);
  if (words.length === 0) return hay.includes(titleNorm);
  const hits = words.filter((w) => hay.includes(w)).length;
  if (hits / words.length >= 0.6) return true;

  // Fallback: a completion verb near a shorter title fragment
  const bigrams = words
    .slice(0, -1)
    .map((w, i) => `${w} ${words[i + 1]}`);
  if (bigrams.some((b) => hay.includes(b))) {
    return COMPLETION_VERBS.some((v) => hay.includes(v));
  }
  return false;
}

/** Return ids of open tasks that should auto-complete for this narrative. */
export function autoCompletableTaskIds(narrative: string, tasks: Task[]): string[] {
  const ids: string[] = [];
  for (const t of tasks) {
    if (t.done) continue;
    if (matchTaskInNarrative(narrative, t)) ids.push(t.id);
  }
  return ids;
}
