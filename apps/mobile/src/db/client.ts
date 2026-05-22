import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

const DB_NAME = "fitclub-workout.db";

// Each entry is one schema version. Append-only — never edit a shipped one.
const MIGRATIONS: string[][] = [
  // v1 -> v2
  [
    `CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL, tenant_id TEXT, member_id TEXT,
      slug TEXT, name TEXT NOT NULL, primary_muscle TEXT NOT NULL,
      equipment TEXT NOT NULL, metric TEXT NOT NULL DEFAULT 'weight_reps',
      default_rest_sec INTEGER NOT NULL DEFAULT 90, instructions TEXT,
      image_url TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      deleted_at TEXT, sync_status TEXT NOT NULL DEFAULT 'synced',
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS member_exercise_prefs (
      id TEXT PRIMARY KEY NOT NULL, tenant_id TEXT NOT NULL,
      member_id TEXT NOT NULL, exercise_id TEXT NOT NULL,
      default_rest_sec INTEGER NOT NULL, created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL, sync_status TEXT NOT NULL DEFAULT 'pending'
    );`,
    `CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL, tenant_id TEXT NOT NULL,
      member_id TEXT NOT NULL, title TEXT NOT NULL DEFAULT 'Workout',
      started_at TEXT NOT NULL, finished_at TEXT,
      duration_sec INTEGER NOT NULL DEFAULT 0,
      total_volume REAL NOT NULL DEFAULT 0, notes TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      is_active INTEGER NOT NULL DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY NOT NULL, workout_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL, order_index INTEGER NOT NULL,
      set_index INTEGER NOT NULL, weight REAL, reps INTEGER,
      duration_sec INTEGER, rest_sec INTEGER,
      is_warmup INTEGER NOT NULL DEFAULT 0, is_pr INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS workout_sets_workout_idx
      ON workout_sets (workout_id);`,
    `CREATE INDEX IF NOT EXISTS workouts_member_idx
      ON workouts (member_id, started_at);`,
  ],
];

const sqlite = SQLite.openDatabaseSync(DB_NAME);
export const db = drizzle(sqlite, { schema });

/** Run pending migrations. Call once on app startup before any query. */
export function runMigrations(): void {
  const row = sqlite.getFirstSync<{ user_version: number }>(
    "PRAGMA user_version;",
  );
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const statements = MIGRATIONS[version]!;
    sqlite.withTransactionSync(() => {
      for (const stmt of statements) sqlite.execSync(stmt);
    });
    version += 1;
    sqlite.execSync(`PRAGMA user_version = ${version};`);
  }
}
