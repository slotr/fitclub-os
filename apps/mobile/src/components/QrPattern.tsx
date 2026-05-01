import { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { generateQrGrid, QR_SIZE } from '../lib/qrPattern';
import { tokens } from '../theme/tokens';

type Props = {
  /** Outer dimension in px. The pattern is square. */
  size: number;
  /** Background of the QR card itself. Defaults to white. */
  background?: string;
  /** Color of the dark cells. */
  cellColor?: string;
  /** Inner padding inside the white square. Defaults to ~7% of size. */
  padding?: number;
  /** Border radius applied to the white square. */
  radius?: number;
  /** Numeric seed used to generate the pseudo-random fill. */
  seed?: number;
  style?: ViewStyle;
};

/**
 * 21×21 procedural QR-pattern, identical to the prototype's `<i class="on">`
 * grid. Implemented here as a flexbox grid of tiny squares.
 */
export function QrPattern({
  size,
  background = tokens.color.surface,
  cellColor = tokens.color.fg,
  padding,
  radius = 14,
  seed,
  style,
}: Props) {
  const grid = useMemo(() => generateQrGrid(seed), [seed]);
  const pad = padding ?? Math.round(size * 0.07);
  const inner = size - pad * 2;
  const cellSize = inner / QR_SIZE;

  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          backgroundColor: background,
          borderRadius: radius,
          padding: pad,
        },
        style,
      ]}
    >
      <View style={styles.grid}>
        {grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((v, c) => (
              <View
                key={c}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: v ? cellColor : 'transparent',
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center' },
  grid: { flex: 1, alignSelf: 'stretch' },
  row: { flexDirection: 'row', flex: 1 },
});
