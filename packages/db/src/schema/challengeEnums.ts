import { pgEnum } from "drizzle-orm/pg-core";

export const challengeMetricType = pgEnum("challenge_metric_type", [
  "volume",
  "workout_count",
  "max_weight",
  "streak_weeks",
]);

export const challengeStatus = pgEnum("challenge_status", [
  "draft",
  "active",
  "ended",
  "cancelled",
]);
