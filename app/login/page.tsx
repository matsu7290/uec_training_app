'use client'; 

import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.endsWith('@gl.cc.uec.ac.jp')) {
      setErrorMsg('大学のメールアドレス（@gl.cc.uec.ac.jp）のみ登録可能です。');
      return;
    }

    // ★ 修正箇所：学籍番号（a2411728等）を抽出して名簿と比較
    const studentId = email.split('@')[0];
    const { data: member, error: memberError } = await supabase
      .from('allowed_members')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (!member || memberError) {
      setErrorMsg(`ID「${studentId}」は名簿に未登録です。管理者に連絡してください。`);
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setErrorMsg('登録エラー: ' + error.message); return; }
    router.push('/');
    router.refresh();
  };

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErrorMsg('ログイン失敗。アドレスかパスワードが違います。'); return; }
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">🔐 部員ログイン</h1>
        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm font-bold">{errorMsg}</div>}
        <form className="flex flex-col gap-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="a0000000@gl.cc.uec.ac.jp" className="w-full border p-2 rounded-md dark:bg-gray-700" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="パスワード" className="w-full border p-2 rounded-md dark:bg-gray-700" />
          <button onClick={handleSignIn} className="bg-blue-600 text-white font-bold py-2 rounded-md">ログイン</button>
          <button onClick={handleSignUp} className="bg-gray-200 dark:bg-gray-700 py-2 rounded-md">新規登録</button>
        </form>
      </div>
    </div>
  );
}