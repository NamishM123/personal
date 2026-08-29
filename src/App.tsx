import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import type { AppState, DayEntry, Thread } from './types';
import { loadState, saveState } from './lib/storage';
import { formatDatePretty, todayKey } from './lib/date';
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
        if (
          !confirm('Replace current data with the contents of this file?')
        ) return;
        setState(parsed as AppState);
      } catch {
        alert('Could not parse that file.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 bg-neutral-950/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Progress Tracker</h1>
            <p className="text-xs text-neutral-500">{formatDatePretty(dateKey)}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sm"
            />
            <button
              onClick={() => setDateKey(todayKey())}
              className="text-xs text-neutral-400 hover:text-white px-2"
            >
              Today
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-800 hover:bg-neutral-800"
            >
              Settings
            </button>
            <button
              onClick={exportJson}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-800 hover:bg-neutral-800"
              title="Download JSON backup"
            >
              Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-800 hover:bg-neutral-800"
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

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
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

export default App;
