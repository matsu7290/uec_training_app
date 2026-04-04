import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const student_id =
    typeof body.student_id === "string"
      ? body.student_id.trim().toLowerCase()
      : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const access_token =
    typeof body.access_token === "string" ? body.access_token : "";

  if (!student_id || !name || !access_token) {
    return NextResponse.json(
      { error: "学籍番号、氏名、ログイントークンが必要です。" },
      { status: 400 },
    );
  }

  const { data: userResult, error: userError } =
    await supabaseAdmin.auth.getUser(access_token);
  if (userError || !userResult?.user) {
    return NextResponse.json(
      { error: "認証に失敗しました。再ログインしてください。" },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_admin, role")
    .eq("id", userResult.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "ユーザー情報を取得できませんでした。" },
      { status: 403 },
    );
  }

  const hasPermission =
    profile.is_admin || ["運営", "副部長", "部長"].includes(profile.role);
  if (!hasPermission) {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("allowed_members")
    .select("student_id")
    .eq("student_id", student_id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      {
        error: `登録済みチェック中にエラーが発生しました: ${existingError.message}`,
      },
      { status: 500 },
    );
  }
  if (existing) {
    return NextResponse.json(
      { error: "この学籍番号はすでに名簿に登録されています。" },
      { status: 409 },
    );
  }

  const { error: insertError } = await supabaseAdmin
    .from("allowed_members")
    .insert([{ student_id, name }]);

  if (insertError) {
    return NextResponse.json(
      { error: `追加失敗: ${insertError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
