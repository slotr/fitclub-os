import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";

type Props = {
  visible: boolean;
  platformLabel: string;
  onContinue: () => void;
  onCancel: () => void;
};

export function HealthPermissionPrompt({
  visible,
  platformLabel,
  onContinue,
  onCancel,
}: Props) {
  const theme = useTheme();
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Connect to {platformLabel}</Text>
          <Text style={styles.body}>
            We&apos;ll save your gym workouts to {platformLabel} so they appear
            in your fitness summary.{"\n\n"}
            We only WRITE workout sessions. We don&apos;t read your health data.
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onContinue}
              style={[styles.continueBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>
          </View>
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
  actions: { flexDirection: "row", gap: 8 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: tokens.color.bg,
  },
  cancelText: { fontFamily: tokens.font.sansBold, fontSize: 14, color: tokens.color.fgMuted },
  continueBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  continueText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 14 },
});
