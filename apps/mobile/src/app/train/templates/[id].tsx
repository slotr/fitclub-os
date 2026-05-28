import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { inArray } from "drizzle-orm";
import { BackButtonRow } from "../../../components/BackButton";
import { SupersetGroupBadge } from "../../../components/SupersetGroupBadge";
import { tokens } from "../../../theme/tokens";
import { useTheme } from "../../../lib/theme-provider";
import { getTemplate, softDeleteTemplate } from "../../../db/api/templates";
import { useWorkoutSession } from "../../../workout/session-store";
import { exercises as exercisesTable } from "../../../db/schema";
import type { LocalWorkoutTemplate, LocalWorkoutTemplateExercise } from "../../../db/schema";
import { db } from "../../../db/client";

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { startWorkout } = useWorkoutSession();
  const [template, setTemplate] = useState<LocalWorkoutTemplate | null>(null);
  const [items, setItems] = useState<LocalWorkoutTemplateExercise[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    if (!id) return;
    const { template: t, exercises: ex } = getTemplate(id);
    setTemplate(t);
    setItems(ex);
    if (ex.length) {
      const exIds = ex.map((e) => e.exerciseId);
      const rows = db.select().from(exercisesTable).where(inArray(exercisesTable.id, exIds)).all();
      const m: Record<string, string> = {};
      for (const r of rows) m[r.id] = r.name;
      setNames(m);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!template) {
    return (
      <View style={styles.container}>
        <BackButtonRow />
        <Text>Loading…</Text>
      </View>
    );
  }

  const onStart = () => {
    startWorkout({ templateId: template.id });
    router.push("/train/active" as Parameters<typeof router.push>[0]);
  };

  const onDelete = () => {
    Alert.alert("Delete template?", "Workout history that used it is preserved.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        softDeleteTemplate(template.id);
        router.back();
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <BackButtonRow />
      <ScrollView>
        <Text style={styles.pageTitle}>{template.name}</Text>
        {template.description ? (
          <Text style={styles.description}>{template.description}</Text>
        ) : null}
        <Text style={styles.meta}>
          {template.estimatedMin ? `~${template.estimatedMin} min · ` : ""}
          {items.length} {items.length === 1 ? "exercise" : "exercises"}
        </Text>

        <Text style={styles.section}>Exercises</Text>
        {items.map((ex, i) => (
          <View key={ex.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseNumber}>{i + 1}.</Text>
              <Text style={styles.exerciseName}>{names[ex.exerciseId] ?? "Unknown"}</Text>
            </View>
            <SupersetGroupBadge group={ex.supersetGroup} />
            <Text style={styles.targetLine}>
              {ex.sets} × {ex.repMin && ex.repMax ? `${ex.repMin}-${ex.repMax}` : "—"}
              {ex.target1rmPct ? ` @ ${ex.target1rmPct}% 1RM` : ""}
              {ex.targetRpe ? ` · RPE ${ex.targetRpe}` : ""}
              {ex.restSeconds ? ` · rest ${ex.restSeconds}s` : ""}
            </Text>
          </View>
        ))}

        <Pressable onPress={onStart} style={[styles.startBtn, { backgroundColor: theme.accent }]}>
          <Text style={styles.startBtnText}>▶ Start workout</Text>
        </Pressable>

        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Delete template</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg, padding: 12 },
  pageTitle: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    marginBottom: 4,
  },
  description: { fontFamily: tokens.font.sansRegular, fontSize: 14, marginBottom: 8 },
  meta: { fontFamily: tokens.font.sansMedium, fontSize: 12, color: tokens.color.fgMuted, marginBottom: 12 },
  section: { fontFamily: tokens.font.sansExtrabold, fontSize: 14, marginTop: 16, marginBottom: 8 },
  exerciseCard: {
    padding: 12, marginVertical: 6,
    backgroundColor: tokens.color.surface,
    borderRadius: 10, borderWidth: 1, borderColor: tokens.color.border,
  },
  exerciseHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  exerciseNumber: { fontFamily: tokens.font.sansBold, fontSize: 14 },
  exerciseName: { fontFamily: tokens.font.sansBold, fontSize: 14 },
  targetLine: { fontFamily: tokens.font.sansRegular, fontSize: 12, color: tokens.color.fgMuted, marginTop: 6 },
  startBtn: {
    marginTop: 20, padding: 16, borderRadius: 12, alignItems: "center",
  },
  startBtnText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 16 },
  deleteBtn: { marginTop: 12, padding: 12, alignItems: "center" },
  deleteBtnText: { color: "#c0392b", fontFamily: tokens.font.sansMedium, fontSize: 13 },
});
