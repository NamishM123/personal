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
  const weekPct = wGoal > 0 ? Math.round((wToday / wGoal) * 100) : 0;

  return (
    <div className="card p-4 hover:shadow-pop transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: thread.color,
              boxShadow: `0 0 0 3px ${thread.color}22`,
            }}
          />
          <span className="font-semibold text-ink truncate">{thread.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="chip !py-0.5 !text-[10px] uppercase tracking-wider">
            {thread.unit}
          </span>
          <span className="text-xs tabular-nums font-semibold text-ink-muted">
            {weekPct}%
          </span>
        </div>
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
