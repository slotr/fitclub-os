import "dotenv/config";
import { and, eq, inArray, sql } from "drizzle-orm";
import { createDbClient, type DbClient } from "./client";
import {
  bookings,
  classes,
  instructors,
  members,
  memberships,
  notificationSends,
  notificationTemplates,
  plans,
  sessions,
  studioSettings,
  tenants,
  waitlist,
  type Class,
  type Instructor,
  type Member,
  type Session,
  type Tenant,
} from "./schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");
  const db = createDbClient(databaseUrl);

  console.log("Seeding demo tenant...");
  const tenant = await ensureDemoTenant(db);

  const [basic, premium] = await ensureDemoPlans(db, tenant.id);

  const demoMember = await ensureDemoMember(db, tenant.id);

  await ensureDemoMembership(db, demoMember.id, premium.id);

  console.log(`Seeded tenant ${tenant.slug} with member ${demoMember.email}`);

  console.log("Seeding fitclub data (classes, sessions, bookings, ...) ...");
  await seedFitclub(db, tenant);
  console.log("Fitclub seed complete.");

  process.exit(0);
}

async function ensureDemoTenant(db: DbClient): Promise<Tenant> {
  const existing = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, "demo"))
    .limit(1);
  if (existing[0]) return existing[0];

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Demo Fitness Club",
      slug: "demo",
      timezone: "Europe/Istanbul",
      brandColor: "#f59e0b",
    })
    .returning();
  if (!tenant) throw new Error("tenant insert failed");
  return tenant;
}

async function ensureDemoPlans(db: DbClient, tenantId: string) {
  const existing = await db
    .select()
    .from(plans)
    .where(eq(plans.tenantId, tenantId));
  const findByName = (name: string) => existing.find((p) => p.name === name);

  const basic =
    findByName("Basic Monthly") ??
    (
      await db
        .insert(plans)
        .values({
          tenantId,
          name: "Basic Monthly",
          priceMinor: 49900,
          currency: "USD",
          durationDays: 30,
          features: ["Open gym access"],
        })
        .returning()
    )[0];

  const premium =
    findByName("Premium Monthly") ??
    (
      await db
        .insert(plans)
        .values({
          tenantId,
          name: "Premium Monthly",
          priceMinor: 89900,
          currency: "USD",
          durationDays: 30,
          features: ["Open gym", "All classes", "Locker"],
        })
        .returning()
    )[0];

  if (!basic || !premium) throw new Error("plans insert failed");
  return [basic, premium] as const;
}

async function ensureDemoMember(db: DbClient, tenantId: string): Promise<Member> {
  const existing = await db
    .select()
    .from(members)
    .where(
      and(eq(members.tenantId, tenantId), eq(members.email, "demo@fitness.local")),
    )
    .limit(1);
  if (existing[0]) return existing[0];

  const [member] = await db
    .insert(members)
    .values({
      tenantId,
      email: "demo@fitness.local",
      fullName: "Demo Member",
      status: "active",
    })
    .returning();
  if (!member) throw new Error("member insert failed");
  return member;
}

