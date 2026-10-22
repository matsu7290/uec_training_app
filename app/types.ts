// アプリ全体で使う Supabase テーブル/ビューの型定義

export type ProfileSummary = {
  email?: string | null;
  role?: string | null;
  grade?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean | null;
};

export type Profile = ProfileSummary & {
  id: string;
};

export type Like = {
  user_id: string;
};

export type Exercise = {
  id: number;
  name: string;
};

export type TrainingRecord = {
  id: string;
  weight: number | null;
  reps: number | null;
  sets: number | null;
  memo: string | null;
  created_at: string;
  custom_exercise_name: string | null;
  user_id: string;
  exercise_id?: number | null;
  exercises: { name: string } | null;
  profiles?: ProfileSummary | null;
  likes?: Like[] | null;
};

export type Top3Row = {
  user_id: string;
  rank: number;
};

export type Participant = {
  user_id: string;
  profiles: ProfileSummary | null;
};

export type CalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  description: string | null;
  event_participants: Participant[] | null;
};

export type RankingRow = {
  id?: string;
  user_id?: string;
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  grade?: string | null;
  max_weight?: number | null;
  total_volume?: number | null;
};

// 前月トップ3の配列を { user_id: rank } のマップに変換する
export function toTop3Map(rows: Top3Row[] | null): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows ?? []) map[row.user_id] = row.rank;
  return map;
}
