type Props = {
  values: number[];
  stroke?: string;
  height?: number;
  className?: string;
};

export function Sparkline({
  values,
  stroke = "var(--good)",
  height = 24,
  className,
}: Props) {
  if (values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 100;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = height - ((v - min) / range) * height - 2;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

export function SparkBars({
  values,
  height = 24,
  highlight,
  className,
}: {
  values: number[];
  height?: number;
  highlight?: number; // index to highlight
  className?: string;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values);
  const w = 100;
  const slot = w / values.length;
  const barW = slot * 0.7;
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
    >
      {values.map((v, i) => {
        const h = (v / (max || 1)) * (height - 2);
        const isHi = highlight !== undefined && i === highlight;
        return (
          <rect
            key={i}
            x={i * slot + (slot - barW) / 2}
            y={height - h}
            width={barW}
            height={h}
            fill={isHi ? "var(--fg)" : "#e5e3e0"}
          />
        );
      })}
    </svg>
  );
}
