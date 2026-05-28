import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";
import type { LocalProgramDay } from "../db/schema";

type Props = {
  day: LocalProgramDay;
  completedAt: string | null;
  isToday: boolean;
  isFuture: boolean;
  onPress?: () => void;
};

export function ProgramDayRow({ day, completedAt, isToday, isFuture, onPress }: Props) {
  const theme = useTheme();
  const iconAndColor = completedAt
    ? { icon: "✓", color: "#2e7d32" }
    : isToday
      ? { icon: "▶", color: theme.accent }
      : day.isRest === 1
        ? { icon: "💤", color: tokens.color.fgMuted }
        : { icon: "◯", color: tokens.color.fgMuted };

  const disabled = isFuture && !isToday;
  const Container: React.ElementType = disabled ? View : Pressable;

  return (
    <Container
      onPress={onPress}
      style={[
        styles.row,
        isToday && { backgroundColor: theme.accentSoft },
        disabled && styles.rowDisabled,
      ]}
    >
      <Text style={[styles.icon, { color: iconAndColor.color }]}>{iconAndColor.icon}</Text>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          Day {day.day}  {day.title}
        </Text>
        {completedAt ? (
          <Text style={styles.date}>{new Date(completedAt).toLocaleDateString()}</Text>
        ) : null}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 8,
  },
  rowDisabled: { opacity: 0.45 },
  icon: { width: 28, fontSize: 16, textAlign: "center" },
  body: { flex: 1 },
  title: { fontFamily: tokens.font.sansBold, fontSize: 13 },
  date: { fontFamily: tokens.font.sansRegular, fontSize: 11, color: tokens.color.fgMuted, marginTop: 2 },
});
