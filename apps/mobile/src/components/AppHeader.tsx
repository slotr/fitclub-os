import React from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";

export function AppHeader({ title }: { title?: string }) {
  const { logoUrl, gymName } = useTheme();
  return (
    <View style={styles.header}>
      {logoUrl ? (
        <Image
          source={{ uri: logoUrl }}
          style={styles.logo}
          contentFit="contain"
        />
      ) : (
        <Text style={styles.gymName}>{gymName}</Text>
      )}
      {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  logo: { width: 32, height: 32 },
  gymName: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 16,
    color: tokens.color.fg,
  },
  pageTitle: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
    marginLeft: 8,
  },
});
