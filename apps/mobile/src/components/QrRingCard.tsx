import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { tokens } from '../theme/tokens';
import { QrPattern } from './QrPattern';

type Props = {
  /** Total available width on the screen (the card stretches to it). */
  width: number;
  /** Show the small "Check-in QR · 28s" header inside the card. Default true. */
  showHeader?: boolean;
  /** Show the "Show this at the door" subtitle. Default true. */
  showFooter?: boolean;
  /** Card background — white in B1, near-black in A8. */
  cardBackground?: string;
  /** QR cell color. */
  cellColor?: string;
  /** Color of the unfilled portion of the ring. */
  trackColor?: string;
  /** Color of the progress portion of the ring. */
  progressColor?: string;
  /** Total tick interval in seconds. Default 30. */
  total?: number;
  /** Footer text. */
  footerLabel?: string;
  /** Outer wrapper style. */
  style?: ViewStyle;
  /** Label for the small header on top-left. */
  headerLabel?: string;
  /** Pad applied around the QR within the ring; controls how big the QR is. */
  qrInset?: number;
  /** Stroke width for the ring. */
  strokeWidth?: number;
  /** When true, header text uses the dark/inverted treatment. */
  darkHeader?: boolean;
};

const RADIUS = 96; // matches viewBox 0..200, r=96
const CIRC = 2 * Math.PI * RADIUS;

export function QrRingCard({
  width,
  showHeader = true,
  showFooter = true,
  cardBackground = tokens.color.surface,
  cellColor = tokens.color.fg,
  trackColor = '#f3f1ee',
  progressColor = tokens.color.accent,
  total = 30,
  footerLabel = 'Show this at the door',
  style,
  headerLabel = 'Check-in QR',
  qrInset = 18,
  strokeWidth = 4,
  darkHeader = false,
}: Props) {
  const [t, setT] = useState(28);

  useEffect(() => {
    const id = setInterval(() => {
      setT((prev) => (prev > 0 ? prev - 1 : total));
    }, 1000);
    return () => clearInterval(id);
  }, [total]);

  const offset = useMemo(() => CIRC * (1 - t / total), [t, total]);

  // The QR is sized so it fits inside the ring with `qrInset` padding all around.
  const ringSize = width - 0; // square
  const qrSize = ringSize - qrInset * 2;

  return (
    <View style={[styles.card, { backgroundColor: cardBackground, width }, style]}>
      {showHeader ? (
        <View style={styles.header}>
          <Text
            style={[
              styles.headerLabel,
              { color: darkHeader ? 'rgba(255,255,255,0.5)' : tokens.color.fgMuted },
            ]}
          >
            {headerLabel}
          </Text>
          <Text
            style={[
              styles.headerCount,
              { color: darkHeader ? '#fff' : tokens.color.fg },
            ]}
          >
            {t}s
          </Text>
        </View>
      ) : null}

      <View style={[styles.ringWrap, { width: ringSize, height: ringSize }]}>
        <Svg
          width={ringSize}
          height={ringSize}
          viewBox="0 0 200 200"
          style={[styles.ring, { transform: [{ rotate: '-90deg' }] }]}
        >
          <Circle cx={100} cy={100} r={RADIUS} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={100}
            cy={100}
            r={RADIUS}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
        </Svg>
        <View style={styles.qrInner}>
          <QrPattern
            size={qrSize}
            background={cardBackground === tokens.color.night ? '#fff' : cardBackground}
            cellColor={cellColor === tokens.color.fg ? tokens.color.fg : cellColor}
            radius={14}
          />
        </View>
      </View>

      {showFooter ? (
        <Text
          style={[
            styles.footer,
            { color: darkHeader ? 'rgba(255,255,255,0.5)' : tokens.color.fgMuted },
          ]}
        >
          {footerLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerCount: {
    fontFamily: tokens.font.mono,
    fontSize: 12,
  },
  ringWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  qrInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
  },
});
