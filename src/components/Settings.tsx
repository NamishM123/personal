import { useState } from 'react';
import type { AppState, Thread, Unit } from '../types';

interface Props {
  state: AppState;
  onClose: () => void;
  onChange: (threads: Thread[]) => void;
}

const PALETTE = [
  '#f472b6', '#60a5fa', '#facc15', '#a78bfa', '#34d399',
  '#fb923c', '#ef4444', '#22d3ee', '#84cc16', '#e879f9',
];

export function Settings({ state, onClose, onChange }: Props) {
  const [draft, setDraft] = useState<Thread[]>(state.threads);

  function update(id: string, patch: Partial<Thread>) {
    setDraft(draft.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function remove(id: string) {
    if (draft.length <= 1) return;
    setDraft(draft.filter((t) => t.id !== id));
  }

  function add() {
    const color = PALETTE[draft.length % PALETTE.length];
    setDraft([
      ...draft,
      {
        id: crypto.randomUUID(),
        name: 'New thread',
        unit: 'minutes',
        weeklyGoal: 60,
        color,
      },
    ]);
  }

  function save() {
    onChange(draft);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Threads & weekly goals</h3>

        <div className="space-y-2">
          {draft.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[auto,1fr,110px,110px,auto] gap-2 items-center p-2 rounded-lg border border-neutral-800 bg-neutral-950/40"
            >
              <input
                type="color"
                value={t.color}
                onChange={(e) => update(t.id, { color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-neutral-700"
                title="Color"
              />
              <input
                type="text"
                value={t.name}
                onChange={(e) => update(t.id, { name: e.target.value })}
                className="px-2 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-sm"
              />
              <select
                value={t.unit}
                onChange={(e) => update(t.id, { unit: e.target.value as Unit })}
                className="px-2 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-sm"
              >
                <option value="minutes">minutes</option>
                <option value="count">count</option>
                <option value="percent">percent</option>
              </select>
              <input
                type="number"
                min="0"
                step="any"
                value={t.weeklyGoal}
                onChange={(e) =>
                  update(t.id, { weeklyGoal: parseFloat(e.target.value) || 0 })
                }
                className="px-2 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-sm"
                title="Weekly goal"
              />
              <button
                onClick={() => remove(t.id)}
                className="text-xs text-neutral-500 hover:text-red-400 px-2"
                title="Delete thread"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={add}
          className="mt-3 text-sm text-neutral-300 hover:text-white"
        >
          + Add thread
        </button>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm rounded-lg text-neutral-300 hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 text-sm rounded-lg bg-neutral-100 text-neutral-950 font-semibold hover:bg-white"
          >
            Save
          </button>
        </div>

        <p className="text-xs text-neutral-500 mt-3">
          Removing a thread keeps past tags in your data but hides its bars.
          Columns: color · name · unit · weekly goal.
        </p>
      </div>
    </div>
  );
}
