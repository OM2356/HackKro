import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import {
  Users,
  Search,
  Award,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Github,
  Mail,
  Loader2,
  X,
  Phone,
} from 'lucide-react';

export const InternManagementPage: React.FC = () => {
  const { showToast } = useNotification();
  const [interns, setInterns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Performance Drawer / Modal
  const [selectedInternId, setSelectedInternId] = useState<number | null>(null);
  const [internDetail, setInternDetail] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchInterns = async () => {
    setIsLoading(true);
    try {
      let url = '/interns?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await apiClient.get(url);
      setInterns(res.data);
    } catch (err) {
      console.error('[Intern Management] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, [statusFilter]);

  const handleToggleStatus = async (intern: any) => {
    const newStatus = intern.status === 'active' ? 'inactive' : 'active';
    try {
      await apiClient.put(`/interns/${intern.id}/status`, { status: newStatus });
      showToast('info', 'Status Updated', `${intern.name} is now ${newStatus}.`);
      fetchInterns();
    } catch (err: any) {
      showToast('error', 'Status Update Failed', err.response?.data?.error || 'Could not update status.');
    }
  };

  const handleOpenPerformance = async (id: number) => {
    setSelectedInternId(id);
    setIsDetailLoading(true);
    try {
      const res = await apiClient.get(`/interns/${id}/performance`);
      setInternDetail(res.data);
    } catch (err) {
      console.error('[Performance Detail] Error:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <AppLayout
      title="Intern Roster & Performance Directory"
      subtitle="Track registered interns, manage cohort activation status, and inspect granular task performance."
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInterns()}
              placeholder="Search by name, email, or track..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st} Interns
              </button>
            ))}
          </div>
        </div>

        {/* Interns Table */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : interns.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No interns found</p>
            <p className="text-xs text-slate-500">Try modifying your search or status filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Intern Name</th>
                    <th className="py-3 px-4">Track / Focus</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Assigned / Done</th>
                    <th className="py-3 px-4 text-center">Total Points</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interns.map((intern) => (
                    <tr key={intern.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {intern.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{intern.name}</div>
                            <div className="text-[11px] text-slate-500">{intern.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">{intern.track || 'Full-Stack'}</td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(intern)}
                          title="Click to toggle status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                            intern.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              intern.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          ></span>
                          <span className="capitalize">{intern.status}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono tabular-nums">
                        <span className="font-bold text-slate-900">{intern.approved_count}</span>
                        <span className="text-slate-400"> / {intern.assigned_count}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold tabular-nums text-slate-900">
                        {intern.total_points} pts
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenPerformance(intern.id)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Performance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Individual Intern Performance Modal */}
      {selectedInternId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Individual Intern Performance</h3>
                <p className="text-xs text-slate-500">Historical view of assigned tasks and evaluations</p>
              </div>
              <button
                onClick={() => {
                  setSelectedInternId(null);
                  setInternDetail(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isDetailLoading || !internDetail ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Intern Header Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{internDetail.intern.name}</div>
                    <div className="text-xs text-slate-500">{internDetail.intern.email}</div>
                    <div className="text-xs font-semibold text-blue-700 mt-1">{internDetail.intern.track}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-semibold">Total Points</div>
                    <div className="text-2xl font-extrabold font-mono text-emerald-600">
                      {internDetail.total_points} pts
                    </div>
                  </div>
                </div>

                {/* Tasks & Submissions List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Assigned Tasks & Submissions ({internDetail.tasks.length})
                  </h4>

                  {internDetail.tasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      No tasks assigned yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {internDetail.tasks.map((task: any) => (
                        <div
                          key={task.assignment_id}
                          className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold uppercase text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {task.task_type}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                task.assignment_status === 'evaluated'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : task.assignment_status === 'submitted'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {task.assignment_status}
                            </span>
                          </div>

                          <div className="font-bold text-slate-900">{task.task_title}</div>

                          {task.github_repo_url && (
                            <div className="flex items-center gap-3 pt-1">
                              <a
                                href={task.github_repo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                <Github className="w-3.5 h-3.5" />
                                <span>GitHub Repository</span>
                              </a>
                            </div>
                          )}

                          {task.evaluation_feedback && (
                            <div className="mt-2 p-2.5 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-100">
                              Feedback: "{task.evaluation_feedback}" (+{task.points_awarded || 0} pts)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};
