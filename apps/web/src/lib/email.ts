import { render } from "@react-email/render";
import {
  Receipt,
  type ReceiptProps,
  Dunning,
  type DunningProps,
} from "@fitness/emails";
import { Resend } from "resend";
import { createElement } from "react";

let cached: Resend | null = null;
function getResend() {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  cached = new Resend(key);
  return cached;
}

export async function sendReceipt(to: string, props: ReceiptProps) {
  const html = await render(createElement(Receipt, props));
  await getResend().emails.send({
    from: "FitClub <noreply@fitclub.local>",
    to,
    subject: "Payment received",
    html,
  });
}

export async function sendDunning(to: string, props: DunningProps) {
  const html = await render(createElement(Dunning, props));
  await getResend().emails.send({
    from: "FitClub <billing@fitclub.local>",
    to,
    subject: `Payment failed — please update your card`,
    html,
  });
}
