import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';

type Props = {
  children: ReactNode;
  /** Skip the SafeArea wrapper; useful for full-bleed dark screens. */
  bare?: boolean;
  /** Override screen background. Defaults to cream `#fafaf9`. */
  background?: string;
  /** Wrap content in a vertical ScrollView. Default `true`. */
  scroll?: boolean;
  /** Additional style merged into the inner content view. */
  contentStyle?: ViewStyle;
  /** Padding applied to the inner content view; pass `0` to opt out. */
  padding?: number;
};

export function ScreenContainer({
  children,
  bare = false,
  background = tokens.color.bg,
  scroll = true,
  contentStyle,
  padding = 20,
}: Props) {
  const insets = useSafeAreaInsets();
  const Wrapper = bare ? View : SafeAreaView;
  const innerStyle: ViewStyle = {
    paddingHorizontal: padding,
    paddingTop: bare ? insets.top : 8,
    paddingBottom: 24,
  };
  const body = (
    <View style={[innerStyle, contentStyle]}>{children}</View>
  );
  return (
    <Wrapper style={[styles.root, { backgroundColor: background }]} edges={bare ? [] : ['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
