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
  /** Cached LLM detections, keyed to the narrative hash they came from. */
  llmCache?: {
    hash: string;
    detections: Detection[];
  };
  /** Assignments completed on this day (Canvas ids or manual ids). */
  completedAssignments?: string[];
}

export interface Assignment {
  id: string; // stable id (canvas:<courseId>:<assignmentId> or manual:<uuid>)
  title: string;
  courseName?: string;
  dueAt: string; // ISO
  url?: string;
  source: 'canvas' | 'manual';
}

export interface Task {
  id: string;
  title: string;
  scope: 'day' | 'week';
  /** For day-scoped: YYYY-MM-DD. For week-scoped: the Monday YYYY-MM-DD. */
  scopeKey: string;
  createdAt: string; // ISO
  done: boolean;
  completedAt?: string; // ISO
  /** Optional thread this task rolls up to. Completing it bumps that thread's bar. */
  threadId?: string;
  /** true when a journal match auto-checked it (so we don't fight the user). */
  autoCompleted?: boolean;
}

export interface AppState {
  threads: Thread[];
  entries: Record<string, DayEntry>;
  /** Ad-hoc tasks the user tracks alongside threads. Keyed by id. */
  tasks?: Record<string, Task>;
  /** Cached assignments (from Canvas or manually added). Keyed by id. */
  assignments?: Record<string, Assignment>;
  /** Canvas integration config. */
  canvas?: {
    /** Proxy base URL, e.g. https://myapp.vercel.app */
    proxyUrl?: string;
    /** Per-user Canvas iCal feed URL (carries its own secret). */
    icalUrl?: string;
    lastSync?: string;
  };
}
