-- infra/supabase/policies/0008_multi_tenant_rls.sql
-- Drops all *_mobile_anon permissive policies and rewrites strict tenant
-- policies to a hybrid form that supports BOTH the admin web
-- (current_tenant_id() session setting) AND the mobile JWT path
-- (user_tenant_ids() based on auth.uid()).

-- -----------------------------------------------------------
-- Step 1: Drop all *_mobile_anon permissive policies
-- -----------------------------------------------------------
DROP POLICY IF EXISTS members_mobile_anon ON public.members;
DROP POLICY IF EXISTS memberships_mobile_anon ON public.memberships;
DROP POLICY IF EXISTS payments_mobile_anon ON public.payments;
DROP POLICY IF EXISTS checkins_mobile_anon ON public.checkins;
DROP POLICY IF EXISTS bookings_mobile_anon ON public.bookings;
DROP POLICY IF EXISTS classes_mobile_anon ON public.classes;
DROP POLICY IF EXISTS instructors_mobile_anon ON public.instructors;
DROP POLICY IF EXISTS sessions_mobile_anon ON public.sessions;
DROP POLICY IF EXISTS waitlist_mobile_anon ON public.waitlist;
DROP POLICY IF EXISTS plans_mobile_anon ON public.plans;
DROP POLICY IF EXISTS studio_settings_mobile_anon ON public.studio_settings;
DROP POLICY IF EXISTS notification_templates_mobile_anon ON public.notification_templates;
DROP POLICY IF EXISTS notification_sends_mobile_anon ON public.notification_sends;
DROP POLICY IF EXISTS exercises_mobile_anon ON public.exercises;
DROP POLICY IF EXISTS member_exercise_prefs_mobile_anon ON public.member_exercise_prefs;
DROP POLICY IF EXISTS workouts_mobile_anon ON public.workouts;
DROP POLICY IF EXISTS workout_sets_mobile_anon ON public.workout_sets;
DROP POLICY IF EXISTS challenges_mobile_anon ON public.challenges;
DROP POLICY IF EXISTS challenge_participants_mobile_anon ON public.challenge_participants;
DROP POLICY IF EXISTS workout_templates_mobile_anon ON public.workout_templates;
DROP POLICY IF EXISTS wte_mobile_anon ON public.workout_template_exercises;
DROP POLICY IF EXISTS programs_mobile_anon ON public.programs;
DROP POLICY IF EXISTS program_days_mobile_anon ON public.program_days;
DROP POLICY IF EXISTS program_day_completions_mobile_anon ON public.program_day_completions;

-- -----------------------------------------------------------
-- Step 2: Rewrite strict policies to hybrid form
-- -----------------------------------------------------------

