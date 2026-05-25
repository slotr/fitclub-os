// apps/mobile/src/components/LeaderboardRow.tsx
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';

export function shortDisplayName(full: string): string {
  const trimmed = full.trim();
  if (!trimmed) return 'Member';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  const lastInitial = last.charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export type LeaderboardRowProps = {
  rank: number;
  memberName: string;
  score: number;
  highlighted?: boolean;
};

export function LeaderboardRow({
  rank, memberName, score, highlighted,
}: LeaderboardRowProps) {
  const medal = MEDAL[rank];
  return (
    <View
      style={[styles.row, highlighted && styles.selfRow]}
    >
      <View style={styles.rankCell}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={styles.rankNum}>{rank}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.name, highlighted && styles.nameSelf]}
          numberOfLines={1}
        >
          {highlighted ? 'You' : shortDisplayName(memberName)}
        </Text>
      </View>
      <Text style={[styles.score, highlighted && styles.scoreSelf]}>
        {score.toLocaleString('en-US')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint ?? tokens.color.border,
  },
  selfRow: {
    backgroundColor: tokens.color.accentSoft ?? '#fff4d6',
    borderRadius: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 0,
    marginHorizontal: -4,
  },
  rankCell: {
    width: 24,
    alignItems: 'center',
  },
  medal: { fontSize: 16 },
  rankNum: {
    fontFamily: tokens.font.sansBold,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: tokens.font.sansBold,
    fontSize: 13,
    color: tokens.color.fg,
  },
  nameSelf: { color: tokens.color.accent },
  score: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 14,
    color: tokens.color.fg,
  },
  scoreSelf: { color: tokens.color.accent },
});
