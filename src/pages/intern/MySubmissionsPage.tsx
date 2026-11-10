import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { TaskSubmissionModal } from '../../components/tasks/TaskSubmissionModal.tsx';
import { Send, Github, ExternalLink, Award, Clock, Loader2, MessageSquare } from 'lucide-react';

export const MySubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/submissions/my');
      setSubmissions(res.data);
    } catch (err) {
      console.error('[My Submissions] Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <AppLayout
      title="My Submissions"
      subtitle="Complete record of all code artifacts submitted to HackKro mentors with evaluation verdicts."
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500">Loading your submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <Send className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No submissions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't submitted any tasks yet. Head over to Daily Tasks or Weekly Capstones to submit your code.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => {
              const isApproved = sub.submission_status === 'approved';
              const isRejected = sub.submission_status === 'rejected';

              return (
                <div
                  key={sub.submission_id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                          {sub.task_type} Task
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs text-slate-500 font-mono">
                          Submitted on {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{sub.task_title}</h3>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isRejected
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isApproved ? 'Approved' : isRejected ? 'Revision Required' : 'Pending Mentor Review'}
                      </span>
                      {isApproved && (
                        <div className="text-sm font-mono font-bold text-emerald-600 mt-1">
                          +{sub.points_awarded} pts awarded
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Artifact Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <a
                      href={sub.github_repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <Github className="w-4 h-4 text-slate-700" />
                      <span className="truncate">{sub.github_repo_url}</span>
                    </a>

                    {sub.live_file_url && (
                      <a
                        href={sub.live_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50/70 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                        <span className="truncate">{sub.live_file_url}</span>
                      </a>
                    )}
                  </div>

                  {/* Intern's notes */}
                  {sub.notes && (
                    <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">Your Notes:</strong> {sub.notes}
                    </div>
                  )}

                  {/* Evaluation Feedback */}
                  {sub.feedback && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Mentor Feedback ({sub.evaluator_name || 'Admin'}):</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed italic">"{sub.feedback}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
