import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

// サービスロールキーを使う管理者用クライアント（サーバー側専用）
// モジュール読み込み時ではなく、呼び出し時に環境変数をチェックすることで
// 環境変数が未設定でもビルド自体は失敗しないようにしています
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return adminClient;
}

export const STAFF_ROLES = ["運営", "副部長", "部長"];

type PermissionResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

// アクセストークンからユーザーを特定し、管理者/運営権限を持つか確認する
export async function verifyStaff(
  supabaseAdmin: SupabaseClient,
  accessToken: string,
): Promise<PermissionResult> {
  if (!accessToken) {
    return { ok: false, status: 401, error: "認証が必要です" };
  }

  const { data: userResult, error: userError } =
    await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userResult?.user) {
    return {
      ok: false,
      status: 401,
      error: "認証に失敗しました。再ログインしてください。",
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_admin, role")
    .eq("id", userResult.user.id)
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      status: 403,
      error: "ユーザー情報を取得できませんでした。",
    };
  }

  const hasPermission =
    profile.is_admin || STAFF_ROLES.includes(profile.role ?? "");
  if (!hasPermission) {
    return { ok: false, status: 403, error: "権限がありません。" };
  }

  return { ok: true, userId: userResult.user.id };
}
