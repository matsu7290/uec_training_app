import { createBrowserClient } from "@supabase/ssr";

// .env.local に設定したURLとキーを読み込みます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 接続用のクライアントを作成してエクスポート（他のファイルで使えるように）します
// ※ ログイン画面 (utils/supabase/client.ts) や proxy.ts と同じく Cookie にセッションを保存する
//   @supabase/ssr のクライアントを使うことで、どの画面でもログイン状態が共有されます
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
