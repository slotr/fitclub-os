import type { ComponentProps } from "react";

type Props = ComponentProps<"svg">;

const stroke = {
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} satisfies Props;

export function HomeIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-7h6v7h3a1 1 0 001-1V10" />
    </svg>
  );
}
export function UsersIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M5.5 21a8.38 8.38 0 0113 0M12 13a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  );
}
export function CheckCircleIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
export function CalendarIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </svg>
  );
}
export function BuildingIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M17 20h5V10l-7-7-7 7v10h5m4 0v-7H10v7" />
    </svg>
  );
}
export function ActivityIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  );
}
export function CardIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
  );
}
export function BellIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14V11a6 6 0 10-12 0v3a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
    </svg>
  );
}
export function ChartBarIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M9 19V13M15 19V9M3 19h18M3 19V5" />
    </svg>
  );
}
export function FileIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
    </svg>
  );
}
export function GearIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M10.3 3.6a1.5 1.5 0 013.4 0l.2 1a8 8 0 014.5 2.5l1-.4a1.5 1.5 0 011.7 2.4l-.7.7a8 8 0 010 5.4l.7.7a1.5 1.5 0 01-1.7 2.4l-1-.4a8 8 0 01-4.5 2.5l-.2 1a1.5 1.5 0 01-3.4 0l-.2-1a8 8 0 01-4.5-2.5l-1 .4a1.5 1.5 0 01-1.7-2.4l.7-.7a8 8 0 010-5.4L1.9 9.1a1.5 1.5 0 011.7-2.4l1 .4a8 8 0 014.5-2.5l.2-1zM12 15a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  );
}
export function SearchIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
export function PlusIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function ArrowUpIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
export function ArrowDownIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}
export function ChevronRightIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
export function MoreVerticalIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}
export function QrIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3M21 21v-4M14 21v-4" />
    </svg>
  );
}
export function TrophyIcon(p: Props) {
  return (
    <svg {...stroke} {...p}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 1 1-10 0V4Z" />
      <path d="M17 4h3v3a3 3 0 0 1-3 3" />
      <path d="M7 4H4v3a3 3 0 0 0 3 3" />
    </svg>
  );
}
