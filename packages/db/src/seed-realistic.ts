/**
 * Realistic business data seed — ~100 members with ~7 months of history:
 * memberships (active / paused / past_due / cancelled), monthly payments,
 * daily check-ins, and class bookings on past + future sessions.
 *
 * Idempotent-ish: skips if realistic members (email @fitclub.member) already
 * exist. Run once against a migrated + base-seeded database.
 */
import "dotenv/config";
import { and, eq, like } from "drizzle-orm";
import { createDbClient, type DbClient } from "./client";
import {
  bookings,
  checkins,
  classes,
  instructors,
  members,
  memberships,
  payments,
  plans,
  sessions,
  tenants,
} from "./schema";

const DAY = 86_400_000;
const now = Date.now();

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
function chance(p: number) {
  return Math.random() < p;
}
async function insertChunked<T>(
  db: DbClient,
  table: Parameters<DbClient["insert"]>[0],
  rows: T[],
  size = 400,
) {
  for (let i = 0; i < rows.length; i += size) {
    await db.insert(table).values(rows.slice(i, i + size) as never);
  }
}

const FIRST = [
  "Ayşe", "Mehmet", "Elif", "Mustafa", "Zeynep", "Ahmet", "Fatma", "Emre",
  "Selin", "Burak", "Deniz", "Cem", "Merve", "Can", "Ece", "Hakan", "Buse",
  "Onur", "İrem", "Kerem", "Gizem", "Tolga", "Sıla", "Barış", "Pelin",
  "Yusuf", "Aslı", "Kaan", "Nazlı", "Serkan", "Derya", "Murat", "Cansu",
  "Berk", "Esra", "Arda", "Melis", "Volkan", "Damla", "Eren", "Gökçe",
  "Sinan", "Bora", "Tuğçe", "Umut", "Yasemin", "Ozan", "Defne", "Mert", "Naz",
];
const LAST = [
  "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk",
  "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara",
  "Koç", "Kurt", "Özkan", "Şimşek", "Polat", "Korkmaz", "Erdoğan", "Aksoy",
  "Türk", "Acar", "Bulut", "Güneş", "Tekin", "Yavuz",
];
const GATES = ["Main", "Side", "Studio-A", "Kiosk-1"];
const CRYPTO_CHAINS: Array<
  "btc" | "eth" | "usdt_trc20" | "usdc_eth" | "usdc_base"
