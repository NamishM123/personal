import { useEffect, useMemo, useRef, useState } from 'react';
import type { DayEntry, Detection, Thread } from '../types';
import { formatAmount } from '../lib/progress';
import { parseNarrative } from '../lib/parse';
import { mergeDetections } from '../lib/merge';
import { isConfigured, llmParse } from '../lib/llm';

interface Props {
  threads: Thread[];
  entry: DayEntry;
  onChange: (entry: DayEntry) => void;
}

function narrativeHash(s: string): string {
  // Cheap stable hash so we can cache LLM output per narrative version.
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `h${h}`;
}

export function DayEditor({ threads, entry, onChange }: Props) {
  const [text, setText] = useState(entry.narrative);
  const dirtyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const [llmStatus, setLlmStatus] = useState<'idle' | 'thinking' | 'done'>('idle');

  useEffect(() => {
    if (!dirtyRef.current) setText(entry.narrative);
  }, [entry.narrative, entry.date]);

  // Debounced commit of narrative
  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = window.setTimeout(() => {
      onChange({ ...entry, narrative: text });
      dirtyRef.current = false;
    }, 120);
    return () => window.clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced LLM parse (only when configured)
  useEffect(() => {
    if (!isConfigured()) {
      setLlmStatus('idle');
      return;
    }
    const trimmed = text.trim();
    const hash = narrativeHash(trimmed);
    if (!trimmed) {
      setLlmStatus('idle');
      return;
    }
    if (entry.llmCache?.hash === hash) {
      setLlmStatus('done');
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLlmStatus('thinking');
    const t = window.setTimeout(async () => {
      try {
        const detections = await llmParse(trimmed, threads, ctrl.signal);
        if (ctrl.signal.aborted) return;
        onChange({
          ...entry,
          narrative: text,
          llmCache: { hash, detections },
        });
        dirtyRef.current = false;
        setLlmStatus('done');
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          // eslint-disable-next-line no-console
          console.warn(err);
        }
        setLlmStatus('idle');
      }
    }, 700);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [text, entry.date]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissed = useMemo(() => new Set(entry.dismissed ?? []), [entry.dismissed]);
  const detections: Detection[] = useMemo(() => {
    const rules = parseNarrative(text, threads);
    const cached =
      entry.llmCache?.hash === narrativeHash(text.trim())
        ? entry.llmCache.detections
        : [];
    return mergeDetections(rules, cached).filter((d) => !dismissed.has(d.key));
  }, [text, threads, dismissed, entry.llmCache]);

  function threadById(id: string): Thread | undefined {
    return threads.find((t) => t.id === id);
  }

  function dismiss(key: string) {
    onChange({
      ...entry,
      narrative: text,
      dismissed: [...(entry.dismissed ?? []), key],
    });
    dirtyRef.current = false;
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const chipTint =
    detections.length > 0 ? '!border-teal-500/40 !text-teal-700 !bg-teal-50' : '';

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <span className="inline-block w-1 h-4 rounded-full bg-teal-500" />
            Journal
          </h2>
          <p className="text-xs text-ink-faint mt-0.5">
            Write what you did. Bars update automatically.
          </p>
        </div>
        <div className="text-[11px] text-ink-faint tabular-nums flex items-center gap-2">
          <span>{words} words</span>
          <span className={`inline-flex items-center gap-1 chip !py-0.5 ${chipTint}`}>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                detections.length > 0
                  ? 'bg-teal-500 animate-pulse'
                  : 'bg-neutral-400'
              }`}
            />
            {detections.length} detected
          </span>
          {isConfigured() && (
            <span
              className={`inline-flex items-center gap-1 chip !py-0.5 ${
                llmStatus === 'thinking'
                  ? '!border-amber-400/40 !text-amber-700 !bg-amber-50'
                  : llmStatus === 'done'
                    ? '!border-teal-500/40 !text-teal-700 !bg-teal-50'
                    : ''
              }`}
              title="Groq LLM extraction"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  llmStatus === 'thinking'
                    ? 'bg-amber-500 animate-pulse'
                    : llmStatus === 'done'
                      ? 'bg-teal-500'
                      : 'bg-neutral-400'
                }`}
              />
              Groq {llmStatus === 'thinking' ? '…' : llmStatus === 'done' ? '✓' : ''}
            </span>
          )}
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          dirtyRef.current = true;
          setText(e.target.value);
        }}
        onBlur={() => {
          if (dirtyRef.current) {
            onChange({ ...entry, narrative: text });
            dirtyRef.current = false;
          }
        }}
        placeholder="Today I went to the gym for 45 minutes, cooked pasta, applied to 8 jobs, and hung out with friends for a couple hours…"
        className="field !p-4 min-h-[240px] resize-y leading-relaxed text-[15px]"
        spellCheck
      />

      {detections.length > 0 ? (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider text-ink-faint font-semibold">
              Detected in this entry
            </div>
            <div className="text-[11px] text-ink-faint tabular-nums">
              {detections.length}
            </div>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {detections.map((d) => {
              const t = threadById(d.threadId);
              if (!t) return null;
              const isLlm = d.key.startsWith('llm:');
              return (
                <li
                  key={d.key}
                  className="group inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full border border-line bg-white text-xs hover:border-line2 transition"
                  title={d.text + (isLlm ? ' (via Groq)' : '')}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: t.color,
                      boxShadow: `0 0 0 3px ${t.color}1a`,
                    }}
                  />
                  <span className="font-semibold text-ink">{t.name}</span>
                  <span className="text-ink-muted tabular-nums">
                    +{formatAmount(d.amount, t.unit)}
                  </span>
                  {isLlm && (
                    <span className="text-[9px] text-amber-700 font-semibold uppercase tracking-wider">
                      AI
                    </span>
                  )}
                  <button
                    onClick={() => dismiss(d.key)}
                    className="ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded-full text-ink-faint hover:text-red-500 hover:bg-red-50 transition"
                    title="Dismiss"
                    aria-label="Dismiss detection"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-ink-faint mt-2">
            Wrong reading? Dismiss the chip or rephrase the sentence. Dismissed chips stay dismissed for this day.
          </p>
        </div>
      ) : text.trim() ? (
        <div className="mt-5 p-3 rounded-lg border border-dashed border-line text-xs text-ink-faint">
          Nothing detected yet. Try naming an activity, e.g. <b>gym</b>, <b>leetcode</b>, <b>cooked</b>, <b>class</b>, or <b>applied</b>, with an amount like <span className="font-mono">45 min</span> or <span className="font-mono">3</span>.
        </div>
      ) : null}
    </div>
  );
}
