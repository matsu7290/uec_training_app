import { createClient } from '@supabase/supabase-js'

// .env.local に設定したURLとキーを読み込みます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 接続用のクライアントを作成してエクスポート（他のファイルで使えるように）します
export const supabase = createClient(supabaseUrl, supabaseKey)