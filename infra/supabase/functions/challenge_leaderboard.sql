-- infra/supabase/functions/challenge_leaderboard.sql
create or replace function public.challenge_leaderboard(p_challenge_id uuid)
returns table (
  member_id   uuid,
  member_name text,
  score       numeric,
  rank        integer
)
language plpgsql
stable
as $$
declare
  c public.challenges%rowtype;
begin
  select * into c from public.challenges where id = p_challenge_id;
  if not found then
    return;
  end if;

  if c.metric_type = 'volume' then
    return query
      select
        m.id,
        m.full_name,
        coalesce(sum(w.total_volume), 0)::numeric as score,
        rank() over (order by coalesce(sum(w.total_volume), 0) desc)::int
      from public.challenge_participants p
      join public.members m on m.id = p.member_id
      left join public.workouts w
        on w.member_id = p.member_id
       and w.tenant_id = c.tenant_id
       and w.started_at >= c.starts_at
       and w.started_at <  c.ends_at
       and w.finished_at is not null
       and w.deleted_at is null
      where p.challenge_id = p_challenge_id
      group by m.id, m.full_name;

  elsif c.metric_type = 'workout_count' then
    return query
      select
        m.id,
        m.full_name,
        count(w.id)::numeric,
        rank() over (order by count(w.id) desc)::int
      from public.challenge_participants p
      join public.members m on m.id = p.member_id
      left join public.workouts w
        on w.member_id = p.member_id
       and w.tenant_id = c.tenant_id
       and w.started_at >= c.starts_at
       and w.started_at <  c.ends_at
       and w.finished_at is not null
       and w.deleted_at is null
      where p.challenge_id = p_challenge_id
      group by m.id, m.full_name;

  elsif c.metric_type = 'max_weight' then
    return query
      select
        m.id,
        m.full_name,
        coalesce(max(s.weight), 0)::numeric,
        rank() over (order by coalesce(max(s.weight), 0) desc)::int
      from public.challenge_participants p
      join public.members m on m.id = p.member_id
      left join public.workouts w
        on w.member_id = p.member_id
       and w.tenant_id = c.tenant_id
       and w.started_at >= c.starts_at
       and w.started_at <  c.ends_at
       and w.finished_at is not null
       and w.deleted_at is null
      left join public.workout_sets s
        on s.workout_id = w.id
       and s.exercise_id = c.exercise_id
       and s.is_warmup = false
      where p.challenge_id = p_challenge_id
      group by m.id, m.full_name;

  elsif c.metric_type = 'streak_weeks' then
    return query
      with weeks as (
        select
          p.member_id,
          date_trunc('week', w.started_at) as wk
        from public.challenge_participants p
        left join public.workouts w
          on w.member_id = p.member_id
         and w.tenant_id = c.tenant_id
         and w.started_at >= c.starts_at
         and w.started_at <  c.ends_at
         and w.finished_at is not null
         and w.deleted_at is null
        where p.challenge_id = p_challenge_id
        group by p.member_id, date_trunc('week', w.started_at)
      ),
      runs as (
        select
          member_id,
          wk,
          wk - (row_number() over (
            partition by member_id order by wk
          )) * interval '1 week' as grp
        from weeks
        where wk is not null
      ),
      run_lengths as (
        select member_id, count(*)::numeric as len
        from runs
        group by member_id, grp
      ),
      best as (
        select member_id, coalesce(max(len), 0) as score
        from run_lengths
        group by member_id
      )
      select
        m.id,
        m.full_name,
        coalesce(b.score, 0),
        rank() over (order by coalesce(b.score, 0) desc)::int
      from public.challenge_participants p
      join public.members m on m.id = p.member_id
      left join best b on b.member_id = p.member_id
      where p.challenge_id = p_challenge_id;
  end if;
end
$$;
