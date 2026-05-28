import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { BackButtonRow } from "../../../components/BackButton";
import { TemplateExerciseEditor } from "../../../components/TemplateExerciseEditor";
import { tokens } from "../../../theme/tokens";
import { createTemplate, type TemplateExerciseInput } from "../../../db/api/templates";
import { useAuth } from "../../../lib/store";
import { useTenantStore } from "../../../lib/tenant-store";
import type { LocalExercise } from "../../../db/schema";

function blankExercise(position: number): TemplateExerciseInput {
  return {
    exerciseId: "",
    position,
    sets: 3,
    repMin: 8,
    repMax: 12,
    restSeconds: 90,
    targetRpe: null,
    target1rmPct: null,
    tempo: null,
    supersetGroup: null,
    notes: null,
  };
}

export default function NewTemplateScreen() {
  const router = useRouter();
  const { member } = useAuth();
  const tenantId = useTenantStore((s) => s.currentTenantId) ?? "";
  const memberId = member?.dbId ?? "";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedMin, setEstimatedMin] = useState<string>("");
  const [exercises, setExercises] = useState<TemplateExerciseInput[]>([blankExercise(0)]);
  const [exerciseNames, setExerciseNames] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onSave = async () => {
    if (!name.trim()) { Alert.alert("Name required"); return; }
    const validExs = exercises.filter((e) => e.exerciseId);
    if (validExs.length === 0) { Alert.alert("Add at least one exercise"); return; }
    setSubmitting(true);
    try {
      const id = await createTemplate({
        tenantId,
        memberId,
        name: name.trim(),
        description: description.trim() || null,
        estimatedMin: estimatedMin ? parseInt(estimatedMin, 10) : null,
        exercises: validExs.map((e, i) => ({ ...e, position: i })),
      });
      router.replace(`/train/templates/${id}` as Parameters<typeof router.replace>[0]);
    } catch (e) {
      Alert.alert("Save failed", String(e));
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <BackButtonRow />
      <Text style={styles.pageTitle}>New template</Text>
      <TextInput
        value={name} onChangeText={setName}
        placeholder="Name (e.g. Push Day)"
        style={styles.input}
      />
      <TextInput
        value={description} onChangeText={setDescription}
        placeholder="Description (optional)"
        style={[styles.input, { minHeight: 60 }]}
        multiline
      />
      <TextInput
        value={estimatedMin} onChangeText={setEstimatedMin}
        placeholder="Estimated duration (min, optional)"
        style={styles.input}
        keyboardType="numeric"
      />
      <Text style={styles.section}>Exercises</Text>
      {exercises.map((ex, i) => (
        <TemplateExerciseEditor
          key={i}
          value={ex}
          exerciseName={exerciseNames[i] ?? null}
          onChange={(next) => {
            const copy = [...exercises];
            copy[i] = next;
            setExercises(copy);
          }}
          onPickExercise={(picked: LocalExercise) => {
            const copy = [...exercises];
            copy[i] = { ...copy[i]!, exerciseId: picked.id };
            setExercises(copy);
            setExerciseNames({ ...exerciseNames, [i]: picked.name });
          }}
          onDelete={() => {
            const copy = exercises.filter((_, j) => j !== i);
            setExercises(copy);
            const namesCopy = { ...exerciseNames };
            delete namesCopy[i];
            setExerciseNames(namesCopy);
          }}
        />
      ))}
      <Pressable
        onPress={() => setExercises([...exercises, blankExercise(exercises.length)])}
        style={styles.addBtn}
      >
        <Text style={styles.addBtnText}>+ Add exercise</Text>
      </Pressable>
      <Pressable
        onPress={onSave}
        disabled={submitting}
        style={[styles.saveBtn, submitting && { opacity: 0.5 }]}
      >
        <Text style={styles.saveBtnText}>{submitting ? "Saving…" : "Save template"}</Text>
      </Pressable>
    </ScrollView>
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
  input: {
    padding: 12, marginVertical: 6,
    borderWidth: 1, borderColor: tokens.color.border,
    borderRadius: 8, fontFamily: tokens.font.sansRegular,
    backgroundColor: tokens.color.surface,
  },
  section: {
    marginTop: 16, marginBottom: 8,
    fontFamily: tokens.font.sansExtrabold, fontSize: 14,
  },
  addBtn: {
    padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: tokens.color.border,
    borderRadius: 8, alignItems: "center", borderStyle: "dashed",
  },
  addBtnText: { fontFamily: tokens.font.sansBold, fontSize: 13, color: tokens.color.fgMuted },
  saveBtn: {
    marginTop: 16, marginBottom: 32,
    padding: 14, borderRadius: 10, alignItems: "center",
    backgroundColor: tokens.color.accent,
  },
  saveBtnText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 15 },
});
