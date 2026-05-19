import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { tokens } from '../theme/tokens';

export type PillTone = 'good' | 'warn' | 'bad' | 'info' | 'dark' | 'outline';

const map: Record<PillTone, { bg: string; fg: string; border?: string }> = {
  good: { bg: tokens.color.goodSoft, fg: tokens.color.goodFg },
  warn: { bg: tokens.color.warnSoft, fg: tokens.color.warnFg },
  bad: { bg: tokens.color.badSoft, fg: tokens.color.badFg },
  info: { bg: tokens.color.infoSoft, fg: tokens.color.infoFg },
  dark: { bg: tokens.color.fg, fg: tokens.color.surface },
  outline: {
    bg: tokens.color.surface,
    fg: tokens.color.fgMuted,
    border: tokens.color.border,
  },
};

export function Pill({
  label,
  tone = 'outline',
  style,
}: {
  label: string;
  tone?: PillTone;
  style?: ViewStyle;
}) {
  const c = map[tone];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: c.bg },
        c.border ? { borderWidth: 1, borderColor: c.border } : null,
        style,
      ]}
    >
      <Text style={[styles.label, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  label: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
