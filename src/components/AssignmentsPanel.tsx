import { useMemo, useState } from 'react';
import type { AppState, Assignment } from '../types';
import { fetchUpcomingAssignments } from '../lib/canvas';
import { todayKey, weekKeys } from '../lib/date';

interface Props {
  state: AppState;
  onSetAssignments: (list: Assignment[]) => void;
  onSetLastSync: (iso: string) => void;
  onSetProxyUrl: (url: string) => void;
  onToggleComplete: (assignmentId: string, dateKey: string, complete: boolean) => void;
  onAddManual: (a: Assignment) => void;
}

function dueDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDue(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const todayK = todayKey();
  const dueK = dueDateKey(iso);
  const daysUntil = Math.round((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (dueK === todayK) return `Today · ${time}`;
  if (daysUntil === 1) return `Tomorrow · ${time}`;
  if (daysUntil > 1 && daysUntil <= 6) {
    return `${d.toLocaleDateString(undefined, { weekday: 'short' })} · ${time}`;
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` · ${time}`;
}

export function AssignmentsPanel({
  state,
  onSetAssignments,
  onSetLastSync,
  onSetProxyUrl,
  onToggleComplete,
  onAddManual,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingOpen, setAddingOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const proxy = state.canvas?.proxyUrl ?? '';
  const [urlDraft, setUrlDraft] = useState(proxy);

  const week = useMemo(() => new Set(weekKeys()), []);
  const today = todayKey();

  const assignments = useMemo(() => {
    const list = Object.values(state.assignments ?? {});
    list.sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
    return list;
  }, [state.assignments]);

  const groups = useMemo(() => {
    const overdue: Assignment[] = [];
    const todayList: Assignment[] = [];
    const weekList: Assignment[] = [];
    const later: Assignment[] = [];
    for (const a of assignments) {
      const k = dueDateKey(a.dueAt);
      if (Date.parse(a.dueAt) < Date.parse(today) && k !== today) overdue.push(a);
      else if (k === today) todayList.push(a);
      else if (week.has(k)) weekList.push(a);
      else later.push(a);
    }
    return { overdue, todayList, weekList, later };
  }, [assignments, today, week]);

  const completed = useMemo(() => {
    const set = new Set<string>();
    for (const e of Object.values(state.entries)) {
      for (const id of e.completedAssignments ?? []) set.add(id);
    }
    return set;
  }, [state.entries]);

  async function sync() {
    if (!proxy) return;
    setBusy(true);
    setError(null);
    try {
      const list = await fetchUpcomingAssignments(proxy, 21);
      onSetAssignments(list);
      onSetLastSync(new Date().toISOString());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function saveProxy() {
    onSetProxyUrl(urlDraft.trim());
  }

  function submitManual() {
    if (!newTitle.trim() || !newDate) return;
    const id = `manual:${crypto.randomUUID()}`;
    const iso = new Date(newDate + 'T23:59:00').toISOString();
    onAddManual({
      id,
      title: newTitle.trim(),
      dueAt: iso,
      source: 'manual',
    });
    setNewTitle('');
    setNewDate('');
    setAddingOpen(false);
  }

  const totalWeek =
    groups.overdue.length +
    groups.todayList.length +
    groups.weekList.length;
  const doneWeek =
    [...groups.overdue, ...groups.todayList, ...groups.weekList].filter((a) =>
      completed.has(a.id),
    ).length;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <span className="inline-block w-1 h-4 rounded-full" style={{ backgroundColor: '#0EA5A3' }} />
            Assignments
          </h2>
          <p className="text-[11px] text-ink-faint mt-0.5">
            {totalWeek === 0
              ? 'Nothing due this week.'
              : `${doneWeek}/${totalWeek} done this week`}
            {state.canvas?.lastSync && (
              <>
                {' · '}
                <span className="text-ink-faint">
                  synced {new Date(state.canvas.lastSync).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="btn-ghost text-xs"
            onClick={() => setAddingOpen((v) => !v)}
          >
            + Add
          </button>
          <button
            className="btn text-xs"
            onClick={sync}
            disabled={!proxy || busy}
            title={proxy ? 'Sync from Canvas' : 'Set proxy URL first'}
          >
            {busy ? 'Syncing…' : 'Sync Canvas'}
          </button>
        </div>
      </div>

      {!proxy && (
        <div className="mb-3 p-2.5 rounded-lg border border-dashed border-line text-xs text-ink-muted">
          Paste your Canvas proxy URL to start syncing (e.g.{' '}
          <span className="font-mono">https://your-app.vercel.app</span>).
          <div className="mt-2 flex gap-1.5">
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://your-app.vercel.app"
              className="field !py-1 !text-xs"
            />
            <button className="btn text-xs" onClick={saveProxy} disabled={!urlDraft.trim()}>
              Save
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {addingOpen && (
        <div className="mb-3 p-3 rounded-lg border border-line bg-paper">
          <label className="block text-[11px] uppercase tracking-wider text-ink-faint font-semibold mb-1">
            New assignment
          </label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            className="field !py-1.5 !text-sm mb-2"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="field !py-1.5 !text-sm"
            />
            <button
              className="btn-primary text-xs"
              onClick={submitManual}
              disabled={!newTitle.trim() || !newDate}
            >
              Add
            </button>
          </div>
        </div>
      )}

      <Section label="Overdue" tone="danger" items={groups.overdue} completed={completed} onToggle={onToggleComplete} />
      <Section label="Today" tone="hot" items={groups.todayList} completed={completed} onToggle={onToggleComplete} />
      <Section label="This week" items={groups.weekList} completed={completed} onToggle={onToggleComplete} />
      <Section label="Later" tone="mute" items={groups.later} completed={completed} onToggle={onToggleComplete} />

      {assignments.length === 0 && (
        <div className="p-4 rounded-lg border border-dashed border-line text-xs text-ink-faint text-center">
          No assignments yet. Add one manually or set your Canvas proxy URL and sync.
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  items,
  completed,
  tone = 'default',
  onToggle,
}: {
  label: string;
  items: Assignment[];
  completed: Set<string>;
  tone?: 'default' | 'hot' | 'danger' | 'mute';
  onToggle: (id: string, dateKey: string, complete: boolean) => void;
}) {
  if (items.length === 0) return null;
  const chipCls =
    tone === 'danger'
      ? 'text-red-700 bg-red-50 border-red-200'
      : tone === 'hot'
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : tone === 'mute'
          ? 'text-ink-faint'
          : 'text-ink-muted';

  return (
    <div className="mt-3">
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 mb-1.5 text-[10px] uppercase tracking-wider font-semibold rounded-full border ${
          tone === 'default' || tone === 'mute' ? 'border-line bg-paper' : ''
        } ${chipCls}`}
      >
        {label} · {items.length}
      </div>
      <ul className="space-y-1">
        {items.map((a) => {
          const done = completed.has(a.id);
          const dueK = dueDateKey(a.dueAt);
          return (
            <li
              key={a.id}
              className={`group flex items-center gap-2 p-2 rounded-lg border transition ${
                done
                  ? 'border-teal-200 bg-teal-50/50'
                  : 'border-line bg-white hover:border-line2'
              }`}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => onToggle(a.id, dueK, e.target.checked)}
                className="w-4 h-4 rounded border-line accent-teal-600"
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${done ? 'line-through text-ink-faint' : 'text-ink font-medium'}`}>
                  {a.title}
                </div>
                <div className="text-[11px] text-ink-faint flex items-center gap-1.5">
                  {a.courseName && <span>{a.courseName}</span>}
                  {a.courseName && <span>·</span>}
                  <span className="tabular-nums">{fmtDue(a.dueAt)}</span>
                </div>
              </div>
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
          );
        })}
      </ul>
    </div>
  );
}
