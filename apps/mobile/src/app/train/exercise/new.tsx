import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { customExerciseInputSchema } from '@fitness/api';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { BackButton } from '../../../components/BackButton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { tokens } from '../../../theme/tokens';
import { upsertExercise } from '../../../db/repo';
import { useAuth } from '../../../lib/store';
import { useTenantStore } from '../../../lib/tenant-store';
import { REST_STEP } from '../../../workout/use-rest-timer';
import type { LocalExercise } from '../../../db/schema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Muscle =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'fullBody';

type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other';

type Metric = 'weight_reps' | 'reps_only' | 'time';

const MUSCLES: { id: Muscle; label: string }[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'legs', label: 'Legs' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'core', label: 'Core' },
  { id: 'fullBody', label: 'Full Body' },
];

const EQUIPMENT: { id: Equipment; label: string }[] = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'machine', label: 'Machine' },
  { id: 'cable', label: 'Cable' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'band', label: 'Band' },
  { id: 'other', label: 'Other' },
];

const METRICS: { id: Metric; label: string }[] = [
  { id: 'weight_reps', label: 'Weight + Reps' },
  { id: 'reps_only', label: 'Reps only' },
  { id: 'time', label: 'Time' },
];

const MIN_REST = 5;
const MAX_REST = 900;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NewExerciseScreen() {
  const router = useRouter();
  const { member } = useAuth();
  const tenantId = useTenantStore((s) => s.currentTenantId) ?? null;

  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [metric, setMetric] = useState<Metric>('weight_reps');
  const [restSec, setRestSec] = useState(90);
  const [error, setError] = useState<string | null>(null);

  function adjustRest(delta: number) {
    setRestSec((prev) => Math.min(MAX_REST, Math.max(MIN_REST, prev + delta)));
  }

  function handleSave() {
    const parsed = customExerciseInputSchema.safeParse({
      name: name.trim(),
      primaryMuscle: muscle,
      equipment,
      metric,
      defaultRestSec: restSec,
    });

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
      setError(msg);
      return;
    }

    setError(null);

    const now = new Date().toISOString();
    const row: LocalExercise = {
      id: Crypto.randomUUID(),
      tenantId,
      memberId: member?.dbId ?? null,
      slug: null,
      name: parsed.data.name,
      primaryMuscle: parsed.data.primaryMuscle,
      equipment: parsed.data.equipment,
      metric: parsed.data.metric,
      defaultRestSec: parsed.data.defaultRestSec,
      instructions: null,
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
      syncedAt: null,
    };

    upsertExercise(row);
    router.back();
  }

  return (
    <ScreenContainer padding={20}>
      {/* Header */}
      <View style={styles.headerRow}>
        <BackButton />
        <Text style={styles.h1}>New Exercise</Text>
      </View>

      {/* Name */}
      <Text style={styles.fieldLabel}>Exercise name</Text>
      <TextInput
        style={[styles.textInput, error && name.trim().length === 0 && styles.textInputError]}
        placeholder="e.g. Bulgarian Split Squat"
        placeholderTextColor={tokens.color.fgFaint}
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (error) setError(null);
        }}
        autoCapitalize="words"
        returnKeyType="done"
        maxLength={120}
      />

      {/* Primary muscle */}
      <Text style={styles.fieldLabel}>Primary muscle</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {MUSCLES.map((m) => {
          const active = muscle === m.id;
          return (
            <Pressable
              key={m.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setMuscle(m.id);
                if (error) setError(null);
              }}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Equipment */}
      <Text style={styles.fieldLabel}>Equipment</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {EQUIPMENT.map((e) => {
          const active = equipment === e.id;
          return (
            <Pressable
              key={e.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setEquipment(e.id);
                if (error) setError(null);
              }}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {e.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Metric */}
      <Text style={styles.fieldLabel}>Tracking metric</Text>
      <View style={styles.segmented}>
        {METRICS.map((m, idx) => {
          const active = metric === m.id;
          return (
            <Pressable
              key={m.id}
              style={[
                styles.segment,
                active && styles.segmentActive,
                idx === 0 && styles.segmentFirst,
                idx === METRICS.length - 1 && styles.segmentLast,
              ]}
              onPress={() => setMetric(m.id)}
            >
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Default rest */}
      <Text style={styles.fieldLabel}>Default rest</Text>
      <View style={styles.restCard}>
        <View style={styles.restControl}>
          <Pressable
            style={styles.restBtn}
            onPress={() => adjustRest(-REST_STEP)}
            hitSlop={8}
          >
            <Text style={styles.restBtnLabel}>−{REST_STEP}s</Text>
          </Pressable>

          <View style={styles.restValue}>
            <Text style={styles.restValueText}>{fmtRest(restSec)}</Text>
          </View>

          <Pressable
            style={styles.restBtn}
            onPress={() => adjustRest(REST_STEP)}
            hitSlop={8}
          >
            <Text style={styles.restBtnLabel}>+{REST_STEP}s</Text>
          </Pressable>
        </View>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Save */}
      <PrimaryButton
        label="Save exercise"
        onPress={handleSave}
        style={styles.saveBtn}
      />
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtRest(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
    letterSpacing: -0.4,
  },

  fieldLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 10,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 2,
  },

  textInput: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: tokens.font.sansMedium,
    fontSize: 15,
    color: tokens.color.fg,
    marginBottom: 16,
    ...tokens.shadow.sm,
  },
  textInputError: {
    borderColor: tokens.color.bad,
  },

  chipScroll: {
    marginBottom: 16,
  },
  chipRow: {
    gap: 6,
    paddingRight: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  chipActive: {
    backgroundColor: tokens.color.accentSoft,
    borderColor: tokens.color.accent,
  },
  chipLabel: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },
  chipLabelActive: {
    fontFamily: tokens.font.sansSemibold,
    color: tokens.color.warnFg,
  },

  segmented: {
    flexDirection: 'row',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: tokens.color.border,
  },
  segmentFirst: {
    borderLeftWidth: 0,
  },
  segmentLast: {
    borderRightWidth: 0,
  },
  segmentActive: {
    backgroundColor: tokens.color.fg,
  },
  segmentLabel: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 11,
    color: tokens.color.fgMuted,
    textAlign: 'center',
  },
  segmentLabelActive: {
    fontFamily: tokens.font.sansSemibold,
    color: tokens.color.surface,
  },

  restCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: 14,
    marginBottom: 16,
    ...tokens.shadow.sm,
  },
  restControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  restBtn: {
    backgroundColor: tokens.color.accentSoft,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: tokens.color.accent,
  },
  restBtnLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 13,
    color: tokens.color.warnFg,
  },
  restValue: {
    flex: 1,
    alignItems: 'center',
  },
  restValueText: {
    fontFamily: tokens.font.monoSemibold,
    fontSize: 26,
    color: tokens.color.fg,
    letterSpacing: -0.5,
  },

  errorBanner: {
    backgroundColor: tokens.color.badSoft,
    borderRadius: tokens.radius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.color.bad,
  },
  errorText: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.badFg,
  },

  saveBtn: {
    marginBottom: 8,
  },
});
