export type Unit = 'minutes' | 'count' | 'percent';

export interface Thread {
  id: string;
  name: string;
  unit: Unit;
  weeklyGoal: number;
  color: string;
}

export interface Tag {
  id: string;
  threadId: string;
  text: string;
  amount: number;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  narrative: string;
  tags: Tag[];
}

export interface AppState {
  threads: Thread[];
  entries: Record<string, DayEntry>;
}
