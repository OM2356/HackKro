import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client.ts';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { SubmissionReviewModal } from '../../components/submissions/SubmissionReviewModal.tsx';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  ClipboardCheck,
  Award,
  ArrowRight,
  ExternalLink,
  Github,
  Mail,
  Loader2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubForReview, setSelectedSubForReview] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, subsRes, internsRes, emailRes] = await Promise.all([
        apiClient.get('/stats/admin'),
        apiClient.get('/submissions?status=submitted'),
        apiClient.get('/interns'),
        apiClient.get('/email/logs'),
      ]);
      setStats(statsRes.data);
      setPendingSubmissions(subsRes.data);
      setInterns(internsRes.data.slice(0, 5));
      setEmailLogs(emailRes.data.slice(0, 5));
    } catch (err) {
      console.error('[Admin Dashboard] Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <AppLayout title="Executive Overview">
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Aggregating HackKro program metrics...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Employee & Admin Console"
      subtitle="Overview of intern enrollments, pending task evaluations, points distribution, and automated communications."
      action={
        <Link
          to="/admin/tasks"
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Assign New Task</span>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Registered Interns</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.total_interns || 0}
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              {stats?.active_interns || 0} active in sprints
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Assigned Tasks</span>
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.total_assigned || 0}
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              Across {stats?.total_tasks || 0} task templates
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Pending Reviews</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-600">
              {stats?.pending_submissions || 0}
            </div>
            <div className="text-[11px] text-slate-500 pt-1">Awaiting mentor grade</div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Approved Solutions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
              {stats?.approved_submissions || 0}
            </div>
            <div className="text-[11px] text-slate-500 pt-1">Points awarded</div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Revision Required</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-600">
              {stats?.rejected_submissions || 0}
            </div>
            <div className="text-[11px] text-slate-500 pt-1">Needs feedback iteration</div>
          </div>
        </div>

        {/* Pending Submissions Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Submissions Awaiting Evaluation</h3>
              <p className="text-xs text-slate-500">
                Review submitted code, verify GitHub branches, award points, and dispatch automated feedback.
              </p>
            </div>
            <Link
              to="/admin/submissions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>All Submissions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-800">All caught up!</h4>
              <p className="text-xs text-slate-500">There are no pending submissions awaiting review right now.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Intern</th>
                      <th className="py-3 px-4">Task</th>
                      <th className="py-3 px-4">Submitted Artifacts</th>
                      <th className="py-3 px-4">Submission Time</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingSubmissions.map((sub) => (
                      <tr key={sub.submission_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{sub.intern_name}</div>
                          <div className="text-[11px] text-slate-500">{sub.intern_email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{sub.task_title}</div>
                          <div className="text-[11px] text-slate-500 font-mono uppercase">
                            {sub.task_type} · Max {sub.max_points} pts
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <a
                              href={sub.github_repo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                            >
                              <Github className="w-3.5 h-3.5" />
                              <span>GitHub</span>
                            </a>
                            {sub.live_file_url && (
                              <a
                                href={sub.live_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-600 hover:text-slate-900 flex items-center gap-1"
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
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedSubForReview(sub)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                          >
                            Review & Grade
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

        {/* 2-Column Section: Top Interns & Automated Email Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Interns Directory Sneak Peek */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Intern Performance Directory</h3>
              <Link
                to="/admin/interns"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Manage Interns</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
              {interns.map((intern) => (
                <div key={intern.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {intern.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{intern.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{intern.track}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <div className="text-xs font-bold font-mono tabular-nums text-slate-900">
                        {intern.total_points} pts
                      </div>
                      <div className="text-[10px] text-slate-500">{intern.approved_count} approved</div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        intern.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {intern.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resend Automated Email Dispatches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Recent Resend Email Dispatches</h3>
              <Link
                to="/admin/email-logs"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Full Audit Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
              {emailLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No automated emails logged yet. They trigger on task assignment, submission, and grading.
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{log.subject}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        To: {log.recipient} · {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          log.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.status.includes('simulated')
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {log.status === 'delivered' ? 'Delivered' : log.status.includes('simulated') ? 'Simulated' : 'Error'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubForReview && (
        <SubmissionReviewModal
          isOpen={Boolean(selectedSubForReview)}
          onClose={() => setSelectedSubForReview(null)}
          onSuccess={fetchDashboardData}
          submission={selectedSubForReview}
        />
      )}
    </AppLayout>
  );
};
