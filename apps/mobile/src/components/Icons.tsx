import Svg, { Circle, Path, SvgProps } from 'react-native-svg';

type IconProps = SvgProps & { size?: number; color?: string; strokeWidth?: number };

const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const });

export function HomeIcon({ size = 22, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-7h6v7h3a1 1 0 001-1V10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ size = 22, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CardIcon({ size = 22, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PersonIcon({ size = 22, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M5.5 21a8.38 8.38 0 0113 0M12 13a4 4 0 100-8 4 4 0 000 8z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 14, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M19 9l-7 7-7-7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 16, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M9 5l7 7-7 7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BackIcon({ size = 22, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size = 22, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PhoneIcon({ size = 22, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M12 18.5v.01M8 3h8a2 2 0 012 2v14a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2zM3 9v2M3 13v2M21 9v2M21 13v2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function QrIcon({ size = 22, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h3m4 0v3m0 4v-1m-4 1v-3m0 0h4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HeartIcon({ size = 18, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MapPinIcon({ size = 12, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 64, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M8 12.5l3 3 5-6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HelpIcon({ size = 20, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChatIcon({ size = 20, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DocIcon({ size = 20, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6a2 2 0 011.4.6L18.4 8a2 2 0 01.6 1.4V19a2 2 0 01-2 2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LockIcon({ size = 20, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M12 15v2m0-13a7 7 0 00-7 7v3a2 2 0 002 2h2v-5H7a5 5 0 0110 0h-2v5h2a2 2 0 002-2v-3a7 7 0 00-7-7z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShareIcon({ size = 16, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DumbbellIcon({ size = 22, color = 'currentColor', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M6 4v16M18 4v16M6 8H4a1 1 0 00-1 1v6a1 1 0 001 1h2M18 8h2a1 1 0 011 1v6a1 1 0 01-1 1h-2M6 12h12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
