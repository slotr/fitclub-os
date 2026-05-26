import {
  boolean, index, integer, pgTable, text, uniqueIndex, uuid, varchar,
} from "drizzle-orm/pg-core";
import { id } from "./_helpers";
import { programs } from "./programs";
import { workoutTemplates } from "./workoutTemplates";

export const programDays = pgTable(
  "program_days",
  {
    id: id(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    day: integer("day").notNull(),
    position: integer("position").notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    templateId: uuid("template_id")
      .references(() => workoutTemplates.id, { onDelete: "set null" }),
    isRest: boolean("is_rest").notNull().default(false),
    notes: text("notes"),
  },
  (t) => ({
    programPositionIdx: uniqueIndex("program_days_position_uq")
      .on(t.programId, t.position),
    programIdx: index("program_days_program_idx").on(t.programId, t.position),
  }),
);
