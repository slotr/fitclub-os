import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { auditLogs, members, payments } from "@fitness/db";
import { cryptoConfirmInputSchema } from "@fitness/api";
import { getDbClient, withTenantScope } from "@/lib/db";

function timingSafeEqualStr(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const sharedSecret = process.env.CRYPTO_WEBHOOK_SECRET;
  if (!sharedSecret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "webhook not configured" },
        { status: 503 },
      );
    }
    console.warn(
      "[crypto-webhook] CRYPTO_WEBHOOK_SECRET unset — accepting any request (dev only)",
    );
  } else {
    const provided = req.headers.get("x-fitclub-secret") ?? "";
    if (!timingSafeEqualStr(provided, sharedSecret)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = cryptoConfirmInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { paymentId, txHash, chain, fromAddress } = parsed.data;

  const rawDb = getDbClient();
  const [paymentRow] = await rawDb
    .select({
      id: payments.id,
      method: payments.method,
      status: payments.status,
      tenantId: members.tenantId,
      cryptoFromAddress: payments.cryptoFromAddress,
    })
    .from(payments)
    .innerJoin(members, eq(members.id, payments.memberId))
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!paymentRow) {
    return NextResponse.json({ error: "payment not found" }, { status: 404 });
  }
  if (paymentRow.method !== "crypto") {
    return NextResponse.json(
      { error: "payment is not a crypto payment" },
      { status: 400 },
    );
  }

  const alreadyPaid = paymentRow.status === "paid";
  const ip = req.headers.get("x-forwarded-for") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  if (!alreadyPaid) {
    await withTenantScope(paymentRow.tenantId, async (db) => {
      await db
        .update(payments)
        .set({
          status: "paid",
          cryptoTxHash: txHash,
          cryptoChain: chain,
          cryptoFromAddress: fromAddress ?? paymentRow.cryptoFromAddress,
          paidAt: new Date(),
        })
        .where(and(eq(payments.id, paymentId), ne(payments.status, "paid")));
      await db.insert(auditLogs).values({
        tenantId: paymentRow.tenantId,
        actorId: null,
        action: "payment.crypto_confirmed",
        targetType: "payment",
        targetId: paymentId,
        ip,
        userAgent,
        payload: { txHash, chain, fromAddress: fromAddress ?? null },
      });
    });
  }

  return NextResponse.json({ ok: true, paymentId, alreadyPaid });
}
