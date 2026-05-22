import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../lib/store";
import { pendingCount, runSync } from "./sync-engine";

type Ctx = { pending: number; syncNow: () => Promise<void> };
const SyncContext = createContext<Ctx>({
  pending: 0,
  syncNow: async () => {},
});

export function SyncProvider({ children }: { children: ReactNode }) {
  const { member } = useAuth();
  const [pending, setPending] = useState(0);

  const syncNow = useCallback(async () => {
    if (!member?.dbId) return;
    await runSync(member.dbId);
    setPending(pendingCount());
  }, [member]);

  useEffect(() => {
    void syncNow();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void syncNow();
    });
    return () => sub.remove();
  }, [syncNow]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) void syncNow();
    });
    return unsub;
  }, [syncNow]);

  return (
    <SyncContext.Provider value={{ pending, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): Ctx {
  return useContext(SyncContext);
}
