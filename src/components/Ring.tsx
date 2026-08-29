interface Props {
  pct: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  gradientId?: string;
  gradientFrom?: string;
  gradientTo?: string;
  children?: React.ReactNode;
  label?: string;
}

/**
 * Ring / donut progress indicator. Uses a single circular stroke with a
 * subtle gradient and a soft glow when filled. Follows the dataviz rules:
 * thin mark, rounded caps, recessive track, text lives outside the color.
 */
export function Ring({
  pct,
  size = 120,
  stroke = 10,
  color,
  trackColor = 'rgba(9,27,46,0.08)',
  gradientId,
  gradientFrom = '#52E4DE',
  gradientTo = '#1EC3C0',
  children,
  label,
}: Props) {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = clamped >= 100;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const gid = gradientId ?? `ring-${gradientFrom.replace('#', '')}`;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
          <filter id={`${gid}-glow`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? `url(#${gid})`}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)',
            filter: filled ? `url(#${gid}-glow)` : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
        {label && (
          <div className="text-[10px] uppercase tracking-wider text-ink-faint font-semibold mt-0.5">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
