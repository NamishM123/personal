import { useMemo, useState } from 'react';
import type { AppState, Assignment, Detection, Task, Thread } from '../types';
import {
  dailyGoal,
  dayTotal,
  formatAmount,
  weekTotal,
  detectionsForDay,
} from '../lib/progress';
import { weekStart } from '../lib/date';
import { ProgressBar } from './ProgressBar';

interface Props {
  state: AppState;
  thread: Thread;
  dateKey: string;
  onClose: () => void;
  onAddTask: (task: Task) => void;
  onToggleTask: (id: string, done: boolean) => void;
  onDeleteTask: (id: string) => void;
}

function isoWeekKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const s = weekStart(new Date(y, m - 1, d));
  const yy = s.getFullYear();
  const mm = String(s.getMonth() + 1).padStart(2, '0');
  const dd = String(s.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function ThreadDetail({
  state,
  thread,
  dateKey,
  onClose,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: Props) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [scope, setScope] = useState<'day' | 'week'>('day');

  const isJobs = thread.id === 'jobs';
  const isCoursework = thread.id === 'coursework';

  const dToday = dayTotal(state, thread.id, dateKey);
  const dGoal = dailyGoal(thread);
  const wToday = weekTotal(state, thread.id);
  const wGoal = thread.weeklyGoal;

  const detections: Detection[] = useMemo(
    () => detectionsForDay(state, dateKey).filter((d) => d.threadId === thread.id),
    [state, dateKey, thread.id],
  );

  const wkKey = useMemo(() => isoWeekKey(dateKey), [dateKey]);

  const tasksForThread = useMemo(() => {
    const all = Object.values(state.tasks ?? {}).filter(
      (t) => t.threadId === thread.id,
    );
    // Day-scoped tasks bound to this date + week-scoped tasks in this week.
    return all.filter(
      (t) =>
        (t.scope === 'day' && t.scopeKey === dateKey) ||
        (t.scope === 'week' && t.scopeKey === wkKey),
    );
  }, [state.tasks, thread.id, dateKey, wkKey]);

  const assignmentsToday: Assignment[] = useMemo(() => {
    if (!isCoursework) return [];
    const all = Object.values(state.assignments ?? {});
    return all.filter((a) => a.dueAt.slice(0, 10) === dateKey);
  }, [state.assignments, isCoursework, dateKey]);

  function submit() {
    const raw = title.trim();
    if (!raw) return;
    const t: Task = {
      id: crypto.randomUUID(),
      title: raw,
      scope,
      scopeKey: scope === 'day' ? dateKey : wkKey,
      createdAt: new Date().toISOString(),
      done: false,
      threadId: thread.id,
    };
    if (url.trim()) t.url = url.trim();
    if (isJobs) {
      const meta: Record<string, string> = {};
      if (company.trim()) meta.company = company.trim();
      if (Object.keys(meta).length > 0) t.meta = meta;
    }
    onAddTask(t);
    setTitle('');
    setCompany('');
    setUrl('');
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-lg shadow-pop max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: thread.color,
                  boxShadow: `0 0 0 4px ${thread.color}1a`,
                }}
              />
              {thread.name}
            </h3>
            <p className="text-xs text-ink-faint mt-0.5 tabular-nums">
              {new Date(dateKey + 'T00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost !px-1.5 !py-1 text-lg leading-none -mt-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatMini
            label="Today"
            value={formatAmount(dToday, thread.unit)}
            goal={formatAmount(dGoal, thread.unit)}
            color={thread.color}
            pct={dGoal > 0 ? (dToday / dGoal) * 100 : 0}
          />
          <StatMini
            label="Week"
            value={formatAmount(wToday, thread.unit)}
            goal={formatAmount(wGoal, thread.unit)}
            color={thread.color}
            pct={wGoal > 0 ? (wToday / wGoal) * 100 : 0}
          />
        </div>

        {/* Quick add */}
        <div className="rounded-xl border border-line bg-paper p-3 mb-4">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint font-semibold mb-2">
            {isJobs ? 'Add an application' : 'Add a task'}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <div className="flex rounded-lg border border-line overflow-hidden text-[11px]">
              {(['day', 'week'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={`px-2 py-1 transition ${
                    scope === s
                      ? 'bg-ink text-white font-semibold'
                      : 'bg-white text-ink-muted hover:text-ink hover:bg-neutral-50'
                  }`}
                >
                  {s === 'day' ? 'Today' : 'Week'}
                </button>
              ))}
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={isJobs ? 'Role (e.g. SWE Intern)' : 'Task title'}
              className="field !py-1.5 !text-sm flex-1 min-w-[140px]"
            />
          </div>
          {isJobs && (
            <div className="flex gap-1.5 mb-2">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Company (e.g. Anthropic)"
                className="field !py-1.5 !text-sm flex-1"
              />
            </div>
          )}
          <div className="flex gap-1.5">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={isJobs ? 'Posting link (optional)' : 'Link (optional)'}
              className="field !py-1.5 !text-sm flex-1 font-mono !text-xs"
              type="url"
            />
            <button
              onClick={submit}
              className="btn-primary text-xs"
              disabled={!title.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {/* Detections */}
        {detections.length > 0 && (
          <Section title="From the journal" count={detections.length}>
            <ul className="space-y-1">
              {detections.map((d) => (
                <li
                  key={d.key}
                  className="flex items-start gap-2 text-sm p-2 rounded-md border border-line bg-white"
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: thread.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-ink italic truncate">"{d.text}"</div>
                  </div>
                  <span className="text-ink-muted tabular-nums text-xs">
                    +{formatAmount(d.amount, thread.unit)}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Tasks */}
        <Section title="Tasks" count={tasksForThread.length}>
          {tasksForThread.length === 0 ? (
            <div className="p-3 rounded-md border border-dashed border-line text-xs text-ink-faint text-center">
              No tasks for {thread.name} yet.
            </div>
          ) : (
            <ul className="space-y-1">
              {tasksForThread
                .slice()
                .sort((a, b) => Number(a.done) - Number(b.done))
                .map((t) => (
                  <li
                    key={t.id}
                    className={`group flex items-center gap-2 p-2 rounded-md border transition ${
                      t.done
                        ? 'border-teal-200 bg-teal-50/50'
                        : 'border-line bg-white hover:border-line2'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={(e) => onToggleTask(t.id, e.target.checked)}
                      className="w-4 h-4 rounded border-line accent-teal-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm truncate ${
                          t.done ? 'line-through text-ink-faint' : 'text-ink'
                        }`}
                      >
                        {t.title}
                      </div>
                      {(t.meta?.company || t.url) && (
                        <div className="text-[11px] text-ink-faint flex items-center gap-1.5 truncate">
                          {t.meta?.company && (
                            <span className="font-medium text-ink-muted">
                              {t.meta.company}
                            </span>
                          )}
                          {t.meta?.company && t.url && <span>·</span>}
                          {t.url && (
                            <a
                              href={t.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="hover:text-teal-700 underline truncate"
                            >
                              {t.url}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-ink-faint uppercase tracking-wider">
                      {t.scope}
                    </span>
                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="text-ink-faint hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition"
                      title="Delete task"
                    >
                      ×
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </Section>

        {isCoursework && assignmentsToday.length > 0 && (
          <Section title="Canvas assignments due today" count={assignmentsToday.length}>
            <ul className="space-y-1">
              {assignmentsToday.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 p-2 rounded-md border border-line bg-white text-sm"
                >
                  <span className="flex-1 min-w-0 truncate">
                    {a.title}
                    {a.courseName && (
                      <span className="text-ink-faint text-xs">
                        {' '}· {a.courseName}
                      </span>
                    )}
                  </span>
                  {a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn-ghost text-[11px]"
                    >
                      Open
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint font-semibold">
          {title}
        </div>
        <div className="text-[11px] text-ink-faint tabular-nums">{count}</div>
      </div>
      {children}
    </div>
  );
}

function StatMini({
  label,
  value,
  goal,
  color,
  pct,
}: {
  label: string;
  value: string;
  goal: string;
  color: string;
  pct: number;
}) {
  const filled = pct >= 100;
  return (
    <div className="p-3 rounded-lg border border-line bg-paper">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-ink-faint font-semibold">
          {label}
        </span>
        <span
          className={`text-lg font-semibold tabular-nums leading-none ${
            filled ? 'text-teal-700' : 'text-ink'
          }`}
        >
          {value}
        </span>
      </div>
      <div className="text-[11px] text-ink-faint tabular-nums mb-1.5">
        of {goal}
      </div>
      <ProgressBar value={pct} goal={100} color={color} />
    </div>
  );
}
