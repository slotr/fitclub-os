type Props = {
  values: number[];
  className?: string;
  height?: number;
  stroke?: string;
  fillId?: string;
};

export function AreaChart({
  values,
  className,
  height = 180,
  stroke = "var(--accent-amber)",
  fillId = "areaFill",
}: Props) {
  if (values.length < 2) return null;
  const w = 360;
  const h = height;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = h - 30 - ((v - min) / range) * (h - 60);
    return [x, y] as const;
  });
  const linePath = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? [0, h];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={2} />
      <circle cx={last[0]} cy={last[1]} r={4} fill={stroke} />
    </svg>
  );
}
