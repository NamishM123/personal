import { useEffect, useRef, useState } from 'react';
import type { Thread } from '../types';

interface Props {
  threads: Thread[];
  selectedText: string;
  onCancel: () => void;
  onSubmit: (threadId: string, amount: number) => void;
}

export function TagModal({ threads, selectedText, onCancel, onSubmit }: Props) {
  const [threadId, setThreadId] = useState(threads[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const thread = threads.find((t) => t.id === threadId);

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);

  function submit() {
    const n = parseFloat(amount);
    if (!thread || Number.isNaN(n) || n <= 0) return;
    onSubmit(thread.id, n);
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="card p-6 w-full max-w-md shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-ink">Tag selection</h3>
            <p className="text-xs text-ink-faint mt-0.5">
              Assign the highlighted text to a thread.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="btn-ghost !px-1.5 !py-1 text-lg leading-none -mt-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-paper border border-line text-sm text-ink-muted italic max-h-28 overflow-y-auto font-mono">
          "{selectedText}"
        </div>

        <label className="block text-[11px] uppercase tracking-wider text-ink-faint mb-2 font-semibold">
          Thread
        </label>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {threads.map((t) => {
            const on = t.id === threadId;
            return (
              <button
                key={t.id}
                onClick={() => setThreadId(t.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  on
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink-muted border-line hover:border-line2 hover:text-ink'
                }`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                {t.name}
              </button>
            );
          })}
        </div>

        <label className="block text-[11px] uppercase tracking-wider text-ink-faint mb-2 font-semibold">
          Amount{' '}
          <span className="text-ink-faint/70 font-normal normal-case">
            {thread ? `(${thread.unit})` : ''}
          </span>
        </label>
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder={
            thread?.unit === 'minutes'
              ? 'e.g. 45'
              : thread?.unit === 'percent'
                ? '0 – 100'
                : 'e.g. 3'
          }
          className="field"
        />

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={submit}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!thread || !amount || parseFloat(amount) <= 0}
          >
            Add tag
            <span className="kbd ml-1 !bg-white/10 !text-white/80 !border-white/20 !shadow-none">
              ↵
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
