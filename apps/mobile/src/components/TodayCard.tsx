import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";
import type { LocalProgram, LocalProgramDay } from "../db/schema";

type Props = {
  program: LocalProgram;
  day: LocalProgramDay;
  exerciseCount: number;
  onStart: () => void;
  onMarkRest: () => void;
};

export function TodayCard({ program, day, exerciseCount, onStart, onMarkRest }: Props) {
  const isRest = day.isRest === 1;
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
      <Text style={[styles.label, { color: theme.accent }]}>Today</Text>
      <Text style={styles.title}>
        {day.title} — Week {day.week} Day {day.day}
      </Text>
      <Text style={styles.sub}>
        {program.name} · {isRest ? "Rest day" : `${exerciseCount} exercises`}
      </Text>
      <Pressable onPress={isRest ? onMarkRest : onStart} style={[styles.btn, { backgroundColor: theme.accent }]}>
        <Text style={styles.btnText}>
          {isRest ? "Mark rest complete" : "Start workout"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16, marginVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  label: {
    fontFamily: tokens.font.sansExtrabold, fontSize: 11,
    letterSpacing: 1,
  },
  title: { fontFamily: tokens.font.sansExtrabold, fontSize: 18, marginTop: 4 },
  sub: { fontFamily: tokens.font.sansRegular, fontSize: 13, color: tokens.color.fgMuted, marginTop: 4 },
  btn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 15 },
});
