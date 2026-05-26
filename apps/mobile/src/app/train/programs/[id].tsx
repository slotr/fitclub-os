import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { BackButton } from "../../../components/BackButton";
import { ProgramDayRow } from "../../../components/ProgramDayRow";
import { tokens } from "../../../theme/tokens";
import { useAuth } from "../../../lib/store";
import {
  getProgram, activateProgram, pauseProgram, restartProgram,
  softDeleteProgram, completeProgramDay,
} from "../../../db/api/programs";
import { useWorkoutSession } from "../../../workout/session-store";
import type { LocalProgram, LocalProgramDay, LocalProgramDayCompletion } from "../../../db/schema";

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { member } = useAuth();
  const memberId = member?.dbId ?? "";
  const { startWorkout } = useWorkoutSession();
  const [program, setProgram] = useState<LocalProgram | null>(null);
  const [days, setDays] = useState<LocalProgramDay[]>([]);
  const [completions, setCompletions] = useState<LocalProgramDayCompletion[]>([]);

  const load = useCallback(() => {
    if (!id) return;
    const { program: p, days: d, completions: c } = getProgram(id);
    setProgram(p);
    setDays(d);
    setCompletions(c);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!program) {
    return (
      <View style={styles.container}>
        <BackButton />
        <Text style={styles.title}>Loading…</Text>
      </View>
    );
  }

  const total = program.weeksCount * program.daysPerWeek;
  const completedMap = new Map(completions.map((c) => [c.programDayId, c]));
  const completedCount = completions.length;
  const week = Math.min(
    Math.floor(program.currentPosition / program.daysPerWeek) + 1,
    program.weeksCount,
  );

  const grouped: Record<number, LocalProgramDay[]> = {};
  for (const d of days) {
    grouped[d.week] = grouped[d.week] ?? [];
    grouped[d.week]!.push(d);
  }

  const onDayPress = (d: LocalProgramDay) => {
    if (program.status !== "active") {
      Alert.alert("Activate program first", "Tap Activate to start the sequence.");
      return;
    }
    if (d.position !== program.currentPosition) return;
    if (d.isRest === 1) {
      completeProgramDay(program.id, d.id, memberId, null);
      load();
      return;
    }
    startWorkout({ programDayId: d.id });
    router.push("/train/active" as Parameters<typeof router.push>[0]);
  };

  const toggleActive = () => {
    if (program.status === "active") pauseProgram(program.id);
    else activateProgram(program.id);
    load();
  };

  const onRestart = () => {
    Alert.alert("Restart program?", "All completion progress will be reset.", [
      { text: "Cancel", style: "cancel" },
      { text: "Restart", style: "destructive", onPress: () => { restartProgram(program.id); load(); }},
    ]);
  };

  const onDelete = () => {
    Alert.alert("Delete program?", "This cannot be undone. Workout history is kept.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        softDeleteProgram(program.id);
        router.back();
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView>
        <Text style={styles.title}>{program.name}</Text>
        <Text style={styles.statusLine}>
          Status: {program.status.toUpperCase()} · {completedCount}/{total} days · Week {week} of {program.weeksCount}
        </Text>
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={toggleActive}>
            <Text style={styles.actionText}>{program.status === "active" ? "Pause" : "Activate"}</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push(`/train/programs/${program.id}/edit` as Parameters<typeof router.push>[0])}
          >
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={onRestart}>
            <Text style={styles.actionText}>Restart</Text>
          </Pressable>
        </View>

        {Object.entries(grouped).map(([wk, daysInWeek]) => (
          <View key={wk}>
            <Text style={styles.weekHeader}>Week {wk}</Text>
            {daysInWeek.map((d) => {
              const completion = completedMap.get(d.id);
              const isToday = program.status === "active" && d.position === program.currentPosition;
              const isFuture = d.position > program.currentPosition;
              return (
                <ProgramDayRow
                  key={d.id}
                  day={d}
                  completedAt={completion?.completedAt ?? null}
                  isToday={isToday}
                  isFuture={isFuture}
                  onPress={() => onDayPress(d)}
                />
              );
            })}
          </View>
        ))}

        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete program</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg, padding: 12 },
  title: { fontFamily: tokens.font.sansExtrabold, fontSize: 22, marginVertical: 8 },
  statusLine: { fontFamily: tokens.font.sansMedium, fontSize: 13, marginBottom: 12 },
  actionsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  actionBtn: {
    flex: 1, padding: 10, borderRadius: 8, alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderWidth: 1, borderColor: tokens.color.border,
  },
  actionText: { fontFamily: tokens.font.sansBold, fontSize: 13 },
  weekHeader: { fontFamily: tokens.font.sansExtrabold, fontSize: 13, marginTop: 16, marginBottom: 4 },
  deleteBtn: { marginTop: 24, padding: 12, alignItems: "center" },
  deleteText: { color: "#c0392b", fontFamily: tokens.font.sansMedium, fontSize: 13 },
});
