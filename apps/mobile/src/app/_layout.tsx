import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { View } from 'react-native';
import { tokens } from '../theme/tokens';
import { AuthProvider } from '../lib/store';
import { runMigrations } from '../db/client';
import { WorkoutSessionProvider } from '../workout/session-store';
import { SyncProvider } from '../workout/use-sync';
import { ThemeProvider } from '../lib/theme-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  useEffect(() => {
    // No-op; fonts will hydrate the UI on next render once loaded.
  }, [fontsLoaded]);

  useEffect(() => {
    runMigrations();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: tokens.color.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <WorkoutSessionProvider>
              <SyncProvider>
                <ThemeProvider>
                  <StatusBar style="dark" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: tokens.color.bg },
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)/otp-verify" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)/gym-picker" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="qr"
                      options={{
                        presentation: 'modal',
                        animation: 'fade',
                      }}
                    />
                    <Stack.Screen name="class/[id]/index" />
                    <Stack.Screen
                      name="class/[id]/confirm"
                      options={{
                        presentation: 'transparentModal',
                        animation: 'fade',
                      }}
                    />
                    <Stack.Screen name="train/active" options={{ animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="train/exercises" />
                    <Stack.Screen name="train/exercise/[id]" />
                    <Stack.Screen name="train/exercise/new" />
                    <Stack.Screen name="train/workout/[id]" />
                    <Stack.Screen name="train/progress" />
                    <Stack.Screen name="train/challenges" />
                    <Stack.Screen name="train/challenge/[id]" />
                    <Stack.Screen name="train/templates" />
                    <Stack.Screen name="train/templates/new" />
                    <Stack.Screen name="train/templates/[id]" />
                    <Stack.Screen name="train/programs" />
                    <Stack.Screen name="train/programs/new" />
                    <Stack.Screen name="train/programs/[id]" />
                    <Stack.Screen name="train/programs/[id]/edit" />
                    <Stack.Screen name="train/programs/presets" />
                    <Stack.Screen name="train/programs/presets/[slug]" />
                    <Stack.Screen name="profile/backup" />
                  </Stack>
                </ThemeProvider>
              </SyncProvider>
            </WorkoutSessionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
