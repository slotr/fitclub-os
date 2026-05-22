import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { tokens } from '../theme/tokens';

const SIZE = 200;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function RestTimerGauge({
  remainingSec,
  targetSec,
  paused,
  onMinus,
  onPlus,
  onTogglePause,
  onSkip,
}: {
  remainingSec: number;
  targetSec: number;
  paused: boolean;
  onMinus: () => void;
  onPlus: () => void;
  onTogglePause: () => void;
  onSkip: () => void;
}) {
  const progress = targetSec > 0 ? remainingSec / targetSec : 0;
  return (
    <View style={styles.wrap}>
      <View>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            stroke={tokens.color.border} strokeWidth={STROKE} fill="none"
          />
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            stroke={tokens.color.accent} strokeWidth={STROKE} fill="none"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.time}>{fmt(remainingSec)}</Text>
          <Text style={styles.target}>of {fmt(targetSec)}</Text>
        </View>
      </View>
      <View style={styles.ctrl}>
        <Pressable style={styles.btn} onPress={onMinus}>
          <Text style={styles.btnTxt}>-5</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnAmber]}
          onPress={onTogglePause}
        >
          <Text style={styles.btnTxt}>{paused ? '▶' : '⏸'}</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={onPlus}>
          <Text style={styles.btnTxt}>+5</Text>
        </Pressable>
      </View>
      <Pressable onPress={onSkip}>
        <Text style={styles.skip}>Skip rest</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14 },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  time: { fontFamily: tokens.font.sansExtrabold, fontSize: 40, color: tokens.color.fg },
  target: { fontFamily: tokens.font.sans, fontSize: 13, color: tokens.color.fgMuted },
  ctrl: { flexDirection: 'row', gap: 14 },
  btn: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2,
    borderColor: tokens.color.fg, alignItems: 'center', justifyContent: 'center',
  },
  btnAmber: { backgroundColor: tokens.color.accent, borderColor: tokens.color.accent },
  btnTxt: { fontFamily: tokens.font.sansBold, fontSize: 16, color: tokens.color.fg },
  skip: { fontFamily: tokens.font.sansMedium, fontSize: 13, color: tokens.color.fgMuted },
});
