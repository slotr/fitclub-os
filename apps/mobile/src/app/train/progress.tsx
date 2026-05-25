import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  computeMuscleSplit, computeStreak, computeTotals, computeWeeklyVolume,
  formatDuration, formatRelativeDate, formatVolumeShort, listPbHistory,
} from '@fitness/api';
import { BackButtonRow } from '../../components/BackButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PrimaryButton } from '../../components/PrimaryButton';
import { BarChart } from '../../components/chart/BarChart';
import { DonutChart } from '../../components/chart/DonutChart';
import { StatCard } from '../../components/chart/StatCard';
import { muscleColor } from '../../components/chart/muscle-palette';
import { tokens } from '../../theme/tokens';
import {
  listAllSetsForMember, listExercises, listWorkouts,
} from '../../db/repo';
import type { LocalWorkoutSet } from '../../db/schema';
import { useAuth } from '../../lib/store';
import type { MuscleEnum, WorkoutSetRow } from '@fitness/api';

/** Coerce SQLite integer booleans to proper booleans for @fitness/api. */
function toSetRow(s: LocalWorkoutSet): WorkoutSetRow {
  return {
    id: s.id,
    workoutId: s.workoutId,
    exerciseId: s.exerciseId,
    orderIndex: s.orderIndex,
    setIndex: s.setIndex,
    weight: s.weight,
    reps: s.reps,
    durationSec: s.durationSec,
    restSec: s.restSec,
    isWarmup: s.isWarmup === 1,
    isPr: s.isPr === 1,
    createdAt: s.createdAt,
  };
}

const WEEK_LABEL = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(
    d.getUTCMonth() + 1,
  ).padStart(2, '0')}`;
};

export default function ProgressScreen() {
  const router = useRouter();
  const { member } = useAuth();
  const memberId = member?.dbId ?? null;

  const workouts = memberId ? listWorkouts(memberId, 9999) : [];
  const sets = memberId ? listAllSetsForMember(memberId).map(toSetRow) : [];
  const exercises = memberId ? listExercises(memberId) : [];

  const totals = useMemo(() => computeTotals(workouts, sets), [workouts, sets]);
  const streak = useMemo(() => computeStreak(workouts), [workouts]);
  const weekly = useMemo(
    () => computeWeeklyVolume(workouts, sets, 8),
    [workouts, sets],
  );
  const split = useMemo(
    () => computeMuscleSplit(
      sets,
      exercises.map((e) => ({ id: e.id, primaryMuscle: e.primaryMuscle as MuscleEnum })),
      4,
    ),
    [sets, exercises],
  );
  const pbs = useMemo(
    () => listPbHistory(sets, exercises, 20),
    [sets, exercises],
  );

  if (workouts.length === 0) {
    return (
      <ScreenContainer>
        <BackButtonRow />
        <View style={styles.emptyHero}>
          <Text style={styles.emptyTitle}>No progress yet</Text>
          <Text style={styles.emptyText}>
            Log your first workout to see trends, PRs, and weekly volume.
          </Text>
          <PrimaryButton
            label="Back to Train"
            onPress={() => router.replace('/(tabs)/train' as Parameters<typeof router.replace>[0])}
          />
        </View>
      </ScreenContainer>
    );
  }

  const donutData = split.slice(0, 8).map((s) => ({
    key: s.muscle,
    value: s.sets,
    color: muscleColor(s.muscle),
  }));
  const legend = split.slice(0, 5);
  const extra = Math.max(0, split.length - 5);

  return (
    <ScreenContainer>
      <BackButtonRow />
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>last 8 weeks · 4-week split</Text>

      <View style={styles.stats}>
        <View style={styles.statRow}>
          <StatCard value={`${totals.workouts}`} label="Workouts" />
          <StatCard value={`${streak.currentWeeks}w`} label="Streak" tone="accent" />
        </View>
        <View style={styles.statRow}>
          <StatCard
            value={`${formatVolumeShort(totals.volume)}`}
            label="Volume (kg)"
          />
          <StatCard
            value={formatDuration(totals.durationSec)}
            label="Total time"
          />
        </View>
      </View>

      <Section title="Weekly volume + sessions">
        <BarChart
          data={weekly.map((p) => ({
            label: WEEK_LABEL(p.weekStart),
            value: p.volume,
            meta: p.workoutCount,
          }))}
        />
      </Section>

      <Section title="Muscle split · 4 weeks">
        <View style={styles.donutRow}>
          <DonutChart data={donutData} />
          <View style={styles.legend}>
            {legend.map((s) => (
              <View key={s.muscle} style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: muscleColor(s.muscle) }]}
                />
                <Text style={styles.legendText}>
                  {s.muscle} {s.pct}%
                </Text>
              </View>
            ))}
            {extra > 0 ? (
              <Text style={styles.legendMore}>+{extra} more</Text>
            ) : null}
          </View>
        </View>
      </Section>

      <Section title="Recent PRs">
        {pbs.length === 0 ? (
          <Text style={styles.emptyInline}>No PRs yet.</Text>
        ) : (
          pbs.map((p) => (
            <View key={p.setId} style={styles.pbRow}>
              <View style={styles.pbDot}>
                <Text style={styles.pbDotIcon}>🏆</Text>
              </View>
              <View style={styles.pbInfo}>
                <Text style={styles.pbName}>{p.exerciseName}</Text>
                <Text style={styles.pbMeta}>
                  {formatRelativeDate(p.createdAt)} · {p.reps} reps
                </Text>
              </View>
              <Text style={styles.pbWeight}>{p.weight} kg</Text>
            </View>
          ))
        )}
      </Section>
    </ScreenContainer>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
  },
  subtitle: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  stats: { gap: 8, marginBottom: 14 },
  statRow: { flexDirection: 'row', gap: 8 },
  section: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 13,
    color: tokens.color.fg,
    marginBottom: 8,
  },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  legend: { flex: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: tokens.font.sansMedium, fontSize: 12, color: tokens.color.fg },
  legendMore: { fontFamily: tokens.font.sansMedium, fontSize: 11, color: tokens.color.fgMuted, marginTop: 2 },
  pbRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  pbDot: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: tokens.color.accentSoft,
    borderWidth: 1.5,
    borderColor: tokens.color.accent,
  },
  pbDotIcon: { fontSize: 14 },
  pbInfo: { flex: 1, minWidth: 0 },
  pbName: { fontFamily: tokens.font.sansBold, fontSize: 13, color: tokens.color.fg },
  pbMeta: { fontFamily: tokens.font.sansMedium, fontSize: 11, color: tokens.color.fgMuted },
  pbWeight: { fontFamily: tokens.font.sansExtrabold, fontSize: 14, color: tokens.color.accent },
  emptyHero: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontFamily: tokens.font.sansExtrabold, fontSize: 18, color: tokens.color.fg },
  emptyText: { fontFamily: tokens.font.sansMedium, fontSize: 13, color: tokens.color.fgMuted, textAlign: 'center', marginBottom: 14 },
  emptyInline: { fontFamily: tokens.font.sansMedium, fontSize: 12, color: tokens.color.fgMuted },
});
