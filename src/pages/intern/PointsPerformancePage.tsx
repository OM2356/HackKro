import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { Award, Trophy, Star, ShieldCheck, Flame, Loader2, ArrowUpRight } from 'lucide-react';

export const PointsPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const [pointsData, setPointsData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPointsAndLeaderboard = async () => {
      setIsLoading(true);
      try {
        const [myRes, lbRes] = await Promise.all([
          apiClient.get('/points/my'),
          apiClient.get('/points/leaderboard'),
        ]);
        setPointsData(myRes.data);
        setLeaderboard(lbRes.data);
      } catch (err) {
        console.error('[Points Performance] Error loading points:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPointsAndLeaderboard();
  }, []);

  const totalPoints = pointsData?.total_points || 0;

  // Milestone Badges logic
  const badges = [
    {
      title: 'First Flight',
      desc: 'Earned initial task points on the platform',
      unlocked: totalPoints > 0,
      icon: Star,
      color: 'text-amber-500 bg-amber-50 border-amber-200',
    },
    {
      title: 'Half-Century Drill',
      desc: 'Accumulated 50+ points through daily tasks',
      unlocked: totalPoints >= 50,
      icon: Award,
      color: 'text-blue-500 bg-blue-50 border-blue-200',
    },
    {
      title: 'Century Master',
      desc: 'Surpassed 100+ points across project submissions',
      unlocked: totalPoints >= 100,
      icon: Trophy,
      color: 'text-purple-500 bg-purple-50 border-purple-200',
    },
    {
      title: 'Top Tier Performer',
      desc: 'Ranked in the top 3 of the intern leaderboard',
      unlocked: leaderboard.slice(0, 3).some((item) => item.id === user?.id),
      icon: Flame,
      color: 'text-rose-500 bg-rose-50 border-rose-200',
    },
  ];

  return (
    <AppLayout
      title="Points & Performance"
      subtitle="Track your accumulated points, evaluation history, and competitive standing on the HackKro leaderboard."
    >
      <div className="space-y-8">
        {/* Top Points Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm border border-slate-700 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your Cumulative Points
              </div>
              <div className="text-4xl font-extrabold font-mono tabular-nums text-white mt-1">
                {totalPoints} <span className="text-sm font-sans font-medium text-slate-400">pts</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-700/80 text-xs text-slate-300">
              Points are credited automatically when your mentors approve daily and weekly solutions.
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Leaderboard Position
              </div>
              <div className="text-4xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
                #{leaderboard.findIndex((r) => r.id === user?.id) + 1 || 1}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Ranked among <span className="font-semibold text-slate-800">{leaderboard.length}</span> active software interns.
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed Submissions
              </div>
              <div className="text-4xl font-extrabold font-mono tabular-nums text-emerald-600 mt-1">
                {pointsData?.history?.length || 0}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Approved tasks with positive score evaluations.
            </div>
          </div>
        </div>

        {/* Milestone Badges Strip */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Achievement Badges</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className={`p-4 rounded-xl border transition-all ${
                    b.unlocked ? `${b.color} shadow-xs` : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        b.unlocked ? 'bg-white shadow-xs' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{b.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-tight mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column: Points History (Left) and Leaderboard (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Points History Ledger (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Points History & Evaluation Log</h3>

            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : pointsData?.history?.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                No points credited yet. Once your mentor reviews your submitted code, awards will show here.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
                {pointsData.history.map((record: any) => (
                  <div key={record.id} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                          {record.task_type || 'Task'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(record.awarded_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{record.task_title || record.reason}</h4>
                      {record.feedback && (
                        <p className="text-xs text-slate-600 italic leading-relaxed pt-1">
                          "{record.feedback}"
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold font-mono tabular-nums text-emerald-600">
                        +{record.points} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interns Leaderboard Table (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Intern Leaderboard</h3>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Intern</th>
                      <th className="py-2.5 px-3 text-center">Tasks</th>
                      <th className="py-2.5 px-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((intern) => {
                      const isMe = intern.id === user?.id;
                      return (
                        <tr
                          key={intern.id}
                          className={`${isMe ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/50'}`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-slate-500">
                            {intern.rank === 1 ? '🥇' : intern.rank === 2 ? '🥈' : intern.rank === 3 ? '🥉' : `#${intern.rank}`}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                                {intern.name.charAt(0)}
                              </div>
                              <div className="truncate max-w-[130px]">
                                <div className="text-slate-900 truncate">
                                  {intern.name} {isMe && <span className="text-[10px] text-blue-600 font-bold">(You)</span>}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">{intern.track}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600">
                            {intern.total_completed}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                            {intern.total_points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
