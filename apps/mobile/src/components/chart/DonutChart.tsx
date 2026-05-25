import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { tokens } from '../../theme/tokens';

export type DonutSlice = { key: string; value: number; color: string };

export type DonutChartProps = {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
};

export function DonutChart({
  data,
  size = 84,
  strokeWidth = 12,
  centerLabel,
}: DonutChartProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tokens.color.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {total > 0
          ? data.reduce<{ offset: number; nodes: React.ReactNode[] }>(
              (acc, slice, i) => {
                const sliceLen = (slice.value / total) * c;
                acc.nodes.push(
                  <Circle
                    key={`${slice.key}-${i}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${sliceLen} ${c}`}
                    strokeDashoffset={-acc.offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  />,
                );
                acc.offset += sliceLen;
                return acc;
              },
              { offset: 0, nodes: [] },
            ).nodes
          : null}
      </Svg>
      {centerLabel ? (
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.label}>{centerLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: tokens.font.sansBold,
    fontSize: 11,
    color: tokens.color.fgMuted,
  },
});
