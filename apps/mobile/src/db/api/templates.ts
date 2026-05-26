import { and, eq, isNull } from "drizzle-orm";
import { db } from "../client";
import {
  workoutTemplates,
  workoutTemplateExercises,
  type LocalWorkoutTemplate,
  type LocalWorkoutTemplateExercise,
} from "../schema";

export type TemplateExerciseInput = {
  exerciseId: string;
  position: number;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  restSeconds: number | null;
  targetRpe: number | null;
  target1rmPct: number | null;
  tempo: string | null;
  supersetGroup: number | null;
  notes: string | null;
};

export type TemplateInput = {
  tenantId: string;
  memberId: string;
  name: string;
  description: string | null;
  estimatedMin: number | null;
  exercises: TemplateExerciseInput[];
};

function uuid(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function createTemplate(input: TemplateInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uuid();
  db.insert(workoutTemplates)
    .values({
      id,
      tenantId: input.tenantId,
      memberId: input.memberId,
      name: input.name,
      description: input.description,
      estimatedMin: input.estimatedMin,
      sourcePreset: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: "pending",
      syncedAt: null,
    })
    .run();
  for (const ex of input.exercises) {
    db.insert(workoutTemplateExercises)
      .values({
        id: uuid(),
        templateId: id,
        exerciseId: ex.exerciseId,
        position: ex.position,
        sets: ex.sets,
        repMin: ex.repMin,
        repMax: ex.repMax,
        restSeconds: ex.restSeconds,
        targetRpe: ex.targetRpe,
        target1rmPct: ex.target1rmPct,
        tempo: ex.tempo,
        supersetGroup: ex.supersetGroup,
        notes: ex.notes,
        syncStatus: "pending",
      })
      .run();
  }
  return id;
}

export function listTemplates(memberId: string): LocalWorkoutTemplate[] {
  return db
    .select()
    .from(workoutTemplates)
    .where(
      and(
        eq(workoutTemplates.memberId, memberId),
        isNull(workoutTemplates.deletedAt),
      ),
    )
    .all();
}

export function getTemplate(id: string): {
  template: LocalWorkoutTemplate | null;
  exercises: LocalWorkoutTemplateExercise[];
} {
  const rows = db
    .select()
    .from(workoutTemplates)
    .where(eq(workoutTemplates.id, id))
    .all();
  const template = rows[0] ?? null;
  if (!template) return { template: null, exercises: [] };
  const exercises = db
    .select()
    .from(workoutTemplateExercises)
    .where(eq(workoutTemplateExercises.templateId, id))
    .all()
    .sort((a, b) => a.position - b.position);
  return { template, exercises };
}

export function updateTemplate(
  id: string,
  patch: Partial<Omit<TemplateInput, "tenantId" | "memberId" | "exercises">>,
  exercises?: TemplateExerciseInput[],
): void {
  const now = new Date().toISOString();
  const setFields: Partial<LocalWorkoutTemplate> & {
    updatedAt: string;
    syncStatus: string;
  } = {
    updatedAt: now,
    syncStatus: "pending",
  };
  if (patch.name !== undefined) setFields.name = patch.name;
  if (patch.description !== undefined) setFields.description = patch.description;
  if (patch.estimatedMin !== undefined) setFields.estimatedMin = patch.estimatedMin;
  db.update(workoutTemplates).set(setFields).where(eq(workoutTemplates.id, id)).run();

  if (exercises) {
    db.delete(workoutTemplateExercises)
      .where(eq(workoutTemplateExercises.templateId, id))
      .run();
    for (const ex of exercises) {
      db.insert(workoutTemplateExercises)
        .values({
          id: uuid(),
          templateId: id,
          exerciseId: ex.exerciseId,
          position: ex.position,
          sets: ex.sets,
          repMin: ex.repMin,
          repMax: ex.repMax,
          restSeconds: ex.restSeconds,
          targetRpe: ex.targetRpe,
          target1rmPct: ex.target1rmPct,
          tempo: ex.tempo,
          supersetGroup: ex.supersetGroup,
          notes: ex.notes,
          syncStatus: "pending",
        })
        .run();
    }
  }
}

export function softDeleteTemplate(id: string): void {
  const now = new Date().toISOString();
  db.update(workoutTemplates)
    .set({
      deletedAt: now,
      updatedAt: now,
      syncStatus: "pending",
    })
    .where(eq(workoutTemplates.id, id))
    .run();
}
