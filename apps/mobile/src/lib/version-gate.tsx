import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Linking, Pressable } from "react-native";
import Constants from "expo-constants";
import { tokens } from "../theme/tokens";
import { getSupabase } from "./supabase";

const CURRENT_VERSION =
  (Constants.expoConfig?.version as string | undefined) ?? "0.0.0";

function semverLess(a: string, b: string): boolean {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

export function VersionGate({ children }: { children: React.ReactNode }) {
  const [minVersion, setMinVersion] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "mobile_min_version")
        .maybeSingle();
      if (data?.value) setMinVersion(String(data.value));
    })();
  }, []);

  if (minVersion && semverLess(CURRENT_VERSION, minVersion)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Update required</Text>
        <Text style={styles.body}>
          A new version of the app is required ({minVersion}+). Please
          update from the App Store to continue.
        </Text>
        <Pressable
          onPress={() => Linking.openURL("https://apps.apple.com/")}
          style={styles.btn}
        >
          <Text style={styles.btnText}>Open App Store</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: tokens.color.bg,
  },
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    marginBottom: 12,
  },
  body: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 15,
    color: tokens.color.fgMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: tokens.color.accent,
  },
  btnText: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 15,
    color: "white",
  },
});
