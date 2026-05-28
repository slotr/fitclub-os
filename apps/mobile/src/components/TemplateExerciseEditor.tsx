import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";
import type { TemplateExerciseInput } from "../db/api/templates";
import { ExercisePicker } from "./ExercisePicker";
import type { LocalExercise } from "../db/schema";

type Props = {
  value: TemplateExerciseInput;
  exerciseName: string | null;
  onChange: (next: TemplateExerciseInput) => void;
  onPickExercise: (ex: LocalExercise) => void;
  onDelete: () => void;
};

export function TemplateExerciseEditor({
  value,
  exerciseName,
  onChange,
  onPickExercise,
  onDelete,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const theme = useTheme();

  return (
    <View style={styles.card}>
      {/* Exercise selector */}
      <Pressable onPress={() => setPickerOpen(true)} style={styles.exerciseBtn}>
        <Text style={styles.exerciseName}>
          {exerciseName ?? "Pick exercise →"}
        </Text>
      </Pressable>

      {/* Sets + Reps row */}
      <View style={styles.fieldsRow}>
        <View style={styles.field}>
          <Text style={styles.label}>Sets</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={() =>
                onChange({ ...value, sets: Math.max(1, value.sets - 1) })
              }
              style={styles.stepBtn}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{value.sets}</Text>
            <Pressable
              onPress={() => onChange({ ...value, sets: value.sets + 1 })}
              style={styles.stepBtn}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Reps</Text>
          <View style={styles.repRow}>
            <TextInput
              keyboardType="numeric"
              value={value.repMin?.toString() ?? ""}
              onChangeText={(t) =>
                onChange({ ...value, repMin: t ? parseInt(t, 10) : null })
              }
              style={styles.repInput}
              placeholder="min"
            />
            <Text style={styles.dash}>–</Text>
            <TextInput
              keyboardType="numeric"
              value={value.repMax?.toString() ?? ""}
              onChangeText={(t) =>
                onChange({ ...value, repMax: t ? parseInt(t, 10) : null })
              }
              style={styles.repInput}
              placeholder="max"
            />
          </View>
        </View>
      </View>

      {/* Rest */}
      <View style={styles.field}>
        <Text style={styles.label}>Rest (seconds)</Text>
        <TextInput
          keyboardType="numeric"
          value={value.restSeconds?.toString() ?? ""}
          onChangeText={(t) =>
            onChange({ ...value, restSeconds: t ? parseInt(t, 10) : null })
          }
          style={styles.textInput}
        />
      </View>

      {/* Advanced toggle */}
      <Pressable onPress={() => setAdvancedOpen((o) => !o)}>
        <Text style={styles.advancedToggle}>
          {advancedOpen ? "▼" : "▶"} Advanced
        </Text>
      </Pressable>

      {advancedOpen && (
        <View>
          <View style={styles.field}>
            <Text style={styles.label}>Target RPE (1–10)</Text>
            <TextInput
              keyboardType="numeric"
              value={value.targetRpe?.toString() ?? ""}
              onChangeText={(t) =>
                onChange({ ...value, targetRpe: t ? parseFloat(t) : null })
              }
              style={styles.textInput}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>1RM % (1–100)</Text>
            <TextInput
              keyboardType="numeric"
              value={value.target1rmPct?.toString() ?? ""}
              onChangeText={(t) =>
                onChange({
                  ...value,
                  target1rmPct: t ? parseInt(t, 10) : null,
                })
              }
              style={styles.textInput}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tempo</Text>
            <TextInput
              value={value.tempo ?? ""}
              onChangeText={(t) =>
                onChange({ ...value, tempo: t || null })
              }
              style={styles.textInput}
              placeholder="3-1-1-0"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Superset group</Text>
            <View style={styles.chipRow}>
              {([null, 0, 1, 2] as Array<number | null>).map((g) => (
                <Pressable
                  key={String(g)}
                  onPress={() => onChange({ ...value, supersetGroup: g })}
                  style={[
                    styles.chip,
                    value.supersetGroup === g && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      value.supersetGroup === g && styles.chipTextActive,
                    ]}
                  >
                    {g === null ? "None" : String.fromCharCode(65 + g)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={value.notes ?? ""}
              onChangeText={(t) =>
                onChange({ ...value, notes: t || null })
              }
              style={[styles.textInput, styles.multilineInput]}
              multiline
            />
          </View>
        </View>
      )}

      {/* Delete */}
      <Pressable onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>Delete exercise</Text>
      </Pressable>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(ex) => {
          onPickExercise(ex);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    ...tokens.shadow.sm,
  },

  // Exercise button
  exerciseBtn: {
    backgroundColor: tokens.color.bg,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.color.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exerciseName: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 15,
    color: tokens.color.fg,
  },

  // Layout helpers
  fieldsRow: {
    flexDirection: "row",
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 11,
    color: tokens.color.fgMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Stepper
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: tokens.color.bg,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontFamily: tokens.font.sansBold,
    fontSize: 16,
    color: tokens.color.fg,
    lineHeight: 20,
  },
  stepperValue: {
    fontFamily: tokens.font.sansBold,
    fontSize: 16,
    color: tokens.color.fg,
    flex: 1,
    textAlign: "center",
  },

  // Reps row
  repRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  repInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 7,
    fontSize: 14,
    fontFamily: tokens.font.sansRegular,
    color: tokens.color.fg,
    backgroundColor: tokens.color.bg,
    textAlign: "center",
  },
  dash: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
  },

  // Generic text input
  textInput: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    fontFamily: tokens.font.sansRegular,
    color: tokens.color.fg,
    backgroundColor: tokens.color.bg,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },

  // Advanced toggle
  advancedToggle: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
    paddingVertical: 2,
  },

  // Superset chips
  chipRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg,
  },
  chipText: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
  },
  chipTextActive: {
    fontFamily: tokens.font.sansBold,
    color: tokens.color.accentFg,
  },

  // Delete button
  deleteBtn: {
    marginTop: 4,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.color.bad,
    backgroundColor: tokens.color.badSoft,
  },
  deleteBtnText: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 13,
    color: tokens.color.badFg,
  },
});