> = ["btc", "eth", "usdt_trc20", "usdc_eth", "usdc_base"];
const CHECKIN_SOURCES: Array<"qr" | "manual" | "kiosk"> = [
  "qr",
  "qr",
  "qr",
  "kiosk",
  "kiosk",
  "manual",
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");
  const db = createDbClient(databaseUrl);

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, "demo"))
    .limit(1);
  if (!tenant) throw new Error("demo tenant not found — run base seed first");

  const existingRealistic = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(eq(members.tenantId, tenant.id), like(members.email, "%@fitclub.member")),
    );
  if (existingRealistic.length > 0) {
    console.log(
      `Realistic members already present (${existingRealistic.length}) — aborting to avoid duplicates.`,
    );
    process.exit(0);
  }

  // --- Plans: flip to TRY pricing, ensure a Performance tier --------------
  const planRows = await db
    .select()
    .from(plans)
    .where(eq(plans.tenantId, tenant.id));
  for (const p of planRows) {
    if (p.currency !== "TRY") {
      await db
        .update(plans)
        .set({ currency: "TRY" })
        .where(eq(plans.id, p.id));
    }
  }
  let perf = planRows.find((p) => p.name.toLowerCase().startsWith("performance"));
  if (!perf) {
    [perf] = await db
      .insert(plans)
      .values({
        tenantId: tenant.id,
        name: "Performance Monthly",
        priceMinor: 149900,
        currency: "TRY",
        durationDays: 30,
        features: ["Everything in Premium", "4 PT sessions / month"],
      })
      .returning();
  }
  const allPlans = await db
    .select()
    .from(plans)
    .where(eq(plans.tenantId, tenant.id));
  const basic =
    allPlans.find((p) => p.name.toLowerCase().startsWith("basic")) ?? allPlans[0]!;
  const premium =
    allPlans.find((p) => p.name.toLowerCase().startsWith("premium")) ?? allPlans[0]!;
  const performance =
    allPlans.find((p) => p.name.toLowerCase().startsWith("performance")) ??
    allPlans[0]!;

  // --- Members + memberships + payments + checkins -----------------------
  const MEMBER_COUNT = 104;
  const memberRows: Array<typeof members.$inferInsert> = [];
  const usedEmails = new Set<string>();

  type Plan = typeof allPlans[number];
  type PlannedMember = {
    email: string;
    joinedAt: Date;
    plan: Plan;
    membershipStatus: "active" | "paused" | "past_due" | "cancelled";
    memberStatus: "active" | "inactive" | "pending";
    endsAt: Date | null;
    pausedAt: Date | null;
  };
  const planned: PlannedMember[] = [];

  for (let i = 0; i < MEMBER_COUNT; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    let email = `${first}.${last}.${i}`
      .toLocaleLowerCase("tr")
      .replace(/[^a-z0-9.]/g, "");
    email = `${email}@fitclub.member`;
    if (usedEmails.has(email)) continue;
    usedEmails.add(email);

    // joined sometime in the last 7 months (210 days)
    const joinedDaysAgo = randInt(8, 210);
    const joinedAt = new Date(now - joinedDaysAgo * DAY);

    // membership status mix
    const roll = Math.random();
    let membershipStatus: PlannedMember["membershipStatus"];
    if (roll < 0.68) membershipStatus = "active";
    else if (roll < 0.78) membershipStatus = "past_due";
    else if (roll < 0.87) membershipStatus = "paused";
    else membershipStatus = "cancelled";

    const planRoll = Math.random();
    const plan =
      planRoll < 0.4 ? basic : planRoll < 0.85 ? premium : performance;

    let endsAt: Date | null = null;
    let pausedAt: Date | null = null;
    let memberStatus: PlannedMember["memberStatus"] = "active";
    if (membershipStatus === "cancelled") {
      // cancelled somewhere between join and now
      const lifeDays = Math.max(20, joinedDaysAgo - randInt(5, 60));
      endsAt = new Date(joinedAt.getTime() + lifeDays * DAY);
      if (endsAt.getTime() > now) endsAt = new Date(now - randInt(2, 20) * DAY);
      memberStatus = "inactive";
    } else if (membershipStatus === "paused") {
      pausedAt = new Date(now - randInt(3, 40) * DAY);
    }

    planned.push({
      email,
      joinedAt,
      plan,
      membershipStatus,
      memberStatus,
      endsAt,
      pausedAt,
    });
    memberRows.push({
      tenantId: tenant.id,
      email,
      phone: `+9055${randInt(10000000, 99999999)}`,
      fullName: `${first} ${last}`,
      birthdate: `${randInt(1972, 2006)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
      gender: pick(["female", "male", "female", "male", "other"]),
      joinedAt,
      status: memberStatus,
    });
  }

  const insertedMembers = await (async () => {
    const out: Array<typeof members.$inferSelect> = [];
    for (let i = 0; i < memberRows.length; i += 200) {
      const got = await db
        .insert(members)
        .values(memberRows.slice(i, i + 200))
        .returning();
      out.push(...got);
    }
    return out;
  })();
  console.log(`members: inserted ${insertedMembers.length}`);

  const membershipRows: Array<typeof memberships.$inferInsert> = [];
  const paymentRows: Array<typeof payments.$inferInsert> = [];
  const checkinRows: Array<typeof checkins.$inferInsert> = [];

  insertedMembers.forEach((m, idx) => {
    const p = planned[idx]!;
    membershipRows.push({
      memberId: m.id,
      planId: p.plan.id,
      status: p.membershipStatus,
      startedAt: p.joinedAt,
      endsAt: p.endsAt,
      pausedAt: p.pausedAt,
      autoRenew: p.membershipStatus === "active",
    });

    // --- payments: ~monthly from join to (cancel | now) ---
    const stop = p.endsAt ? p.endsAt.getTime() : now;
    let cycle = 0;
    for (let t = p.joinedAt.getTime(); t <= stop; t += 30 * DAY) {
      cycle++;
      const isLast = t + 30 * DAY > stop;
      const isCrypto = chance(0.2);
      let status: "paid" | "failed" | "refunded" | "pending" = "paid";
      let attemptCount = 1;
      if (p.membershipStatus === "past_due" && isLast) {
        status = "failed";
        attemptCount = randInt(2, 4);
      } else if (chance(0.025)) {
        status = "refunded";
      }
      paymentRows.push({
        memberId: m.id,
        amountMinor: p.plan.priceMinor,
        currency: "TRY",
        method: isCrypto ? "crypto" : "card",
        status,
        paidAt: status === "paid" ? new Date(t) : null,
        attemptCount,
        stripeInvoiceId: isCrypto
          ? null
          : `in_${m.id.slice(0, 8)}_${cycle}`,
        cryptoChain: isCrypto ? pick(CRYPTO_CHAINS) : null,
        cryptoTxHash: isCrypto
          ? "0x" + Math.random().toString(16).slice(2).padEnd(40, "0")
          : null,
        cryptoFromAddress: isCrypto
          ? "0x" + Math.random().toString(16).slice(2).padEnd(40, "0")
          : null,
        createdAt: new Date(t),
      });
    }

    // --- checkins: realistic attendance over the membership window ---
    const visitWindowEnd = Math.min(now, stop);
    // weekly frequency profile per member
    const perWeek = pick([0, 1, 1, 2, 2, 2, 3, 3, 4]);
    if (perWeek > 0) {
      for (
        let t = p.joinedAt.getTime();
        t < visitWindowEnd;
        t += 7 * DAY
      ) {
        const visitsThisWeek = randInt(
          Math.max(0, perWeek - 1),
          perWeek + 1,
        );
        for (let v = 0; v < visitsThisWeek; v++) {
          const dayOffset = randInt(0, 6);
          const hour = randInt(7, 21);
          const minute = randInt(0, 59);
          const at = t + dayOffset * DAY + hour * 3_600_000 + minute * 60_000;
          if (at >= visitWindowEnd || at < p.joinedAt.getTime()) continue;
          checkinRows.push({
            tenantId: tenant.id,
            memberId: m.id,
            checkedInAt: new Date(at),
            source: pick(CHECKIN_SOURCES),
            gateId: pick(GATES),
          });
        }
      }
    }
  });

  await insertChunked(db, memberships, membershipRows, 300);
  console.log(`memberships: inserted ${membershipRows.length}`);
  await insertChunked(db, payments, paymentRows, 400);
  console.log(`payments: inserted ${paymentRows.length}`);
  await insertChunked(db, checkins, checkinRows, 500);
  console.log(`checkins: inserted ${checkinRows.length}`);

  // --- Past sessions (90 days back) for booking history ------------------
  const classRows = await db
    .select()
    .from(classes)
    .where(eq(classes.tenantId, tenant.id));
  const instructorRows = await db
    .select()
    .from(instructors)
    .where(eq(instructors.tenantId, tenant.id));
  const SESSION_HOURS = [9, 12, 17, 18, 19, 20];

  const pastSessionRows: Array<typeof sessions.$inferInsert> = [];
  for (let d = 90; d >= 1; d--) {
    const base = new Date(now - d * DAY);
    base.setUTCHours(0, 0, 0, 0);
    const sessionsToday = randInt(3, 5);
    for (let s = 0; s < sessionsToday; s++) {
      const klass = pick(classRows);
      const hour = pick(SESSION_HOURS);
      const startsAt = new Date(base.getTime() + hour * 3_600_000);
      pastSessionRows.push({
        tenantId: tenant.id,
        classId: klass.id,
        instructorId: pick(instructorRows).id,
        startsAt,
        endsAt: new Date(startsAt.getTime() + klass.defaultDurationMin * 60_000),
        capacity: klass.defaultCapacity,
        room: klass.room,
        status: "completed",
      });
    }
  }
  const insertedSessions = await (async () => {
    const out: Array<typeof sessions.$inferSelect> = [];
    for (let i = 0; i < pastSessionRows.length; i += 300) {
      const got = await db
        .insert(sessions)
        .values(pastSessionRows.slice(i, i + 300))
        .returning();
      out.push(...got);
    }
    return out;
  })();
  console.log(`sessions (past): inserted ${insertedSessions.length}`);

  const futureSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.tenantId, tenant.id));
  const upcoming = futureSessions.filter((s) => s.startsAt.getTime() > now);

  // --- Bookings ----------------------------------------------------------
  // memberMap: who was a member at a given time
  const memberWindows = insertedMembers.map((m, idx) => ({
    id: m.id,
    from: planned[idx]!.joinedAt.getTime(),
    to: planned[idx]!.endsAt ? planned[idx]!.endsAt!.getTime() : now + 60 * DAY,
  }));

  const bookingRows: Array<typeof bookings.$inferInsert> = [];
  const seen = new Set<string>();

  // past sessions → attended / no_show / cancelled
  for (const sess of insertedSessions) {
    const fill = Math.round(sess.capacity * (0.4 + Math.random() * 0.5));
    for (let i = 0; i < fill; i++) {
      const cand = pick(memberWindows);
      if (sess.startsAt.getTime() < cand.from || sess.startsAt.getTime() > cand.to)
        continue;
      const key = `${sess.id}:${cand.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const r = Math.random();
      const status =
        r < 0.78 ? "attended" : r < 0.93 ? "no_show" : "cancelled";
      bookingRows.push({
        tenantId: tenant.id,
        sessionId: sess.id,
        memberId: cand.id,
        status,
        bookedAt: new Date(sess.startsAt.getTime() - randInt(1, 96) * 3_600_000),
        cancelledAt:
          status === "cancelled"
            ? new Date(sess.startsAt.getTime() - randInt(1, 24) * 3_600_000)
            : null,
      });
    }
  }
  // upcoming sessions → booked
  for (const sess of upcoming) {
    const fill = Math.round(sess.capacity * (0.3 + Math.random() * 0.4));
    for (let i = 0; i < fill; i++) {
      const cand = pick(memberWindows);
      if (cand.to < now) continue; // skip lapsed members
      const key = `${sess.id}:${cand.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      bookingRows.push({
        tenantId: tenant.id,
        sessionId: sess.id,
        memberId: cand.id,
        status: "booked",
        bookedAt: new Date(now - randInt(1, 240) * 3_600_000),
      });
    }
  }
  await insertChunked(db, bookings, bookingRows, 500);
  console.log(`bookings: inserted ${bookingRows.length}`);

  console.log("Realistic seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
