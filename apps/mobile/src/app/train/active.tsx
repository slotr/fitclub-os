import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutSession } from '../../workout/session-store';
import { useRestTimer } from '../../workout/use-rest-timer';
import { useSync } from '../../workout/use-sync';
import { getExercise } from '../../db/repo';
import { RestTimerGauge } from '../../components/RestTimerGauge';
import { SupersetGroupBadge } from '../../components/SupersetGroupBadge';
import { tokens } from '../../theme/tokens';
import type { LocalWorkoutSet } from '../../db/schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtElapsed(sec: number): string {
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

function fmtRest(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

// ---------------------------------------------------------------------------
// RestBadge — inline tap-to-edit rest seconds
// ---------------------------------------------------------------------------

function RestBadge({
  restSec,
  onUpdate,
}: {
  restSec: number;
  onUpdate: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <Pressable style={styles.restBadge} onPress={() => setEditing(true)} hitSlop={6}>
        <Text style={styles.restBadgeText}>{fmtRest(restSec)}</Text>
      </Pressable>
    );
  }

  function adjust(delta: number) {
    const next = Math.min(900, Math.max(5, restSec + delta));
    onUpdate(next);
  }

  return (
    <View style={styles.restEditor}>
      <Pressable style={styles.restEditorBtn} onPress={() => adjust(-5)} hitSlop={6}>
        <Text style={styles.restEditorBtnTxt}>-5</Text>
      </Pressable>
      <Pressable style={styles.restEditorValue} onPress={() => setEditing(false)}>
        <Text style={styles.restEditorValueTxt}>{fmtRest(restSec)}</Text>
      </Pressable>
      <Pressable style={styles.restEditorBtn} onPress={() => adjust(5)} hitSlop={6}>
        <Text style={styles.restEditorBtnTxt}>+5</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SetRow
// ---------------------------------------------------------------------------

function SetRow({
  set,
  metric,
  done,
  onToggleDone,
  onUpdate,
  onUpdateRest,
}: {
  set: LocalWorkoutSet;
  metric: string;
  done: boolean;
  onToggleDone: () => void;
  onUpdate: (patch: Partial<LocalWorkoutSet>) => void;
  onUpdateRest: (v: number) => void;
}) {
  const isTime = metric === 'time';
  const isRepsOnly = metric === 'reps_only';

  return (
    <>
      {(set.plannedRepMin != null || set.plannedRepMax != null) && (
        <Text style={styles.targetHint}>
          Target {set.plannedRepMin === set.plannedRepMax
            ? (set.plannedRepMin ?? '')
            : `${set.plannedRepMin ?? '?'}-${set.plannedRepMax ?? '?'}`}
          {set.planned1rmPct ? ` @ ${set.planned1rmPct}%` : ''}
          {set.plannedRpe ? ` · RPE ${set.plannedRpe}` : ''}
        </Text>
      )}
      <View style={[styles.setRow, done && styles.setRowDone]}>
      {/* Set number */}
      <Text style={styles.setIndex}>{set.setIndex + 1}</Text>

      {/* Inputs */}
      <View style={styles.setInputs}>
        {/* Weight — only for weight_reps */}
        {!isTime && !isRepsOnly && (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.numInput}
              value={set.weight != null ? String(set.weight) : ''}
              onChangeText={(v) => {
                const n = parseFloat(v);
                onUpdate({ weight: isNaN(n) ? null : n });
              }}
              keyboardType="numeric"
              placeholder="kg"
              placeholderTextColor={tokens.color.fgFaint}
              selectTextOnFocus
            />
            <Text style={styles.inputUnit}>kg</Text>
          </View>
        )}

        {/* Reps — for weight_reps and reps_only */}
        {!isTime && (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.numInput}
              value={set.reps != null ? String(set.reps) : ''}
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                onUpdate({ reps: isNaN(n) ? null : n });
              }}
              keyboardType="numeric"
              placeholder="reps"
              placeholderTextColor={tokens.color.fgFaint}
              selectTextOnFocus
            />
            <Text style={styles.inputUnit}>reps</Text>
          </View>
        )}

        {/* Duration — for time metric only */}
        {isTime && (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.numInput}
              value={set.durationSec != null ? String(set.durationSec) : ''}
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                onUpdate({ durationSec: isNaN(n) ? null : n });
              }}
              keyboardType="numeric"
              placeholder="sec"
              placeholderTextColor={tokens.color.fgFaint}
              selectTextOnFocus
            />
            <Text style={styles.inputUnit}>sec</Text>
          </View>
        )}
      </View>

      {/* Rest badge */}
      <RestBadge
        restSec={set.restSec ?? 90}
        onUpdate={onUpdateRest}
      />

      {/* Done toggle */}
      <Pressable
        style={[styles.doneBtn, done && styles.doneBtnActive]}
        onPress={onToggleDone}
        hitSlop={6}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
      >
        {done && <Text style={styles.doneBtnCheck}>✓</Text>}
      </Pressable>
    </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// ExerciseCard
