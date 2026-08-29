interface Props {
  value: number;
  goal: number;
  color: string;
  label?: string;
  right?: string;
}

export function ProgressBar({ value, goal, color, label, right }: Props) {
  const pct = goal > 0 ? Math.max(0, Math.min(100, (value / goal) * 100)) : 0;
  const filled = pct >= 100;
  return (
    <div className="w-full">
      {(label || right) && (
        <div className="flex justify-between text-xs text-neutral-400 mb-1">
          <span>{label}</span>
          <span className={filled ? 'text-emerald-400' : ''}>{right}</span>
        </div>
      )}
      <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
