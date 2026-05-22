import { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { BackButton } from '../../../components/BackButton';
import { Pill } from '../../../components/Pill';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { tokens } from '../../../theme/tokens';
import { getWorkout, listSets, getExercise } from '../../../db/repo';
import { useWorkoutSession } from '../../../workout/session-store';
import type { LocalWorkoutSet } from '../../../db/schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDuration(sec: number): string {
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  const h = Math.floor(sec / 3600);
  const rem = sec % 3600;
  const m = Math.floor(rem / 60);
  const s = rem % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function fmtSetValue(set: LocalWorkoutSet, metric: string): string {
  switch (metric) {
    case 'weight_reps':
      return `${set.weight ?? '—'}×${set.reps ?? '—'}`;
    case 'reps_only':
      return `${set.reps ?? '—'} reps`;
    case 'time':
      return `${set.durationSec ?? '—'}s`;
    default:
      return `${set.weight ?? '—'}×${set.reps ?? '—'}`;
  }
}

// ---------------------------------------------------------------------------
// PR Banner
// ---------------------------------------------------------------------------

function PrBanner({ sets }: { sets: LocalWorkoutSet[] }) {
  const prSets = sets.filter((s) => s.isPr === 1);
  if (prSets.length === 0) return null;

  // Deduplicate by exerciseId, pick heaviest weight for display
  const byExercise = new Map<string, LocalWorkoutSet>();
  for (const s of prSets) {
    const existing = byExercise.get(s.exerciseId);
    if (!existing || (s.weight ?? 0) > (existing.weight ?? 0)) {
      byExercise.set(s.exerciseId, s);
    }
  }

  const lines: string[] = [];
  for (const [exerciseId, s] of byExercise) {
    const name = getExercise(exerciseId)?.name ?? 'Unknown';
    const weightStr = s.weight != null ? ` ${s.weight} kg` : '';
    lines.push(`${name}${weightStr}`);
  }

  return (
    <View style={styles.prBanner}>
      <Text style={styles.prBannerTitle}>New PR</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.prBannerLine}>
          {line}
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Exercise Breakdown Card
// ---------------------------------------------------------------------------

function ExerciseBreakdownCard({
  exerciseId,
  sets,
}: {
  exerciseId: string;
  sets: LocalWorkoutSet[];
}) {
  const exercise = getExercise(exerciseId);
  const metric = exercise?.metric ?? 'weight_reps';
  const name = exercise?.name ?? 'Unknown exercise';

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {name}
        </Text>
        {metric !== 'weight_reps' && (
          <View style={styles.metricBadge}>
            <Text style={styles.metricBadgeText}>
              {metric === 'time' ? 'Time' : 'Reps only'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {sets.map((s, idx) => {
        const isPr = s.isPr === 1;
        const isWarmup = s.isWarmup === 1;
        return (
          <View
            key={s.id}
            style={[
              styles.setRow,
              isPr && styles.setRowPr,
              idx < sets.length - 1 && styles.setRowBorder,
            ]}
          >
            <Text style={styles.setNumber}>{s.setIndex + 1}</Text>
            <Text style={styles.setValue}>{fmtSetValue(s, metric)}</Text>
            <View style={styles.setBadges}>
              {isWarmup && <Pill label="Warm-up" tone="outline" />}
              {isPr && <Pill label="PR" tone="warn" />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workout: activeWorkout, startWorkout } = useWorkoutSession();

  const workout = id ? getWorkout(id) : undefined;
  const sets = useMemo(() => (id ? listSets(id) : []), [id]);

  // Group sets by exerciseId, ordered by orderIndex
  const exerciseGroups = useMemo(() => {
    const map = new Map<string, LocalWorkoutSet[]>();
    for (const s of sets) {
      if (!map.has(s.exerciseId)) map.set(s.exerciseId, []);
      map.get(s.exerciseId)!.push(s);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.setIndex - b.setIndex);
    }
    return [...map.entries()].sort(
      ([, a], [, b]) => (a[0]?.orderIndex ?? 0) - (b[0]?.orderIndex ?? 0),
    );
  }, [sets]);

  const hasPr = sets.some((s) => s.isPr === 1);

  // Not found guard
  if (!workout) {
    return (
      <ScreenContainer padding={20}>
        <View style={styles.headerRow}>
          <BackButton />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Workout not found</Text>
          <Text style={styles.notFoundBody}>
            This workout may have been deleted.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  function handleRepeat() {
    if (activeWorkout) {
      Alert.alert(
        'Active workout in progress',
        'Please finish or discard your current workout before starting a new one.',
        [{ text: 'OK', style: 'default' }],
      );
      return;
    }
    startWorkout(workout!.id);
    router.replace('/train/active' as Parameters<typeof router.replace>[0]);
  }

  const volumeStr = `${Number(workout.totalVolume).toLocaleString('en-US')} kg`;
  const dateStr = fmtDate(workout.startedAt);
  const durationStr = fmtDuration(workout.durationSec);

  return (
    <ScreenContainer padding={20}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <BackButton />
      </View>

      {/* Workout title */}
      <Text style={styles.workoutTitle}>{workout.title}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Date</Text>
          <Text style={styles.statValue}>{dateStr}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{durationStr}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>{volumeStr}</Text>
        </View>
      </View>

      {/* PR banner */}
      {hasPr && <PrBanner sets={sets} />}

      {/* Notes */}
      {workout.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <Text style={styles.notesText}>{workout.notes}</Text>
        </View>
      ) : null}

      {/* Exercise breakdown */}
      {exerciseGroups.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Exercises</Text>
          {exerciseGroups.map(([exerciseId, groupSets]) => (
            <ExerciseBreakdownCard
              key={exerciseId}
              exerciseId={exerciseId}
              sets={groupSets}
            />
          ))}
        </>
      )}

      {/* Repeat button */}
      <View style={styles.repeatWrap}>
        <PrimaryButton
          label="Repeat this workout"
          variant="accent"
          onPress={handleRepeat}
        />
      </View>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  workoutTitle: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 26,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginBottom: 14,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    ...tokens.shadow.sm,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: tokens.color.borderFaint,
    marginVertical: 2,
  },
  statLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 9,
    color: tokens.color.fgFaint,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: tokens.font.sansBold,
    fontSize: 13,
    color: tokens.color.fg,
    letterSpacing: -0.2,
  },

  // PR Banner
  prBanner: {
    backgroundColor: tokens.color.accentSoft,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 4,
  },
  prBannerTitle: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 13,
    color: tokens.color.warnFg,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  prBannerLine: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 14,
    color: tokens.color.fg,
  },

  // Notes
  notesCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: 16,
    marginBottom: 16,
    ...tokens.shadow.sm,
  },
  notesText: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fg,
    lineHeight: 20,
  },

  // Section label
  sectionLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 10,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
    ...tokens.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.fg,
    letterSpacing: -0.2,
  },
  metricBadge: {
    backgroundColor: tokens.color.accentSoft,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  metricBadgeText: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 10,
    color: tokens.color.warnFg,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.color.borderFaint,
    marginHorizontal: 14,
    marginBottom: 2,
  },

  // Set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  setRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint,
  },
  setRowPr: {
    backgroundColor: tokens.color.accentSoft,
  },
  setNumber: {
    width: 24,
    textAlign: 'center',
    fontFamily: tokens.font.monoSemibold,
    fontSize: 13,
    color: tokens.color.fgMuted,
  },
  setValue: {
    flex: 1,
    fontFamily: tokens.font.monoSemibold,
    fontSize: 15,
    color: tokens.color.fg,
    letterSpacing: -0.2,
  },
  setBadges: {
    flexDirection: 'row',
    gap: 4,
  },

  // Repeat button
  repeatWrap: {
    marginTop: 8,
    marginBottom: 8,
  },

  // Not found
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
