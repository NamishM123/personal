import type { AppState, Thread } from '../types';
import {
  dailyGoal,
  dayTotal,
  formatAmount,
  weekDaily,
  weekTotal,
} from '../lib/progress';
import { todayKey, weekKeys } from '../lib/date';
import { ProgressBar } from './ProgressBar';
import { WeekStrip } from './WeekStrip';

interface Props {
  state: AppState;
  thread: Thread;
}

export function ThreadCard({ state, thread }: Props) {
  const today = todayKey();
  const dToday = dayTotal(state, thread.id, today);
  const dGoal = dailyGoal(thread);
  const wToday = weekTotal(state, thread.id);
  const wGoal = thread.weeklyGoal;
  const week = weekDaily(state, thread.id);
  const todayIdx = weekKeys().indexOf(today);

  const wPct = wGoal > 0 ? Math.round((wToday / wGoal) * 100) : 0;
  const wPctClamped = Math.min(100, wPct);
  const dPct = dGoal > 0 ? Math.round((dToday / dGoal) * 100) : 0;
  const filled = wPct >= 100;

  return (
    <div className="card p-4 hover:shadow-pop transition-shadow relative overflow-hidden">
      {/* Ambient color wash in the top-right */}
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-[0.08] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${thread.color}, transparent 60%)` }}
      />

      <div className="flex items-start justify-between mb-3 relative">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: thread.color,
              boxShadow: `0 0 0 4px ${thread.color}1a`,
            }}
          />
          <div className="min-w-0">
            <div className="font-semibold text-ink truncate leading-tight">
              {thread.name}
            </div>
            <div className="text-[11px] text-ink-faint uppercase tracking-wider font-medium">
              {thread.unit}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold tabular-nums text-ink leading-none">
              {formatAmount(wToday, thread.unit)}
            </span>
            <span className="text-xs text-ink-faint">
              / {formatAmount(wGoal, thread.unit)}
            </span>
          </div>
          <span
            className={`text-[11px] tabular-nums font-semibold mt-0.5 ${
              filled ? 'text-teal-700' : 'text-ink-muted'
            }`}
          >
            {wPct}% this week
          </span>
        </div>
      </div>

      <ProgressBar value={wToday} goal={wGoal} color={thread.color} />

      <div className="mt-2 flex justify-between text-[10px] text-ink-faint tabular-nums">
        <span>Today · {formatAmount(dToday, thread.unit)} / {formatAmount(dGoal, thread.unit)}</span>
        <span className={dPct >= 100 ? 'text-teal-700 font-semibold' : ''}>
          {dPct}%
        </span>
      </div>

      <WeekStrip
        values={week}
        dailyGoal={dGoal}
        color={thread.color}
        todayIndex={todayIdx}
      />

      {/* Percent-position wPctClamped kept for aria/testing; visually already carried by the bar */}
      <span className="sr-only">{wPctClamped}% of weekly goal</span>
    </div>
  );
}