async function ensureDemoMembership(
  db: DbClient,
  memberId: string,
  planId: string,
) {
  const existing = await db
    .select()
    .from(memberships)
    .where(eq(memberships.memberId, memberId))
    .limit(1);
  if (existing[0]) return existing[0];

  const [row] = await db
    .insert(memberships)
    .values({
      memberId,
      planId,
      status: "active",
      startedAt: new Date(),
    })
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Fitclub seed (classes, instructors, sessions, bookings, waitlist, etc.)
// ---------------------------------------------------------------------------

const CLASS_SEEDS: Array<{
  name: string;
  category: "yoga" | "cross" | "pilates" | "strength" | "cardio" | "pt";
  defaultDurationMin: number;
  defaultCapacity: number;
  room: string;
  color: string;
}> = [
  {
    name: "Vinyasa Yoga",
    category: "yoga",
    defaultDurationMin: 60,
    defaultCapacity: 18,
    room: "Studio A",
    color: "#a78bfa",
  },
  {
    name: "CrossFit WOD",
    category: "cross",
    defaultDurationMin: 60,
    defaultCapacity: 14,
    room: "Open Floor",
    color: "#ef4444",
  },
  {
    name: "Reformer Pilates",
    category: "pilates",
    defaultDurationMin: 50,
    defaultCapacity: 10,
    room: "Studio B",
    color: "#f472b6",
  },
  {
    name: "Strength & Conditioning",
    category: "strength",
    defaultDurationMin: 60,
    defaultCapacity: 16,
    room: "Open Floor",
    color: "#f59e0b",
  },
  {
    name: "Spin Cardio",
    category: "cardio",
    defaultDurationMin: 45,
    defaultCapacity: 20,
    room: "Spin Room",
    color: "#22d3ee",
  },
  {
    name: "Personal Training",
    category: "pt",
    defaultDurationMin: 60,
    defaultCapacity: 1,
    room: "Studio A",
    color: "#10b981",
  },
];

const INSTRUCTOR_SEEDS: Array<{
  name: string;
  email: string;
  phone: string;
  bio: string;
}> = [
  {
    name: "Ayşe Yılmaz",
    email: "ayse.yilmaz@fitness.local",
    phone: "+905551110001",
    bio: "Yoga and pilates coach with 8 years of studio experience.",
  },
  {
    name: "Mehmet Demir",
    email: "mehmet.demir@fitness.local",
    phone: "+905551110002",
    bio: "Strength specialist, former national-level powerlifter.",
  },
  {
    name: "Elif Kaya",
    email: "elif.kaya@fitness.local",
    phone: "+905551110003",
    bio: "Cardio and HIIT enthusiast, certified spin instructor.",
  },
];

const SESSION_TIMES: Array<{ hour: number; minute: number }> = [
  { hour: 9, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 17, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 19, minute: 30 },
  { hour: 20, minute: 30 },
];

const ROOMS = ["Studio A", "Studio B", "Spin Room", "Open Floor"];

const TEMPLATE_SEEDS: Array<{
  key: string;
  channel: "push" | "sms" | "whatsapp" | "email";
  subject: string | null;
  body: string;
  variables: string[];
}> = [
  {
    key: "welcome",
    channel: "email",
    subject: "Welcome to {{studioName}}",
    body: "Hi {{firstName}}, welcome aboard! Your membership is active and we're excited to see you in class.",
    variables: ["studioName", "firstName"],
  },
  {
    key: "renewal_reminder",
    channel: "email",
    subject: "Your membership renews on {{renewDate}}",
    body: "Hi {{firstName}}, just a reminder that your {{planName}} renews on {{renewDate}}.",
    variables: ["firstName", "planName", "renewDate"],
  },
  {
    key: "payment_failed",
    channel: "sms",
    subject: null,
    body: "Hi {{firstName}}, your last payment for {{planName}} failed. Please update your card to keep your membership active.",
    variables: ["firstName", "planName"],
  },
  {
    key: "class_reminder",
    channel: "push",
    subject: null,
    body: "Reminder: {{className}} with {{instructorName}} starts at {{startTime}}.",
    variables: ["className", "instructorName", "startTime"],
  },
  {
    key: "waitlist_promoted",
    channel: "whatsapp",
    subject: null,
    body: "Good news {{firstName}}! A spot opened up in {{className}} on {{startTime}}. You're now booked in.",
    variables: ["firstName", "className", "startTime"],
  },
];

async function seedFitclub(db: DbClient, tenant: Tenant) {
  const allClasses = await ensureClasses(db, tenant.id);
  const allInstructors = await ensureInstructors(db, tenant.id);
  const allSessions = await ensureSessions(db, tenant.id, allClasses, allInstructors);
  const tenantMembers = await db
    .select()
    .from(members)
    .where(eq(members.tenantId, tenant.id));

  if (tenantMembers.length === 0) {
    console.log("  no members found for tenant — skipping bookings/waitlist");
  } else {
    await ensureBookings(db, tenant.id, allSessions, tenantMembers);
    await ensureWaitlist(db, tenant.id, allSessions, tenantMembers);
  }

  await ensureNotificationTemplates(db, tenant.id);
  await ensureStudioSettings(db, tenant);
}

async function ensureClasses(db: DbClient, tenantId: string): Promise<Class[]> {
  const existing = await db
    .select()
    .from(classes)
    .where(eq(classes.tenantId, tenantId));
  const byName = new Map(existing.map((c) => [c.name, c]));

  const toInsert = CLASS_SEEDS.filter((c) => !byName.has(c.name)).map((c) => ({
    tenantId,
    ...c,
  }));
  if (toInsert.length > 0) {
    const inserted = await db.insert(classes).values(toInsert).returning();
    inserted.forEach((c) => byName.set(c.name, c));
    console.log(`  classes: inserted ${inserted.length}`);
  } else {
    console.log("  classes: already present");
  }

  return CLASS_SEEDS.map((c) => {
    const row = byName.get(c.name);
    if (!row) throw new Error(`class missing after seed: ${c.name}`);
    return row;
  });
}

async function ensureInstructors(
  db: DbClient,
  tenantId: string,
): Promise<Instructor[]> {
  const existing = await db
    .select()
    .from(instructors)
    .where(eq(instructors.tenantId, tenantId));
  const byEmail = new Map(existing.map((i) => [i.email ?? "", i]));

  const toInsert = INSTRUCTOR_SEEDS.filter((i) => !byEmail.has(i.email)).map(
    (i) => ({ tenantId, ...i }),
  );
  if (toInsert.length > 0) {
    const inserted = await db.insert(instructors).values(toInsert).returning();
    inserted.forEach((i) => byEmail.set(i.email ?? "", i));
    console.log(`  instructors: inserted ${inserted.length}`);
  } else {
    console.log("  instructors: already present");
  }

  return INSTRUCTOR_SEEDS.map((i) => {
    const row = byEmail.get(i.email);
    if (!row) throw new Error(`instructor missing after seed: ${i.email}`);
    return row;
  });
}

async function ensureSessions(
  db: DbClient,
  tenantId: string,
  classRows: Class[],
  instructorRows: Instructor[],
): Promise<Session[]> {
  const existing = await db
    .select()
    .from(sessions)
    .where(eq(sessions.tenantId, tenantId));
  if (existing.length >= 60) {
    console.log(`  sessions: already present (${existing.length})`);
    return existing;
  }

  const existingKeys = new Set(
    existing.map((s) => `${s.classId}:${s.startsAt.toISOString()}`),
  );

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const rows: Array<typeof sessions.$inferInsert> = [];
  let counter = 0;
  for (let day = 0; day < 14 && rows.length + existing.length < 60; day += 1) {
    for (const time of SESSION_TIMES) {
      if (rows.length + existing.length >= 60) break;
      const klass = classRows[counter % classRows.length]!;
      const instructor = instructorRows[counter % instructorRows.length]!;
      const room = ROOMS[counter % ROOMS.length]!;
      const startsAt = new Date(today);
      startsAt.setUTCDate(startsAt.getUTCDate() + day);
      startsAt.setUTCHours(time.hour, time.minute, 0, 0);
      const endsAt = new Date(
        startsAt.getTime() + klass.defaultDurationMin * 60_000,
      );
      const key = `${klass.id}:${startsAt.toISOString()}`;
      if (existingKeys.has(key)) {
        counter += 1;
        continue;
      }
      rows.push({
        tenantId,
        classId: klass.id,
        instructorId: instructor.id,
        startsAt,
        endsAt,
        capacity: klass.defaultCapacity,
        room,
        status: "scheduled",
      });
      counter += 1;
    }
  }

  if (rows.length === 0) {
    console.log("  sessions: nothing to insert");
    return existing;
  }

  const inserted = await db.insert(sessions).values(rows).returning();
  console.log(`  sessions: inserted ${inserted.length}`);
  return [...existing, ...inserted];
}

async function ensureBookings(
  db: DbClient,
  tenantId: string,
  sessionRows: Session[],
  memberRows: Member[],
) {
  const sessionIds = sessionRows.map((s) => s.id);
  if (sessionIds.length === 0) return;
  const existing = await db
    .select({ sessionId: bookings.sessionId, memberId: bookings.memberId })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        inArray(bookings.sessionId, sessionIds),
      ),
    );
  if (existing.length >= 240) {
    console.log(`  bookings: already present (${existing.length})`);
    return;
  }

  const taken = new Set(existing.map((b) => `${b.sessionId}:${b.memberId}`));
  const TARGET = 240;
  const rows: Array<typeof bookings.$inferInsert> = [];
  let cursor = 0;

  while (rows.length + existing.length < TARGET) {
    const session = sessionRows[cursor % sessionRows.length]!;
    // 4 bookings per session keeps us roughly at 240 / 60.
    const bookingsForSession = Math.min(4, memberRows.length);
    for (let i = 0; i < bookingsForSession; i += 1) {
      const member = memberRows[(cursor * 4 + i) % memberRows.length]!;
      const key = `${session.id}:${member.id}`;
      if (taken.has(key)) continue;
      taken.add(key);
      rows.push({
        tenantId,
        sessionId: session.id,
        memberId: member.id,
        status: "booked",
      });
      if (rows.length + existing.length >= TARGET) break;
    }
    cursor += 1;
    if (cursor > sessionRows.length * memberRows.length) break;
  }

  if (rows.length === 0) {
    console.log("  bookings: nothing to insert");
    return;
  }
  await db.insert(bookings).values(rows);
  console.log(`  bookings: inserted ${rows.length}`);
}

