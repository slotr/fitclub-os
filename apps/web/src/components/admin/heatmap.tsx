type Props = {
  values: number[][]; // rows × cols
  className?: string;
};

export function Heatmap({ values, className }: Props) {
  const rows = values.length;
  const cols = values[0]?.length ?? 0;
  const max = Math.max(1, ...values.flat());
  const cellW = 16;
  const cellH = 18;
  const gap = 2;
  const left = 18;
  const top = 4;
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const w = left + cols * (cellW + gap) - gap + 4;
  const h = top + rows * (cellH + gap) + 18;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ width: "100%", height: 180 }}
    >
      {days.slice(0, rows).map((d, r) => (
        <text
          key={r}
          x={0}
          y={top + r * (cellH + gap) + cellH * 0.7}
          fontSize="9"
          fill="#6b7280"
        >
          {d}
        </text>
      ))}
      {values.map((row, r) =>
        row.map((v, c) => {
          const a = Math.max(0.06, Math.min(0.95, v / max));
          return (
            <rect
              key={`${r}-${c}`}
              x={left + c * (cellW + gap)}
              y={top + r * (cellH + gap)}
              width={cellW}
              height={cellH}
              rx={3}
              fill={`rgba(245,158,11,${a.toFixed(2)})`}
            />
          );
        }),
      )}
      {Array.from({ length: cols }).map((_, c) =>
        c % 2 === 0 ? (
          <text
            key={c}
            x={left + c * (cellW + gap) + 1}
            y={top + rows * (cellH + gap) + 12}
            fontSize="8"
            fill="#9ca3af"
          >
            {7 + c}
          </text>
        ) : null,
      )}
    </svg>
  );
}
