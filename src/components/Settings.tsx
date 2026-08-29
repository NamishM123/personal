import { useState } from 'react';
import type { AppState, Thread, Unit } from '../types';

interface Props {
  state: AppState;
  onClose: () => void;
  onChange: (threads: Thread[]) => void;
}

const PALETTE = [
  '#52E4DE', '#1EC3C0', '#0F8A88', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F97316', '#F59E0B', '#22C55E', '#EF4444',
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
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-2xl shadow-pop max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-ink">Threads</h3>
            <p className="text-xs text-ink-faint mt-0.5">
              Configure the life threads you track and their weekly goals.
              Daily goal is derived as{' '}
              <span className="font-mono text-ink-muted">weekly ÷ 7</span>.
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

        <div className="rounded-xl border border-line overflow-hidden">
          <div className="grid grid-cols-[36px,1fr,110px,110px,32px] gap-2 items-center px-3 py-2 bg-paper border-b border-line text-[10px] uppercase tracking-wider text-ink-faint font-semibold">
            <span></span>
            <span>Name</span>
            <span>Unit</span>
            <span>Weekly goal</span>
            <span></span>
          </div>
          <div className="divide-y divide-line bg-white">
            {draft.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[36px,1fr,110px,110px,32px] gap-2 items-center px-3 py-2"
              >
                <label className="relative w-7 h-7 rounded-md border border-line overflow-hidden cursor-pointer flex items-center justify-center"
                  style={{ backgroundColor: t.color }}
                  title="Color">
                  <input
                    type="color"
                    value={t.color}
                    onChange={(e) => update(t.id, { color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => update(t.id, { name: e.target.value })}
                  className="field !py-1.5"
                />
                <select
                  value={t.unit}
                  onChange={(e) => update(t.id, { unit: e.target.value as Unit })}
                  className="field !py-1.5"
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
                  className="field !py-1.5 tabular-nums"
                />
                <button
                  onClick={() => remove(t.id)}
                  className="text-ink-faint hover:text-red-500 text-sm w-8 h-8 rounded-md hover:bg-red-50 transition"
                  title="Delete thread"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={add} className="btn mt-3">
          + Add thread
        </button>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn">
            Cancel
          </button>
          <button onClick={save} className="btn-primary">
            Save changes
          </button>
        </div>

        <p className="text-xs text-ink-faint mt-3">
          Removing a thread keeps past tags in your data but hides its bars.
        </p>
      </div>
    </div>
  );
}
