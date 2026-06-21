CREATE TYPE "public"."crypto_chain" AS ENUM('btc', 'eth', 'usdt_trc20', 'usdc_eth', 'usdc_base');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'crypto');--> statement-breakpoint
ALTER TYPE "public"."payment_status" ADD VALUE 'pending';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "method" "payment_method" DEFAULT 'card' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "crypto_chain" "crypto_chain";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "crypto_tx_hash" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "crypto_from_address" text;