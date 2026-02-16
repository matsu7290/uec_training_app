'use client'; // ★ブラウザ側でログイン状態を監視するための宣言

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import Link from 'next/link';

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 画面が開かれたときに、現在のログインユーザーを取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // ログイン・ログアウトの切り替えを常に監視する
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ログアウト処理
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // 画面を更新して状態をリセット
  };

  // 🟢 ログインしている場合の表示
  if (user) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {user.email}
        </span>
        <button 
          onClick={handleSignOut} 
          className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          ログアウト
        </button>
      </div>
    );
  }

  // 🔴 ログインしていない場合の表示
  return (
    <Link 
      href="/login" 
      className="bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition shadow-sm"
    >
      ログイン / 新規登録
    </Link>
  );
}