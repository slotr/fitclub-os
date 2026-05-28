ALTER TABLE "workouts" ADD COLUMN "health_synced" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "health_uuid" text;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "health_attempts" integer DEFAULT 0 NOT NULL;