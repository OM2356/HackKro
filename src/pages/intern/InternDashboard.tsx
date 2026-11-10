import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiClient } from '../../api/client.ts';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { TaskSubmissionModal } from '../../components/tasks/TaskSubmissionModal.tsx';
import {
  Award,
  CalendarDays,
  CalendarRange,
  Clock,
  ArrowRight,
  ExternalLink,
  Github,
  Sparkles,
  Send,
  Loader2,
} from 'lucide-react';

export const InternDashboard: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, tasksRes, subsRes] = await Promise.all([
        apiClient.get('/stats/intern'),
        apiClient.get('/assignments/my'),
        apiClient.get('/submissions/my'),
      ]);
      setStats(statsRes.data);
      setAssignedTasks(tasksRes.data);
      setRecentSubmissions(subsRes.data.slice(0, 5));
      await refreshProfile();
    } catch (err) {
      console.error('[Intern Dashboard] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dailyTasks = assignedTasks.filter((t) => t.type === 'daily');
  const weeklyTasks = assignedTasks.filter((t) => t.type === 'weekly');
  const pendingDaily = dailyTasks.filter((t) => t.assignment_status === 'pending');
  const pendingWeekly = weeklyTasks.filter((t) => t.assignment_status === 'pending');

  if (isLoading) {
    return (
      <AppLayout title="Intern Overview">
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your assignments and points...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Intern Workspace"
      subtitle={`Welcome back, ${user?.name}! Keep track of daily assignments and weekly capstones.`}
      action={
        <Link
          to="/intern/daily-tasks"
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Submit Task</span>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Welcome Banner Card */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-700 relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Status: Active Intern ({user?.track || 'Full-Stack'})</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Hello, {user?.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              You have <strong className="text-amber-400 font-mono tabular-nums">{pendingDaily.length}</strong> daily drill(s) and{' '}
              <strong className="text-blue-400 font-mono tabular-nums">{pendingWeekly.length}</strong> weekly capstone(s) awaiting your submission.
            </p>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Points Earned</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.total_points || 0} <span className="text-xs text-slate-500 font-sans font-medium">pts</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
              <span>Leaderboard Rank:</span>
              <span className="font-semibold font-mono text-slate-700">#{stats?.rank || 1}</span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Daily Tasks Pending</span>
              <CalendarDays className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.daily_pending || 0}
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              {dailyTasks.length} total daily drill(s) assigned
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Weekly Milestones</span>
              <CalendarRange className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.weekly_pending || 0}
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              {weeklyTasks.length} weekly capstone(s) assigned
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Approval Rate</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.approval_rate ?? 100}%
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              {stats?.completed_tasks || 0} evaluated submission(s)
            </div>
          </div>
        </div>

        {/* Daily Tasks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Daily Assigned Drills</h3>
              <p className="text-xs text-slate-500">Short-deadline tasks focusing on specific code routines</p>
            </div>
            <Link
              to="/intern/daily-tasks"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All ({dailyTasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {dailyTasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              No daily tasks assigned to you right now. Check back when your mentor publishes new drills.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyTasks.slice(0, 4).map((task) => (
                <div
                  key={task.assignment_id}
                  className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between gap-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {task.category || 'General'}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          task.assignment_status === 'evaluated'
                            ? 'bg-emerald-50 text-emerald-700'
                            : task.assignment_status === 'submitted'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.assignment_status === 'evaluated'
                          ? `Evaluated (${task.evaluation_status || 'Graded'})`
                          : task.assignment_status === 'submitted'
                          ? 'Awaiting Review'
                          : 'Pending Submission'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{task.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{task.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-mono">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums font-bold text-slate-800">
                        {task.max_points} pts
                      </span>

                      {task.assignment_status === 'pending' ? (
                        <button
                          onClick={() => setSelectedTaskForSubmission(task)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          Submit
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedTaskForSubmission(task)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Resubmit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Capstones Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Milestones</h3>
              <p className="text-xs text-slate-500">Comprehensive full-stack projects and architectural milestones</p>
            </div>
            <Link
              to="/intern/weekly-tasks"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All ({weeklyTasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {weeklyTasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              No weekly milestones assigned yet.
            </div>
          ) : (
            <div className="space-y-3">
              {weeklyTasks.map((task) => (
                <div
                  key={task.assignment_id}
                  className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                        Weekly Capstone
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs font-mono text-slate-500">
                        Deadline: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Max Score</div>
                      <div className="text-sm font-bold font-mono text-slate-900">{task.max_points} pts</div>
                    </div>

                    <button
                      onClick={() => setSelectedTaskForSubmission(task)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
                    >
                      {task.assignment_status === 'pending' ? 'Submit Solution' : 'Update Submission'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions History Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recent Submissions & Feedback</h3>
            <Link
              to="/intern/submissions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              You haven't submitted any tasks yet. Pick an assigned task above to submit your code!
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Task</th>
                      <th className="py-3 px-4">Artifacts</th>
                      <th className="py-3 px-4">Submitted At</th>
                      <th className="py-3 px-4">Evaluation Status</th>
                      <th className="py-3 px-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentSubmissions.map((sub) => (
                      <tr key={sub.submission_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{sub.task_title}</div>
                          <div className="text-[11px] text-slate-500 uppercase font-mono">{sub.task_type}</div>
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
                              <span>Repo</span>
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
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              sub.submission_status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : sub.submission_status === 'rejected'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {sub.submission_status === 'approved'
                              ? 'Approved'
                              : sub.submission_status === 'rejected'
                              ? 'Revision Needed'
                              : 'Pending Review'}
                          </span>
                          {sub.feedback && (
                            <div className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                              "{sub.feedback}"
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                          {sub.submission_status === 'approved' ? (
                            <span className="text-emerald-600">+{sub.points_awarded || 0} pts</span>
                          ) : (
                            <span className="text-slate-400">0 pts</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Submission Modal */}
      {selectedTaskForSubmission && (
        <TaskSubmissionModal
          isOpen={Boolean(selectedTaskForSubmission)}
          onClose={() => setSelectedTaskForSubmission(null)}
          onSuccess={fetchData}
          task={{
            assignment_id: selectedTaskForSubmission.assignment_id,
            title: selectedTaskForSubmission.title,
            description: selectedTaskForSubmission.description,
            type: selectedTaskForSubmission.type,
            max_points: selectedTaskForSubmission.max_points,
            deadline: selectedTaskForSubmission.deadline,
            existing_github: selectedTaskForSubmission.github_repo_url,
            existing_live: selectedTaskForSubmission.live_file_url,
            existing_notes: selectedTaskForSubmission.submission_notes,
          }}
        />
      )}
    </AppLayout>
  );
};
