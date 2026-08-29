interface Props {
  value: number;
  goal: number;
  color: string;
  label?: string;
  right?: string;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, goal, color, label, right, size = 'md' }: Props) {
  const pct = goal > 0 ? Math.max(0, Math.min(100, (value / goal) * 100)) : 0;
  const filled = pct >= 100;
  const track = size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div className="w-full">
      {(label || right) && (
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
            {label}
          </span>
          <span
            className={`text-xs tabular-nums ${
              filled ? 'text-teal-700 font-semibold' : 'text-ink-muted'
            }`}
          >
            {right}
          </span>
        </div>
      )}
      <div className={`w-full ${track} bg-neutral-100 rounded-full overflow-hidden ring-1 ring-inset ring-line`}>
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color})`,
            boxShadow: `inset 0 0 0 1px ${color}22`,
          }}
        />
      </div>
    </div>
  );
}
