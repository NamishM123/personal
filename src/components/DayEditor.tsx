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
  const [flash, setFlash] = useState<string | null>(null);

  function openTagModal() {
    const el = textareaRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const chunk = value.slice(start, end).trim();
    if (!chunk) {
      setFlash('Select text in your entry first.');
      setTimeout(() => setFlash(null), 2200);
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
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <span className="inline-block w-1 h-4 rounded-full bg-teal-500" />
            Journal
          </h2>
          <p className="text-xs text-ink-faint mt-0.5">
            Write freely. Select a phrase and tag it to a thread.
          </p>
        </div>
        <button onClick={openTagModal} className="btn-primary">
          Tag selection
          <span className="kbd ml-1 !bg-white/10 !text-white/80 !border-white/20 !shadow-none">
            T
          </span>
        </button>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={entry.narrative}
          onChange={(e) => updateNarrative(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't') {
              e.preventDefault();
              openTagModal();
            }
          }}
          placeholder="Today I went to the gym for 45 minutes, cooked pasta, applied to 8 jobs, and hung out with friends for a couple hours…"
          className="field !p-4 min-h-[220px] resize-y leading-relaxed text-[15px]"
        />
        {flash && (
          <div className="absolute bottom-3 left-3 right-3 text-xs px-3 py-2 rounded-md bg-ink text-white shadow-pop">
            {flash}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
        <span>
          Tip: select text, press{' '}
          <span className="kbd">⌘</span>
          <span className="kbd ml-1">T</span> to tag.
        </span>
        <span className="tabular-nums">
          {entry.narrative.trim() ? entry.narrative.trim().split(/\s+/).length : 0} words
        </span>
      </div>

      {entry.tags.length > 0 && (
        <>
          <div className="divider my-5" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wider text-ink-faint font-semibold">
                Tags on this day
              </div>
              <div className="text-xs text-ink-faint tabular-nums">
                {entry.tags.length}
              </div>
            </div>
            <ul className="space-y-1.5">
              {entry.tags.map((t) => {
                const thread = threadById(state.threads, t.threadId);
                if (!thread) return null;
                return (
                  <li
                    key={t.id}
                    className="group flex items-start justify-between gap-3 text-sm p-2.5 rounded-lg border border-line bg-paper hover:bg-white hover:border-line2 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: thread.color }}
                        />
                        <span className="font-semibold text-ink">
                          {thread.name}
                        </span>
                        <span className="text-ink-muted tabular-nums">
                          · {formatAmount(t.amount, thread.unit)}
                        </span>
                      </div>
                      <div className="text-ink-muted text-xs italic truncate font-mono">
                        "{t.text}"
                      </div>
                    </div>
                    <button
                      onClick={() => removeTag(t.id)}
                      className="text-xs text-ink-faint hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition"
                      title="Remove tag"
                    >
                      remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
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
