import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import type { AppState, Assignment, DayEntry, Thread } from './types';
import { loadState, saveState } from './lib/storage';
import { formatDatePretty, todayKey, weekStart } from './lib/date';
import { dailyGoal, dayTotal, weekTotal } from './lib/progress';
import { ThreadCard } from './components/ThreadCard';
import { DayEditor } from './components/DayEditor';
import { Settings } from './components/Settings';
import { Ring } from './components/Ring';
import { AssignmentsPanel } from './components/AssignmentsPanel';

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [dateKey, setDateKey] = useState<string>(() => todayKey());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeThreads = useMemo(() => state.threads, [state.threads]);

  const entry: DayEntry = useMemo(
    () =>
      state.entries[dateKey] ?? { date: dateKey, narrative: '', dismissed: [] },
    [state.entries, dateKey],
  );

  const summary = useMemo(() => {
    const today = todayKey();
    let dayHit = 0;
    let weekHit = 0;
    for (const t of activeThreads) {
      const d = dayTotal(state, t.id, today);
      const w = weekTotal(state, t.id);
      if (dailyGoal(t) > 0 && d >= dailyGoal(t)) dayHit += 1;
      if (t.weeklyGoal > 0 && w >= t.weeklyGoal) weekHit += 1;
    }
    const total = activeThreads.length;
    const weekAvgPct =
      total === 0
        ? 0
        : Math.round(
            (activeThreads.reduce((acc, t) => {
              const w = weekTotal(state, t.id);
              return acc + (t.weeklyGoal > 0 ? Math.min(1, w / t.weeklyGoal) : 0);
            }, 0) /
              total) *
              100,
          );
    const dayAvgPct =
      total === 0
        ? 0
        : Math.round(
            (activeThreads.reduce((acc, t) => {
              const d = dayTotal(state, t.id, today);
              const g = dailyGoal(t);
              return acc + (g > 0 ? Math.min(1, d / g) : 0);
            }, 0) /
              total) *
              100,
          );
    return { dayHit, weekHit, total, weekAvgPct, dayAvgPct };
  }, [state, activeThreads]);

  const weekRange = useMemo(() => {
    const start = weekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return { text: `${fmt(start)} – ${fmt(end)}` };
  }, []);

  function upsertEntry(next: DayEntry) {
    setState((s) => ({
      ...s,
      entries: { ...s.entries, [next.date]: next },
    }));
  }

  function updateThreads(threads: Thread[]) {
    setState((s) => ({ ...s, threads }));
  }

  function setProxyUrl(url: string) {
    setState((s) => ({ ...s, canvas: { ...(s.canvas ?? {}), proxyUrl: url } }));
  }

  function setIcalUrl(url: string) {
    setState((s) => ({ ...s, canvas: { ...(s.canvas ?? {}), icalUrl: url } }));
  }

  function setAssignments(list: Assignment[]) {
    const map: Record<string, Assignment> = {};
    // preserve any manual ones already present
    for (const a of Object.values(state.assignments ?? {})) {
      if (a.source === 'manual') map[a.id] = a;
    }
    for (const a of list) map[a.id] = a;
    setState((s) => ({ ...s, assignments: map }));
  }

  function addManualAssignment(a: Assignment) {
    setState((s) => ({
      ...s,
      assignments: { ...(s.assignments ?? {}), [a.id]: a },
    }));
  }

  function setLastSync(iso: string) {
    setState((s) => ({ ...s, canvas: { ...(s.canvas ?? {}), lastSync: iso } }));
  }

  function toggleAssignmentComplete(id: string, dueKey: string, complete: boolean) {
    setState((s) => {
      const nextEntries = { ...s.entries };

      // Remove id from every day first — completion lives on exactly one day.
      for (const [k, e] of Object.entries(nextEntries)) {
        if (!e.completedAssignments?.includes(id)) continue;
        nextEntries[k] = {
          ...e,
          completedAssignments: (e.completedAssignments ?? []).filter((x) => x !== id),
        };
      }

      if (complete) {
        const target = todayKey();
        const existing = nextEntries[target] ??
          ({
            date: target,
            narrative: '',
            dismissed: [],
          } as DayEntry);
        // Prefer to credit "today" so today's bar moves; fall back to due day otherwise.
        // Users can move the credit later by editing the date — we credit today for simplicity.
        void dueKey;
        nextEntries[target] = {
          ...existing,
          completedAssignments: [
            ...(existing.completedAssignments ?? []),
            id,
          ],
        };
      }

      return { ...s, entries: nextEntries };
    });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.threads || !parsed.entries) {
          alert('That file does not look like a progress-tracker export.');
          return;
        }
        if (!confirm('Replace current data with the contents of this file?'))
          return;
        setState(parsed as AppState);
      } catch {
        alert('Could not parse that file.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="relative min-h-screen">
      <header className="relative z-10 border-b border-line bg-paper/85 backdrop-blur sticky top-0">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-9 h-9 rounded-xl bg-ink flex items-center justify-center shadow-card">
              <div className="w-3.5 h-3.5 rounded-md bg-teal-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-200" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold text-ink leading-none">
                Progress Tracker
              </h1>
              <p className="text-[11px] text-ink-faint mt-1 leading-none tabular-nums">
                {formatDatePretty(dateKey)} · Week of {weekRange.text}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <input
                type="date"
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
                className="field !py-1 !text-xs !w-auto"
              />
              <button
                onClick={() => setDateKey(todayKey())}
                className="btn-ghost"
              >
                Today
              </button>
            </div>
            <button onClick={() => setSettingsOpen(true)} className="btn">
              Settings
            </button>
            <button onClick={exportJson} className="btn" title="Download JSON backup">
              Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn"
              title="Restore from JSON backup"
            >
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 pt-10 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6 md:gap-10 items-center">
          <div>
            <div className="chip mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Tracking {summary.total} threads · live
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink leading-[1.05]">
              Small days.<br />
              <span className="bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">
                Loud weeks.
              </span>
            </h2>
            <p className="text-sm text-ink-muted mt-3 max-w-md leading-relaxed">
              Write what you did. The parser tags it. The bars fill themselves.
              Every day pushes its share of the weekly goal.
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-2 text-ink-muted">
                <span className="text-teal-700 font-semibold tabular-nums">
                  {summary.dayHit}/{summary.total}
                </span>
                <span>daily goals hit</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-line2" />
              <div className="inline-flex items-center gap-2 text-ink-muted">
                <span className="text-teal-700 font-semibold tabular-nums">
                  {summary.weekHit}/{summary.total}
                </span>
                <span>weekly goals hit</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6 justify-center md:justify-end">
            <RingStat label="Today" pct={summary.dayAvgPct} size={132} />
            <RingStat label="Week" pct={summary.weekAvgPct} size={132} />
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-5 pb-12 grid grid-cols-1 lg:grid-cols-[1.1fr,1fr] gap-5">
        <section className="space-y-5">
          <DayEditor threads={activeThreads} entry={entry} onChange={upsertEntry} />
          <AssignmentsPanel
            state={state}
            onSetAssignments={setAssignments}
            onSetLastSync={setLastSync}
            onSetProxyUrl={setProxyUrl}
            onSetIcalUrl={setIcalUrl}
            onToggleComplete={toggleAssignmentComplete}
            onAddManual={addManualAssignment}
          />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
          {activeThreads.map((t) => (
            <ThreadCard key={t.id} state={state} thread={t} />
          ))}
        </section>
      </main>

      <footer className="relative z-10 border-t border-line bg-paper/70">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between text-xs text-ink-faint">
          <span>Local-first. Data lives in your browser.</span>
          <span className="font-mono">
            {state.threads.length} threads · {Object.keys(state.entries).length} entries
          </span>
        </div>
      </footer>

      {settingsOpen && (
        <Settings
          state={state}
          onClose={() => setSettingsOpen(false)}
          onChange={updateThreads}
        />
      )}
    </div>
  );
}

function RingStat({
  label,
  pct,
  size = 120,
}: {
  label: string;
  pct: number;
  size?: number;
}) {
  const filled = pct >= 100;
  return (
    <Ring pct={pct} size={size} stroke={10} label={label}>
      <div className="flex items-baseline">
        <span
          className={`text-3xl font-semibold tabular-nums leading-none ${
            filled ? 'text-teal-700' : 'text-ink'
          }`}
        >
          {pct}
        </span>
        <span className="text-sm text-ink-muted">%</span>
      </div>
    </Ring>
  );
}

export default App;
