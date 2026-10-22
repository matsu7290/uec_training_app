import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, verifyStaff } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { title, event_date, description, access_token } =
      await request.json();

    if (!title || !event_date) {
      return NextResponse.json(
        { error: "タイトルと日付は必須です" },
        { status: 400 },
      );
    }

    // 管理者権限チェック（クライアントから送られたアクセストークンでユーザーを特定）
    const permission = await verifyStaff(
      supabaseAdmin,
      typeof access_token === "string" ? access_token : "",
    );
    if (!permission.ok) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status },
      );
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
    const supabaseAdmin = getSupabaseAdmin();
    const { id, title, event_date, description, access_token } =
      await request.json();

    if (!id || !title || !event_date) {
      return NextResponse.json(
        { error: "ID、タイトル、日付は必須です" },
        { status: 400 },
      );
    }

    // 管理者権限チェック（クライアントから送られたアクセストークンでユーザーを特定）
    const permission = await verifyStaff(
      supabaseAdmin,
      typeof access_token === "string" ? access_token : "",
    );
    if (!permission.ok) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status },
      );
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
