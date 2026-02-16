'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import UserAvatar from '../components/UserAvatar'; // 追加

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedParticipants, setSelectedParticipants] = useState<any[] | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [top3Ids, setTop3Ids] = useState<Record<string, number>>({}); // 追加

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentProfile(prof);
    }

    const { data: top3 } = await supabase.from('last_month_top_3').select('*');
    if (top3) {
      const mapping = top3.reduce((acc: any, curr: any) => ({ ...acc, [curr.user_id]: curr.rank }), {});
      setTop3Ids(mapping);
    }

    const { data } = await supabase
      .from('events')
      .select(`
        *,
        event_participants (
          user_id,
          profiles ( email, display_name, avatar_url, grade, role )
        )
      `)
      .order('event_date', { ascending: true });

    if (data) setEvents(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const prevMonthDays = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth() - 1);

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));

  const handleRSVP = async (eventId: string, participants: any[]) => {
    if (!currentUser) return alert('ログインが必要です！');
    const myP = participants.find(p => p.user_id === currentUser.id);

    if (myP) {
      await supabase.from('event_participants').delete().match({ event_id: eventId, user_id: currentUser.id });
    } else {
      await supabase.from('event_participants').insert([{ event_id: eventId, user_id: currentUser.id }]);
    }
    fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('このイベントを削除しますか？')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) alert('削除に失敗しました: ' + error.message);
    else fetchEvents();
  };

  return (
    <div className="p-6 max-w-xl mx-auto mb-24 min-h-screen">
      <h1 className="text-3xl font-black italic tracking-tighter mb-8 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent uppercase animate-in fade-in slide-in-from-left-4 duration-700">
        スケジュール
      </h1>

      <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/40 dark:border-slate-700/50 shadow-sm mb-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black italic tracking-tight">
            {viewDate.getFullYear()}.{viewDate.getMonth() + 1}
          </h2>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">◀</button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">▶</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <span key={d} className="text-[10px] font-black text-slate-400">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {[...Array(firstDay)].map((_, i) => (
            <div key={`prev-${i}`} className="h-10 flex items-center justify-center text-slate-200 dark:text-slate-700 text-xs font-bold">
              {prevMonthDays - firstDay + i + 1}
            </div>
          ))}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();
            const hasEvent = events.some(e => {
              const d = new Date(e.event_date);
              return d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth() && d.getDate() === day;
            });
            return (
              <div key={day} className="relative h-10 flex flex-col items-center justify-center">
                <span className={`text-xs font-black ${isToday ? 'text-blue-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {day}
                </span>
                {hasEvent && (
                  <div className="absolute bottom-1 w-1 h-1 bg-pink-500 rounded-full animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1 mb-6">今後の予定</h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-slate-200/50 dark:bg-slate-800/50 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event, index) => {
            const date = new Date(event.event_date);
            const participants = event.event_participants || [];
            const isJoining = currentUser && participants.some((p: any) => p.user_id === currentUser.id);

            return (
              <div 
                key={event.id} 
                style={{ animationDelay: `${index * 100}ms` }}
                className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 dark:border-slate-700/50 shadow-sm relative group overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="absolute -top-4 -right-4 p-8 opacity-5 text-9xl grayscale group-hover:rotate-12 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500 pointer-events-none select-none font-black text-slate-100">
                  📅
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black bg-blue-500 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                      {date.toLocaleDateString()}
                    </span>
                    {currentProfile?.is_admin && (
                      <button onClick={() => deleteEvent(event.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">🗑️</button>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-black mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {event.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed italic">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <button 
                      onClick={() => {
                        setSelectedParticipants(participants);
                        setSelectedEventTitle(event.title);
                      }}
                      className="flex -space-x-2 active:scale-90 transition-transform"
                    >
                      {participants.slice(0, 5).map((p: any, i: number) => (
                        <div key={i} className="transform hover:-translate-y-1 transition-transform">
                          <UserAvatar 
                            url={p.profiles?.avatar_url} 
                            rank={top3Ids[p.user_id]} 
                            size="w-9 h-9"
                          />
                        </div>
                      ))}
                      {participants.length > 5 && (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center font-black border-2 border-white">
                          +{participants.length - 5}
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => handleRSVP(event.id, participants)}
                      className={`px-6 py-2.5 rounded-2xl font-black text-xs transition-all active:scale-95 shadow-lg ${
                        isJoining 
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 shadow-none' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30'
                      }`}
                    >
                      {isJoining ? 'CANCEL' : 'JOIN'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedParticipants && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/50 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black italic text-lg tracking-tight uppercase">Attendees</h3>
              <button onClick={() => setSelectedParticipants(null)} className="text-slate-400 p-2">✕</button>
            </div>
            
            <div className="p-4 max-h-[50vh] overflow-y-auto space-y-3 custom-scrollbar">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 px-2 italic">{selectedEventTitle}</p>
              {selectedParticipants.map((p: any, i: number) => {
                const profile = p.profiles;
                const studentId = profile?.email ? profile.email.split('@')[0] : '匿名';
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/30">
                    <UserAvatar 
                      url={profile?.avatar_url} 
                      rank={top3Ids[p.user_id]} 
                      size="w-11 h-11"
                    />
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-slate-900 dark:text-white leading-none mb-1">
                        {profile?.display_name || studentId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {profile?.grade || 'N/A'} · {studentId}
                      </span>
                    </div>
                    {profile?.role && profile.role !== '部員' && (
                      <span className="ml-auto text-[8px] font-black bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full uppercase border border-orange-200">
                        {profile.role}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-6">
              <button onClick={() => setSelectedParticipants(null)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl text-xs active:scale-95 shadow-lg uppercase tracking-widest">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}