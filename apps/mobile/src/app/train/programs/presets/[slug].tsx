import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BackButton } from "../../../../components/BackButton";
import { tokens } from "../../../../theme/tokens";
import { useTheme } from "../../../../lib/theme-provider";
import { getPreset } from "@fitness/api";
import { useAuth } from "../../../../lib/store";
import { useTenantStore } from "../../../../lib/tenant-store";
import { copyPresetToProgram, PresetExercisesMissingError } from "../../../../db/api/presets";

export default function PresetDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { member } = useAuth();
  const tenantId = useTenantStore((s) => s.currentTenantId) ?? "";
  const memberId = member?.dbId ?? "";
  const [copying, setCopying] = useState(false);

  const preset = slug ? getPreset(slug) : undefined;
  if (!preset) {
    return (
      <View style={styles.container}>
        <BackButton />
        <Text style={styles.title}>Preset not found</Text>
      </View>
    );
  }

  const week1 = preset.days.filter((d) => d.week === 1);

  const onUse = async () => {
    if (!memberId) { Alert.alert("Member context missing"); return; }
    setCopying(true);
    try {
      const programId = await copyPresetToProgram(preset, tenantId, memberId);
      router.replace(`/train/programs/${programId}` as Parameters<typeof router.replace>[0]);
    } catch (e) {
      if (e instanceof PresetExercisesMissingError) {
        Alert.alert(
          "Preset unavailable",
          `Missing exercises in your library:\n${e.missing.join("\n")}`,
        );
      } else {
        Alert.alert("Copy failed", String(e));
      }
      setCopying(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView>
        <Text style={styles.title}>{preset.name}</Text>
        <Text style={styles.meta}>
          {preset.goal} · {preset.level} · {preset.weeks} weeks · {preset.daysPerWeek} days/week
        </Text>
        {preset.equipmentNeeded.length > 0 && (
          <Text style={styles.meta}>Equipment: {preset.equipmentNeeded.join(", ")}</Text>
        )}

        <Text style={styles.section}>About</Text>
        <Text style={styles.description}>{preset.description}</Text>
        {preset.authorCredit && (
          <Text style={styles.credit}>— {preset.authorCredit}</Text>
        )}

        <Text style={styles.section}>Sample (Week 1)</Text>
        {week1.map((d, i) => (
          <View key={i} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{d.title}{d.isRest ? " (rest)" : ""}</Text>
            {d.exercises.map((ex, j) => (
              <Text key={j} style={styles.exerciseLine}>
                · {ex.exerciseSlug} {ex.sets}×{ex.repMin}-{ex.repMax}
              </Text>
            ))}
          </View>
        ))}

        <Pressable
          onPress={onUse}
          disabled={copying}
          style={[styles.useBtn, { backgroundColor: theme.accent }, copying && { opacity: 0.5 }]}
        >
          <Text style={styles.useBtnText}>
            {copying ? "Copying…" : "+ Use this program"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg, padding: 12 },
  title: { fontFamily: tokens.font.sansExtrabold, fontSize: 22, marginVertical: 8 },
  meta: { fontFamily: tokens.font.sansMedium, fontSize: 12, color: tokens.color.fgMuted, marginBottom: 4 },
  section: { fontFamily: tokens.font.sansExtrabold, fontSize: 14, marginTop: 16, marginBottom: 8 },
  description: { fontFamily: tokens.font.sansRegular, fontSize: 14, lineHeight: 20 },
  credit: { fontFamily: tokens.font.sansRegular, fontSize: 12, color: tokens.color.fgMuted, marginTop: 4, fontStyle: "italic" },
  dayCard: {
    padding: 10, marginVertical: 4,
    backgroundColor: tokens.color.surface,
    borderRadius: 8, borderWidth: 1, borderColor: tokens.color.border,
  },
  dayTitle: { fontFamily: tokens.font.sansBold, fontSize: 13 },
  exerciseLine: { fontFamily: tokens.font.sansRegular, fontSize: 12, color: tokens.color.fgMuted, marginTop: 4 },
  useBtn: {
    marginTop: 24, marginBottom: 32, padding: 14, borderRadius: 12, alignItems: "center",
  },
  useBtnText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 16 },
});
