import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import type { LocalProgram } from "../db/schema";

type Props = {
  program: LocalProgram;
  completedCount: number;
  onPress: () => void;
};

function statusLabel(s: string): { label: string; bg: string; fg: string } {
  switch (s) {
    case "active":    return { label: "ACTIVE",    bg: "#e8f5e9", fg: "#2e7d32" };
    case "paused":    return { label: "PAUSED",    bg: "#fff8e1", fg: "#8a6d3b" };
    case "completed": return { label: "COMPLETED", bg: "#e3f2fd", fg: "#1565c0" };
    default:          return { label: "DRAFT",     bg: "#eceff1", fg: "#546e7a" };
  }
}

export function ProgramCard({ program, completedCount, onPress }: Props) {
  const total = program.weeksCount * program.daysPerWeek;
  const week = Math.min(
    Math.floor(program.currentPosition / program.daysPerWeek) + 1,
    program.weeksCount,
  );
  const st = statusLabel(program.status);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>{program.name}</Text>
        <View style={[styles.pill, { backgroundColor: st.bg }]}>
          <Text style={[styles.pillText, { color: st.fg }]}>{st.label}</Text>
        </View>
      </View>
      <Text style={styles.sub}>
        Week {week} of {program.weeksCount} · {completedCount}/{total} days
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14, marginVertical: 6,
    backgroundColor: tokens.color.surface,
    borderRadius: 12, borderWidth: 1,
    borderColor: tokens.color.border,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontFamily: tokens.font.sansExtrabold, fontSize: 15, flex: 1, marginRight: 8 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  pillText: { fontFamily: tokens.font.sansExtrabold, fontSize: 9, letterSpacing: 0.5 },
  sub: { fontFamily: tokens.font.sansRegular, fontSize: 12, color: tokens.color.fgMuted, marginTop: 6 },
});
