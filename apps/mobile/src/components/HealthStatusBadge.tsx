import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

export type HealthStatus =
  | "not-determined"
  | "requesting"
  | "granted"
  | "granted-paused"
  | "denied"
  | "unavailable";

type Props = { status: HealthStatus };

const STATUS_LABEL: Record<HealthStatus, { label: string; bg: string; fg: string }> = {
  "not-determined": { label: "TAP TO ENABLE", bg: "#eceff1", fg: "#546e7a" },
  "requesting": { label: "REQUESTING…", bg: "#fff8e1", fg: "#8a6d3b" },
  "granted": { label: "GRANTED", bg: "#e8f5e9", fg: "#2e7d32" },
  "granted-paused": { label: "PAUSED", bg: "#fff8e1", fg: "#8a6d3b" },
  "denied": { label: "DENIED", bg: "#ffebee", fg: "#c62828" },
  "unavailable": { label: "NOT SUPPORTED", bg: "#eceff1", fg: "#546e7a" },
};

export function HealthStatusBadge({ status }: Props) {
  const s = STATUS_LABEL[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.label, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
});
