import {
  index, pgTable, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { id } from "./_helpers";
import { members } from "./members";
import { programDays } from "./programDays";
import { programs } from "./programs";
import { workouts } from "./workouts";

export const programDayCompletions = pgTable(
  "program_day_completions",
  {
    id: id(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    programDayId: uuid("program_day_id")
      .notNull()
      .references(() => programDays.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    workoutId: uuid("workout_id")
      .references(() => workouts.id, { onDelete: "set null" }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    programDayUq: uniqueIndex("program_day_completions_uq")
      .on(t.programId, t.programDayId),
    memberIdx: index("program_day_completions_member_idx")
      .on(t.memberId, t.programId),
  }),
);
