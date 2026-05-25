// apps/mobile/src/db/api/challenges.ts
import { getSupabase } from '../../lib/supabase';
import type { LeaderboardRow } from '@fitness/api';

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? '';

export type ChallengeRow = {
  id: string;
  name: string;
  description: string | null;
  metricType: 'volume' | 'workout_count' | 'max_weight' | 'streak_weeks';
  exerciseId: string | null;
  startsAt: string;
  endsAt: string;
  status: 'draft' | 'active' | 'ended' | 'cancelled';
};

type Raw = {
  id: string;
  name: string;
  description: string | null;
  metric_type: ChallengeRow['metricType'];
  exercise_id: string | null;
  starts_at: string;
  ends_at: string;
  status: ChallengeRow['status'];
};

function shape(r: Raw): ChallengeRow {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    metricType: r.metric_type,
    exerciseId: r.exercise_id,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    status: r.status,
  };
}

export async function fetchChallenges(): Promise<ChallengeRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('challenges')
    .select(
      'id,name,description,metric_type,exercise_id,starts_at,ends_at,status',
    )
    .eq('tenant_id', TENANT_ID)
    .neq('status', 'draft')
    .is('deleted_at', null)
    .order('starts_at', { ascending: false });
  if (error || !data) return [];
  return (data as Raw[]).map(shape);
}

export async function fetchMyChallengeIds(
  memberId: string,
): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('challenge_id')
    .eq('member_id', memberId);
  if (error || !data) return [];
  return (data as { challenge_id: string }[]).map((r) => r.challenge_id);
}

export async function joinChallenge(
  challengeId: string,
  memberId: string,
): Promise<{ ok: boolean }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false };
  const { error } = await supabase
    .from('challenge_participants')
    .insert({ challenge_id: challengeId, member_id: memberId });
  return { ok: !error };
}

export async function fetchLeaderboard(
  challengeId: string,
): Promise<LeaderboardRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('challenge_leaderboard', {
    p_challenge_id: challengeId,
  });
  if (error || !data) return [];
  return (data as Array<{
    member_id: string;
    member_name: string;
    score: string | number;
    rank: number;
  }>).map((r) => ({
    memberId: r.member_id,
    memberName: r.member_name,
    score: Number(r.score),
    rank: Number(r.rank),
  }));
}
