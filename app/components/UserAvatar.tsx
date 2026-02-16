'use client';

// 王冠の色の定義
const CROWN_STYLES: Record<number, string> = {
  1: "text-amber-400 drop-shadow-[0_2px_3px_rgba(251,191,36,0.5)]", // 金
  2: "text-slate-300 drop-shadow-[0_2px_3px_rgba(203,213,225,0.5)]", // 銀
  3: "text-orange-400 drop-shadow-[0_2px_3px_rgba(251,146,60,0.5)]", // 銅
};

export default function UserAvatar({ url, rank, size = "w-12 h-12" }: { url: string, rank?: number, size?: string }) {
  return (
    <div className={`relative ${size}`}>
      {/* 王冠演出：ランクがある場合のみ表示 */}
      {rank && rank <= 3 && (
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 z-10 text-xl animate-bounce ${CROWN_STYLES[rank]}`}>
          👑
        </div>
      )}
      
      {/* アイコン本体 */}
      <div className={`w-full h-full bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden border border-white/50`}>
        {url?.startsWith('http') ? (
          <img src={url} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">{url || '💪'}</span>
        )}
      </div>
    </div>
  );
}