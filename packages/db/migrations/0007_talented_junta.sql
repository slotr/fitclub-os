CREATE TYPE "public"."program_status" AS ENUM('draft', 'active', 'paused', 'completed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"estimated_min" integer,
	"source_preset" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_template_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"sets" integer NOT NULL,
	"rep_min" integer,
	"rep_max" integer,
	"rest_seconds" integer,
	"target_rpe" numeric(3, 1),
	"target_1rm_pct" integer,
	"tempo" text,
	"superset_group" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"weeks_count" integer NOT NULL,
	"days_per_week" integer NOT NULL,
	"status" "program_status" DEFAULT 'draft' NOT NULL,
	"current_position" integer DEFAULT 0 NOT NULL,
	"source_preset" varchar(80),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"week" integer NOT NULL,
	"day" integer NOT NULL,
	"position" integer NOT NULL,
	"title" varchar(120) NOT NULL,
	"template_id" uuid,
	"is_rest" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_day_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"program_day_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"workout_id" uuid,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "program_day_id" uuid;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "planned_rep_min" integer;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "planned_rep_max" integer;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "planned_rest_sec" integer;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "planned_rpe" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "planned_1rm_pct" integer;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "superset_group" integer;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "is_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_template_exercises_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_template_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_days" ADD CONSTRAINT "program_days_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_days" ADD CONSTRAINT "program_days_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_day_completions" ADD CONSTRAINT "program_day_completions_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_day_completions" ADD CONSTRAINT "program_day_completions_program_day_id_program_days_id_fk" FOREIGN KEY ("program_day_id") REFERENCES "public"."program_days"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_day_completions" ADD CONSTRAINT "program_day_completions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_day_completions" ADD CONSTRAINT "program_day_completions_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workout_templates_member_idx" ON "workout_templates" USING btree ("member_id","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workout_templates_tenant_idx" ON "workout_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wte_template_position_uq" ON "workout_template_exercises" USING btree ("template_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wte_template_idx" ON "workout_template_exercises" USING btree ("template_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_member_idx" ON "programs" USING btree ("member_id","status","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_tenant_idx" ON "programs" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "program_days_position_uq" ON "program_days" USING btree ("program_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "program_days_program_idx" ON "program_days" USING btree ("program_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "program_day_completions_uq" ON "program_day_completions" USING btree ("program_id","program_day_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "program_day_completions_member_idx" ON "program_day_completions" USING btree ("member_id","program_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workouts" ADD CONSTRAINT "workouts_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workouts" ADD CONSTRAINT "workouts_program_day_id_program_days_id_fk" FOREIGN KEY ("program_day_id") REFERENCES "public"."program_days"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Manual CHECK constraints (drizzle-kit does not generate these)
ALTER TABLE "workout_template_exercises"
  ADD CONSTRAINT "wte_sets_positive" CHECK ("sets" > 0);

ALTER TABLE "workout_template_exercises"
  ADD CONSTRAINT "wte_rep_range" CHECK (
    "rep_min" IS NULL OR "rep_max" IS NULL OR "rep_max" >= "rep_min"
  );

ALTER TABLE "programs"
  ADD CONSTRAINT "programs_weeks_positive" CHECK ("weeks_count" > 0);

ALTER TABLE "programs"
  ADD CONSTRAINT "programs_days_range" CHECK (
    "days_per_week" BETWEEN 1 AND 7
  );

ALTER TABLE "program_days"
  ADD CONSTRAINT "program_days_week_positive" CHECK ("week" > 0);

ALTER TABLE "program_days"
  ADD CONSTRAINT "program_days_day_range" CHECK ("day" BETWEEN 1 AND 7);

ALTER TABLE "program_days"
  ADD CONSTRAINT "program_days_rest_or_template" CHECK (
    "is_rest" = true OR "template_id" IS NOT NULL
  );
