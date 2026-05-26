import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { eq } from 'drizzle-orm';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Pill } from '../../components/Pill';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';
import { useWorkoutSession } from '../../workout/session-store';
import { useSync } from '../../workout/use-sync';
import { listWorkouts, listSets } from '../../db/repo';
import { db } from '../../db/client';
import { getTodayDay, listPrograms, completeProgramDay } from '../../db/api/programs';
import { listTemplates } from '../../db/api/templates';
import { workoutTemplateExercises, type LocalProgram, type LocalWorkoutTemplate, type LocalProgramDay } from '../../db/schema';
import { TemplateCard } from '../../components/TemplateCard';
import { ProgramCard } from '../../components/ProgramCard';
import { TodayCard } from '../../components/TodayCard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function TrainScreen() {
  const router = useRouter();
  const { member } = useAuth();
  const { workout, startWorkout } = useWorkoutSession();
  const { pending } = useSync();

  const memberId = member?.dbId;
  const history = memberId ? listWorkouts(memberId, 10) : [];
  const last = history[0];

  const [today, setToday] = useState<{ program: LocalProgram; day: LocalProgramDay } | null>(null);
  const [templates, setTemplates] = useState<LocalWorkoutTemplate[]>([]);
  const [programs, setPrograms] = useState<LocalProgram[]>([]);
  const [templateExCounts, setTemplateExCounts] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      if (memberId) {
        const tplList = listTemplates(memberId).slice(0, 8);
        setTemplates(tplList);
        const counts: Record<string, number> = {};
        for (const t of tplList) {
          counts[t.id] = db.select().from(workoutTemplateExercises)
            .where(eq(workoutTemplateExercises.templateId, t.id)).all().length;
        }
        setTemplateExCounts(counts);
        setPrograms(listPrograms(memberId).slice(0, 3));
        setToday(getTodayDay(memberId));
      }
    }, [memberId]),
  );

  const onRepeat = () => {
    if (last && !workout) startWorkout({ sourceWorkoutId: last.id });
    router.push('/train/active');
  };

  return (
    <ScreenContainer padding={20} contentStyle={{ paddingTop: 8 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.h1}>Train</Text>
        {workout && (
          <Pill label="Session active" tone="good" />
        )}
      </View>

      {/* Today card */}
      {today && (
        <TodayCard
          program={today.program}
          day={today.day}
          exerciseCount={
            today.day.templateId
              ? (templateExCounts[today.day.templateId] ?? 0)
              : 0
          }
          onStart={() => {
            startWorkout({ programDayId: today.day.id });
            router.push('/train/active' as Parameters<typeof router.push>[0]);
          }}
          onMarkRest={() => {
            if (memberId) {
              completeProgramDay(today.program.id, today.day.id, memberId, null);
              setToday(getTodayDay(memberId));
            }
          }}
        />
      )}

      {/* Templates section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderLabel}>Templates</Text>
        <Pressable onPress={() => router.push('/train/templates' as Parameters<typeof router.push>[0])}>
          <Text style={styles.seeAll}>See all →</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            exerciseCount={templateExCounts[t.id] ?? 0}
            onPress={() => router.push(`/train/templates/${t.id}` as Parameters<typeof router.push>[0])}
          />
        ))}
        <Pressable
          style={styles.createTplCard}
          onPress={() => router.push('/train/templates/new' as Parameters<typeof router.push>[0])}
        >
          <Text style={styles.createTplText}>+ Create</Text>
        </Pressable>
      </ScrollView>

      {/* Programs section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderLabel}>Programs</Text>
        <Pressable onPress={() => router.push('/train/programs' as Parameters<typeof router.push>[0])}>
          <Text style={styles.seeAll}>See all →</Text>
        </Pressable>
      </View>
      {programs.map((p) => (
        <ProgramCard
          key={p.id}
          program={p}
          completedCount={0}
          onPress={() => router.push(`/train/programs/${p.id}` as Parameters<typeof router.push>[0])}
        />
      ))}
      <View style={styles.programActions}>
        <Pressable
          style={styles.smallBtn}
          onPress={() => router.push('/train/programs/presets' as Parameters<typeof router.push>[0])}
        >
          <Text style={styles.smallBtnText}>📚 Browse presets</Text>
        </Pressable>
        <Pressable
          style={styles.smallBtn}
          onPress={() => router.push('/train/programs/new' as Parameters<typeof router.push>[0])}
        >
          <Text style={styles.smallBtnText}>+ Create</Text>
        </Pressable>
      </View>

      {/* Resume active workout if one is in progress */}
      {workout && (
        <PrimaryButton
          label="Resume workout"
          onPress={() => router.push('/train/active')}
          variant="primary"
          style={styles.cta}
        />
      )}

      {/* Repeat last workout */}
      {last && (
        <Pressable style={styles.repeatCard} onPress={onRepeat}>
          <View style={styles.repeatLeft}>
            <Text style={styles.repeatLabel}>Repeat last workout</Text>
            <Text style={styles.repeatTitle} numberOfLines={1}>{last.title}</Text>
          </View>
          <Text style={styles.repeatDate}>{relativeDate(last.startedAt)}</Text>
        </Pressable>
      )}

      {/* Exercise library */}
      <Pressable
        style={styles.libraryRow}
        onPress={() => router.push('/train/exercises')}
      >
        <Text style={styles.libraryLabel}>Exercise library</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {/* Progress card */}
      <Pressable
        onPress={() => router.push('/train/progress')}
        style={styles.progressCard}
      >
        <Text style={styles.progressTitle}>📊 Progress</Text>
        <Text style={styles.progressSub}>1RM trends, PBs, weekly volume →</Text>
      </Pressable>

      {/* Challenges card */}
      <Pressable
        onPress={() => router.push('/train/challenges')}
        style={styles.challengesCard}
      >
        <Text style={styles.challengesTitle}>🏆 Challenges</Text>
        <Text style={styles.challengesSub}>Join leaderboards →</Text>
      </Pressable>

      {/* History section */}
      <Text style={styles.sectionLabel}>Recent workouts</Text>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptyBody}>
            Pick a template or program above to log your first session.
          </Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {history.map((w, idx) => {
            const setCount = listSets(w.id).length;
            return (
              <Pressable
                key={w.id}
                style={[
                  styles.historyRow,
                  idx === history.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => router.push(`/train/workout/${w.id}`)}
              >
                <View style={styles.historyLeft}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {w.title}
                  </Text>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyMetaText}>
                      {relativeDate(w.startedAt)}
                    </Text>
                    {w.durationSec > 0 && (
                      <>
                        <Text style={styles.historyDot}>·</Text>
                        <Text style={styles.historyMetaText}>
                          {fmtDuration(w.durationSec)}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyVolume}>
                    {Number(w.totalVolume).toLocaleString('en-US')} kg
                  </Text>
                  <Text style={styles.historySetCount}>{setCount} sets</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Sync status */}
      <Text style={[styles.syncLine, pending > 0 && styles.syncPending]}>
        {pending === 0 ? 'All synced' : `${pending} workout${pending === 1 ? '' : 's'} pending`}
      </Text>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 26,
    color: tokens.color.fg,
    letterSpacing: -0.5,
  },

  cta: {
    marginBottom: 12,
  },

  repeatCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    ...tokens.shadow.sm,
  },
  repeatLeft: {
    flex: 1,
    marginRight: 12,
  },
  repeatLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 10,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  repeatTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 14,
    color: tokens.color.fg,
  },
  repeatDate: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },

  libraryRow: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    ...tokens.shadow.sm,
  },
  libraryLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 14,
    color: tokens.color.fg,
  },
  chevron: {
    fontFamily: tokens.font.sansBold,
    fontSize: 20,
    color: tokens.color.fgMuted,
    lineHeight: 22,
  },

  progressCard: {
    backgroundColor: tokens.color.accentSoft ?? '#fff4d6',
    borderWidth: 1,
    borderColor: tokens.color.accent,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  progressTitle: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 14,
    color: tokens.color.accent,
  },
  progressSub: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },

  challengesCard: {
    backgroundColor: '#e7eef9',
    borderWidth: 1,
    borderColor: '#aac4ec',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  challengesTitle: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 14,
    color: '#2f5596',
  },
  challengesSub: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },

  sectionLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },

  emptyState: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    ...tokens.shadow.sm,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.fg,
    marginBottom: 4,
  },
  emptyBody: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    textAlign: 'center',
    lineHeight: 19,
  },

  historyList: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    ...tokens.shadow.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint,
  },
  historyLeft: {
    flex: 1,
    marginRight: 12,
  },
  historyTitle: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 14,
    color: tokens.color.fg,
    marginBottom: 2,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyMetaText: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },
  historyDot: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgFaint,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyVolume: {
    fontFamily: tokens.font.monoSemibold,
    fontSize: 13,
    color: tokens.color.fg,
    marginBottom: 1,
  },
  historySetCount: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgMuted,
  },

  syncLine: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgFaint,
    textAlign: 'center',
    marginTop: 16,
  },
  syncPending: {
    color: tokens.color.warnFg,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeaderLabel: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 13,
    color: tokens.color.fg,
  },
  seeAll: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },
  templateScroll: {
    marginVertical: 8,
  },
  createTplCard: {
    width: 100,
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.color.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTplText: {
    fontFamily: tokens.font.sansBold,
    fontSize: 13,
    color: tokens.color.fgMuted,
  },
  programActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  smallBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  smallBtnText: {
    fontFamily: tokens.font.sansBold,
    fontSize: 12,
  },
});