-- members
DROP POLICY IF EXISTS members_select ON public.members;
DROP POLICY IF EXISTS members_modify ON public.members;
CREATE POLICY members_select ON public.members
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY members_modify ON public.members
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- memberships
DROP POLICY IF EXISTS memberships_select ON public.memberships;
DROP POLICY IF EXISTS memberships_modify ON public.memberships;
CREATE POLICY memberships_select ON public.memberships
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY memberships_modify ON public.memberships
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- payments
DROP POLICY IF EXISTS payments_select ON public.payments;
DROP POLICY IF EXISTS payments_modify ON public.payments;
CREATE POLICY payments_select ON public.payments
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY payments_modify ON public.payments
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- checkins
DROP POLICY IF EXISTS checkins_select ON public.checkins;
DROP POLICY IF EXISTS checkins_modify ON public.checkins;
CREATE POLICY checkins_select ON public.checkins
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY checkins_modify ON public.checkins
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- bookings
DROP POLICY IF EXISTS bookings_select ON public.bookings;
DROP POLICY IF EXISTS bookings_modify ON public.bookings;
CREATE POLICY bookings_select ON public.bookings
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY bookings_modify ON public.bookings
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- classes
DROP POLICY IF EXISTS classes_select ON public.classes;
DROP POLICY IF EXISTS classes_modify ON public.classes;
CREATE POLICY classes_select ON public.classes
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY classes_modify ON public.classes
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- instructors
DROP POLICY IF EXISTS instructors_select ON public.instructors;
DROP POLICY IF EXISTS instructors_modify ON public.instructors;
CREATE POLICY instructors_select ON public.instructors
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY instructors_modify ON public.instructors
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- sessions
DROP POLICY IF EXISTS sessions_select ON public.sessions;
DROP POLICY IF EXISTS sessions_modify ON public.sessions;
CREATE POLICY sessions_select ON public.sessions
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY sessions_modify ON public.sessions
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- waitlist
DROP POLICY IF EXISTS waitlist_select ON public.waitlist;
DROP POLICY IF EXISTS waitlist_modify ON public.waitlist;
CREATE POLICY waitlist_select ON public.waitlist
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY waitlist_modify ON public.waitlist
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- plans
DROP POLICY IF EXISTS plans_select ON public.plans;
DROP POLICY IF EXISTS plans_modify ON public.plans;
CREATE POLICY plans_select ON public.plans
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY plans_modify ON public.plans
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- studio_settings
DROP POLICY IF EXISTS studio_settings_select ON public.studio_settings;
DROP POLICY IF EXISTS studio_settings_modify ON public.studio_settings;
CREATE POLICY studio_settings_select ON public.studio_settings
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY studio_settings_modify ON public.studio_settings
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- notification_templates
DROP POLICY IF EXISTS notification_templates_select ON public.notification_templates;
DROP POLICY IF EXISTS notification_templates_modify ON public.notification_templates;
CREATE POLICY notification_templates_select ON public.notification_templates
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY notification_templates_modify ON public.notification_templates
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- notification_sends
DROP POLICY IF EXISTS notification_sends_select ON public.notification_sends;
DROP POLICY IF EXISTS notification_sends_modify ON public.notification_sends;
CREATE POLICY notification_sends_select ON public.notification_sends
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY notification_sends_modify ON public.notification_sends
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- member_exercise_prefs
DROP POLICY IF EXISTS member_exercise_prefs_select ON public.member_exercise_prefs;
DROP POLICY IF EXISTS member_exercise_prefs_modify ON public.member_exercise_prefs;
CREATE POLICY member_exercise_prefs_select ON public.member_exercise_prefs
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY member_exercise_prefs_modify ON public.member_exercise_prefs
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- workouts
DROP POLICY IF EXISTS workouts_select ON public.workouts;
DROP POLICY IF EXISTS workouts_modify ON public.workouts;
CREATE POLICY workouts_select ON public.workouts
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY workouts_modify ON public.workouts
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- challenges
DROP POLICY IF EXISTS challenges_select ON public.challenges;
DROP POLICY IF EXISTS challenges_modify ON public.challenges;
CREATE POLICY challenges_select ON public.challenges
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY challenges_modify ON public.challenges
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- workout_templates
DROP POLICY IF EXISTS workout_templates_select ON public.workout_templates;
DROP POLICY IF EXISTS workout_templates_modify ON public.workout_templates;
CREATE POLICY workout_templates_select ON public.workout_templates
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY workout_templates_modify ON public.workout_templates
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- programs
DROP POLICY IF EXISTS programs_select ON public.programs;
DROP POLICY IF EXISTS programs_modify ON public.programs;
CREATE POLICY programs_select ON public.programs
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY programs_modify ON public.programs
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- exercises (special case: tenant_id IS NULL for global library)
DROP POLICY IF EXISTS exercises_select ON public.exercises;
DROP POLICY IF EXISTS exercises_modify ON public.exercises;
CREATE POLICY exercises_select ON public.exercises
  FOR SELECT USING (
    tenant_id IS NULL
    OR tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY exercises_modify ON public.exercises
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- workout_sets (child of workouts)
DROP POLICY IF EXISTS workout_sets_select ON public.workout_sets;
DROP POLICY IF EXISTS workout_sets_modify ON public.workout_sets;
CREATE POLICY workout_sets_select ON public.workout_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_sets.workout_id
        AND (
          w.tenant_id = public.current_tenant_id()
          OR w.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );
CREATE POLICY workout_sets_modify ON public.workout_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_sets.workout_id
        AND (
          w.tenant_id = public.current_tenant_id()
          OR w.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_sets.workout_id
        AND (
          w.tenant_id = public.current_tenant_id()
          OR w.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );

-- challenge_participants (child of challenges)
DROP POLICY IF EXISTS challenge_participants_select ON public.challenge_participants;
DROP POLICY IF EXISTS challenge_participants_modify ON public.challenge_participants;
CREATE POLICY challenge_participants_select ON public.challenge_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
        AND (
          c.tenant_id = public.current_tenant_id()
          OR c.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );
CREATE POLICY challenge_participants_modify ON public.challenge_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
        AND (
          c.tenant_id = public.current_tenant_id()
          OR c.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
        AND (
          c.tenant_id = public.current_tenant_id()
          OR c.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );

-- workout_template_exercises (child of workout_templates; policy names use wte_ prefix)
DROP POLICY IF EXISTS wte_select ON public.workout_template_exercises;
DROP POLICY IF EXISTS wte_modify ON public.workout_template_exercises;
CREATE POLICY wte_select ON public.workout_template_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = workout_template_exercises.template_id
        AND (
          t.tenant_id = public.current_tenant_id()
          OR t.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );
CREATE POLICY wte_modify ON public.workout_template_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = workout_template_exercises.template_id
        AND (
          t.tenant_id = public.current_tenant_id()
          OR t.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = workout_template_exercises.template_id
        AND (
          t.tenant_id = public.current_tenant_id()
          OR t.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );

-- program_days (child of programs)
DROP POLICY IF EXISTS program_days_select ON public.program_days;
DROP POLICY IF EXISTS program_days_modify ON public.program_days;
CREATE POLICY program_days_select ON public.program_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_days.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );
CREATE POLICY program_days_modify ON public.program_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_days.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_days.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );

-- program_day_completions (child of programs)
DROP POLICY IF EXISTS program_day_completions_select ON public.program_day_completions;
DROP POLICY IF EXISTS program_day_completions_modify ON public.program_day_completions;
CREATE POLICY program_day_completions_select ON public.program_day_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_day_completions.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );
CREATE POLICY program_day_completions_modify ON public.program_day_completions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_day_completions.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_day_completions.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );

-- -----------------------------------------------------------
-- Step 3: tenants self-select policy (gym picker needs to read tenant names)
-- -----------------------------------------------------------
DROP POLICY IF EXISTS tenants_select_self ON public.tenants;
CREATE POLICY tenants_select_self ON public.tenants
  FOR SELECT USING (
    id = public.current_tenant_id()
    OR id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
