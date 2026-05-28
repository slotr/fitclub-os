// apps/mobile/src/app/train/challenges.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButtonRow } from '../../components/BackButton';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../lib/theme-provider';
import { useAuth } from '../../lib/store';
import {
  fetchChallenges, fetchMyChallengeIds, type ChallengeRow,
} from '../../db/api/challenges';

function fmtWindow(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}

function daysLeft(endISO: string): number {
  return Math.max(
    0,
    Math.ceil(
      (new Date(endISO).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );
}

export default function ChallengesScreen() {
  const router = useRouter();
  const { member } = useAuth();
  const memberId = member?.dbId ?? null;
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) return;
    const [all, mine] = await Promise.all([
      fetchChallenges(),
      fetchMyChallengeIds(memberId),
    ]);
    setRows(all);
    setMyIds(new Set(mine));
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();
  const { joined, browse, ended } = useMemo(() => {
    const joined: ChallengeRow[] = [];
    const browse: ChallengeRow[] = [];
    const ended: ChallengeRow[] = [];
    for (const c of rows) {
      const isEnded =
        c.status === 'ended' ||
        c.status === 'cancelled' ||
        new Date(c.endsAt).getTime() < now;
      if (isEnded) {
        ended.push(c);
        continue;
      }
      if (myIds.has(c.id)) joined.push(c);
      else browse.push(c);
    }
    return { joined, browse, ended };
  }, [rows, myIds, now]);

  return (
    <ScreenContainer>
      <BackButtonRow />
      <Text style={styles.title}>Challenges</Text>
      <Text style={styles.subtitle}>
        {loading
          ? 'Loading…'
          : `${joined.length + browse.length} active · ${ended.length} ended`}
      </Text>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <Group title="Joined">
          {joined.length === 0 ? (
            <Text style={styles.emptyInline}>
              You haven't joined any active challenge yet.
            </Text>
          ) : (
            joined.map((c) => (
              <Card
                key={c.id}
                row={c}
                joined
                onPress={() =>
                  router.push(
                    `/train/challenge/${c.id}` as Parameters<typeof router.push>[0],
                  )
                }
              />
            ))
          )}
        </Group>

        {browse.length > 0 ? (
          <Group title="Browse">
            {browse.map((c) => (
              <Card
                key={c.id}
                row={c}
                onPress={() =>
                  router.push(
                    `/train/challenge/${c.id}` as Parameters<typeof router.push>[0],
                  )
                }
              />
            ))}
          </Group>
        ) : null}

        {ended.length > 0 ? (
          <Group title="Ended">
            {ended.map((c) => (
              <Card
                key={c.id}
                row={c}
                muted
                onPress={() =>
                  router.push(
                    `/train/challenge/${c.id}` as Parameters<typeof router.push>[0],
                  )
                }
              />
            ))}
          </Group>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Card({
  row,
  joined,
  muted,
  onPress,
}: {
  row: ChallengeRow;
  joined?: boolean;
  muted?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        joined && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
        muted && styles.cardMuted,
      ]}
    >
      <View style={styles.cardHead}>
        <Text style={styles.cardName} numberOfLines={1}>
          {row.name}
        </Text>
        <View style={styles.metricPill}>
          <Text style={styles.metricPillTxt}>{row.metricType}</Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>
        {fmtWindow(row.startsAt, row.endsAt)}
        {row.status === 'active' && !muted
          ? ` · ${daysLeft(row.endsAt)} days left`
          : ''}
      </Text>
      {!joined && row.status === 'active' && !muted ? (
        <Text style={[styles.joinCta, { color: theme.accent }]}>+ Tap to view & join</Text>
      ) : null}
    </Pressable>
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
    marginBottom: 14,
  },
  group: { marginBottom: 14 },
  groupTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: tokens.color.fgMuted,
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  cardMuted: { opacity: 0.7 },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 14,
    color: tokens.color.fg,
  },
  metricPill: {
    backgroundColor: tokens.color.fg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  metricPillTxt: {
    fontFamily: tokens.font.sansBold,
    fontSize: 10,
    color: '#fff',
  },
  cardMeta: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 11,
    color: tokens.color.fgMuted,
    marginTop: 3,
  },
  joinCta: {
    fontFamily: tokens.font.sansBold,
    fontSize: 11,
    marginTop: 6,
  },
  emptyInline: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },
});
