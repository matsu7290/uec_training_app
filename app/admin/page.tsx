'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import UserAvatar from '../components/UserAvatar';

type TabType = 'events' | 'members' | 'whitelist';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- データステート ---
  const [events, setEvents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allowedMembers, setAllowedMembers] = useState<any[]>([]);

  // --- 編集用ステート ---
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  const [newStudentId, setNewStudentId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('is_admin, role').eq('id', user.id).single();
      const hasPermission = profile?.is_admin || ['運営', '副部長', '部長'].includes(profile?.role);
      if (!hasPermission) { alert('権限がありません'); router.push('/'); return; }
      fetchData();
    };
    checkAdmin();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    const [e, p, a] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }),
      supabase.from('profiles').select('*').order('grade').order('email'),
      supabase.from('allowed_members').select('*').order('created_at', { ascending: false })
    ]);
    if (e.data) setEvents(e.data);
    if (p.data) setProfiles(p.data);
    if (a.data) setAllowedMembers(a.data);
    setIsLoading(false);
  };

  // --- ハンドラー ---
  const handleUpdateProfile = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ role: editRole, grade: editGrade, is_admin: editIsAdmin }).eq('id', id);
    if (error) return alert('更新失敗');
    setEditingProfileId(null);
    fetchData();
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title: eventTitle, event_date: eventDate, description: eventDesc };
    if (editingEventId) await supabase.from('events').update(data).eq('id', editingEventId);
    else await supabase.from('events').insert([data]);
    setEventTitle(''); setEventDate(''); setEventDesc(''); setEditingEventId(null);
    fetchData();
  };

  const handleAddAllowedMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('allowed_members').insert([{ student_id: newStudentId, name: newMemberName }]);
    if (error) return alert('追加失敗');
    setNewStudentId(''); setNewMemberName('');
    fetchData();
  };

  // 検索フィルタリング
  const filteredProfiles = profiles.filter(p => 
    (p.display_name || '').includes(searchTerm) || 
    (p.email || '').includes(searchTerm)
  );

  if (isLoading) return <div className="p-20 text-center font-black animate-pulse text-slate-400">LOADING ADMIN...</div>;

  const inputClass = "w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="max-w-2xl mx-auto p-4 mb-24">
      <h1 className="text-2xl font-black italic mb-6 tracking-tighter bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent uppercase">Admin Control</h1>

      {/* タブナビゲーション */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-8">
        {(['members', 'events', 'whitelist'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
          >
            {tab === 'members' ? '部員管理' : tab === 'events' ? 'イベント' : '名簿登録'}
          </button>
        ))}
      </div>

      {/* --- 部員管理タブ --- */}
      {activeTab === 'members' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <input 
            type="text" 
            placeholder="名前や学籍番号で検索..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={inputClass}
          />
          <div className="grid gap-3">
            {filteredProfiles.map(p => (
              <div key={p.id} className={`p-4 rounded-[2rem] border transition-all ${editingProfileId === p.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <UserAvatar url={p.avatar_url} size="w-12 h-12" />
                    <div>
                      <p className="font-black text-sm">{p.display_name || p.email.split('@')[0]}</p>
                      <p className="text-[10px] font-mono text-slate-400">{p.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingProfileId(p.id);
                      setEditRole(p.role);
                      setEditGrade(p.grade || '');
                      setEditIsAdmin(p.is_admin || false);
                    }}
                    className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    編集
                  </button>
                </div>

                {editingProfileId === p.id ? (
                  <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-inner">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 ml-1">役職</label>
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={inputClass}>
                          {['部員', '運営', '副部長', '部長'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 ml-1">学年</label>
                        <input value={editGrade} onChange={(e) => setEditGrade(e.target.value)} placeholder="B4" className={inputClass} />
                      </div>
                    </div>
                    <label className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl cursor-pointer">
                      <span className="text-xs font-bold">管理者権限 (Admin Panel)</span>
                      <input type="checkbox" checked={editIsAdmin} onChange={(e) => setEditIsAdmin(e.target.checked)} className="w-5 h-5 rounded-lg" />
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateProfile(p.id)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-xs">保存する</button>
                      <button onClick={() => setEditingProfileId(null)} className="px-4 bg-slate-200 dark:bg-slate-700 rounded-xl font-black text-xs">戻る</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <span className="text-[9px] font-black px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-500">{p.grade || '学年未設定'}</span>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md ${p.role === '部長' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-500'}`}>{p.role}</span>
                    {p.is_admin && <span className="text-[9px] font-black px-2 py-1 bg-red-50 text-red-500 rounded-md">ADMIN</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- イベント管理タブ --- */}
      {activeTab === 'events' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <form onSubmit={handleSaveEvent} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
            <h2 className="font-black text-sm uppercase tracking-widest text-blue-500">{editingEventId ? 'イベント編集' : '新規イベント作成'}</h2>
            <input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="イベント名" required className={inputClass} />
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className={inputClass} />
            <textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="詳細・場所" className={inputClass} rows={2} />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase">{editingEventId ? 'Update' : '公開する'}</button>
              {editingEventId && <button type="button" onClick={() => setEditingEventId(null)} className="px-6 bg-slate-100 dark:bg-slate-700 rounded-xl font-black text-xs">CANCEL</button>}
            </div>
          </form>
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-xs font-black">{e.title}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{e.event_date}</p>
                </div>
                <button onClick={() => { setEditingEventId(e.id); setEventTitle(e.title); setEventDate(e.event_date); setEventDesc(e.description); }} className="text-[10px] font-black text-blue-500 underline">編集</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- 名簿登録タブ --- */}
      {activeTab === 'whitelist' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <form onSubmit={handleAddAllowedMember} className="bg-slate-900 text-white p-6 rounded-[2rem] space-y-4">
            <h2 className="font-black text-sm uppercase tracking-widest text-slate-400">新規名簿登録</h2>
            <input value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)} placeholder="学籍番号 (m2411728)" required className="w-full bg-slate-800 border-none rounded-xl p-3 text-xs font-bold text-white" />
            <input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="氏名" required className="w-full bg-slate-800 border-none rounded-xl p-3 text-xs font-bold text-white" />
            <button type="submit" className="w-full bg-white text-slate-900 py-3 rounded-xl font-black text-xs uppercase">名簿に追加</button>
          </form>
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700">
            <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">登録済み名簿</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {allowedMembers.map(am => (
                <div key={am.student_id} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700 text-[11px]">
                  <span className="font-bold">{am.name}</span>
                  <span className="font-mono text-slate-400">{am.student_id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}