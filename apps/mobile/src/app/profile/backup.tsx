import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildBackup, parseBackup, mergeRows } from '@fitness/api';
import { db } from '../../db/client';
import {
  exercises,
  memberExercisePrefs,
  workouts,
  workoutSets,
  type LocalExercise,
  type LocalWorkout,
  type LocalWorkoutSet,
  type LocalMemberExercisePref,
} from '../../db/schema';
import { upsertExercise } from '../../db/repo';
import { eq, isNotNull } from 'drizzle-orm';
import { useAuth } from '../../lib/store';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButtonRow } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Pill } from '../../components/Pill';
import { tokens } from '../../theme/tokens';
import { useSync } from '../../workout/use-sync';

export default function BackupScreen() {
  const { member } = useAuth();
  const { pending, syncNow } = useSync();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // ── Export ────────────────────────────────────────────────────────────────

  const onExport = async () => {
    if (!member?.dbId) {
      Alert.alert('Not signed in', 'Sign in before exporting.');
      return;
    }
    setExporting(true);
    try {
      type Row = Record<string, unknown> & { id: string; updatedAt?: string };
      const json = buildBackup({
        memberId: member.dbId,
        exercises: db
          .select()
          .from(exercises)
          .where(isNotNull(exercises.memberId))
          .all() as Row[],
        memberPrefs: db
          .select()
          .from(memberExercisePrefs)
          .all() as Row[],
        workouts: db
          .select()
          .from(workouts)
          .where(eq(workouts.memberId, member.dbId))
          .all() as Row[],
        sets: db.select().from(workoutSets).all() as Row[],
      });

      const date = new Date().toISOString().slice(0, 10);
      const file = new File(Paths.cache, `fitclub-workouts-${date}.json`);
      file.write(json);

      await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
    } catch (e) {
      Alert.alert('Export failed', (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const onImport = async () => {
    setImporting(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });
      if (res.canceled || !res.assets?.[0]) return;

      let backup;
      try {
        const pickedFile = new File(res.assets[0].uri);
        const raw = await pickedFile.text();
        backup = parseBackup(raw);
      } catch (e) {
        Alert.alert('Import failed', (e as Error).message);
        return;
      }

      // ── Exercises ──
      const localExercises = db.select().from(exercises).all();
      const mergedExercises = mergeRows(
        localExercises as (LocalExercise & Record<string, unknown>)[],
        backup.exercises as (LocalExercise & Record<string, unknown>)[],
      );
      for (const row of mergedExercises) {
        upsertExercise(row as LocalExercise);
      }

      // ── Member exercise prefs ──
      const localPrefs = db.select().from(memberExercisePrefs).all();
      const mergedPrefs = mergeRows(
        localPrefs as (LocalMemberExercisePref & Record<string, unknown>)[],
        backup.memberPrefs as (LocalMemberExercisePref & Record<string, unknown>)[],
      );
      for (const row of mergedPrefs) {
        db.insert(memberExercisePrefs)
          .values(row as LocalMemberExercisePref)
          .onConflictDoUpdate({
            target: memberExercisePrefs.id,
            set: row as LocalMemberExercisePref,
          })
          .run();
      }

      // ── Workouts ──
      const localWorkouts = db.select().from(workouts).all();
      const mergedWorkouts = mergeRows(
        localWorkouts as (LocalWorkout & Record<string, unknown>)[],
        backup.workouts as (LocalWorkout & Record<string, unknown>)[],
      );
      for (const row of mergedWorkouts) {
        db.insert(workouts)
          .values({ ...(row as LocalWorkout), syncStatus: 'pending' })
          .onConflictDoUpdate({
            target: workouts.id,
            set: { ...(row as LocalWorkout), syncStatus: 'pending' },
          })
          .run();
      }

      // ── Workout sets ──
      const localSets = db.select().from(workoutSets).all();
      const mergedSets = mergeRows(
        localSets as (LocalWorkoutSet & Record<string, unknown>)[],
        backup.sets as (LocalWorkoutSet & Record<string, unknown>)[],
      );
      for (const row of mergedSets) {
        db.insert(workoutSets)
          .values(row as LocalWorkoutSet)
          .onConflictDoUpdate({
            target: workoutSets.id,
            set: row as LocalWorkoutSet,
          })
          .run();
      }

      const importedWorkouts = backup.workouts.length;
      const importedExercises = backup.exercises.length;
      Alert.alert(
        'Import complete',
        `Imported ${importedWorkouts} workout${importedWorkouts !== 1 ? 's' : ''}, ${importedExercises} custom exercise${importedExercises !== 1 ? 's' : ''}.`,
      );
    } finally {
      setImporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <BackButtonRow />
      <Text style={styles.h1}>Workout backup</Text>
      <Text style={styles.sub}>
        Export saves a backup file you can store in iCloud Drive or Google
        Drive. Import merges a backup back in — your existing data is never
        overwritten with older records.
      </Text>

      {/* Sync status */}
      <View style={styles.syncCard}>
        <View style={styles.syncRow}>
          <Pill
            label={pending === 0 ? 'All synced' : `${pending} pending`}
            tone={pending === 0 ? 'good' : 'warn'}
          />
          <Text style={styles.syncLabel}>
            {pending === 0
              ? 'Your workouts are up to date.'
              : `${pending} workout${pending !== 1 ? 's' : ''} waiting to sync.`}
          </Text>
        </View>
        {pending > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.syncNowBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={syncNow}
          >
            <Text style={styles.syncNowLabel}>Sync now</Text>
          </Pressable>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Export</Text>
          <Text style={styles.actionDesc}>
            Saves all your workouts and custom exercises to a{' '}
            <Text style={styles.mono}>.json</Text> file and opens the share
            sheet.
          </Text>
          <PrimaryButton
            label={exporting ? 'Exporting…' : 'Export backup'}
            onPress={onExport}
            disabled={exporting}
            variant="primary"
          />
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Import</Text>
          <Text style={styles.actionDesc}>
            Pick a previously exported{' '}
            <Text style={styles.mono}>fitclub-workouts-*.json</Text> file.
            Existing data is merged — nothing is deleted.
          </Text>
          <PrimaryButton
            label={importing ? 'Importing…' : 'Import backup'}
            onPress={onImport}
            disabled={importing}
            variant="secondary"
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 26,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    lineHeight: 19,
    marginBottom: 20,
  },

  // Sync card
  syncCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: 14,
    marginBottom: 18,
    gap: 10,
    ...tokens.shadow.sm,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  syncLabel: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    flex: 1,
  },
  syncNowBtn: {
    alignSelf: 'flex-end',
    height: 34,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.fg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncNowLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 13,
    color: tokens.color.surface,
  },

  // Actions
  actions: {
    gap: 14,
  },
  actionCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: 16,
    gap: 10,
    ...tokens.shadow.sm,
  },
  actionTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.fg,
  },
  actionDesc: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    lineHeight: 18,
  },
  mono: {
    fontFamily: tokens.font.mono,
    fontSize: 12,
  },
});
