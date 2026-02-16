'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';

export default function RecordPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<any[]>([]);
  const [isCustom, setIsCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('exercises').select('*').order('id').then(({ data }) => data && setExercises(data));
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('training_records').insert([{
      exercise_id: !isCustom && fd.get('ex_id') ? Number(fd.get('ex_id')) : null,
      custom_exercise_name: isCustom ? String(fd.get('custom')) : null,
      weight: Number(fd.get('w')), reps: Number(fd.get('r')), sets: Number(fd.get('s')),
      memo: String(fd.get('m')), user_id: user?.id
    }]);
    router.push('/');
    router.refresh();
  };

  const InputStyle = "w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-bold";

  return (
    <div className="p-6 max-w-xl mx-auto mb-24">
      <h1 className="text-3xl font-black italic tracking-tighter mb-8 bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent uppercase">アクティビティ</h1>
      <form onSubmit={handleSubmit} className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 dark:border-slate-700/50 space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">種目</label>
          <select name="ex_id" onChange={(e) => setIsCustom(e.target.value === 'c')} className={InputStyle}>
            <option value="">種目の選択...</option>
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            <option value="c">＋ その他</option>
          </select>
        </div>
        {isCustom && <input name="custom" placeholder="種目名" required className={`${InputStyle} animate-in fade-in slide-in-from-top-2 border-2 border-blue-500/20`} />}
        
        <div className="grid grid-cols-3 gap-4">
          <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">重さ</label><input name="w" type="number" step="0.5" placeholder="kg" className={InputStyle} /></div>
          <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">レップ数</label><input name="r" type="number" placeholder="reps" className={InputStyle} /></div>
          <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">セット数</label><input name="s" type="number" placeholder="sets" className={InputStyle} /></div>
        </div>

        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">ひとこと</label><textarea name="m" rows={3} placeholder="" className={InputStyle}></textarea></div>

        <button disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-transform disabled:opacity-50">
          {isSubmitting ? 'PUMPING UP...' : 'POST RECORD'}
        </button>
      </form>
    </div>
  );
}