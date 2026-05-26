import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { eq } from "drizzle-orm";
import { BackButton } from "../../../../components/BackButton";
import { tokens } from "../../../../theme/tokens";
import { useAuth } from "../../../../lib/store";
import { getProgram } from "../../../../db/api/programs";
import { listTemplates } from "../../../../db/api/templates";
import { db } from "../../../../db/client";
import { programDays, type LocalProgramDay, type LocalWorkoutTemplate } from "../../../../db/schema";

export default function ProgramEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member } = useAuth();
  const memberId = member?.dbId ?? "";
  const [days, setDays] = useState<LocalProgramDay[]>([]);
  const [templates, setTemplates] = useState<LocalWorkoutTemplate[]>([]);
  const [currentPosition, setCurrentPosition] = useState(0);

  const load = useCallback(() => {
    if (!id) return;
    const { program: p, days: d } = getProgram(id);
    setDays(d);
    setCurrentPosition(p?.currentPosition ?? 0);
    if (memberId) setTemplates(listTemplates(memberId));
  }, [id, memberId]);

  useEffect(() => { load(); }, [load]);

  const updateDay = (dayId: string, patch: Partial<LocalProgramDay>) => {
    db.update(programDays).set({ ...patch, syncStatus: "pending" })
      .where(eq(programDays.id, dayId)).run();
    setDays(days.map((d) => d.id === dayId ? { ...d, ...patch } : d));
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Edit program</Text>
      <Text style={styles.warning}>
        Only future days can be edited. Completed days are locked.
      </Text>
      <ScrollView>
        {days.map((d) => {
          const isPast = d.position < currentPosition;
          return (
            <View key={d.id} style={[styles.dayCard, isPast && styles.dayDisabled]}>
              <Text style={styles.dayTitle}>Week {d.week} Day {d.day} · {d.title}</Text>
              {isPast ? (
                <Text style={styles.lockedHint}>(completed — locked)</Text>
              ) : (
                <View>
                  <View style={styles.row}>
                    <Switch
                      value={d.isRest === 1}
                      onValueChange={(v) => updateDay(d.id, {
                        isRest: v ? 1 : 0,
                        templateId: v ? null : d.templateId,
                      })}
                    />
                    <Text style={styles.label}> Rest day</Text>
                  </View>
                  {d.isRest === 0 && (
                    <ScrollView horizontal>
                      {templates.map((t) => (
                        <Pressable
                          key={t.id}
                          onPress={() => updateDay(d.id, { templateId: t.id, title: t.name })}
                          style={[
                            styles.tplChip,
                            d.templateId === t.id && styles.tplChipActive,
                          ]}
                        >
                          <Text style={styles.tplChipText}>{t.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg, padding: 12 },
  title: { fontFamily: tokens.font.sansExtrabold, fontSize: 18, marginVertical: 8 },
  warning: { fontSize: 12, color: tokens.color.fgMuted, marginBottom: 8, fontStyle: "italic" },
  dayCard: {
    padding: 10, marginVertical: 4,
    borderWidth: 1, borderColor: tokens.color.border,
    borderRadius: 8,
  },
  dayDisabled: { opacity: 0.4 },
  dayTitle: { fontFamily: tokens.font.sansBold, fontSize: 13 },
  lockedHint: { fontFamily: tokens.font.sansRegular, fontSize: 11, color: tokens.color.fgMuted, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  label: { fontFamily: tokens.font.sansMedium, fontSize: 12 },
  tplChip: {
    padding: 8, marginRight: 6, marginTop: 6, borderRadius: 8,
    backgroundColor: tokens.color.surface,
    borderWidth: 1, borderColor: tokens.color.border,
  },
  tplChipActive: { backgroundColor: tokens.color.accentSoft, borderColor: tokens.color.accent },
  tplChipText: { fontFamily: tokens.font.sansMedium, fontSize: 11 },
});
