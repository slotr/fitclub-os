import { pgEnum } from "drizzle-orm/pg-core";

export const programStatus = pgEnum("program_status", [
  "draft",
  "active",
  "paused",
  "completed",
]);
