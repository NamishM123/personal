interface Props {
  value: number;
  goal: number;
  color: string;
  markers?: number[]; // percentages, 0..100
  height?: number;
}

/**
 * Thin, glassy progress track with rounded caps, a subtle gradient fill,
 * ambient glow on completion, and optional milestone tick marks.
 */
export function ProgressBar({
  value,
  goal,
  color,
  markers = [25, 50, 75],
  height = 6,
}: Props) {
  const pct = goal > 0 ? Math.max(0, Math.min(100, (value / goal) * 100)) : 0;
  const filled = pct >= 100;
  const gradId = `bar-${color.replace('#', '')}`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        width="100%"
        height={height}
        className="block overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
          <filter id={`${gradId}-glow`}>
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <rect
          x="0"
          y="0"
          width="100%"
          height={height}
          rx={height / 2}
          fill="rgba(9,27,46,0.06)"
        />

        {/* Milestone ticks (recessive) */}
        {markers.map((m) => (
          <rect
            key={m}
            x={`${m}%`}
            y="0"
            width="1"
            height={height}
            fill="rgba(9,27,46,0.14)"
          />
        ))}

        {/* Fill */}
        <rect
          x="0"
          y="0"
          width={`${pct}%`}
          height={height}
          rx={height / 2}
          fill={`url(#${gradId})`}
          style={{
            transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
            filter: filled ? `url(#${gradId}-glow)` : undefined,
          }}
        />

        {/* Leading dot at the end of the fill */}
        {pct > 2 && pct < 100 && (
          <circle
            cx={`${pct}%`}
            cy={height / 2}
            r={height / 2}
            fill="#fff"
            stroke={color}
            strokeWidth="1.5"
            style={{ transition: 'cx 700ms cubic-bezier(0.16,1,0.3,1)' }}
          />
        )}
      </svg>
    </div>
  );
}
