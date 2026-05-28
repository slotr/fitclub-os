import React, { useState, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { eq } from "drizzle-orm";
import { BackButtonRow } from "../../components/BackButton";
import { tokens } from "../../theme/tokens";
import { useTheme } from "../../lib/theme-provider";
import { listTemplates } from "../../db/api/templates";
import { workoutTemplateExercises, type LocalWorkoutTemplate } from "../../db/schema";
import { db } from "../../db/client";
import { useAuth } from "../../lib/store";

export default function TemplatesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { member } = useAuth();
  const memberId = member?.dbId ?? "";
  const [templates, setTemplates] = useState<LocalWorkoutTemplate[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    if (!memberId) return;
    const list = listTemplates(memberId);
    setTemplates(list);
    const cmap: Record<string, number> = {};
    for (const t of list) {
      cmap[t.id] = db.select().from(workoutTemplateExercises)
        .where(eq(workoutTemplateExercises.templateId, t.id)).all().length;
    }
    setCounts(cmap);
  }, [memberId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <BackButtonRow />
      <Text style={styles.pageTitle}>Templates</Text>
      <Pressable
        onPress={() => router.push("/train/templates/new" as Parameters<typeof router.push>[0])}
        style={[styles.fab, { backgroundColor: theme.accent }]}
      >
        <Text style={styles.fabText}>+ Create template</Text>
      </Pressable>
      <FlatList
        data={templates}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/train/templates/${item.id}` as Parameters<typeof router.push>[0])}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>{counts[item.id] ?? 0} exercises</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No templates yet. Tap &quot;Create template&quot; to begin.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg, padding: 12 },
  pageTitle: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    marginBottom: 12,
  },
  fab: {
    marginBottom: 12,
    padding: 12, borderRadius: 10, alignItems: "center",
  },
  fabText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 14 },
  row: {
    padding: 12, marginVertical: 4,
    backgroundColor: tokens.color.surface,
    borderRadius: 10, borderWidth: 1, borderColor: tokens.color.border,
  },
  name: { fontFamily: tokens.font.sansBold, fontSize: 14 },
  sub: { fontFamily: tokens.font.sansRegular, fontSize: 12, color: tokens.color.fgMuted, marginTop: 4 },
  empty: { textAlign: "center", padding: 24, color: tokens.color.fgMuted, fontFamily: tokens.font.sansRegular },
});
