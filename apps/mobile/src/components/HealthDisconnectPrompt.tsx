import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

type Props = {
  visible: boolean;
  platformLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function HealthDisconnectPrompt({
  visible,
  platformLabel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Disconnect {platformLabel}?</Text>
          <Text style={styles.body}>
            Future workouts won&apos;t be saved to {platformLabel}. Workouts
            already saved will stay.{"\n\n"}
            To remove past data: open {platformLabel} &gt; Sources &gt; FitClub.
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.disconnectBtn}>
              <Text style={styles.disconnectText}>Disconnect</Text>
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
  disconnectBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#c62828",
  },
  disconnectText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 14 },
});
