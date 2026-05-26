import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { tokens } from "../theme/tokens";
import type { LocalWorkoutTemplate } from "../db/schema";

type Props = {
  template: LocalWorkoutTemplate;
  exerciseCount: number;
  onPress: () => void;
};

export function TemplateCard({ template, exerciseCount, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.name} numberOfLines={1}>{template.name}</Text>
      <Text style={styles.sub}>{exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}</Text>
      {template.estimatedMin ? (
        <Text style={styles.sub}>~{template.estimatedMin} min</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    padding: 12,
    marginRight: 12,
    backgroundColor: tokens.color.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  name: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 14,
    marginBottom: 4,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },
});
