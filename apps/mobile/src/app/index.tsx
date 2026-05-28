import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useTenantStore } from "../lib/tenant-store";
import { getCurrentSession } from "../lib/auth";
import { fetchMyMemberships } from "../lib/api";
import { tokens } from "../theme/tokens";

const STORAGE_CURRENT = "fitclub.tenant.current";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) {
        router.replace("/(auth)/login" as Parameters<typeof router.replace>[0]);
        return;
      }

      // Always re-fetch memberships on cold start — no local cache to avoid
      // stale state when admin adds/removes members or branding changes.
      const memberships = await fetchMyMemberships();
      if (memberships.length === 0) {
        await useTenantStore.getState().signOut();
        router.replace("/(auth)/login" as Parameters<typeof router.replace>[0]);
        return;
      }
      await useTenantStore.getState().setMemberships(memberships);

      // If a previous tenant id was selected, restore it; otherwise pick or prompt.
      const previousId = await SecureStore.getItemAsync(STORAGE_CURRENT).catch(
        () => null,
      );
      const restoreMatch = previousId
        ? memberships.find((m) => m.tenantId === previousId)
        : null;

      if (restoreMatch) {
        await useTenantStore.getState().setCurrent(restoreMatch);
        router.replace("/(tabs)" as Parameters<typeof router.replace>[0]);
      } else if (memberships.length === 1) {
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
