import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id } from "./_helpers";
import { challenges } from "./challenges";
import { members } from "./members";

export const challengeParticipants = pgTable(
  "challenge_participants",
  {
    id: id(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    challengeMemberUnique: uniqueIndex(
      "challenge_participants_challenge_member_unique_idx",
    ).on(t.challengeId, t.memberId),
    memberChallengeIdx: index(
      "challenge_participants_member_challenge_idx",
    ).on(t.memberId, t.challengeId),
  }),
);

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type NewChallengeParticipant =
  typeof challengeParticipants.$inferInsert;
