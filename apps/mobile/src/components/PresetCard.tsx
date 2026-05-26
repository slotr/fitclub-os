import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { tokens } from "../theme/tokens";
import type { PresetProgram } from "@fitness/api";

const GOAL_ICON: Record<string, string> = {
  strength: "🏋️",
  hypertrophy: "💪",
  cardio: "🏃",
  bodyweight: "🤸",
  general: "✨",
};

export function PresetCard({
  preset, onPress,
}: { preset: PresetProgram; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.title}>
        {GOAL_ICON[preset.goal]} {preset.name}
      </Text>
      <Text style={styles.meta}>
        {preset.goal} · {preset.level} · {preset.weeks} weeks
      </Text>
      <Text style={styles.meta}>
        {preset.daysPerWeek} days/week · {preset.equipmentNeeded.join(", ") || "no equipment"}
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
  title: { fontFamily: tokens.font.sansExtrabold, fontSize: 15 },
  meta: { fontFamily: tokens.font.sansRegular, fontSize: 12, color: tokens.color.fgMuted, marginTop: 4 },
});
