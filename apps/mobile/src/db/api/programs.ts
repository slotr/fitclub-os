import { and, eq, isNull } from "drizzle-orm";
import { db } from "../client";
import {
  programs, programDays, programDayCompletions,
  type LocalProgram, type LocalProgramDay, type LocalProgramDayCompletion,
} from "../schema";

function uuid(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export type ProgramInput = {
  tenantId: string;
  memberId: string;
  name: string;
  description: string | null;
  weeksCount: number;
  daysPerWeek: number;
  sourcePreset?: string | null;
};

export type ProgramDayInput = {
  week: number;
  day: number;
  position: number;
  title: string;
  templateId: string | null;
  isRest: boolean;
  notes: string | null;
};

export async function createProgram(
  input: ProgramInput,
  days: ProgramDayInput[],
): Promise<string> {
  const now = new Date().toISOString();
  const id = uuid();
  db.insert(programs).values({
    id,
    tenantId: input.tenantId,
    memberId: input.memberId,
    name: input.name,
    description: input.description,
    weeksCount: input.weeksCount,
    daysPerWeek: input.daysPerWeek,
    status: "draft",
    currentPosition: 0,
    sourcePreset: input.sourcePreset ?? null,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: "pending",
    syncedAt: null,
  }).run();
  for (const d of days) {
    db.insert(programDays).values({
      id: uuid(),
      programId: id,
      week: d.week,
      day: d.day,
      position: d.position,
      title: d.title,
      templateId: d.templateId,
      isRest: d.isRest ? 1 : 0,
      notes: d.notes,
      syncStatus: "pending",
    }).run();
  }
  return id;
}

export function listPrograms(memberId: string): LocalProgram[] {
  return db.select()
    .from(programs)
    .where(and(eq(programs.memberId, memberId), isNull(programs.deletedAt)))
    .all();
}

export function getProgram(id: string): {
  program: LocalProgram | null;
  days: LocalProgramDay[];
  completions: LocalProgramDayCompletion[];
} {
  const program = db.select().from(programs).where(eq(programs.id, id)).all()[0] ?? null;
  if (!program) return { program: null, days: [], completions: [] };
  const days = db.select().from(programDays)
    .where(eq(programDays.programId, id)).all()
    .sort((a, b) => a.position - b.position);
  const completions = db.select().from(programDayCompletions)
    .where(eq(programDayCompletions.programId, id)).all();
  return { program, days, completions };
}

export function activateProgram(id: string): void {
  const now = new Date().toISOString();
  db.update(programs).set({
    status: "active",
    startedAt: now,
    updatedAt: now,
    syncStatus: "pending",
  }).where(eq(programs.id, id)).run();
}

export function pauseProgram(id: string): void {
  const now = new Date().toISOString();
  db.update(programs).set({
    status: "paused", updatedAt: now, syncStatus: "pending",
  }).where(eq(programs.id, id)).run();
}

export function completeProgramDay(
  programId: string, programDayId: string, memberId: string,
  workoutId: string | null,
): void {
  const now = new Date().toISOString();
  db.insert(programDayCompletions).values({
    id: uuid(),
    programId,
    programDayId,
    memberId,
    workoutId,
    completedAt: now,
    syncStatus: "pending",
  }).run();
  const p = db.select().from(programs).where(eq(programs.id, programId)).all()[0];
  if (!p) return;
  const total = p.weeksCount * p.daysPerWeek;
  const next = Math.min(p.currentPosition + 1, total);
  const status: "active" | "completed" = next >= total ? "completed" : (p.status as "active");
  db.update(programs).set({
    currentPosition: next,
    status,
    completedAt: status === "completed" ? now : p.completedAt,
    updatedAt: now,
    syncStatus: "pending",
  }).where(eq(programs.id, programId)).run();
}

export function restartProgram(id: string): void {
  const now = new Date().toISOString();
  db.delete(programDayCompletions).where(eq(programDayCompletions.programId, id)).run();
  db.update(programs).set({
    currentPosition: 0,
    status: "active",
    startedAt: now,
    completedAt: null,
    updatedAt: now,
    syncStatus: "pending",
  }).where(eq(programs.id, id)).run();
}

export function softDeleteProgram(id: string): void {
  const now = new Date().toISOString();
  db.update(programs).set({
    deletedAt: now, updatedAt: now, syncStatus: "pending",
  }).where(eq(programs.id, id)).run();
}

export function getActiveProgram(memberId: string): LocalProgram | null {
  const rows = db.select().from(programs)
    .where(and(
      eq(programs.memberId, memberId),
      eq(programs.status, "active"),
      isNull(programs.deletedAt),
    ))
    .all();
  return rows[0] ?? null;
}

export function getTodayDay(memberId: string): {
  program: LocalProgram;
  day: LocalProgramDay;
} | null {
  const p = getActiveProgram(memberId);
  if (!p) return null;
  const days = db.select().from(programDays)
    .where(eq(programDays.programId, p.id))
    .all();
  const day = days.find((d) => d.position === p.currentPosition);
  return day ? { program: p, day } : null;
}
