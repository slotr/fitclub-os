"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  activateMemberAction,
  cancelMembershipAction,
  pauseMembershipAction,
  resumeMembershipAction,
} from "../_actions";

export function DetailActions({
  memberId,
  memberStatus,
  membershipStatus,
  email,
}: {
  memberId: string;
  memberStatus: "active" | "inactive" | "pending";
  membershipStatus: "active" | "paused" | "past_due" | "cancelled" | null;
  email: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSendMessage = () => {
    router.push(`/admin/notifications?member=${encodeURIComponent(email)}`);
  };

  const onPauseToggle = () => {
    const isPaused = membershipStatus === "paused";
    if (
      !window.confirm(
        isPaused
          ? "Resume this member's billing on the next cycle?"
          : "Pause billing immediately? Member keeps access through current cycle.",
      )
    )
      return;
    startTransition(async () => {
      if (isPaused) await resumeMembershipAction(memberId);
      else await pauseMembershipAction(memberId);
      router.refresh();
    });
  };

  const onCancel = () => {
    if (
      !window.confirm(
        "Cancel this membership? Member status flips to inactive. This cannot be undone from the UI.",
      )
    )
      return;
    startTransition(async () => {
      await cancelMembershipAction(memberId);
      router.refresh();
    });
  };

  const isPaused = membershipStatus === "paused";
  const isCancelled = membershipStatus === "cancelled";
  const isPending = memberStatus === "pending";

  const onActivate = () => {
    startTransition(async () => {
      await activateMemberAction(memberId);
      router.refresh();
    });
  };

  return (
    <div className="mt-4 flex w-full flex-col gap-2">
      {isPending && (
        <button
          type="button"
          onClick={onActivate}
          disabled={pending}
          className="h-9 rounded-sm bg-good text-xs font-semibold text-surface hover:opacity-90 disabled:opacity-50"
        >
          Activate member
        </button>
      )}
      <button
        type="button"
        onClick={onSendMessage}
        disabled={pending}
        className="h-9 rounded-sm border border-[var(--border-color)] bg-surface text-xs font-semibold hover:bg-[#faf9f7] disabled:opacity-50"
      >
        Send message
      </button>
      <button
        type="button"
        onClick={onPauseToggle}
        disabled={pending || isCancelled}
        className="h-9 rounded-sm border border-[var(--border-color)] bg-surface text-xs font-semibold hover:bg-[#faf9f7] disabled:opacity-50"
      >
        {isPaused ? "Resume membership" : "Pause membership"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={pending || isCancelled}
        className="h-9 rounded-sm border border-[var(--border-color)] bg-surface text-xs font-semibold text-bad hover:bg-bad-soft/40 disabled:opacity-50"
      >
        {isCancelled ? "Cancelled" : "Cancel membership"}
      </button>
    </div>
  );
}
