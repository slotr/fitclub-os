import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButton } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { tokens } from '../../theme/tokens';
import { listExercises } from '../../db/repo';
import { useWorkoutSession } from '../../workout/session-store';
import { useAuth } from '../../lib/store';
import type { LocalExercise } from '../../db/schema';

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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ExercisesScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isPicker = mode === 'picker';
  const { member } = useAuth();
  const { addExercise } = useWorkoutSession();

  const [query, setQuery] = useState('');
  const [muscles, setMuscles] = useState<Set<Muscle>>(new Set());
  const [equipment, setEquipment] = useState<Set<Equipment>>(new Set());

  const allExercises: LocalExercise[] = useMemo(
    () => (member?.dbId ? listExercises(member.dbId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [member?.dbId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allExercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (muscles.size > 0 && !muscles.has(ex.primaryMuscle as Muscle)) return false;
      if (equipment.size > 0 && !equipment.has(ex.equipment as Equipment)) return false;
      return true;
    });
  }, [allExercises, query, muscles, equipment]);

  function toggleMuscle(id: Muscle) {
    setMuscles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleEquipment(id: Equipment) {
    setEquipment((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelect(ex: LocalExercise) {
    if (isPicker) {
      addExercise(ex.id);
      router.back();
    } else {
      router.push(`/train/exercise/${ex.id}`);
    }
  }

  const hasFilters = muscles.size > 0 || equipment.size > 0;

  return (
    <ScreenContainer padding={20}>
      {/* Header */}
      <View style={styles.headerRow}>
        <BackButton />
        <Text style={styles.h1}>{isPicker ? 'Add Exercise' : 'Exercise Library'}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises…"
          placeholderTextColor={tokens.color.fgFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Muscle chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipStrip}
        contentContainerStyle={styles.chipStripInner}
      >
        {MUSCLES.map((m) => {
          const active = muscles.has(m.id);
          return (
            <Pressable
              key={m.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleMuscle(m.id)}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Equipment chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipStrip}
        contentContainerStyle={styles.chipStripInner}
      >
        {EQUIPMENT.map((e) => {
          const active = equipment.has(e.id);
          return (
            <Pressable
              key={e.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleEquipment(e.id)}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {e.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Filter summary */}
      {hasFilters && (
        <Pressable
          onPress={() => {
            setMuscles(new Set());
            setEquipment(new Set());
          }}
        >
          <Text style={styles.clearFilters}>Clear filters</Text>
        </Pressable>
      )}

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
      </Text>

      {/* Exercise list */}
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No exercises found</Text>
            <Text style={styles.emptyBody}>
              Try adjusting your search or filters.
            </Text>
          </View>
        ) : (
          filtered.map((ex, idx) => (
            <Pressable
              key={ex.id}
              style={[
                styles.row,
                idx === filtered.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => handleSelect(ex)}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {ex.name}
                </Text>
                <Text style={styles.rowMeta}>
                  {capitalise(ex.primaryMuscle)} · {capitalise(ex.equipment)}
                </Text>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </Pressable>
          ))
        )}
      </View>

      {/* Create custom */}
      <PrimaryButton
        label="Create custom exercise"
        variant="secondary"
        onPress={() => router.push('/train/exercise/new')}
        style={styles.createBtn}
      />
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalise(s: string): string {
  if (!s) return s;
  // camelCase → "Full Body"
  const spaced = s.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
    letterSpacing: -0.4,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
    ...tokens.shadow.sm,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: tokens.font.sansMedium,
    fontSize: 14,
    color: tokens.color.fg,
    padding: 0,
    margin: 0,
  },

  chipStrip: {
    marginBottom: 6,
  },
  chipStripInner: {
    gap: 6,
    paddingRight: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 11,
    color: tokens.color.fgMuted,
  },
  chipLabelActive: {
    fontFamily: tokens.font.sansSemibold,
    color: tokens.color.warnFg,
  },

  clearFilters: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: tokens.color.info,
    textAlign: 'right',
    marginBottom: 4,
  },

  resultsCount: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 10,
    color: tokens.color.fgFaint,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 6,
    marginLeft: 2,
  },

  list: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    marginBottom: 14,
    ...tokens.shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint,
  },
  rowLeft: {
    flex: 1,
    marginRight: 8,
  },
  rowName: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 14,
    color: tokens.color.fg,
    marginBottom: 2,
  },
  rowMeta: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgMuted,
  },
  rowChevron: {
    fontFamily: tokens.font.sansBold,
    fontSize: 20,
    color: tokens.color.fgFaint,
    lineHeight: 22,
  },

  empty: {
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 14,
    color: tokens.color.fg,
    marginBottom: 4,
  },
  emptyBody: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    textAlign: 'center',
  },

  createBtn: {
    marginBottom: 8,
  },
});
