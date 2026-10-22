import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, verifyStaff } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
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

    // 管理者権限チェック
    const permission = await verifyStaff(supabaseAdmin, access_token);
    if (!permission.ok) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status },
      );
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
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