async function ensureWaitlist(
  db: DbClient,
  tenantId: string,
  sessionRows: Session[],
  memberRows: Member[],
) {
  const sessionIds = sessionRows.map((s) => s.id);
  if (sessionIds.length === 0) return;
  const existing = await db
    .select({ sessionId: waitlist.sessionId, memberId: waitlist.memberId })
    .from(waitlist)
    .where(
      and(
        eq(waitlist.tenantId, tenantId),
        inArray(waitlist.sessionId, sessionIds),
      ),
    );
  if (existing.length >= 12) {
    console.log(`  waitlist: already present (${existing.length})`);
    return;
  }

  const taken = new Set(existing.map((w) => `${w.sessionId}:${w.memberId}`));
  const targetSessions = sessionRows.slice(0, 4); // first 4 sessions get a waitlist
  const rows: Array<typeof waitlist.$inferInsert> = [];

  for (const session of targetSessions) {
    for (let position = 1; position <= 3; position += 1) {
      const member = memberRows[(rows.length + 1) % memberRows.length]!;
      const key = `${session.id}:${member.id}`;
      if (taken.has(key)) continue;
      taken.add(key);
      rows.push({
        tenantId,
        sessionId: session.id,
        memberId: member.id,
        position,
      });
      if (rows.length + existing.length >= 12) break;
    }
    if (rows.length + existing.length >= 12) break;
  }

  if (rows.length === 0) {
    console.log("  waitlist: nothing to insert");
    return;
  }
  await db.insert(waitlist).values(rows);
  console.log(`  waitlist: inserted ${rows.length}`);
}

