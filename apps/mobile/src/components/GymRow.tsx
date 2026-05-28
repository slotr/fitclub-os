import React from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import type { Membership } from "@fitness/api";

type Props = {
  membership: Membership;
  isCurrent?: boolean;
  onPress: () => void;
};

export function GymRow({ membership, isCurrent, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, isCurrent && styles.rowCurrent]}
    >
      <View style={styles.dotWrap}>
        <View style={[styles.dot, isCurrent && styles.dotFilled]} />
      </View>
      {membership.logoUrl ? (
        <Image
          source={{ uri: membership.logoUrl }}
          style={styles.logo}
          contentFit="contain"
        />
      ) : (
        <View style={styles.logoFallback}>
          <Text style={styles.logoFallbackText}>
            {membership.gymName.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {membership.gymName}
        </Text>
        <Text style={styles.sub}>Member</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginVertical: 6,
    backgroundColor: tokens.color.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  rowCurrent: {
    borderColor: tokens.color.accent,
    borderWidth: 2,
  },
  dotWrap: { width: 24, alignItems: "center" },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: tokens.color.border,
  },
  dotFilled: {
    backgroundColor: tokens.color.accent,
    borderColor: tokens.color.accent,
  },
  logo: { width: 40, height: 40, marginHorizontal: 12, borderRadius: 8 },
  logoFallback: {
    width: 40,
    height: 40,
    marginHorizontal: 12,
    borderRadius: 8,
    backgroundColor: tokens.color.bg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 18,
    color: tokens.color.fgMuted,
  },
  body: { flex: 1 },
  name: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.fg,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },
});
