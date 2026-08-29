import type { AppState, Thread } from '../types';
import { dailyGoal, dayTotal, formatAmount, weekTotal } from '../lib/progress';
import { todayKey } from '../lib/date';
import { ProgressBar } from './ProgressBar';

interface Props {
  state: AppState;
  thread: Thread;
}

export function ThreadPanel({ state, thread }: Props) {
  const today = todayKey();
  const dToday = dayTotal(state, thread.id, today);
  const dGoal = dailyGoal(thread);
  const wToday = weekTotal(state, thread.id);
  const wGoal = thread.weeklyGoal;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: thread.color }}
          />
          <span className="font-semibold text-neutral-100">{thread.name}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">
          {thread.unit}
        </span>
      </div>

      <div className="space-y-3">
        <ProgressBar
          value={dToday}
          goal={dGoal}
          color={thread.color}
          label="Today"
          right={`${formatAmount(dToday, thread.unit)} / ${formatAmount(dGoal, thread.unit)}`}
        />
        <ProgressBar
          value={wToday}
          goal={wGoal}
          color={thread.color}
          label="This week"
          right={`${formatAmount(wToday, thread.unit)} / ${formatAmount(wGoal, thread.unit)}`}
        />
      </div>
    </div>
  );
}
