import { sql } from "drizzle-orm";
import {
  customType,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id } from "./_helpers";
import { tenants } from "./tenants";

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "inactive",
  "pending",
]);

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

export const members = pgTable(
  "members",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    authUserId: uuid("auth_user_id"),
    email: varchar("email", { length: 256 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    fullName: text("full_name").notNull(),
    birthdate: date("birthdate"),
    gender: varchar("gender", { length: 16 }),
    photoUrl: text("photo_url"),
    qrSecretEnc: bytea("qr_secret_enc"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    status: memberStatusEnum("status").notNull().default("pending"),
    userId: uuid("user_id"),
    deletedAt: deletedAt(),
    createdAt: createdAt(),
  },
  (t) => ({
    tenantEmailUnique: uniqueIndex("members_tenant_email_uniq").on(
      t.tenantId,
      t.email,
    ),
    tenantStatusIdx: index("members_tenant_status_idx").on(t.tenantId, t.status),
    userIdx: index("members_user_id_idx").on(t.userId),
  }),
);

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
