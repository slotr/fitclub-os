import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "expo-sqlite": fileURLToPath(
        new URL("./__mocks__/expo-sqlite.ts", import.meta.url),
      ),
      "@react-native-async-storage/async-storage": fileURLToPath(
        new URL("./__mocks__/async-storage-mock.ts", import.meta.url),
      ),
      "zustand": fileURLToPath(
        new URL("./__mocks__/zustand.ts", import.meta.url),
      ),
      "./supabase": fileURLToPath(
        new URL("./__mocks__/supabase-mock.ts", import.meta.url),
      ),
    },
  },
  test: {
    root: fileURLToPath(new URL(".", import.meta.url)),
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
  },
});
