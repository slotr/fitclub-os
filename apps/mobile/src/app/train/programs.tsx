import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { eq } from "drizzle-orm";
import { BackButton } from "../../components/BackButton";
import { ProgramCard } from "../../components/ProgramCard";
import { tokens } from "../../theme/tokens";
import { listPrograms } from "../../db/api/programs";
import { useAuth } from "../../lib/store";
import { db } from "../../db/client";
import { programDayCompletions, type LocalProgram } from "../../db/schema";

export default function ProgramsScreen() {
  const router = useRouter();
  const { member } = useAuth();
  const memberId = member?.dbId ?? "";
  const [items, setItems] = useState<LocalProgram[]>([]);
  const [completed, setCompleted] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    if (!memberId) return;
    const list = listPrograms(memberId);
    setItems(list);
    const m: Record<string, number> = {};
    for (const p of list) {
      m[p.id] = db.select().from(programDayCompletions)
        .where(eq(programDayCompletions.programId, p.id)).all().length;
    }
    setCompleted(m);
  }, [memberId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Programs</Text>
      <View style={styles.actions}>
        <Pressable
          style={styles.btn}
          onPress={() => router.push("/train/programs/presets" as Parameters<typeof router.push>[0])}
        >
          <Text style={styles.btnText}>📚 Browse presets</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={() => router.push("/train/programs/new" as Parameters<typeof router.push>[0])}
        >
          <Text style={styles.btnText}>+ Create program</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProgramCard
            program={item}
            completedCount={completed[item.id] ?? 0}
            onPress={() => router.push(`/train/programs/${item.id}` as Parameters<typeof router.push>[0])}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No programs yet. Browse presets or create your own.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg, padding: 12 },
  title: { fontFamily: tokens.font.sansExtrabold, fontSize: 22, marginVertical: 8 },
  actions: { flexDirection: "row", gap: 8, marginBottom: 12 },
  btn: {
    flex: 1, padding: 10, borderRadius: 8, alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderWidth: 1, borderColor: tokens.color.border,
  },
  btnText: { fontFamily: tokens.font.sansBold, fontSize: 13 },
  empty: { textAlign: "center", padding: 24, color: tokens.color.fgMuted, fontFamily: tokens.font.sansRegular },
});
