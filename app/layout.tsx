import './globals.css';
import Link from 'next/link';
import { Noto_Sans_JP } from 'next/font/google';

// 筋肉質な力強さを出すために Noto Sans JP を採用
const noto = Noto_Sans_JP({ 
  subsets: ['latin'], 
  weight: ['400', '700', '900'],
  display: 'swap',
});

export const metadata = {
  title: '筋トレサークルapp',
  description: 'サークル部員専用のトレーニング記録・共有アプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${noto.className} min-h-screen bg-fixed bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-white to-blue-100 dark:from-gray-900 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-slate-100`}>
        
        {/* 背景の装飾：奥行きを出すための磨りガラス風レイヤー */}
        <div className="fixed inset-0 -z-10 h-full w-full opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:bg-[radial-gradient(125%_125%_at_50%_10%,#000_40%,#1e3a8a_100%)]"></div>
        </div>

        {/* メインコンテンツ */}
        <main className="pb-24 relative z-0">
          {children}
        </main>

        {/* 📱 磨りガラス風 下部メニュー（グラスモーフィズム採用） */}
        <nav className="fixed bottom-0 w-full backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border-t border-white/20 dark:border-gray-700/30 flex justify-around items-center h-[72px] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-50 px-2 transition-all">
          
          <Link href="/" className="flex flex-col items-center flex-1 py-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-90">
            <span className="text-2xl mb-1">🏠</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">ホーム</span>
          </Link>

          <Link href="/calendar" className="flex flex-col items-center flex-1 py-1 text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all active:scale-90">
            <span className="text-2xl mb-1">📅</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">予定</span>
          </Link>
          
          {/* 中央の＋ボタン：フローティングアクションボタン風 */}
          <Link href="/record" className="flex flex-col items-center justify-center -mt-8 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-2xl w-14 h-14 shadow-[0_8px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_10px_25px_rgba(37,99,235,0.5)] transition-all active:scale-95 border-4 border-white dark:border-gray-900">
            <span className="text-2xl">➕</span>
          </Link>
          
          <Link href="/ranking" className="flex flex-col items-center flex-1 py-1 text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 transition-all active:scale-90">
            <span className="text-2xl mb-1">👑</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">ランキング</span>
          </Link>

          <Link href="/mypage" className="flex flex-col items-center flex-1 py-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90">
            <span className="text-2xl mb-1">👤</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">マイページ</span>
          </Link>

        </nav>

      </body>
    </html>
  );
}