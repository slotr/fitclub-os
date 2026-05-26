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
  // v2 -> v3 — Train-B: templates, programs, presets infrastructure
  [
    `CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY NOT NULL, tenant_id TEXT NOT NULL,
      member_id TEXT NOT NULL, name TEXT NOT NULL,
      description TEXT, estimated_min INTEGER, source_preset TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      deleted_at TEXT, sync_status TEXT NOT NULL DEFAULT 'pending',
      synced_at TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS workout_templates_member_idx
       ON workout_templates (member_id, deleted_at);`,
    `CREATE TABLE IF NOT EXISTS workout_template_exercises (
      id TEXT PRIMARY KEY NOT NULL, template_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL, position INTEGER NOT NULL,
      sets INTEGER NOT NULL CHECK (sets > 0),
      rep_min INTEGER, rep_max INTEGER,
      rest_seconds INTEGER, target_rpe REAL, target_1rm_pct INTEGER,
      tempo TEXT, superset_group INTEGER, notes TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      CHECK (rep_min IS NULL OR rep_max IS NULL OR rep_max >= rep_min),
      UNIQUE (template_id, position)
    );`,
    `CREATE INDEX IF NOT EXISTS wte_template_idx
       ON workout_template_exercises (template_id, position);`,
    `CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY NOT NULL, tenant_id TEXT NOT NULL,
      member_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
      weeks_count INTEGER NOT NULL CHECK (weeks_count > 0),
      days_per_week INTEGER NOT NULL CHECK (days_per_week BETWEEN 1 AND 7),
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','active','paused','completed')),
      current_position INTEGER NOT NULL DEFAULT 0,
      source_preset TEXT, started_at TEXT, completed_at TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending', synced_at TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS programs_member_idx
       ON programs (member_id, status, deleted_at);`,
    `CREATE TABLE IF NOT EXISTS program_days (
      id TEXT PRIMARY KEY NOT NULL, program_id TEXT NOT NULL,
      week INTEGER NOT NULL CHECK (week > 0),
      day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 7),
      position INTEGER NOT NULL, title TEXT NOT NULL,
      template_id TEXT, is_rest INTEGER NOT NULL DEFAULT 0,
      notes TEXT, sync_status TEXT NOT NULL DEFAULT 'pending',
      CHECK (is_rest = 1 OR template_id IS NOT NULL),
      UNIQUE (program_id, position)
    );`,
    `CREATE INDEX IF NOT EXISTS program_days_program_idx
       ON program_days (program_id, position);`,
    `CREATE TABLE IF NOT EXISTS program_day_completions (
      id TEXT PRIMARY KEY NOT NULL, program_id TEXT NOT NULL,
      program_day_id TEXT NOT NULL, member_id TEXT NOT NULL,
      workout_id TEXT, completed_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      UNIQUE (program_id, program_day_id)
    );`,
    `CREATE INDEX IF NOT EXISTS pdc_member_idx
       ON program_day_completions (member_id, program_id);`,
    `ALTER TABLE workouts ADD COLUMN template_id TEXT;`,
    `ALTER TABLE workouts ADD COLUMN program_day_id TEXT;`,
    `ALTER TABLE workout_sets ADD COLUMN planned_rep_min INTEGER;`,
    `ALTER TABLE workout_sets ADD COLUMN planned_rep_max INTEGER;`,
    `ALTER TABLE workout_sets ADD COLUMN planned_rest_sec INTEGER;`,
    `ALTER TABLE workout_sets ADD COLUMN planned_rpe REAL;`,
    `ALTER TABLE workout_sets ADD COLUMN planned_1rm_pct INTEGER;`,
    `ALTER TABLE workout_sets ADD COLUMN superset_group INTEGER;`,
    `ALTER TABLE workout_sets ADD COLUMN is_complete INTEGER NOT NULL DEFAULT 0;`,
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
