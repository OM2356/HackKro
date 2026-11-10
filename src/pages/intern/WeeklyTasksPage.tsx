import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { TaskSubmissionModal } from '../../components/tasks/TaskSubmissionModal.tsx';
import { CalendarRange, Clock, Award, CheckCircle2, Send, Loader2, GitBranch, ExternalLink } from 'lucide-react';

export const WeeklyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const fetchWeeklyTasks = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/assignments/my?type=weekly');
      setTasks(res.data);
    } catch (err) {
      console.error('[Weekly Tasks] Error fetching:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyTasks();
  }, []);

  return (
    <AppLayout
      title="Weekly Capstone Projects"
      subtitle="Large-scope architectural milestones designed to test full-stack competence, testing, and cloud deployment."
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500">Loading weekly milestones...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <CalendarRange className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No weekly capstones assigned yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Your mentors will assign weekly milestones at the start of each sprint cycle.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {tasks.map((task) => {
              const isPastDeadline = new Date(task.deadline).getTime() < Date.now();
              const isEvaluated = task.assignment_status === 'evaluated';
              const isSubmitted = task.assignment_status === 'submitted';

              return (
                <div
                  key={task.assignment_id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs hover:shadow-xs transition-shadow space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded text-[11px]">
                          {task.category || 'Capstone Project'}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            isEvaluated
                              ? 'bg-emerald-50 text-emerald-700'
                              : isSubmitted
                              ? 'bg-amber-50 text-amber-700'
                              : isPastDeadline
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isEvaluated
                            ? `Evaluated (+${task.points_awarded || 0} pts)`
                            : isSubmitted
                            ? 'Submitted (Pending Mentor Review)'
                            : isPastDeadline
                            ? 'Past Deadline'
                            : 'In Progress'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {task.description}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl sm:text-right shrink-0 min-w-[160px]">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Total Points
                      </div>
                      <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-0.5">
                        {task.max_points} <span className="text-xs font-sans font-medium text-slate-500">pts</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 sm:justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Status Box if already submitted */}
                  {task.submission_id && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                        <span>Submitted Deliverables</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          Submitted on {new Date(task.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap text-xs">
                        <a
                          href={task.github_repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>View Submitted GitHub Repo</span>
                        </a>
                        {task.live_file_url && (
                          <a
                            href={task.live_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-700 hover:text-slate-900 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Deployment Preview</span>
                          </a>
                        )}
                      </div>
                      {task.evaluation_feedback && (
                        <div className="mt-2 pt-2 border-t border-slate-200/80 text-xs">
                          <strong className="text-slate-900">Mentor Remarks:</strong>{' '}
                          <span className="text-slate-600 italic">"{task.evaluation_feedback}"</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action row */}
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{task.assignment_status === 'pending' ? 'Submit Project Solution' : 'Update Submission'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Submission Modal */}
      {selectedTask && (
        <TaskSubmissionModal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          onSuccess={fetchWeeklyTasks}
          task={{
            assignment_id: selectedTask.assignment_id,
            title: selectedTask.title,
            description: selectedTask.description,
            type: selectedTask.type,
            max_points: selectedTask.max_points,
            deadline: selectedTask.deadline,
            existing_github: selectedTask.github_repo_url,
            existing_live: selectedTask.live_file_url,
            existing_notes: selectedTask.submission_notes,
          }}
        />
      )}
    </AppLayout>
  );
};
