'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import UserAvatar from '../components/UserAvatar';

export default function RankingPage() {
  const [big3, setBig3] = useState<any[]>([]);
  const [volume, setVolume] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [volumeTimeframe, setVolumeTimeframe] = useState<'week' | 'month'>('week');
  const [top3Ids, setTop3Ids] = useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = useState<any>(null); // ★追加：ログインユーザー管理

  const fetchBig3 = async () => {
    const { data } = await supabase.from('big3_rankings').select('*').order('max_weight', { ascending: false }).limit(10);
    if (data) setBig3(data);
  };

  const fetchVolume = async (frame: 'week' | 'month') => {
    const viewName = frame === 'week' ? 'volume_rankings_weekly' : 'volume_rankings_monthly';
    const { data } = await supabase.from(viewName).select('*').order('total_volume', { ascending: false }).limit(10);
    if (data) setVolume(data || []);
  };

  const fetchTop3 = async () => {
    const { data: top3 } = await supabase.from('last_month_top_3').select('*');
    if (top3) {
      const mapping = top3.reduce((acc: any, curr: any) => ({ ...acc, [curr.user_id]: curr.rank }), {});
      setTop3Ids(mapping);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      // ★追加：ログイン状態の確認
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      await Promise.all([fetchBig3(), fetchVolume(volumeTimeframe), fetchTop3()]);
      setIsLoading(false);
    };
    initFetch();
  }, [volumeTimeframe]);

  const Card = ({ title, data, unit, color, icon, children }: any) => (
    <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-sm border border-white/40 dark:border-slate-700/50 mb-10 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className={`text-2xl p-2 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>{icon}</span>
          <h2 className="text-xl font-black italic tracking-tighter">{title}</h2>
        </div>
        {children}
      </div>
      <div className="space-y-3 pt-2">
        {data.map((item: any, index: number) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
          const val = item.max_weight || item.total_volume;
          
          // ★修正：ログインしていない場合は情報を隠す
          const isGuest = !currentUser;
          const studentId = item.email?.split('@')[0] || '匿名';
          const name = isGuest ? '匿名部員' : (item.display_name || studentId);
          const userId = item.user_id || item.id;
          const avatarUrl = isGuest ? null : item.avatar_url;
          const grade = isGuest ? null : item.grade;

          return (
            <div 
              key={index} 
              style={{ animationDelay: `${index * 50}ms` }}
              className={`flex items-center justify-between p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2 fill-mode-both ${index < 3 ? 'bg-white/50 dark:bg-slate-700/50 shadow-sm' : ''}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 text-center font-black ${index === 0 ? 'text-2xl' : 'text-lg text-slate-400'}`}>{medal}</span>
                <UserAvatar 
                  url={avatarUrl} 
                  rank={isGuest ? undefined : top3Ids[userId]} 
                  size="w-10 h-10"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none">{name}</span>
                  {grade && <span className="text-[8px] text-slate-400 font-bold mt-1 uppercase">{grade}</span>}
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black italic">{val.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{unit}</span>
              </div>
            </div>
          );
        })}
        {!isLoading && data.length === 0 && (
          <p className="text-center py-10 text-slate-400 text-xs italic font-medium">No records found for this period.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-xl mx-auto mb-24">
      <h1 className="text-3xl font-black italic tracking-tighter mb-8 bg-gradient-to-r from-amber-500 to-yellow-300 bg-clip-text text-transparent uppercase animate-in fade-in slide-in-from-left-4 duration-700">
        ランキング
      </h1>

      {/* ★追加：未ログイン時の警告メッセージ */}
      {!currentUser && !isLoading && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
          <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            ログインすると部員名が表示されます 💪
          </p>
        </div>
      )}
      
      {isLoading ? (
        <div className="animate-pulse space-y-10">
          <div className="h-64 bg-slate-200/50 dark:bg-slate-800/50 rounded-[2.5rem]" />
          <div className="h-64 bg-slate-200/50 dark:bg-slate-800/50 rounded-[2.5rem]" />
        </div>
      ) : (
        <>
          <Card title="BIG3" data={big3} unit="kg" color="from-orange-500 to-red-600" icon="🔥" />
          <Card title="総重量" data={volume} unit="kg" color="from-blue-500 to-indigo-600" icon="📊">
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-white/20">
              <button 
                onClick={() => setVolumeTimeframe('week')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${volumeTimeframe === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
              >
                WEEK
              </button>
              <button 
                onClick={() => setVolumeTimeframe('month')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${volumeTimeframe === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
              >
                MONTH
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}