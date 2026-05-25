import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export type StatCardProps = {
  value: string;
  label: string;
  tone?: 'default' | 'accent';
};

export function StatCard({ value, label, tone = 'default' }: StatCardProps) {
  const accent = tone === 'accent';
  return (
    <View
      style={[
        styles.card,
        accent && { backgroundColor: tokens.color.accentSoft ?? tokens.color.bg },
      ]}
    >
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: tokens.color.surface ?? '#ffffff',
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 10,
    padding: 10,
  },
  value: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
  },
  label: {
    fontFamily: tokens.font.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },
});