// ---------------------------------------------------------------------------

function ExerciseCard({
  exerciseId,
  sets,
  doneSets,
  onToggleDone,
  onUpdate,
  onAddSet,
}: {
  exerciseId: string;
  sets: LocalWorkoutSet[];
  doneSets: Set<string>;
  onToggleDone: (set: LocalWorkoutSet) => void;
  onUpdate: (id: string, patch: Partial<LocalWorkoutSet>) => void;
  onAddSet: (exerciseId: string) => void;
}) {
  const exercise = getExercise(exerciseId);
  const metric = exercise?.metric ?? 'weight_reps';

  return (
    <View style={styles.exerciseCard}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {exercise?.name ?? 'Unknown exercise'}
        </Text>
        {sets[0]?.supersetGroup != null && (
          <SupersetGroupBadge group={sets[0].supersetGroup} />
        )}
        {metric !== 'weight_reps' && (
          <View style={styles.metricBadge}>
            <Text style={styles.metricBadgeText}>
              {metric === 'time' ? 'Time' : 'Reps only'}
            </Text>
          </View>
        )}
      </View>

      {/* Column labels */}
      <View style={styles.colLabels}>
        <Text style={[styles.colLabel, styles.colLabelSet]}>SET</Text>
        <View style={styles.setInputs}>
          {metric !== 'time' && metric !== 'reps_only' && (
            <Text style={[styles.colLabel, styles.colLabelInput]}>WEIGHT</Text>
          )}
          {metric !== 'time' && (
            <Text style={[styles.colLabel, styles.colLabelInput]}>REPS</Text>
          )}
          {metric === 'time' && (
            <Text style={[styles.colLabel, styles.colLabelInput]}>DURATION</Text>
          )}
        </View>
        <Text style={[styles.colLabel, styles.colLabelRest]}>REST</Text>
        <Text style={[styles.colLabel, styles.colLabelDone]}></Text>
      </View>

      {/* Set rows */}
      {sets.map((s) => (
        <SetRow
          key={s.id}
          set={s}
          metric={metric}
          done={doneSets.has(s.id)}
          onToggleDone={() => onToggleDone(s)}
          onUpdate={(patch) => onUpdate(s.id, patch)}
          onUpdateRest={(v) => onUpdate(s.id, { restSec: v })}
        />
      ))}

      {/* Add set */}
      <Pressable
        style={styles.addSetBtn}
        onPress={() => onAddSet(exerciseId)}
      >
        <Text style={styles.addSetBtnText}>+ Add set</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { workout, sets, addSet, updateSet, finishWorkout, discardWorkout } =
    useWorkoutSession();
  const rest = useRestTimer();
  const { syncNow } = useSync();

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!workout) return;
    const t = setInterval(() => {
      setElapsed(
        Math.round((Date.now() - new Date(workout.startedAt).getTime()) / 1000),
      );
    }, 1000);
    return () => clearInterval(t);
  }, [workout]);

  // Local "done" set ids (for checkbox visual)
  const [doneSets, setDoneSets] = useState<Set<string>>(new Set());

  // Local paused state (useRestTimer doesn't expose paused directly)
  const [paused, setPaused] = useState(false);

  // Group sets by exerciseId, ordered by orderIndex
  const exerciseGroups = useMemo(() => {
    const map = new Map<string, LocalWorkoutSet[]>();
    for (const s of sets) {
      if (!map.has(s.exerciseId)) map.set(s.exerciseId, []);
      map.get(s.exerciseId)!.push(s);
    }
    // Sort each group by setIndex
    for (const arr of map.values()) {
      arr.sort((a, b) => a.setIndex - b.setIndex);
    }
    // Build ordered list by first set's orderIndex
    return [...map.entries()].sort(
      ([, a], [, b]) => (a[0]?.orderIndex ?? 0) - (b[0]?.orderIndex ?? 0),
    );
  }, [sets]);

  // Guard: no active workout
  if (!workout) {
    return (
      <View style={[styles.emptyScreen, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.emptyTitle}>No active workout</Text>
        <Text style={styles.emptyBody}>Start a workout from the Train tab.</Text>
        <Pressable style={styles.backPressable} onPress={() => router.back()}>
          <Text style={styles.backPressableText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  function handleToggleDone(set: LocalWorkoutSet) {
    setDoneSets((prev) => {
      const next = new Set(prev);
      if (next.has(set.id)) {
        next.delete(set.id);
      } else {
        next.add(set.id);
        const defaultRest =
          getExercise(set.exerciseId)?.defaultRestSec ?? 90;
        rest.start(set.restSec ?? defaultRest);
        setPaused(false);
      }
      return next;
    });
  }

  function handleTogglePause() {
    rest.togglePause();
    setPaused((p) => !p);
  }

  function handleFinish() {
    const id = finishWorkout();
    if (id) {
      void syncNow();
      router.replace(`/train/workout/${id}` as Parameters<typeof router.replace>[0]);
    }
  }

  function handleDiscard() {
    Alert.alert(
      'Discard workout',
      'All logged sets will be lost. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardWorkout();
            router.replace('/(tabs)/train' as Parameters<typeof router.replace>[0]);
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleDiscard} hitSlop={8}>
            <Text style={styles.discardText}>Discard</Text>
          </Pressable>
        </View>
        <View style={styles.timerWrap}>
          <Text style={styles.timerText}>{fmtElapsed(elapsed)}</Text>
          {workout?.programDayId && (
            <Text style={styles.programSubtitle}>From program</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>Finish</Text>
          </Pressable>
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                              */}
      {/* ------------------------------------------------------------------ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {exerciseGroups.length === 0 ? (
          <View style={styles.emptyExercises}>
            <Text style={styles.emptyExercisesTitle}>No exercises yet</Text>
            <Text style={styles.emptyExercisesBody}>
              Tap "Add exercise" below to get started.
            </Text>
          </View>
        ) : (
          exerciseGroups.map(([exerciseId, groupSets]) => (
            <ExerciseCard
              key={exerciseId}
              exerciseId={exerciseId}
              sets={groupSets}
              doneSets={doneSets}
              onToggleDone={handleToggleDone}
              onUpdate={updateSet}
              onAddSet={addSet}
            />
          ))
        )}

        {/* Add exercise */}
        <Pressable
          style={styles.addExerciseBtn}
          onPress={() =>
            router.push(
              '/train/exercises?mode=picker' as Parameters<typeof router.push>[0],
            )
          }
        >
          <Text style={styles.addExerciseBtnText}>+ Add exercise</Text>
        </Pressable>
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* Rest timer overlay                                                   */}
      {/* ------------------------------------------------------------------ */}
      {rest.running && (
        <View style={[StyleSheet.absoluteFill, styles.restOverlay]}>
          <RestTimerGauge
            remainingSec={rest.remainingSec}
            targetSec={rest.targetSec}
            paused={paused}
            onMinus={() => rest.addSeconds(-5)}
            onPlus={() => rest.addSeconds(5)}
            onTogglePause={handleTogglePause}
            onSkip={rest.skip}
          />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint,
    backgroundColor: tokens.color.surface,
    ...tokens.shadow.sm,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timerWrap: {
    alignItems: 'center',
  },
  timerText: {
    fontFamily: tokens.font.monoSemibold,
    fontSize: 22,
    color: tokens.color.fg,
    letterSpacing: 1,
  },
  discardText: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 14,
    color: tokens.color.bad,
  },
  finishBtn: {
    backgroundColor: tokens.color.accent,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  finishBtnText: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 14,
    color: tokens.color.accentFg,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    ...tokens.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
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

  // Column labels
  colLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint,
  },
  colLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 9,
    color: tokens.color.fgFaint,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  colLabelSet: {
    width: 28,
    textAlign: 'center',
  },
  colLabelInput: {
    flex: 1,
    textAlign: 'center',
  },
  colLabelRest: {
    width: 56,
    textAlign: 'center',
  },
  colLabelDone: {
    width: 36,
  },

  // Set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint,
    gap: 4,
  },
  setRowDone: {
    backgroundColor: tokens.color.goodSoft,
  },
  setIndex: {
    width: 28,
    textAlign: 'center',
    fontFamily: tokens.font.monoSemibold,
    fontSize: 13,
    color: tokens.color.fgMuted,
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  numInput: {
    width: '100%',
    height: 38,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg,
    textAlign: 'center',
    fontFamily: tokens.font.monoSemibold,
    fontSize: 15,
    color: tokens.color.fg,
    paddingHorizontal: 4,
  },
  inputUnit: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 9,
    color: tokens.color.fgFaint,
    letterSpacing: 0.3,
  },

  // Rest badge
  restBadge: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.accentSoft,
    borderRadius: tokens.radius.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  restBadgeText: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.warnFg,
  },
  restEditor: {
    width: 56,
    alignItems: 'center',
    gap: 2,
  },
  restEditorBtn: {
    width: 52,
    alignItems: 'center',
    backgroundColor: tokens.color.accentSoft,
    borderRadius: tokens.radius.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: tokens.color.accent,
  },
  restEditorBtnTxt: {
    fontFamily: tokens.font.sansBold,
    fontSize: 11,
    color: tokens.color.warnFg,
  },
  restEditorValue: {
    paddingVertical: 2,
  },
  restEditorValueTxt: {
    fontFamily: tokens.font.monoSemibold,
    fontSize: 11,
    color: tokens.color.fg,
  },

  // Done button
  doneBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  doneBtnActive: {
    backgroundColor: tokens.color.good,
    borderColor: tokens.color.good,
  },
  doneBtnCheck: {
    fontFamily: tokens.font.sansBold,
    fontSize: 14,
    color: tokens.color.surface,
    lineHeight: 16,
  },

  // Add set
  addSetBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  addSetBtnText: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 13,
    color: tokens.color.info,
  },

  // Add exercise
  addExerciseBtn: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.color.border,
    borderStyle: 'dashed',
    ...tokens.shadow.sm,
  },
  addExerciseBtnText: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 15,
    color: tokens.color.fgMuted,
  },

  // Rest overlay
  restOverlay: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },

  // Empty states
  emptyScreen: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 18,
    color: tokens.color.fg,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  backPressable: {
    backgroundColor: tokens.color.fg,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backPressableText: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 15,
    color: tokens.color.surface,
  },
  emptyExercises: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: 32,
    alignItems: 'center',
    ...tokens.shadow.sm,
  },
  emptyExercisesTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.fg,
    marginBottom: 6,
  },
  emptyExercisesBody: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  targetHint: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    fontStyle: 'italic',
    marginBottom: 4,
    paddingHorizontal: 14,
  },
  programSubtitle: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
