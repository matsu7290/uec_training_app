'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Profile, TrainingRecord } from '../types';

// マイページに必要なデータをまとめて取得する（state は更新しない）
async function loadMyPageData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  
  // ★ 修正ポイント：種目IDまたはカスタム種目名のどちらかが入力されている（NULLでない）ものだけを取得
  const { data: r } = await supabase
    .from('training_records')
    .select('*, exercises(name)')
    .eq('user_id', user.id)
    .or('exercise_id.not.is.null,custom_exercise_name.not.is.null')
    .order('created_at', { ascending: false });

  return {
    profile: p as Profile | null,
    records: (r ?? []) as TrainingRecord[],
  };
}

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // この値を変更するとデータを再取得する
  const [reloadKey, setReloadKey] = useState(0);

  const fetchData = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let ignore = false;
    loadMyPageData().then((result) => {
      if (ignore) return;
      if (!result) {
        router.push('/login');
        return;
      }
      setProfile(result.profile); 
      setRecords(result.records);
      setIsLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [reloadKey, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const file = e.target.files?.[0];
      if (!file || !profile) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      
      fetchData();
      alert('プロフィール写真を更新しました！');
    } catch (error) {
      alert('アップロード失敗: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    const fd = new FormData(e.currentTarget);
    await supabase.from('profiles').update({ 
      display_name: fd.get('dn'), 
      avatar_url: fd.get('av') 
    }).eq('id', profile.id);
    setIsEditing(false); 
    fetchData();
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse italic text-slate-400">Loading your stats...</div>;
  if (!profile) return <div className="p-8 text-center italic text-slate-400">プロフィールが見つかりませんでした。管理者に連絡してください。</div>;

  const studentId = profile?.email ? profile.email.split('@')[0] : 'Unknown';

  const renderAvatar = (url?: string | null) => {
    if (url?.startsWith('http')) {
      // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage の外部URLをそのまま表示するため
      return <img src={url} alt="Avatar" className="w-full h-full object-cover rounded-[2.5rem]" />;
    }
    return <span>{url || '💪'}</span>;
  };

  return (
    <div className="p-6 max-w-xl mx-auto mb-24">
      <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-xl border border-white/40 dark:border-slate-700/50 mb-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <div className="relative group w-32 h-32 mx-auto mb-6">
          <div className={`text-7xl bg-slate-100 dark:bg-slate-900 w-full h-full flex items-center justify-center rounded-[2.5rem] mx-auto shadow-inner border border-white/50 overflow-hidden transition-all ${isUploading ? 'opacity-50' : ''}`}>
            {renderAvatar(profile?.avatar_url)}
          </div>
          
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] font-black opacity-0 group-hover:opacity-100 rounded-[2.5rem] cursor-pointer transition-opacity backdrop-blur-sm">
            {isUploading ? 'UPLOADING...' : '変更'}
            <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
          </label>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">アイコン（絵文字を使う場合ここに入力）</label>
              <input name="av" defaultValue={profile.avatar_url?.startsWith('http') ? '' : (profile.avatar_url ?? '')} placeholder="💪" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-center font-bold outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ニックネーム</label>
              <input name="dn" defaultValue={profile.display_name ?? ''} placeholder="Name" required className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-center font-bold outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-blue-500/30 active:scale-95 transition-transform uppercase tracking-widest">保存</button>
            <button type="button" onClick={() => setIsEditing(false)} className="text-xs font-bold text-slate-400 underline">Cancel</button>
          </form>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">
              {profile?.display_name || studentId}
            </h1>
            <p className="text-[10px] font-mono text-slate-400 mt-1">{studentId}</p>
            
            <div className="flex justify-center gap-2 mt-4 mb-6">
              <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-white/50 shadow-sm">
                {profile.grade || 'NO GRADE'}
              </span>
              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-white/50 shadow-sm ${profile.role === '部長' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                {profile.role}
              </span>
            </div>
            <button onClick={() => setIsEditing(true)} className="text-xs font-black text-slate-400 hover:text-blue-500 transition-colors underline tracking-widest uppercase">
              EDIT PROFILE
            </button>
          </div>
        )}
      </div>

      {profile?.is_admin && (
        <Link href="/admin" className="group relative block w-full mb-10 overflow-hidden rounded-2xl p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400">
          <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#334155_0%,#94a3b8_50%,#334155_100%)]" />
          <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-950 px-3 py-4 text-[10px] font-black text-white backdrop-blur-3xl group-hover:bg-slate-900 transition tracking-[0.3em] uppercase">
            ⚙️ 管理者専用画面
          </div>
        </Link>
      )}

      <div className="flex items-center justify-between mb-6 ml-2">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">個人の記録</h2>
        <span className="text-[10px] font-bold text-slate-300 uppercase">{records.length} Records</span>
      </div>

      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="text-center py-12 bg-white/30 dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-400 text-sm italic font-medium">まだありません</p>
          </div>
        ) : (
          records.map((r, index) => (
            <div 
              key={r.id} 
              style={{ animationDelay: `${index * 50}ms` }}
              className="bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm p-5 rounded-[2rem] border border-white/20 flex justify-between items-center hover:bg-white/80 dark:hover:bg-slate-800/60 transition-all animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-1">
                  {r.exercises?.name || r.custom_exercise_name}
                </p>
                <p className="font-black italic text-xl tracking-tight text-slate-900 dark:text-white">
                  {r.weight}<span className="text-xs font-normal ml-0.5">kg</span> 
                  <span className="text-slate-300 font-light mx-2">×</span> 
                  {r.reps}<span className="text-xs font-normal ml-0.5">reps</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
                {r.sets && <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 uppercase">{r.sets} SETS</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}