import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BackButton } from "../../../components/BackButton";
import { PresetCard } from "../../../components/PresetCard";
import { tokens } from "../../../theme/tokens";
import { useTheme } from "../../../lib/theme-provider";
import { PRESETS, type PresetProgram } from "@fitness/api";

type FilterValue = "all" | "strength" | "hypertrophy" | "cardio" | "bodyweight" | "beginner";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "strength", label: "Strength" },
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "cardio", label: "Cardio" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "beginner", label: "Beginner" },
];

export default function PresetLibraryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return PRESETS;
    if (filter === "beginner") return PRESETS.filter((p) => p.level === "beginner");
    return PRESETS.filter((p) => p.goal === filter);
  }, [filter]);

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Preset programs</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(f) => f.value}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setFilter(item.value)}
            style={[styles.chip, filter === item.value && { backgroundColor: theme.accent, borderColor: theme.accent }]}
          >
            <Text style={[styles.chipText, filter === item.value && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        )}
        style={styles.filterRow}
      />
      <FlatList
        data={filtered}
        keyExtractor={(p: PresetProgram) => p.slug}
        renderItem={({ item }) => (
          <PresetCard
            preset={item}
            onPress={() => router.push(`/train/programs/presets/${item.slug}` as Parameters<typeof router.push>[0])}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg, padding: 12 },
  title: { fontFamily: tokens.font.sansExtrabold, fontSize: 22, marginVertical: 8 },
  filterRow: { maxHeight: 44, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginRight: 8,
    backgroundColor: tokens.color.surface,
    borderWidth: 1, borderColor: tokens.color.border,
  },
  chipText: { fontFamily: tokens.font.sansMedium, fontSize: 12 },
  chipTextActive: { color: "white" },
});
