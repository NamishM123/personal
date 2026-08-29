import type { Detection, Thread } from '../types';

const NUM_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  couple: 2, few: 3, several: 4, dozen: 12, half: 0.5,
};

function normalizeNumberWord(token: string): number | null {
  const n = parseFloat(token);
  if (!Number.isNaN(n)) return n;
  return NUM_WORDS[token.toLowerCase()] ?? null;
}

/** Turn a clause into minutes when time-language is present, else null. */
function extractMinutes(clause: string): number | null {
  const lower = clause.toLowerCase();

  // "an hour and a half", "half an hour", "a couple hours"
  if (/\b(an?\s+hour\s+and\s+a\s+half|1\.5\s*(?:h|hours?|hrs?))\b/.test(lower)) return 90;
  if (/\bhalf\s+(?:an\s+)?hour\b/.test(lower)) return 30;
  if (/\ba\s+(?:couple|couple\s+of)\s+hours?\b/.test(lower)) return 120;
  if (/\b(?:a\s+)?few\s+hours?\b/.test(lower)) return 180;
  if (/\ban\s+hour\b/.test(lower)) return 60;

  // "3h", "3 hrs", "3 hours", "45m", "45 min", "45 minutes"
  const hourRe = /(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:h(?:rs?|ours?)?|hours?)\b/gi;
  const minRe = /(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|forty-five|forty five|sixty)\s*(?:m(?:in(?:ute)?s?)?|minutes?|mins?)\b/gi;

  let total = 0;
  let matched = false;
  for (const m of lower.matchAll(hourRe)) {
    const n = normalizeNumberWord(m[1]);
    if (n !== null) {
      total += n * 60;
      matched = true;
    }
  }
  for (const m of lower.matchAll(minRe)) {
    const n = normalizeNumberWord(m[1]);
    if (n !== null) {
      total += n;
      matched = true;
    }
  }
  return matched ? Math.round(total) : null;
}

/** For count threads, look for the leading integer in the clause. */
function extractCount(clause: string): number | null {
  const lower = clause.toLowerCase();
  // "3 leetcode", "did 3 problems", "applied to 8 jobs"
  const m = lower.match(/\b(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|couple|few|several)\b/);
  if (!m) return null;
  const n = normalizeNumberWord(m[1]);
  return n !== null ? n : null;
}

function splitClauses(text: string): { text: string; start: number }[] {
  const out: { text: string; start: number }[] = [];
  const re = /[^.!?;\n]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    // Split each sentence further on ", and", ", then", ", also", "; "
    let cursor = 0;
    const subRe = /,\s+(?:and\s+|then\s+|also\s+|plus\s+)?|(?:\s+and\s+)|(?:\s+then\s+)/gi;
    let sm: RegExpExecArray | null;
    while ((sm = subRe.exec(raw)) !== null) {
      const piece = raw.slice(cursor, sm.index);
      if (piece.trim()) out.push({ text: piece, start: m.index + cursor });
      cursor = sm.index + sm[0].length;
    }
    const tail = raw.slice(cursor);
    if (tail.trim()) out.push({ text: tail, start: m.index + cursor });
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive, word-boundary-aware match. */
function clauseMentionsThread(clause: string, thread: Thread): boolean {
  const lower = clause.toLowerCase();
  for (const alias of thread.aliases) {
    const a = alias.toLowerCase();
    // multiword aliases: substring is safe (spaces make them word-bounded enough)
    if (a.includes(' ')) {
      if (lower.includes(a)) return true;
      continue;
    }
    const re = new RegExp(`\\b${escapeRegex(a)}\\b`, 'i');
    if (re.test(clause)) return true;
  }
  return false;
}

/** Score a match so we can pick the best thread when multiple match. */
function matchScore(clause: string, thread: Thread): number {
  const lower = clause.toLowerCase();
  let best = 0;
  for (const alias of thread.aliases) {
    const a = alias.toLowerCase();
    const idx = lower.indexOf(a);
    if (idx === -1) continue;
    // Prefer longer aliases and multiword matches
    const len = a.length + (a.includes(' ') ? 4 : 0);
    if (len > best) best = len;
  }
  return best;
}

export function parseNarrative(text: string, threads: Thread[]): Detection[] {
  if (!text.trim()) return [];
  const clauses = splitClauses(text);
  const detections: Detection[] = [];
  const seen = new Set<string>();

  for (const { text: clause, start } of clauses) {
    // Rank threads by match strength; only produce a detection if a clause matches at least one.
    const scored = threads
      .map((t) => ({ t, s: matchScore(clause, t) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);

    if (scored.length === 0) continue;

    // Allow multiple threads per clause, but skip weaker duplicates within same clause.
    const claimed = new Set<string>();
    for (const { t: thread } of scored) {
      if (claimed.has(thread.id)) continue;
      if (!clauseMentionsThread(clause, thread)) continue;

      let amount: number | null = null;
      if (thread.unit === 'minutes') amount = extractMinutes(clause);
      else if (thread.unit === 'count') amount = extractCount(clause);
      else if (thread.unit === 'percent') amount = extractCount(clause);

      if (amount === null || amount <= 0) amount = thread.defaultAmount;

      const trimmed = clause.trim();
      const key = `${thread.id}:${start}:${trimmed.slice(0, 40).toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      claimed.add(thread.id);

      detections.push({
        key,
        threadId: thread.id,
        amount,
        text: trimmed,
        start,
        end: start + clause.length,
      });
    }
  }

  return detections;
}
