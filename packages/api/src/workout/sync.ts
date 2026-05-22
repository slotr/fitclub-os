import type { SyncStatus } from "./types";

type Syncable = {
  id: string;
  syncStatus: string;
  isActive: number;
};

/**
 * Rows that should be pushed: status pending or failed, and not the
 * in-progress (active) workout. An active workout is never synced.
 */
export function selectPending<T extends Syncable>(rows: T[]): T[] {
  return rows.filter(
    (r) =>
      r.isActive === 0 &&
      (r.syncStatus === "pending" || r.syncStatus === "failed"),
  );
}

export function nextSyncStatus(ok: boolean): SyncStatus {
  return ok ? "synced" : "failed";
}
