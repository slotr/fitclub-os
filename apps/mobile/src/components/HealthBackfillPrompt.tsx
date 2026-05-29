import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";

type Props = {
  visible: boolean;
  count: number;
  platformLabel: string;
  onConfirm: () => void;
  onSkip: () => void;
};

export function HealthBackfillPrompt({
  visible,
  count,
  platformLabel,
  onConfirm,
  onSkip,
}: Props) {
  const theme = useTheme();
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Backfill past workouts?</Text>
          <Text style={styles.body}>
            You have {count} past workouts. Would you like to add them to{" "}
            {platformLabel} now?
          </Text>
          <Pressable
            onPress={onConfirm}
            style={[styles.confirmBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.confirmText}>
              Sync {count} workout{count === 1 ? "" : "s"}
            </Text>
          </Pressable>
          <Pressable onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 18,
    color: tokens.color.fg,
    marginBottom: 12,
  },
  body: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  confirmText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 14 },
  skipBtn: { padding: 12, alignItems: "center" },
  skipText: { fontFamily: tokens.font.sansBold, fontSize: 13, color: tokens.color.fgMuted },
});
