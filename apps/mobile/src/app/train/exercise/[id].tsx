import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { BackButton } from '../../../components/BackButton';
import { Pill } from '../../../components/Pill';
import { tokens } from '../../../theme/tokens';
import { getExercise, getPref, setPref, listAllSetsForMember } from '../../../db/repo';
import { REST_STEP } from '../../../workout/use-rest-timer';
import { useAuth } from '../../../lib/store';
import { useTenantStore } from '../../../lib/tenant-store';
import {
  computeOneRepMaxSeries,
  filterByRange,
  type RangeKey,
} from '@fitness/api';
import { LineChart } from '../../../components/chart/LineChart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalise(s: string): string {
  if (!s) return s;
  const spaced = s.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function fmtRest(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

const MIN_REST = 5;
const MAX_REST = 900;

// ---------------------------------------------------------------------------
// Muscle placeholder colours
// ---------------------------------------------------------------------------

const MUSCLE_BG: Record<string, string> = {
  chest: '#fee2e2',
  back: '#dbeafe',
  shoulders: '#ede9fe',
  biceps: '#d1fae5',
  triceps: '#fce7f3',
  legs: '#fef3c7',
  glutes: '#fef9c3',
  core: '#ffedd5',
  fullBody: '#f0fdf4',
};

const MUSCLE_FG: Record<string, string> = {
  chest: '#991b1b',
  back: '#1e40af',
  shoulders: '#5b21b6',
  biceps: '#065f46',
  triceps: '#9f1239',
  legs: '#92400e',
  glutes: '#854d0e',
  core: '#9a3412',
  fullBody: '#166534',
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ExerciseDetailScreen() {
  useRouter(); // keep router available if needed
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member } = useAuth();
  const tenantId = useTenantStore((s) => s.currentTenantId) ?? "";

  const exercise = id ? getExercise(id) : undefined;

  const memberId = member?.dbId ?? '';

  const initialRest =
    memberId && id
      ? (getPref(memberId, id) ?? exercise?.defaultRestSec ?? 90)
      : (exercise?.defaultRestSec ?? 90);

  const [restSec, setRestSec] = useState<number>(initialRest);

  const [range, setRange] = useState<RangeKey>('3m');
  const trendSeries = useMemo(() => {
    if (!member?.dbId) return [];
    if (exercise?.metric !== 'weight_reps') return [];
    const all = listAllSetsForMember(member.dbId);
    const full = computeOneRepMaxSeries(
      all.map((s) => ({
        ...s,
        isWarmup: s.isWarmup === 1,
        isPr: s.isPr === 1,
      })),
      exercise.id,
    );
    return filterByRange(full, range);
  }, [member?.dbId, exercise?.id, exercise?.metric, range]);
  const latest = trendSeries.at(-1);
  const delta =
    trendSeries.length >= 2
      ? Math.round(latest!.estOneRepMax - trendSeries[0]!.estOneRepMax)
      : null;

  if (!exercise) {
    return (
      <ScreenContainer padding={20}>
        <View style={styles.headerRow}>
          <BackButton />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Exercise not found</Text>
          <Text style={styles.notFoundBody}>
            This exercise may have been removed.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  function adjustRest(delta: number) {
    const next = Math.min(MAX_REST, Math.max(MIN_REST, restSec + delta));
    setRestSec(next);
    if (memberId && exercise) {
      const prefId = `${memberId}:${exercise.id}`;
      setPref(prefId, tenantId, memberId, exercise.id, next);
    }
  }

  const placeholderBg = MUSCLE_BG[exercise.primaryMuscle] ?? tokens.color.accentSoft;
  const placeholderFg = MUSCLE_FG[exercise.primaryMuscle] ?? tokens.color.warnFg;

  return (
    <ScreenContainer padding={20}>
      {/* Header */}
      <View style={styles.headerRow}>
        <BackButton />
        {!exercise.slug && (
          <Pill label="Custom" tone="info" />
        )}
      </View>

      {/* Image / placeholder */}
      {exercise.imageUrl ? (
        <Image
          source={{ uri: exercise.imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: placeholderBg }]}>
          <Text style={[styles.imagePlaceholderLabel, { color: placeholderFg }]}>
            {capitalise(exercise.primaryMuscle)}
          </Text>
        </View>
      )}

      {/* Name */}
      <Text style={styles.name}>{exercise.name}</Text>

      {/* Chips row */}
      <View style={styles.chipsRow}>
        <Pill label={capitalise(exercise.primaryMuscle)} tone="info" />
        <Pill label={capitalise(exercise.equipment)} tone="outline" />
        <Pill label={metricLabel(exercise.metric)} tone="outline" />
      </View>

      {/* 1RM Trend */}
      {exercise?.metric === 'weight_reps' ? (
        <View style={oneRmStyles.section}>
          <View style={oneRmStyles.headerRow}>
            <Text style={oneRmStyles.title}>Your 1RM trend</Text>
            <View style={oneRmStyles.chips}>
              {(['1m', '3m', '6m', 'all'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRange(r)}
                  style={[oneRmStyles.chip, range === r && oneRmStyles.chipOn]}
                >
                  <Text
                    style={[
                      oneRmStyles.chipLabel,
                      range === r && oneRmStyles.chipLabelOn,
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          {trendSeries.length === 0 ? (
            <Text style={oneRmStyles.empty}>
              No data in this range — log this exercise to see your trend.
            </Text>
          ) : trendSeries.length === 1 ? (
            <Text style={oneRmStyles.empty}>
              est 1RM {Math.round(latest!.estOneRepMax)} kg · need one more
              session to see a trend
            </Text>
          ) : (
            <>
              <LineChart
                data={trendSeries.map((p) => ({ x: p.date, y: p.estOneRepMax }))}
                height={120}
              />
              <View style={oneRmStyles.footerRow}>
                <Text style={oneRmStyles.footerLatest}>
                  est 1RM <Text style={oneRmStyles.footerLatestVal}>
                    {Math.round(latest!.estOneRepMax)} kg
                  </Text>
                </Text>
                {delta !== null ? (
                  <Text
                    style={[
                      oneRmStyles.footerDelta,
                      delta >= 0
                        ? oneRmStyles.footerDeltaUp
                        : oneRmStyles.footerDeltaDown,
                    ]}
                  >
                    {delta >= 0 ? '+' : ''}{delta} kg / {range}
                  </Text>
                ) : null}
              </View>
            </>
          )}
        </View>
      ) : null}

      {/* Instructions */}
      {exercise.instructions ? (
        <View style={styles.instructionsCard}>
          <Text style={styles.sectionLabel}>Instructions</Text>
          <Text style={styles.instructionsText}>{exercise.instructions}</Text>
        </View>
      ) : null}

      {/* Rest preference */}
      <View style={styles.restCard}>
        <Text style={styles.sectionLabel}>Default rest</Text>
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
        <Text style={styles.restNote}>Saved per exercise</Text>
      </View>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function metricLabel(metric: string): string {
  switch (metric) {
    case 'weight_reps': return 'Weight + Reps';
    case 'reps_only': return 'Reps only';
    case 'time': return 'Time';
    default: return metric;
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  image: {
    width: '100%',
    height: 200,
    borderRadius: tokens.radius.lg,
    marginBottom: 16,
    backgroundColor: tokens.color.border,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: tokens.radius.lg,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderLabel: {
    fontFamily: tokens.font.sansBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },

  name: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginBottom: 10,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },

  instructionsCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: 16,
    marginBottom: 14,
    ...tokens.shadow.sm,
  },

  sectionLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 10,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  instructionsText: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fg,
    lineHeight: 20,
  },

  restCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: 16,
    marginBottom: 14,
    ...tokens.shadow.sm,
  },
  restControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 6,
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
    fontSize: 28,
    color: tokens.color.fg,
    letterSpacing: -0.5,
  },
  restNote: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgFaint,
    textAlign: 'center',
  },

  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  notFoundTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 16,
    color: tokens.color.fg,
    marginBottom: 6,
  },
  notFoundBody: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    textAlign: 'center',
  },
});

const oneRmStyles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: tokens.font.sansBold, fontSize: 13, color: tokens.color.fg },
  chips: { flexDirection: 'row', gap: 4 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: tokens.color.borderFaint,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  chipOn: { backgroundColor: tokens.color.fg, borderColor: tokens.color.fg },
  chipLabel: { fontFamily: tokens.font.sansBold, fontSize: 10, color: tokens.color.fgMuted },
  chipLabelOn: { color: '#fff' },
  empty: { fontFamily: tokens.font.sansMedium, fontSize: 12, color: tokens.color.fgMuted, marginTop: 8 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  footerLatest: { fontFamily: tokens.font.sansMedium, fontSize: 12, color: tokens.color.fgMuted },
  footerLatestVal: { fontFamily: tokens.font.sansExtrabold, color: tokens.color.fg },
  footerDelta: { fontFamily: tokens.font.sansBold, fontSize: 12 },
  footerDeltaUp: { color: '#4a8c3a' },
  footerDeltaDown: { color: tokens.color.fgMuted },
});
