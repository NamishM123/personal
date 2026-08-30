import { useMemo, useState } from 'react';
import type { AppState, Thread } from '../types';
import { todayKey } from '../lib/date';
import { dailyGoal, dayTotal } from '../lib/progress';

interface Props {
  state: AppState;
  activeDate: string;
  onSelectDate: (dateKey: string) => void;
}

function keyFor(y: number, mIdx: number, d: number): string {
  const m = String(mIdx + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function dayCompletionPct(state: AppState, threads: Thread[], dateKey: string): number {
  if (threads.length === 0) return 0;
  const sum = threads.reduce((acc, t) => {
    const g = dailyGoal(t);
    if (g <= 0) return acc;
    const d = dayTotal(state, t.id, dateKey);
    return acc + Math.min(1, d / g);
  }, 0);
  return Math.round((sum / threads.length) * 100);
}

/**
 * Compact month calendar. Each cell is a day, tinted by average daily
 * completion (0..100 %). A saved day gets a check-mark dot. Click a cell
 * to jump to it. Arrows step month.
 */
export function Calendar({ state, activeDate, onSelectDate }: Props) {
  const [{ year, month }, setYm] = useState(() => {
    const [y, m] = todayKey().split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  const today = todayKey();

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const dow = (first.getDay() + 6) % 7; // Mon = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: { key?: string; d?: number; pct?: number; saved?: boolean }[] = [];
    for (let i = 0; i < dow; i++) list.push({});
    for (let d = 1; d <= daysInMonth; d++) {
      const k = keyFor(year, month, d);
      const entry = state.entries[k];
      const pct = entry ? dayCompletionPct(state, state.threads, k) : 0;
      list.push({ key: k, d, pct, saved: Boolean(entry?.savedAt) });
    }
    while (list.length % 7 !== 0) list.push({});
    return list;
  }, [year, month, state]);

  const label = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  function step(delta: number) {
    setYm(({ year: y, month: m }) => {
      const next = new Date(y, m + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  function goToday() {
    const [y, m] = todayKey().split('-').map(Number);
    setYm({ year: y, month: m - 1 });
    onSelectDate(todayKey());
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <span className="inline-block w-1 h-4 rounded-full bg-teal-500" />
            Calendar
          </h2>
          <p className="text-[11px] text-ink-faint mt-0.5 tabular-nums">
            {label}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="btn-ghost !px-2 !py-1 text-sm"
            onClick={() => step(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            className="btn-ghost !px-2 !py-1 text-xs"
            onClick={goToday}
          >
            Today
          </button>
          <button
            className="btn-ghost !px-2 !py-1 text-sm"
            onClick={() => step(1)}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div
            key={i}
            className="text-[9px] uppercase tracking-wider text-ink-faint text-center py-1 font-semibold"
          >
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          if (!c.key) return <div key={i} className="h-9" />;
          const isActive = c.key === activeDate;
          const isToday = c.key === today;
          const pct = c.pct ?? 0;
          // Teal ramp from 0 (transparent) to 100
          const alpha = Math.min(0.85, 0.08 + (pct / 100) * 0.77);
          const bg =
            pct > 0
              ? `rgba(30, 195, 192, ${alpha.toFixed(2)})`
              : 'transparent';
          return (
            <button
              key={i}
              onClick={() => onSelectDate(c.key!)}
              className={`relative h-9 rounded-md text-xs tabular-nums transition
                ${isActive ? 'ring-2 ring-ink' : 'ring-1 ring-inset ring-line hover:ring-line2'}
              `}
              style={{ backgroundColor: bg }}
              title={`${c.key} · ${pct}% ${c.saved ? '· saved' : ''}`}
            >
              <span
                className={`absolute inset-0 flex items-center justify-center ${
                  pct >= 50 ? 'text-white font-semibold' : 'text-ink-muted'
                } ${isToday ? 'underline underline-offset-2' : ''}`}
              >
                {c.d}
              </span>
              {c.saved && (
                <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-teal-700 ring-1 ring-white" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 text-[10px] text-ink-faint">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm ring-1 ring-inset ring-line" />
          <span>low</span>
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(30,195,192,0.4)' }} />
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(30,195,192,0.85)' }} />
          <span>high</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-700" />
          <span>saved day</span>
        </div>
      </div>
    </div>
  );
}
