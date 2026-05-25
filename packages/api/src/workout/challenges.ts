import { z } from "zod";

export const CHALLENGE_METRIC_TYPES = [
  "volume", "workout_count", "max_weight", "streak_weeks",
] as const;
export type ChallengeMetricType = typeof CHALLENGE_METRIC_TYPES[number];

export const CHALLENGE_STATUSES = [
  "draft", "active", "ended", "cancelled",
] as const;
export type ChallengeStatus = typeof CHALLENGE_STATUSES[number];

export const challengeInputSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  metricType: z.enum(CHALLENGE_METRIC_TYPES),
  exerciseId: z.string().uuid().nullable().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
}).superRefine((v, ctx) => {
  if (v.metricType === "max_weight" && !v.exerciseId) {
    ctx.addIssue({
      code: "custom",
      message: "exerciseId required for max_weight",
      path: ["exerciseId"],
    });
  }
  if (new Date(v.endsAt) <= new Date(v.startsAt)) {
    ctx.addIssue({
      code: "custom",
      message: "endsAt must be after startsAt",
      path: ["endsAt"],
    });
  }
});

export type ChallengeInput = z.infer<typeof challengeInputSchema>;

export type LeaderboardRow = {
  memberId: string;
  memberName: string;
  score: number;
  rank: number;
};
