import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { Award, Trophy, Users, Loader2 } from 'lucide-react';

export const AdminLeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/points/leaderboard');
      setLeaderboard(res.data);
    } catch (err) {
      console.error('[Admin Leaderboard] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <AppLayout
      title="Cohort Points Leaderboard"
      subtitle="Rankings of all active interns based on points awarded across daily tasks and weekly milestone capstones."
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Intern</th>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4 text-center">Assigned</th>
                    <th className="py-3 px-4 text-center">Approved</th>
                    <th className="py-3 px-4 text-right font-mono">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((intern) => (
                    <tr key={intern.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-sm">
                        {intern.rank === 1 ? '🥇' : intern.rank === 2 ? '🥈' : intern.rank === 3 ? '🥉' : `#${intern.rank}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                            {intern.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{intern.name}</div>
                            <div className="text-[11px] text-slate-500">{intern.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{intern.track}</td>
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-600">
                        {intern.total_assigned}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums font-semibold text-emerald-600">
                        {intern.approved_count}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-slate-900 tabular-nums">
                        {intern.total_points} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
