interface Props {
  values: number[]; // length 7, Mon..Sun
  dailyGoal: number;
  color: string;
  todayIndex: number;
}

/**
 * 7-day contribution strip. Height per bar encodes value relative to the
 * daily goal; a filled bar means the goal was hit. The bar for "today"
 * gets a highlighted underline.
 */
export function WeekStrip({ values, dailyGoal, color, todayIndex }: Props) {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="grid grid-cols-7 gap-1 mt-3">
      {values.map((v, i) => {
        const pct = dailyGoal > 0 ? Math.max(0, Math.min(1, v / dailyGoal)) : 0;
        const hit = pct >= 1;
        const isToday = i === todayIndex;
        const isFuture = i > todayIndex;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-full h-8 relative rounded-md bg-neutral-100/80 overflow-hidden ring-1 ring-inset ring-line">
              <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                style={{
                  height: `${pct * 100}%`,
                  background: hit
                    ? `linear-gradient(180deg, ${color}, ${color})`
                    : `linear-gradient(180deg, ${color}cc, ${color}66)`,
                  opacity: isFuture ? 0.25 : 1,
                }}
              />
              {isToday && (
                <div
                  className="absolute inset-x-0 bottom-0 h-px"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>
            <span
              className={`text-[9px] tabular-nums ${
                isToday ? 'font-semibold text-ink' : 'text-ink-faint'
              }`}
            >
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
