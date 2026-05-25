import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export type BarPoint = { label: string; value: number; meta?: number };

export type BarChartProps = {
  data: BarPoint[];
  height?: number;
  barColor?: string;
  dimColor?: string;
  gap?: number;
  showLabels?: boolean;
};

export function BarChart({
  data,
  height = 90,
  barColor = tokens.color.accent,
  dimColor = tokens.color.borderFaint ?? tokens.color.border,
  gap = 4,
  showLabels = true,
}: BarChartProps) {
  if (data.length === 0) {
    return <View style={{ height }} />;
  }
  const max = Math.max(1, ...data.map((p) => p.value));
  return (
    <View>
      <View style={[styles.bars, { height, gap }]}>
        {data.map((p, i) => {
          const ratio = p.value / max;
          const h = Math.max(2, ratio * (height - 12));
          return (
            <View key={`${p.label}-${i}`} style={styles.col}>
              {typeof p.meta === 'number' && p.meta > 0 ? (
                <Text style={styles.meta}>{p.meta}</Text>
              ) : null}
              <View
                style={{
                  width: '100%',
                  height: h,
                  backgroundColor: p.value === 0 ? dimColor : barColor,
                  borderTopLeftRadius: 3,
                  borderTopRightRadius: 3,
                }}
              />
            </View>
          );
        })}
      </View>
      {showLabels ? (
        <View style={[styles.labels, { gap }]}>
          {data.map((p, i) => (
            <Text key={`${p.label}-${i}-l`} style={styles.label}>
              {p.label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  meta: {
    fontFamily: tokens.font.sansBold,
    fontSize: 9,
    color: tokens.color.fg,
    marginBottom: 2,
  },
  labels: {
    flexDirection: 'row',
    marginTop: 4,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: tokens.font.sansMedium,
    fontSize: 9,
    color: tokens.color.fgMuted,
  },
});
