'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import UserAvatar from '../components/UserAvatar';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [events, setEvents] = useState<any[]>([]);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  const [profiles, setProfiles] = useState<any[]>([]);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false); // ★追加：is_admin編集用

  const [allowedMembers, setAllowedMembers] = useState<any[]>([]);
  const [newStudentId, setNewStudentId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('is_admin, role').eq('id', user.id).single();

      const hasPermission = profile?.is_admin || ['運営', '副部長', '部長'].includes(profile?.role);

      if (!hasPermission) {
        alert('運営以上の権限が必要です。');
        router.push('/');
        return;
      }
      
      setIsAdmin(true);
      fetchData();
    };
    checkAdmin();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: eData } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    const { data: pData } = await supabase.from('profiles').select('*').order('grade').order('email');
    const { data: aData } = await supabase.from('allowed_members').select('*').order('created_at', { ascending: false });
    
    if (eData) setEvents(eData);
    if (pData) setProfiles(pData);
    if (aData) setAllowedMembers(aData);
    setIsLoading(false);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = { title: eventTitle, event_date: eventDate, description: eventDesc };
    if (editingEventId) {
      await supabase.from('events').update(eventData).eq('id', editingEventId);
    } else {
      await supabase.from('events').insert([eventData]);
    }
    setEventTitle(''); setEventDate(''); setEventDesc(''); setEditingEventId(null);
    fetchData();
  };

  // ★修正：is_admin も更新対象に含める
  const handleUpdateProfile = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: editRole, 
        grade: editGrade, 
        is_admin: editIsAdmin 
      })
      .eq('id', id);
    
    if (error) return alert('更新失敗: ' + error.message);
    setEditingProfileId(null);
    fetchData();
  };

  const handleAddAllowedMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('allowed_members').insert([{ student_id: newStudentId, name: newMemberName }]);
    if (error) return alert('追加失敗');
    setNewStudentId(''); setNewMemberName('');
    fetchData();
  };

  if (isLoading) return <div className="p-8 text-center italic text-slate-400">Loading Admin Panel...</div>;

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <div className="p-6 max-w-xl mx-auto mb-24 space-y-12">
      <h1 className="text-3xl font-black italic bg-gradient-to-r from-red-600 to-pink-500 bg-clip-text text-transparent uppercase tracking-tighter">管理者専用画面</h1>

      {/* イベント管理セクション（変更なし） */}
      <section className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 dark:border-slate-700/50 shadow-xl">
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">📅 {editingEventId ? 'Edit Event' : 'New Event'}</h2>
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="イベント名" required className={inputClass} />
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className={inputClass} />
          <textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="詳細・場所" className={inputClass} rows={2} />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-transform">{editingEventId ? 'UPDATE' : '公開'}</button>
            {editingEventId && <button type="button" onClick={() => setEditingEventId(null)} className="px-6 bg-slate-200 dark:bg-slate-700 rounded-2xl font-bold text-xs">CANCEL</button>}
          </div>
        </form>
        <div className="mt-6 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {events.map(e => (
            <div key={e.id} className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-white/20 text-xs">
              <span className="font-bold">{e.event_date} : {e.title}</span>
              <div className="flex gap-2">
                <button onClick={() => { setEditingEventId(e.id); setEventTitle(e.title); setEventDate(e.event_date); setEventDesc(e.description); }} className="text-blue-500 underline font-black">EDIT</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ロール＆学年管理セクション（★修正あり） */}
      <section className="space-y-4">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">ロール＆学年管理</h2>
        <div className="grid gap-3">
          {profiles.map(p => (
            <div key={p.id} className="bg-white/50 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-3xl border border-white/20">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserAvatar url={p.avatar_url} size="w-10 h-10" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black">{p.display_name || p.email.split('@')[0]}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{p.email}</span>
                  </div>
                </div>
                {/* ★修正：編集開始時に is_admin の状態もセットする */}
                <button onClick={() => { 
                  setEditingProfileId(p.id); 
                  setEditRole(p.role); 
                  setEditGrade(p.grade || ''); 
                  setEditIsAdmin(p.is_admin || false);
                }} className="text-[10px] font-black text-blue-500 underline">編集</button>
              </div>
              
              {editingProfileId === p.id ? (
                <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex gap-2">
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 rounded-xl p-2 text-xs font-bold border-none">
                      <option value="部員">部員</option>
                      <option value="運営">運営</option>
                      <option value="副部長">副部長</option>
                      <option value="部長">部長</option>
                    </select>
                    <input type="text" value={editGrade} onChange={(e) => setEditGrade(e.target.value)} placeholder="B4" className="w-16 bg-white dark:bg-slate-900 rounded-xl p-2 text-xs font-bold border-none text-center" />
                  </div>
                  
                  {/* ★追加：is_admin の切り替えスイッチ */}
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">管理者権限</label>
                    <input 
                      type="checkbox" 
                      checked={editIsAdmin} 
                      onChange={(e) => setEditIsAdmin(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <button onClick={() => handleUpdateProfile(p.id)} className="w-full bg-green-600 text-white py-2 rounded-xl text-[10px] font-black">SAVE CHANGES</button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full font-bold text-slate-500">{p.grade || '??'}</span>
                  <span className="text-[9px] bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full font-bold text-blue-500">{p.role}</span>
                  {p.is_admin && <span className="text-[9px] bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full font-bold text-red-500">ADMIN</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 部員追加セクション（変更なし） */}
      <section className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl">
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">📝 部員追加</h2>
        <form onSubmit={handleAddAllowedMember} className="space-y-3 mb-6">
          <input type="text" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)} placeholder="学籍番号 (m2411728)" required className="w-full bg-slate-800 border-none rounded-xl p-3 text-xs font-bold placeholder:text-slate-500" />
          <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="氏名" required className="w-full bg-slate-800 border-none rounded-xl p-3 text-xs font-bold placeholder:text-slate-500" />
          <button type="submit" className="w-full bg-white text-slate-900 font-black py-3 rounded-xl text-xs active:scale-95 transition-transform">追加</button>
        </form>
        <div className="space-y-2 max-h-32 overflow-y-auto text-[10px] font-mono custom-scrollbar">
          {allowedMembers.map(am => (
            <div key={am.student_id} className="flex justify-between border-b border-slate-800 pb-1 text-slate-400">
              <span>{am.name}</span>
              <span>{am.student_id}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}