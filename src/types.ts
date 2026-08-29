export type Unit = 'minutes' | 'count' | 'percent';

export interface Thread {
  id: string;
  name: string;
  unit: Unit;
  weeklyGoal: number;
  color: string;
  /** Keywords / verbs / nouns that should be recognized as this thread in the journal. */
  aliases: string[];
  /** Fallback amount when the thread is mentioned but no explicit amount was parsed. */
  defaultAmount: number;
  icon?: string;
}

export interface Detection {
  /** Stable id for a given (threadId, span) so dismissals persist across re-parses. */
  key: string;
  threadId: string;
  amount: number;
  /** The clause of text the detection came from. */
  text: string;
  /** Character range within the narrative. */
  start: number;
  end: number;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  narrative: string;
  /** Dismissed detection keys (so re-parsing won't re-introduce them). */
  dismissed: string[];
}

export interface AppState {
  threads: Thread[];
  entries: Record<string, DayEntry>;
}
