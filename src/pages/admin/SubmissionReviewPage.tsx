import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { SubmissionReviewModal } from '../../components/submissions/SubmissionReviewModal.tsx';
import {
  ClipboardCheck,
  Search,
  Github,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Award,
  MessageSquare,
} from 'lucide-react';

export const SubmissionReviewPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'daily' | 'weekly'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      let url = '/submissions?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (typeFilter !== 'all') url += `type=${typeFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await apiClient.get(url);
      setSubmissions(res.data);
    } catch (err) {
      console.error('[Submission Review] Error fetching submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubmissions();
  };

  return (
    <AppLayout
      title="Code Submission Evaluation & Grading"
      subtitle="Inspect intern GitHub repositories, verify live demos, award points, and dispatch automated feedback."
    >
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by intern name, email or task title..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Segmented */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
              {(['all', 'submitted', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'submitted' ? 'Pending Review' : st}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Cadences</option>
              <option value="daily">Daily Tasks</option>
              <option value="weekly">Weekly Capstones</option>
            </select>
          </div>
        </div>

        {/* Submissions Table */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No submissions found</h3>
            <p className="text-xs text-slate-500">
              No submissions match the current status and search filters.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Intern</th>
                    <th className="py-3 px-4">Task Details</th>
                    <th className="py-3 px-4">Artifacts</th>
                    <th className="py-3 px-4">Submission Time</th>
                    <th className="py-3 px-4">Verdict & Points</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => {
                    const isApproved = sub.submission_status === 'approved';
                    const isRejected = sub.submission_status === 'rejected';
                    const isPending = sub.submission_status === 'submitted';

                    return (
                      <tr key={sub.submission_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{sub.intern_name}</div>
                          <div className="text-[11px] text-slate-500">{sub.intern_email}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{sub.intern_track}</div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 line-clamp-1">{sub.task_title}</div>
                          <div className="text-[11px] text-slate-500 font-mono uppercase mt-0.5">
                            {sub.task_type} · Max {sub.max_points} pts
                          </div>
                          {sub.notes && (
                            <div className="text-[11px] text-slate-600 line-clamp-1 italic mt-1 bg-slate-50 p-1 rounded">
                              "{sub.notes}"
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <a
                              href={sub.github_repo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded"
                            >
                              <Github className="w-3.5 h-3.5" />
                              <span>GitHub</span>
                            </a>
                            {sub.live_file_url && (
                              <a
                                href={sub.live_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Demo</span>
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {new Date(sub.submitted_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700'
                                : isRejected
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                          </span>
                          {isApproved && (
                            <div className="text-xs font-mono font-bold text-emerald-600 mt-1">
                              +{sub.points_awarded} pts
                            </div>
                          )}
                          {sub.feedback && (
                            <div className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5">
                              Feedback: "{sub.feedback}"
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${
                              isPending
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isPending ? 'Review & Grade' : 'Re-evaluate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedSubmission && (
        <SubmissionReviewModal
          isOpen={Boolean(selectedSubmission)}
          onClose={() => setSelectedSubmission(null)}
          onSuccess={fetchSubmissions}
          submission={selectedSubmission}
        />
      )}
    </AppLayout>
  );
};
