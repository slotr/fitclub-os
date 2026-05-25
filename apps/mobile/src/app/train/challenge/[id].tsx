// apps/mobile/src/app/train/challenge/[id].tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, FlatList, RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { type LeaderboardRow } from '@fitness/api';
import { BackButtonRow } from '../../../components/BackButton';
import { LeaderboardRow as LeaderRow } from '../../../components/LeaderboardRow';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { tokens } from '../../../theme/tokens';
import { useAuth } from '../../../lib/store';
import {
  fetchChallenges, fetchLeaderboard, fetchMyChallengeIds,
  joinChallenge, type ChallengeRow,
} from '../../../db/api/challenges';

const TOP_N = 20;

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member } = useAuth();
  const memberId = member?.dbId ?? null;

  const [challenge, setChallenge] = useState<ChallengeRow | null>(null);
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [joined, setJoined] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    if (!id || !memberId) return;
    const [all, mine, lb] = await Promise.all([
      fetchChallenges(),
      fetchMyChallengeIds(memberId),
      fetchLeaderboard(id),
    ]);
    const c = all.find((x) => x.id === id) ?? null;
    setChallenge(c);
    setJoined(mine.includes(id));
    setBoard(lb);
  }, [id, memberId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isEnded = useMemo(() => {
    if (!challenge) return false;
    return (
      challenge.status === 'ended' ||
      challenge.status === 'cancelled' ||
      new Date(challenge.endsAt).getTime() < Date.now()
    );
  }, [challenge]);

  const daysLeft = useMemo(() => {
    if (!challenge) return 0;
    return Math.max(
      0,
      Math.ceil(
        (new Date(challenge.endsAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  }, [challenge]);

  const myRow = useMemo(
    () => board.find((r) => r.memberId === memberId) ?? null,
    [board, memberId],
  );
  const topRows = board.slice(0, TOP_N);
  const showSelfPinned =
    myRow !== null &&
    !topRows.some((r) => r.memberId === memberId);

  async function onJoin() {
    if (!id || !memberId || joining) return;
    setJoining(true);
    setJoined(true); // optimistic
    const { ok } = await joinChallenge(id, memberId);
    if (!ok) {
      setJoined(false);
      Alert.alert('Could not join', 'Please try again.');
    } else {
      await load();
    }
    setJoining(false);
  }

  if (!challenge) {
    return (
      <ScreenContainer>
        <BackButtonRow />
        <Text style={styles.empty}>Challenge not found.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <BackButtonRow />
      <Text style={styles.title}>{challenge.name}</Text>
      <Text style={styles.subtitle}>
        {challenge.metricType} · {isEnded ? 'ended' : `${daysLeft} days left`}
      </Text>

      {challenge.description ? (
        <Text style={styles.description}>{challenge.description}</Text>
      ) : null}

      <View style={styles.headerRow}>
        <View style={styles.headerCol}>
          <Text style={styles.headerLabel}>Window</Text>
          <Text style={styles.headerValue}>
            {new Date(challenge.startsAt).toLocaleDateString('en-US', {
              day: 'numeric', month: 'short',
            })}{' '}
            –{' '}
            {new Date(challenge.endsAt).toLocaleDateString('en-US', {
              day: 'numeric', month: 'short',
            })}
          </Text>
        </View>
        <View style={[styles.headerCol, { alignItems: 'flex-end' }]}>
          <Text style={styles.headerLabel}>Your rank</Text>
          <Text style={styles.headerRank}>
            {joined && myRow ? `#${myRow.rank}` : '—'}
          </Text>
        </View>
      </View>

      {!joined && !isEnded ? (
        <View style={{ marginBottom: 12 }}>
          <PrimaryButton
            label={joining ? 'Joining…' : 'Join challenge'}
            onPress={onJoin}
            disabled={joining}
          />
        </View>
      ) : null}

      <Text style={styles.boardTitle}>
        {isEnded ? '🏆 Final leaderboard' : 'Leaderboard'}
        <Text style={styles.boardCount}>  · {board.length}</Text>
      </Text>

      <FlatList
        data={topRows}
        keyExtractor={(r) => r.memberId}
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
        renderItem={({ item }) => (
          <LeaderRow
            rank={item.rank}
            memberName={item.memberName}
            score={item.score}
            highlighted={item.memberId === memberId}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No participants yet.</Text>
        }
        ListFooterComponent={
          showSelfPinned && myRow ? (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.pinnedLabel}>… you are at</Text>
              <LeaderRow
                rank={myRow.rank}
                memberName={myRow.memberName}
                score={myRow.score}
                highlighted
              />
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
  },
  subtitle: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },
  description: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fg,
    marginTop: 10,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  headerCol: {},
  headerLabel: {
    fontFamily: tokens.font.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: tokens.color.fgMuted,
  },
  headerValue: {
    fontFamily: tokens.font.sansBold,
    fontSize: 13,
    color: tokens.color.fg,
    marginTop: 2,
  },
  headerRank: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.accent,
    marginTop: 2,
  },
  boardTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 13,
    color: tokens.color.fg,
    marginBottom: 4,
  },
  boardCount: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 11,
    color: tokens.color.fgMuted,
  },
  pinnedLabel: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 11,
    color: tokens.color.fgMuted,
    marginBottom: 2,
  },
  empty: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginTop: 12,
  },
});
