import { useMemo, useState } from 'react';
import type { AppState, Task } from '../types';
import { todayKey, weekStart } from '../lib/date';

interface Props {
  state: AppState;
  onAdd: (task: Task) => void;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onChangeCategory: (id: string, threadId: string | undefined) => void;
}

function weekKey(date: Date = new Date()): string {
  const s = weekStart(date);
  const y = s.getFullYear();
  const m = String(s.getMonth() + 1).padStart(2, '0');
  const d = String(s.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function TasksPanel({
  state,
  onAdd,
  onToggle,
  onDelete,
  onChangeCategory,
}: Props) {
  const [scope, setScope] = useState<'day' | 'week'>('day');
  const [title, setTitle] = useState('');
  const [threadId, setThreadId] = useState<string>('');

  const threads = state.threads;

  const today = todayKey();
  const wk = weekKey();

  const { dayTasks, weekTasks } = useMemo(() => {
    const all = Object.values(state.tasks ?? {});
    return {
      dayTasks: all
        .filter((t) => t.scope === 'day' && t.scopeKey === today)
        .sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt.localeCompare(b.createdAt)),
      weekTasks: all
        .filter((t) => t.scope === 'week' && t.scopeKey === wk)
        .sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt.localeCompare(b.createdAt)),
    };
  }, [state.tasks, today, wk]);

  const dayDone = dayTasks.filter((t) => t.done).length;
  const weekDone = weekTasks.filter((t) => t.done).length;
  const dayPct = dayTasks.length === 0 ? 0 : Math.round((dayDone / dayTasks.length) * 100);
  const weekPct = weekTasks.length === 0 ? 0 : Math.round((weekDone / weekTasks.length) * 100);

  function submit() {
    if (!title.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      title: title.trim(),
      scope,
      scopeKey: scope === 'day' ? today : wk,
      createdAt: new Date().toISOString(),
      done: false,
      threadId: threadId || undefined,
    });
    setTitle('');
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <span className="inline-block w-1 h-4 rounded-full bg-teal-500" />
            Tasks
          </h2>
          <p className="text-[11px] text-ink-faint mt-0.5">
            Ad-hoc targets, separate from Canvas.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-ink-muted tabular-nums">
          <span>
            <b className={dayPct >= 100 ? 'text-teal-700' : 'text-ink'}>{dayDone}</b>/{dayTasks.length} today
          </span>
          <span>·</span>
          <span>
            <b className={weekPct >= 100 ? 'text-teal-700' : 'text-ink'}>{weekDone}</b>/{weekTasks.length} week
          </span>
        </div>
      </div>

      <MiniBars dayPct={dayPct} weekPct={weekPct} />

      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <div className="flex rounded-lg border border-line overflow-hidden text-xs">
          {(['day', 'week'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-2.5 py-1.5 transition ${
                scope === s
                  ? 'bg-ink text-white font-semibold'
                  : 'bg-white text-ink-muted hover:text-ink hover:bg-neutral-50'
              }`}
              title={s === 'day' ? 'Belongs to today' : 'Belongs to this week'}
            >
              {s === 'day' ? 'Today' : 'This week'}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder={
            scope === 'day' ? 'Add a task for today…' : 'Add a task for this week…'
          }
          className="field !py-1.5 !text-sm flex-1 min-w-[180px]"
        />
        <CategorySelect
          threads={threads}
          value={threadId}
          onChange={setThreadId}
        />
        <button
          className="btn-primary text-xs"
          onClick={submit}
          disabled={!title.trim()}
        >
          Add
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TaskList
          label="Today"
          items={dayTasks}
          threads={threads}
          onToggle={onToggle}
          onDelete={onDelete}
          onChangeCategory={onChangeCategory}
          emptyText="No day tasks yet."
        />
        <TaskList
          label="This week"
          items={weekTasks}
          threads={threads}
          onToggle={onToggle}
          onDelete={onDelete}
          onChangeCategory={onChangeCategory}
          emptyText="No weekly tasks yet."
        />
      </div>

      <p className="text-[11px] text-ink-faint mt-3">
        Tip: with a category set, completing a task bumps that thread's bar.
        Writing about it in the Journal auto-checks matching tasks.
      </p>
    </div>
  );
}

function CategorySelect({
  threads,
  value,
  onChange,
  compact = false,
}: {
  threads: { id: string; name: string; color: string }[];
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const cur = threads.find((t) => t.id === value);
  return (
    <div className="relative inline-flex items-center">
      <span
        className="pointer-events-none absolute left-2 w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: cur?.color ?? '#D1D5DB' }}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`field !py-1.5 !pl-6 !pr-6 text-xs appearance-none cursor-pointer ${
          compact ? '!w-[110px]' : ''
        }`}
        title="Category"
      >
        <option value="">No category</option>
        {threads.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function MiniBars({ dayPct, weekPct }: { dayPct: number; weekPct: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          { label: 'Today', pct: dayPct },
          { label: 'This week', pct: weekPct },
        ] as const
      ).map((b) => {
        const filled = b.pct >= 100;
        return (
          <div key={b.label}>
            <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-ink-faint font-semibold mb-1">
              <span>{b.label}</span>
              <span className={`tabular-nums ${filled ? 'text-teal-700' : 'text-ink-muted'}`}>
                {b.pct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden ring-1 ring-inset ring-line">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${Math.min(100, b.pct)}%`,
                  background: 'linear-gradient(90deg, #52E4DE, #1EC3C0)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskList({
  label,
  items,
  threads,
  onToggle,
  onDelete,
  onChangeCategory,
  emptyText,
}: {
  label: string;
  items: Task[];
  threads: { id: string; name: string; color: string }[];
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onChangeCategory: (id: string, threadId: string | undefined) => void;
  emptyText: string;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-1.5 text-[10px] uppercase tracking-wider font-semibold rounded-full border border-line bg-paper text-ink-muted">
        {label} · {items.length}
      </div>
      {items.length === 0 ? (
        <div className="p-2.5 rounded-lg border border-dashed border-line text-[11px] text-ink-faint">
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((t) => {
            const cat = threads.find((th) => th.id === t.threadId);
            return (
              <li
                key={t.id}
                className={`group flex items-center gap-2 p-2 rounded-lg border transition ${
                  t.done
                    ? 'border-teal-200 bg-teal-50/50'
                    : 'border-line bg-white hover:border-line2'
                }`}
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => onToggle(t.id, e.target.checked)}
                  className="w-4 h-4 rounded border-line accent-teal-600"
                />
                {cat && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: cat.color,
                      boxShadow: `0 0 0 3px ${cat.color}1a`,
                    }}
                    title={cat.name}
                  />
                )}
                <span
                  className={`flex-1 text-sm truncate ${
                    t.done ? 'line-through text-ink-faint' : 'text-ink'
                  }`}
                >
                  {t.title}
                </span>
                {t.done && t.autoCompleted && (
                  <span
                    className="text-[9px] text-teal-700 font-semibold uppercase tracking-wider"
                    title="Auto-checked from your journal"
                  >
                    Auto
                  </span>
                )}
                <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                  <CategorySelect
                    threads={threads}
                    value={t.threadId ?? ''}
                    onChange={(v) => onChangeCategory(t.id, v || undefined)}
                    compact
                  />
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-ink-faint hover:text-red-500 text-xs"
                    title="Delete task"
                    aria-label="Delete task"
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
