"use client";

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import Link from "next/link";
import AuthButton from "./components/AuthButton";
import UserAvatar from "./components/UserAvatar";

export default function Home() {
  const [records, setRecords] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [top3Ids, setTop3Ids] = useState<Record<string, number>>({});

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setCurrentProfile(prof);
    }

    // 前月トップ3の取得
    const { data: top3 } = await supabase.from("last_month_top_3").select("*");
    if (top3) {
      const mapping = top3.reduce(
        (acc: any, curr: any) => ({ ...acc, [curr.user_id]: curr.rank }),
        {},
      );
      setTop3Ids(mapping);
    }

    const { data, error } = await supabase
      .from("training_records")
      .select(
        `
        id, weight, reps, sets, memo, created_at, custom_exercise_name, user_id,
        exercises ( name ),
        profiles ( email, role, grade, display_name, avatar_url, is_admin ),
        likes ( user_id ) 
      `,
      )
      .order("created_at", { ascending: false });

    if (error) console.error(error.message);
    else if (data) setRecords(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (recordId: string) => {
    if (!confirm("この投稿を削除してよろしいですか？")) return;
    const { error } = await supabase
      .from("training_records")
      .delete()
      .eq("id", recordId);
    if (error) alert("削除失敗: " + error.message);
    else fetchData();
  };

  const handleLike = async (recordId: string, likes: any[]) => {
    if (!currentUser) {
      alert("ログインが必要です！");
      return;
    }
    const hasLiked = likes.some((like) => like.user_id === currentUser.id);
    if (hasLiked) {
      await supabase
        .from("likes")
        .delete()
        .match({ record_id: recordId, user_id: currentUser.id });
    } else {
      await supabase
        .from("likes")
        .insert([{ record_id: recordId, user_id: currentUser.id }]);
    }
    fetchData();
  };

  return (
    <div className="p-6 max-w-xl mx-auto mb-24 min-h-screen animate-in fade-in duration-1000">
      <header className="sticky top-4 z-20 backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 p-4 rounded-2xl shadow-sm border border-white/40 dark:border-gray-700/40 flex justify-between items-center mb-8 animate-in slide-in-from-top-4 duration-700">
        <h1 className="text-xl font-black italic tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent italic">
          筋トレアプリ
        </h1>
        <AuthButton />
      </header>

      {currentUser ? (
        <Link
          href="/record"
          className="group relative block w-full mb-10 overflow-hidden rounded-2xl p-[2px] transition-transform active:scale-95 animate-in zoom-in-95 duration-700 delay-150 fill-mode-both"
        >
          <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
          <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-950 px-3 py-4 text-sm font-black text-white backdrop-blur-3xl group-hover:bg-slate-900 transition">
            🚀 今日のセットを投稿する
          </div>
        </Link>
      ) : (
        <div className="mb-10 p-6 bg-slate-100 dark:bg-slate-800/40 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 text-center animate-in zoom-in-95 duration-700 delay-150 fill-mode-both">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
            ログインすると投稿やナイスバルクができます 💪
          </p>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1 animate-in fade-in duration-700 delay-300 fill-mode-both">
          Timeline
        </h2>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-[2rem]"
              />
            ))}
          </div>
        ) : (
          records.map((record: any, index: number) => {
            const date = new Date(record.created_at);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
            const profile = record.profiles;

            const finalName = currentUser
              ? profile?.display_name ||
                (profile?.email ? profile.email.split("@")[0] : "匿名")
              : "匿名";

            const displayAvatar = currentUser ? profile?.avatar_url : null;
            const canDelete =
              currentUser &&
              (currentUser.id === record.user_id || currentProfile?.is_admin);

            return (
              <div
                key={record.id}
                style={{ animationDelay: `${100 + index * 100}ms` }}
                className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-white/50 dark:border-slate-700/50 transition-all hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      url={displayAvatar}
                      rank={currentUser ? top3Ids[record.user_id] : undefined}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-sm ${profile?.role === "部長" && currentUser ? "text-amber-500" : "text-slate-900 dark:text-white"}`}
                        >
                          {finalName}
                        </span>
                        {profile?.grade && currentUser && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold text-slate-500">
                            {profile.grade}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium italic uppercase tracking-wider">
                        {currentUser ? profile?.role || "部員" : "GUEST"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-mono text-slate-400">
                      {formattedDate}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {record.memo && (
                  <p className="text-slate-700 dark:text-slate-300 mb-5 text-sm leading-relaxed px-1 whitespace-pre-wrap font-medium">
                    {record.memo}
                  </p>
                )}

                {(record.exercises || record.custom_exercise_name) && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/80 dark:to-slate-900/40 p-4 rounded-2xl mb-2 border border-slate-100 dark:border-slate-800 shadow-inner">
                    <p className="text-[10px] font-black text-blue-500 dark:text-blue-400 mb-2 uppercase tracking-tighter">
                      {record.exercises?.name || record.custom_exercise_name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                        {record.weight || "0"}
                      </span>
                      <span className="text-xs font-bold text-slate-400 mr-3">
                        kg
                      </span>
                      <span className="text-lg font-light text-slate-300">
                        ×
                      </span>
                      <span className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white ml-2">
                        {record.reps || "0"}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        reps
                      </span>
                      {record.sets && (
                        <span className="ml-auto text-xs font-black bg-blue-500 text-white px-2 py-1 rounded-lg shadow-sm">
                          {record.sets} SETS
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleLike(record.id, record.likes || [])}
                    className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all active:scale-95 ${
                      record.likes?.some(
                        (l: any) => l.user_id === currentUser?.id,
                      )
                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <span
                      className={
                        record.likes?.some(
                          (l: any) => l.user_id === currentUser?.id,
                        )
                          ? "animate-bounce"
                          : ""
                      }
                    >
                      👍
                    </span>
                    いいね！
                    <span
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] ${record.likes?.some((l: any) => l.user_id === currentUser?.id) ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}
                    >
                      {record.likes?.length || 0}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
