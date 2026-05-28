import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Pill } from '../../components/Pill';
import { AppHeader } from '../../components/AppHeader';
import { tokens } from '../../theme/tokens';
import { classes as mockClasses, type GymClass, type ClassCategory } from '../../mocks/classes';
import { fetchUpcomingSessions, live, type LiveSession } from '../../lib/api';

const DAY_TABS = ['Today', 'Sat 26', 'Sun 27', 'Mon 28', 'Tue 29', 'Wed 30'] as const;
const FILTERS: { id: 'all' | ClassCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'cross', label: 'CrossFit' },
  { id: 'pilates', label: 'Pilates' },
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Spin' },
];

const CAT_BG: Record<ClassCategory, string> = {
  yoga: tokens.color.cat.yoga,
  cross: tokens.color.cat.cross,
  pilates: tokens.color.cat.pilates,
  strength: tokens.color.cat.strength,
  cardio: tokens.color.cat.cardio,
  pt: tokens.color.cat.pt,
};
const CAT_FG: Record<ClassCategory, string> = {
  yoga: tokens.color.cat.yogaFg,
  cross: tokens.color.cat.crossFg,
  pilates: tokens.color.cat.pilatesFg,
  strength: tokens.color.cat.strengthFg,
  cardio: tokens.color.cat.cardioFg,
  pt: tokens.color.cat.ptFg,
};

type Item = {
  id: string;
  name: string;
  category: ClassCategory;
  instructor: string;
  booked: number;
  capacity: number;
  startsLabel: string;
  status: 'open' | 'waitlist' | 'full';
  badge: string;
};

function shapeMock(c: GymClass): Item {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    instructor: c.instructor,
    booked: c.booked,
    capacity: c.capacity,
    startsLabel: c.startsAt,
    status: c.status,
    badge: c.badge,
  };
}

function shapeLive(s: LiveSession): Item {
  const date = new Date(s.startsAt);
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const status: Item['status'] =
    s.booked >= s.capacity
      ? 'full'
      : s.booked >= s.capacity - 1
        ? 'waitlist'
        : 'open';
  const badgeMap: Record<string, string> = {
    yoga: '🧘',
    cross: '🏋️',
    pilates: '🤸',
    strength: '💪',
    cardio: '🚴',
    pt: '🥊',
  };
  return {
    id: s.id,
    name: s.className,
    category: s.category as ClassCategory,
    instructor: s.instructor ?? 'TBA',
    booked: s.booked,
    capacity: s.capacity,
    startsLabel: time,
    status,
    badge: badgeMap[s.category] ?? '⭐',
  };
}

export default function ClassesScreen() {
  const router = useRouter();
  const [day, setDay] = useState<(typeof DAY_TABS)[number]>('Today');
  const [filter, setFilter] = useState<'all' | ClassCategory>('all');
  const [liveItems, setLiveItems] = useState<Item[] | null>(null);

  useEffect(() => {
    let active = true;
    if (!live.configured()) {
      setLiveItems(null);
      return;
    }
    fetchUpcomingSessions(40).then((rows) => {
      if (!active) return;
      setLiveItems(rows.map(shapeLive));
    });
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo<Item[]>(() => {
    const source: Item[] = liveItems ?? mockClasses.map(shapeMock);
    return source.filter((c) => filter === 'all' || c.category === filter);
  }, [filter, liveItems]);

  return (
    <ScreenContainer padding={20}>
      <AppHeader title="Classes" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayStrip}
        contentContainerStyle={styles.dayStripInner}
      >
        {DAY_TABS.map((d) => {
          const active = day === d;
          return (
            <Pressable
              key={d}
              style={[styles.dayTab, active && styles.dayTabActive]}
              onPress={() => setDay(d)}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{d}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ gap: 8 }}>
        {items.map((c) => (
          <Pressable
            key={c.id}
            style={[
              styles.card,
              { borderLeftColor: CAT_FG[c.category], borderLeftWidth: 3 },
            ]}
            onPress={() => router.push(`/class/${c.id}`)}
          >
            <View style={[styles.icon, { backgroundColor: CAT_BG[c.category] }]}>
              <Text style={[styles.iconLetter, { color: CAT_FG[c.category] }]}>
                {c.badge}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{c.name}</Text>
              <Text style={styles.cardMeta}>
                <Text style={styles.cardMetaStrong}>{c.startsLabel}</Text>
                {' · '}
                {c.instructor}
                {' · '}
                <Text style={styles.cardMetaStrong}>
                  {c.booked}/{c.capacity}
                </Text>
              </Text>
            </View>
            <Pill
              label={c.status === 'open' ? 'Open' : c.status === 'waitlist' ? 'Waitlist' : 'Full'}
              tone={c.status === 'open' ? 'good' : c.status === 'waitlist' ? 'warn' : 'bad'}
            />
          </Pressable>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 14,
  },
  dayStrip: {
    marginBottom: 14,
  },
  dayStripInner: {
    gap: 6,
    paddingRight: 12,
  },
  dayTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  dayTabActive: {
    backgroundColor: tokens.color.fg,
    borderColor: tokens.color.fg,
  },
  dayLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },
  dayLabelActive: { color: tokens.color.surface },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 12,
    ...tokens.shadow.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLetter: {
    fontFamily: tokens.font.sansBold,
    fontSize: 16,
  },
  cardName: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 14,
    color: tokens.color.fg,
  },
  cardMeta: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgMuted,
    marginTop: 3,
  },
  cardMetaStrong: {
    fontFamily: tokens.font.monoSemibold,
    color: tokens.color.fg,
  },

  filterRow: {
    paddingTop: 12,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
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
});
