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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-3">Tag selection</h3>
        <div className="mb-4 p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 text-sm text-neutral-300 italic max-h-28 overflow-y-auto">
          "{selectedText}"
        </div>

        <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
          Thread
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setThreadId(t.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                t.id === threadId
                  ? 'border-transparent text-neutral-950 font-semibold'
                  : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'
              }`}
              style={t.id === threadId ? { backgroundColor: t.color } : undefined}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                style={{ backgroundColor: t.color }}
              />
              {t.name}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
          Amount {thread ? `(${thread.unit})` : ''}
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
          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 focus:border-neutral-500 focus:outline-none text-neutral-100"
        />

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm rounded-lg text-neutral-300 hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 text-sm rounded-lg bg-neutral-100 text-neutral-950 font-semibold hover:bg-white disabled:opacity-40"
            disabled={!thread || !amount || parseFloat(amount) <= 0}
          >
            Add tag
          </button>
        </div>
      </div>
    </div>
  );
}
