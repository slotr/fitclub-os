import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { GymRow } from "../../components/GymRow";
import { tokens } from "../../theme/tokens";
import { useTenantStore } from "../../lib/tenant-store";

export default function GymPickerScreen() {
  const router = useRouter();
  const memberships = useTenantStore((s) => s.memberships);
  const setCurrent = useTenantStore((s) => s.setCurrent);

  return (
    <ScreenContainer padding={20} contentStyle={{ paddingTop: 40 }}>
      <Text style={styles.title}>Choose your gym</Text>
      <Text style={styles.subtitle}>
        You&apos;re a member of {memberships.length} gyms.
      </Text>
      <FlatList
        data={memberships}
        keyExtractor={(m) => m.tenantId}
        renderItem={({ item }) => (
          <GymRow
            membership={item}
            onPress={async () => {
              await setCurrent(item);
              router.replace("/(tabs)" as Parameters<typeof router.replace>[0]);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No gyms available.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginBottom: 16,
  },
  empty: { padding: 24, alignItems: "center" },
  emptyText: { color: tokens.color.fgMuted, fontFamily: tokens.font.sansRegular },
});
