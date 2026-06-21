import { z } from "zod";

export const paymentMethodSchema = z.enum(["card", "crypto"]);

export const cryptoChainSchema = z.enum([
  "btc",
  "eth",
  "usdt_trc20",
  "usdc_eth",
  "usdc_base",
]);

export const paymentStatusSchema = z.enum([
  "paid",
  "failed",
  "refunded",
  "pending",
]);

export const cryptoConfirmInputSchema = z.object({
  paymentId: z.string().uuid(),
  txHash: z.string().min(8).max(128),
  chain: cryptoChainSchema,
  fromAddress: z.string().min(8).max(128).optional(),
});

export const cryptoChainLabel: Record<
  z.infer<typeof cryptoChainSchema>,
  string
> = {
  btc: "Bitcoin",
  eth: "Ethereum",
  usdt_trc20: "USDT (TRC20)",
  usdc_eth: "USDC (ETH)",
  usdc_base: "USDC (Base)",
};

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type CryptoChain = z.infer<typeof cryptoChainSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type CryptoConfirmInput = z.infer<typeof cryptoConfirmInputSchema>;
