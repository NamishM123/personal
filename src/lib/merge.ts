import type { Detection } from '../types';

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Merge rule-based and LLM detections. Prefer rule detections when the same
 * clause was detected for the same thread — they carry span info. Dedupe on
 * (threadId, first 3 significant words of the clause).
 */
export function mergeDetections(rules: Detection[], llm: Detection[]): Detection[] {
  const seen = new Map<string, Detection>();
  const keyOf = (d: Detection) => `${d.threadId}::${norm(d.text).split(' ').slice(0, 3).join(' ')}`;

  for (const d of rules) seen.set(keyOf(d), d);
  for (const d of llm) {
    const k = keyOf(d);
    if (!seen.has(k)) seen.set(k, d);
  }
  return Array.from(seen.values());
}
