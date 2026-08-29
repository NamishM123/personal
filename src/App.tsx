import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import type { AppState, DayEntry, Thread } from './types';
import { loadState, saveState } from './lib/storage';
import { formatDatePretty, todayKey, weekStart, weekKeys } from './lib/date';
import { dailyGoal, dayTotal, weekTotal } from './lib/progress';
import { ThreadPanel } from './components/ThreadPanel';
import { DayEditor } from './components/DayEditor';
import { Settings } from './components/Settings';

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [dateKey, setDateKey] = useState<string>(() => todayKey());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeThreads = useMemo(() => state.threads, [state.threads]);

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
    const keys = weekKeys();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return { text: `${fmt(start)} – ${fmt(end)}`, keys };
  }, []);

  function upsertEntry(entry: DayEntry) {
    setState((s) => ({
      ...s,
      entries: { ...s.entries, [entry.date]: entry },
    }));
  }

  function updateThreads(threads: Thread[]) {
    setState((s) => ({ ...s, threads }));
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
        if (!confirm('Replace current data with the contents of this file?')) return;
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
            <div className="relative w-8 h-8 rounded-lg bg-ink flex items-center justify-center shadow-card">
              <div className="w-3 h-3 rounded-sm bg-teal-400" />
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

      <div className="relative z-10 max-w-6xl mx-auto px-5 pt-8 pb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="chip mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Tracking {summary.total} threads
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Small days.{' '}
              <span className="text-ink-muted">Loud weeks.</span>
            </h2>
            <p className="text-sm text-ink-muted mt-2 max-w-md">
              Write what you did. Tag it. Watch the bars fill. Every day pushes
              its share of the weekly goal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            <StatTile label="Today" pct={summary.dayAvgPct}
              caption={`${summary.dayHit}/${summary.total} goals hit`} />
            <StatTile label="This week" pct={summary.weekAvgPct}
              caption={`${summary.weekHit}/${summary.total} goals hit`} />
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-5 pb-12 grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-5">
        <section>
          <DayEditor
            state={state}
            dateKey={dateKey}
            onChangeEntry={upsertEntry}
          />
        </section>

        <section className="space-y-3">
          {activeThreads.map((t) => (
            <ThreadPanel key={t.id} state={state} thread={t} />
          ))}
        </section>
      </main>

      <footer className="relative z-10 border-t border-line bg-paper/70">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between text-xs text-ink-faint">
          <span>Local-first. Data lives in your browser.</span>
          <span className="font-mono">
            /{state.threads.length} threads · {Object.keys(state.entries).length} entries
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

function StatTile({
  label,
  pct,
  caption,
}: {
  label: string;
  pct: number;
  caption: string;
}) {
  const filled = pct >= 100;
  return (
    <div className="card p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint font-semibold">
          {label}
        </span>
        <span
          className={`text-lg font-semibold tabular-nums ${
            filled ? 'text-teal-700' : 'text-ink'
          }`}
        >
          {pct}%
        </span>
      </div>
      <div className="mt-2 w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden ring-1 ring-inset ring-line">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: 'linear-gradient(90deg, #52E4DE, #1EC3C0)',
          }}
        />
      </div>
      <div className="text-[11px] text-ink-faint mt-2 tabular-nums">{caption}</div>
    </div>
  );
}

export default App;
