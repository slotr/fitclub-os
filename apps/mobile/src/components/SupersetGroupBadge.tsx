import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { tokens } from "../theme/tokens";

export function SupersetGroupBadge({ group }: { group: number | null }) {
  if (group == null) return null;
  const letter = String.fromCharCode(65 + (group % 26));
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>SUPERSET {letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#fef0e6",
    borderColor: "#f4a261",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 10,
    color: "#a05a16",
    letterSpacing: 0.5,
  },
});
