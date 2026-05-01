import { cn } from "@/lib/utils";

const palette = [
  "bg-amber-soft text-fg",
  "bg-cat-pilates text-info",
  "bg-cat-cardio text-good",
  "bg-cat-strength text-info",
  "bg-cat-cross text-bad",
  "bg-cat-pt text-bad",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  name,
  size = 32,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts[parts.length - 1] ?? "";
  const initials =
    parts.length >= 2 && first[0] && last[0]
      ? (first[0] + last[0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  const tone = palette[hash(name) % palette.length];
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold leading-none",
        tone,
        className,
      )}
    >
      {initials}
    </span>
  );
}
