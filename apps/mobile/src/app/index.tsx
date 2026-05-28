import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTenantStore } from "../lib/tenant-store";
import { getCurrentSession } from "../lib/auth";
import { fetchMyMemberships } from "../lib/api";
import { tokens } from "../theme/tokens";

const STORAGE_CURRENT = "fitclub.tenant.current";
const STORAGE_MEMBERSHIPS = "fitclub.tenant.memberships";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) {
        router.replace("/(auth)/login" as Parameters<typeof router.replace>[0]);
        return;
      }

      const cachedStr = await AsyncStorage.getItem(STORAGE_MEMBERSHIPS);
      const currentId = await AsyncStorage.getItem(STORAGE_CURRENT);

      if (cachedStr && currentId) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            useTenantStore.getState().hydrate(parsed, currentId);
            router.replace("/(tabs)" as Parameters<typeof router.replace>[0]);
            return;
          }
        } catch {
          /* fall through to live fetch */
        }
      }

      const memberships = await fetchMyMemberships();
      if (memberships.length === 0) {
        await useTenantStore.getState().signOut();
        router.replace("/(auth)/login" as Parameters<typeof router.replace>[0]);
        return;
      }
      await useTenantStore.getState().setMemberships(memberships);
      if (memberships.length === 1) {
        await useTenantStore.getState().setCurrent(memberships[0]!);
        router.replace("/(tabs)" as Parameters<typeof router.replace>[0]);
      } else {
        router.replace("/(auth)/gym-picker" as Parameters<typeof router.replace>[0]);
      }
    })();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tokens.color.bg,
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