async function ensureNotificationTemplates(db: DbClient, tenantId: string) {
  const existing = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.tenantId, tenantId));
  const byKey = new Map(
    existing.map((t) => [`${t.key}:${t.channel}`, t]),
  );

  const toInsert = TEMPLATE_SEEDS.filter(
    (t) => !byKey.has(`${t.key}:${t.channel}`),
  ).map((t) => ({ tenantId, ...t }));
  if (toInsert.length === 0) {
    console.log("  notification_templates: already present");
    return;
  }
  await db.insert(notificationTemplates).values(toInsert);
  console.log(`  notification_templates: inserted ${toInsert.length}`);
  // Touch notificationSends to keep the import used; no rows seeded.
  void notificationSends;
  void sql;
}

async function ensureStudioSettings(db: DbClient, tenant: Tenant) {
  const existing = await db
    .select()
    .from(studioSettings)
    .where(eq(studioSettings.tenantId, tenant.id))
    .limit(1);
  if (existing[0]) {
    console.log("  studio_settings: already present");
    return;
  }
  await db.insert(studioSettings).values({
    tenantId: tenant.id,
    name: tenant.name,
    timezone: tenant.timezone ?? "Europe/Istanbul",
    locale: tenant.locale ?? "en",
    currency: "TRY",
    accentColor: tenant.brandColor,
    hours: [
      { day: "mon", open: "07:00", close: "22:00" },
      { day: "tue", open: "07:00", close: "22:00" },
      { day: "wed", open: "07:00", close: "22:00" },
      { day: "thu", open: "07:00", close: "22:00" },
      { day: "fri", open: "07:00", close: "22:00" },
      { day: "sat", open: "09:00", close: "20:00" },
      { day: "sun", open: "09:00", close: "18:00" },
    ],
    integrations: {},
  });
  console.log("  studio_settings: inserted");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
