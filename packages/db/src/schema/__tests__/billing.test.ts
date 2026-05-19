import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { plans } from "../plans";
import { memberships, membershipStatusEnum } from "../memberships";
import { payments, paymentStatusEnum } from "../payments";

describe("plans schema", () => {
  it("declares required columns", () => {
    expect(Object.keys(getTableColumns(plans))).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "name",
        "priceMinor",
        "currency",
        "durationDays",
        "features",
        "active",
      ]),
    );
  });
});

describe("memberships schema", () => {
  it("declares required columns", () => {
    expect(Object.keys(getTableColumns(memberships))).toEqual(
      expect.arrayContaining([
        "id",
        "memberId",
        "planId",
        "status",
        "startedAt",
        "endsAt",
        "pausedAt",
        "stripeSubscriptionId",
        "autoRenew",
        "lastInvoiceId",
      ]),
    );
  });

  it("exposes the status enum", () => {
    expect(membershipStatusEnum.enumValues).toEqual([
      "active",
      "paused",
      "past_due",
      "cancelled",
    ]);
  });
});

describe("payments schema", () => {
  it("declares required columns", () => {
    expect(Object.keys(getTableColumns(payments))).toEqual(
      expect.arrayContaining([
        "id",
        "memberId",
        "amountMinor",
        "currency",
        "stripeInvoiceId",
        "status",
        "paidAt",
        "attemptCount",
      ]),
    );
  });

  it("exposes the status enum", () => {
    expect(paymentStatusEnum.enumValues).toEqual([
      "paid",
      "failed",
      "refunded",
      "pending",
    ]);
  });
});
