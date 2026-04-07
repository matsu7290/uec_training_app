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
  try {
    const { title, event_date, description } = await request.json();

    if (!title || !event_date) {
      return NextResponse.json(
        { error: "タイトルと日付は必須です" },
        { status: 400 },
      );
    }

    // 管理者権限チェック
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "プロフィール取得エラー" },
        { status: 500 },
      );
    }

    const hasPermission =
      profile?.is_admin || ["運営", "副部長", "部長"].includes(profile?.role);

    if (!hasPermission) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // イベント作成
    const { data, error } = await supabaseAdmin
      .from("events")
      .insert([{ title, event_date, description }])
      .select();

    if (error) {
      return NextResponse.json(
        { error: "イベント作成失敗: " + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, title, event_date, description } = await request.json();

    if (!id || !title || !event_date) {
      return NextResponse.json(
        { error: "ID、タイトル、日付は必須です" },
        { status: 400 },
      );
    }

    // 管理者権限チェック
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "プロフィール取得エラー" },
        { status: 500 },
      );
    }

    const hasPermission =
      profile?.is_admin || ["運営", "副部長", "部長"].includes(profile?.role);

    if (!hasPermission) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // イベント更新
    const { data, error } = await supabaseAdmin
      .from("events")
      .update({ title, event_date, description })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "イベント更新失敗: " + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
