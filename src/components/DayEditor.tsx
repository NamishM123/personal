import { useRef, useState } from 'react';
import type { AppState, DayEntry, Tag, Thread } from '../types';
import { formatAmount } from '../lib/progress';
import { TagModal } from './TagModal';

interface Props {
  state: AppState;
  dateKey: string;
  onChangeEntry: (entry: DayEntry) => void;
}

function threadById(threads: Thread[], id: string): Thread | undefined {
  return threads.find((t) => t.id === id);
}

export function DayEditor({ state, dateKey, onChangeEntry }: Props) {
  const entry: DayEntry = state.entries[dateKey] ?? {
    date: dateKey,
    narrative: '',
    tags: [],
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selected, setSelected] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);

  function openTagModal() {
    const el = textareaRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const chunk = value.slice(start, end).trim();
    if (!chunk) {
      alert('Select some text in your entry first, then click "Tag selection".');
      return;
    }
    setSelected(chunk);
    setModalOpen(true);
  }

  function addTag(threadId: string, amount: number) {
    const tag: Tag = {
      id: crypto.randomUUID(),
      threadId,
      text: selected,
      amount,
    };
    onChangeEntry({ ...entry, tags: [...entry.tags, tag] });
    setModalOpen(false);
    setSelected('');
  }

  function removeTag(id: string) {
    onChangeEntry({ ...entry, tags: entry.tags.filter((t) => t.id !== id) });
  }

  function updateNarrative(value: string) {
    onChangeEntry({ ...entry, narrative: value });
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Journal</h2>
        <button
          onClick={openTagModal}
          className="px-3 py-1.5 text-sm rounded-lg bg-neutral-100 text-neutral-950 font-semibold hover:bg-white"
        >
          Tag selection
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={entry.narrative}
        onChange={(e) => updateNarrative(e.target.value)}
        placeholder="Today I went to the gym for 45 minutes, cooked pasta, applied to 8 jobs, and hung out with friends for a couple hours…"
        className="w-full min-h-[180px] p-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-neutral-600 focus:outline-none text-neutral-100 resize-y leading-relaxed"
      />

      <p className="text-xs text-neutral-500 mt-2">
        Select any portion of your entry, then click <b>Tag selection</b> to
        attribute it to a thread with an amount.
      </p>

      {entry.tags.length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Tags on this day
          </div>
          <ul className="space-y-1.5">
            {entry.tags.map((t) => {
              const thread = threadById(state.threads, t.threadId);
              if (!thread) return null;
              return (
                <li
                  key={t.id}
                  className="flex items-start justify-between gap-3 text-sm p-2 rounded-lg bg-neutral-950/60 border border-neutral-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: thread.color }}
                      />
                      <span className="font-medium text-neutral-200">
                        {thread.name}
                      </span>
                      <span className="text-neutral-400">
                        · {formatAmount(t.amount, thread.unit)}
                      </span>
                    </div>
                    <div className="text-neutral-400 text-xs italic truncate">
                      "{t.text}"
                    </div>
                  </div>
                  <button
                    onClick={() => removeTag(t.id)}
                    className="text-xs text-neutral-500 hover:text-red-400 shrink-0"
                    title="Remove tag"
                  >
                    remove
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {modalOpen && (
        <TagModal
          threads={state.threads}
          selectedText={selected}
          onCancel={() => setModalOpen(false)}
          onSubmit={addTag}
        />
      )}
    </div>
  );
}
