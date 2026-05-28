import { Redirect, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarIcon, CardIcon, DumbbellIcon, HomeIcon, PersonIcon } from '../../components/Icons';
import { tokens } from '../../theme/tokens';
import { useTenantStore } from '../../lib/tenant-store';
import { useTheme } from '../../lib/theme-provider';

const ROUTES = [
  { name: 'index', label: 'Home', Icon: HomeIcon },
  { name: 'classes', label: 'Classes', Icon: CalendarIcon },
  { name: 'train', label: 'Train', Icon: DumbbellIcon },
  { name: 'membership', label: 'Pay', Icon: CardIcon },
  { name: 'profile', label: 'Profile', Icon: PersonIcon },
] as const;

type TabRoute = (typeof ROUTES)[number];

export default function TabsLayout() {
  const isAuthed = useTenantStore((s) => s.isAuthed);
  const currentTenantId = useTenantStore((s) => s.currentTenantId);
  const theme = useTheme();

  if (!isAuthed) return <Redirect href={"/(auth)/login" as Parameters<typeof Redirect>[0]["href"]} />;
  if (!currentTenantId) return <Redirect href={"/(auth)/gym-picker" as Parameters<typeof Redirect>[0]["href"]} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
      }}
      tabBar={(props) => <CustomTabBar {...(props as unknown as TabBarProps)} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="classes" options={{ title: 'Classes' }} />
      <Tabs.Screen name="train" options={{ title: 'Train' }} />
      <Tabs.Screen name="membership" options={{ title: 'Pay' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

type Route = { key: string; name: string };
type EmitArg = { type: 'tabPress'; target: string; canPreventDefault: true };
type EmitResult = { defaultPrevented: boolean };
type TabBarProps = {
  state: { index: number; routes: Route[] };
  navigation: {
    emit: (event: EmitArg) => EmitResult;
    navigate: (name: string) => void;
  };
};

function CustomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <BlurView
      intensity={32}
      tint="light"
      style={[styles.bar, { paddingBottom: Math.max(24, insets.bottom) }]}
    >
      <View style={styles.barInner}>
        {ROUTES.map((r, i) => {
          const focused = state.index === i;
          const route = state.routes.find((s) => s.name === r.name);
          if (!route) return null;
          return (
            <TabItem
              key={r.name}
              item={r}
              focused={focused}
              theme={theme}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </BlurView>
  );
}

function TabItem({ item, focused, theme, onPress }: { item: TabRoute; focused: boolean; theme: ReturnType<typeof useTheme>; onPress: () => void }) {
  const color = focused ? theme.accent : tokens.color.fgMuted;
  const Icon = item.Icon;
  return (
    <Pressable onPress={onPress} style={styles.tab} accessibilityRole="button">
      <Icon size={22} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{item.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 80,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  barInner: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
  },
  tabLabel: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 10,
  },
});
