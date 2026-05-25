import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { tokens } from '../../theme/tokens';

export type LinePoint = { x: number | string; y: number };

export type LineChartProps = {
  data: LinePoint[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  showLastDot?: boolean;
  yMin?: number;
  yMax?: number;
  accessibilityLabel?: string;
};

const PAD = 4;

export function LineChart({
  data,
  height = 120,
  strokeColor = tokens.color.accent,
  fillColor = 'rgba(240, 179, 35, 0.15)',
  showLastDot = true,
  yMin,
  yMax,
  accessibilityLabel,
}: LineChartProps) {
  const layout = useMemo(() => {
    if (data.length === 0) return null;
    const ys = data.map((p) => p.y);
    const lo = yMin ?? Math.min(...ys);
    const hi = yMax ?? Math.max(...ys);
    const span = hi - lo || 1;
    return { lo, hi, span };
  }, [data, yMin, yMax]);

  if (data.length === 0 || !layout) {
    return <View style={[styles.box, { height }]} />;
  }

  return (
    <View
      style={[styles.box, { height }]}
      accessibilityLabel={accessibilityLabel}
    >
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
      >
        {data.length === 1 ? (
          <Circle
            cx={50}
            cy={height / 2}
            r={4}
            fill={strokeColor}
          />
        ) : (
          <>
            <Path
              d={buildAreaPath(data, layout.lo, layout.span, height)}
              fill={fillColor}
              stroke="none"
            />
            <Path
              d={buildLinePath(data, layout.lo, layout.span, height)}
              stroke={strokeColor}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {showLastDot && (
              <Circle
                cx={100}
                cy={
                  height -
                  PAD -
                  ((data[data.length - 1]!.y - layout.lo) / layout.span) *
                    (height - PAD * 2)
                }
                r={3}
                fill={strokeColor}
              />
            )}
          </>
        )}
      </Svg>
    </View>
  );
}

function buildLinePath(
  data: LinePoint[],
  lo: number,
  span: number,
  h: number,
): string {
  return data
    .map((p, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = h - PAD - ((p.y - lo) / span) * (h - PAD * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function buildAreaPath(
  data: LinePoint[],
  lo: number,
  span: number,
  h: number,
): string {
  const top = data
    .map((p, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = h - PAD - ((p.y - lo) / span) * (h - PAD * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  return `${top} L 100 ${h} L 0 ${h} Z`;
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
