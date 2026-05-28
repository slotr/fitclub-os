import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { BackButton } from "../../../components/BackButton";
import { tokens } from "../../../theme/tokens";
import { createProgram, type ProgramDayInput } from "../../../db/api/programs";
import { listTemplates } from "../../../db/api/templates";
import { useAuth } from "../../../lib/store";
import { useTenantStore } from "../../../lib/tenant-store";
import type { LocalWorkoutTemplate } from "../../../db/schema";

type DaySpec = { templateId: string | null; isRest: boolean };

export default function NewProgramScreen() {
  const router = useRouter();
  const { member } = useAuth();
  const tenantId = useTenantStore((s) => s.currentTenantId) ?? "";
  const memberId = member?.dbId ?? "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [pattern, setPattern] = useState<DaySpec[]>(
    Array.from({ length: 3 }, () => ({ templateId: null, isRest: true })),
  );
  const [repeatWeekly, setRepeatWeekly] = useState(true);
  const [templates, setTemplates] = useState<LocalWorkoutTemplate[]>([]);

  useEffect(() => {
    if (memberId) setTemplates(listTemplates(memberId));
  }, [memberId]);

  useEffect(() => {
    setPattern((prev) => {
      if (prev.length === daysPerWeek) return prev;
      return Array.from({ length: daysPerWeek }, (_, i) =>
        prev[i] ?? { templateId: null, isRest: true },
      );
    });
  }, [daysPerWeek]);

  const onSave = async () => {
    if (!name.trim()) { Alert.alert("Name required"); return; }
    const hasWorkout = pattern.some((d) => !d.isRest && d.templateId);
    if (!hasWorkout) { Alert.alert("Add at least one workout day"); return; }

    const days: ProgramDayInput[] = [];
    for (let w = 1; w <= weeks; w++) {
      for (let d = 1; d <= daysPerWeek; d++) {
        const spec = pattern[d - 1]!;
        const title = spec.isRest
          ? "Rest"
          : templates.find((t) => t.id === spec.templateId)?.name ?? `Day ${d}`;
        days.push({
          week: w, day: d,
          position: (w - 1) * daysPerWeek + (d - 1),
          title,
          templateId: spec.isRest ? null : spec.templateId,
          isRest: spec.isRest,
          notes: null,
        });
      }
    }
    const id = await createProgram({
      tenantId,
      memberId,
      name: name.trim(),
      description: null,
      weeksCount: weeks,
      daysPerWeek,
    }, days);
    router.replace(`/train/programs/${id}` as Parameters<typeof router.replace>[0]);
  };

  return (
    <ScrollView style={styles.container}>
      <BackButton />
      <Text style={styles.title}>New program · Step {step} of 3</Text>

      {step === 1 && (
        <View>
          <Text style={styles.section}>Basics</Text>
          <TextInput
            value={name} onChangeText={setName}
            placeholder="Program name"
            style={styles.input}
          />
          <Text style={styles.label}>Weeks</Text>
          <View style={styles.row}>
            <Pressable style={styles.stepBtn} onPress={() => setWeeks(Math.max(1, weeks - 1))}>
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{weeks}</Text>
            <Pressable style={styles.stepBtn} onPress={() => setWeeks(Math.min(52, weeks + 1))}>
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.label}>Days per week</Text>
          <View style={styles.row}>
            <Pressable style={styles.stepBtn} onPress={() => setDaysPerWeek(Math.max(1, daysPerWeek - 1))}>
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{daysPerWeek}</Text>
            <Pressable style={styles.stepBtn} onPress={() => setDaysPerWeek(Math.min(7, daysPerWeek + 1))}>
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
          <Pressable style={styles.nextBtn} onPress={() => setStep(2)}>
            <Text style={styles.nextBtnText}>Next →</Text>
          </Pressable>
        </View>
      )}

      {step === 2 && (
        <View>
          <Text style={styles.section}>Week pattern</Text>
          <View style={styles.row}>
            <Switch value={repeatWeekly} onValueChange={setRepeatWeekly} />
            <Text style={styles.label}> Repeat same pattern every week</Text>
          </View>
          {pattern.map((spec, i) => (
            <View key={i} style={styles.daySpecCard}>
              <Text style={styles.label}>Day {i + 1}</Text>
              <View style={styles.row}>
                <Switch
                  value={spec.isRest}
                  onValueChange={(v) => {
                    const copy = [...pattern];
                    copy[i] = { ...copy[i]!, isRest: v, templateId: v ? null : copy[i]!.templateId };
                    setPattern(copy);
                  }}
                />
                <Text style={styles.label}> Rest day</Text>
              </View>
              {!spec.isRest && (
                <ScrollView horizontal>
                  {templates.map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => {
                        const copy = [...pattern];
                        copy[i] = { ...copy[i]!, templateId: t.id };
                        setPattern(copy);
                      }}
                      style={[
                        styles.tplChip,
                        spec.templateId === t.id && styles.tplChipActive,
                      ]}
                    >
                      <Text style={styles.tplChipText}>{t.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          ))}
          <View style={styles.row}>
            <Pressable style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </Pressable>
            <Pressable style={styles.nextBtn} onPress={() => setStep(3)}>
              <Text style={styles.nextBtnText}>Next →</Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === 3 && (
        <View>
          <Text style={styles.section}>Review</Text>
          <Text>{name} · {weeks} weeks × {daysPerWeek} days/week = {weeks * daysPerWeek} days total</Text>
          <View style={styles.row}>
            <Pressable style={styles.backBtn} onPress={() => setStep(2)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </Pressable>
            <Pressable style={styles.nextBtn} onPress={onSave}>
              <Text style={styles.nextBtnText}>Save as draft</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg, padding: 12 },
  title: { fontFamily: tokens.font.sansExtrabold, fontSize: 18, marginVertical: 8 },
  section: { fontFamily: tokens.font.sansExtrabold, fontSize: 14, marginTop: 8, marginBottom: 8 },
  input: {
    padding: 12, borderWidth: 1, borderColor: tokens.color.border,
    borderRadius: 8, fontFamily: tokens.font.sansRegular,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8 },
  label: { fontFamily: tokens.font.sansMedium, fontSize: 13, color: tokens.color.fgMuted },
  stepBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: tokens.color.surface,
    borderWidth: 1, borderColor: tokens.color.border,
    alignItems: "center", justifyContent: "center",
  },
  stepBtnText: { fontFamily: tokens.font.sansExtrabold, fontSize: 22 },
  stepperValue: { fontFamily: tokens.font.sansBold, fontSize: 20, minWidth: 32, textAlign: "center" },
  nextBtn: {
    marginTop: 16, padding: 14, borderRadius: 10, alignItems: "center",
    backgroundColor: tokens.color.accent, flex: 1,
  },
  nextBtnText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 14 },
  backBtn: { padding: 14, borderRadius: 10, alignItems: "center", flex: 1 },
  backBtnText: { fontFamily: tokens.font.sansBold, fontSize: 14, color: tokens.color.fgMuted },
  daySpecCard: {
    padding: 12, marginVertical: 6,
    borderWidth: 1, borderColor: tokens.color.border,
    borderRadius: 10,
  },
  tplChip: {
    padding: 10, marginRight: 8, borderRadius: 8,
    backgroundColor: tokens.color.surface,
    borderWidth: 1, borderColor: tokens.color.border,
  },
  tplChipActive: { backgroundColor: tokens.color.accentSoft, borderColor: tokens.color.accent },
  tplChipText: { fontFamily: tokens.font.sansMedium, fontSize: 12 },
});
