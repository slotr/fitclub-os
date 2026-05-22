import { BACKUP_VERSION, backupFileSchema, type BackupFile } from "./schemas";

type Row = Record<string, unknown> & { id: string; updatedAt?: string };

export type BackupInput = {
  memberId: string;
  exercises: Row[];
  memberPrefs: Row[];
  workouts: Row[];
  sets: Row[];
};

/** Serialise a member's workout data to a versioned JSON string. */
export function buildBackup(input: BackupInput): string {
  const file: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    memberId: input.memberId,
    exercises: input.exercises,
    memberPrefs: input.memberPrefs,
    workouts: input.workouts,
    sets: input.sets,
  };
  return JSON.stringify(file);
}

/** Parse + validate a backup JSON string. Throws on any problem. */
export function parseBackup(raw: string): BackupFile {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Backup file is not valid JSON.");
  }
  const result = backupFileSchema.safeParse(json);
  if (!result.success) {
    throw new Error(
      "Backup file is not a supported FitClub workout backup.",
    );
  }
  return result.data;
}

/**
 * Last-write-wins merge of `incoming` rows into `local` rows.
 * No id match -> inserted. Id match -> the newer `updatedAt` wins.
 * Rows without `updatedAt` are treated as oldest.
 */
export function mergeRows<T extends Row>(local: T[], incoming: T[]): T[] {
  const byId = new Map<string, T>();
  for (const row of local) byId.set(row.id, row);
  for (const row of incoming) {
    const existing = byId.get(row.id);
    if (!existing) {
      byId.set(row.id, row);
      continue;
    }
    const a = existing.updatedAt ?? "";
    const b = row.updatedAt ?? "";
    if (b > a) byId.set(row.id, row);
  }
  return [...byId.values()];
}
