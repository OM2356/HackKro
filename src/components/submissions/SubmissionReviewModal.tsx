import React, { useState } from 'react';
import { apiClient } from '../../api/client.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import { X, CheckCircle, XCircle, Github, ExternalLink, MessageSquare, Award, Loader2, AlertCircle } from 'lucide-react';

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  submission: {
    submission_id: number;
    task_title: string;
    task_type: string;
    max_points: number;
    intern_name: string;
    intern_email: string;
    intern_track?: string;
    github_repo_url: string;
    live_file_url?: string;
    notes?: string;
    submitted_at: string;
    evaluation_status?: string;
    points_awarded?: number;
    feedback?: string;
  };
}

export const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  submission,
}) => {
  const { showToast } = useNotification();
  const [decision, setDecision] = useState<'approved' | 'rejected'>(
    (submission.evaluation_status as any) || 'approved'
  );
  const [points, setPoints] = useState<number>(
    submission.points_awarded !== undefined ? submission.points_awarded : submission.max_points
  );
  const [feedback, setFeedback] = useState<string>(submission.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!feedback.trim()) {
      setError('Evaluation feedback comments are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/evaluations', {
        submission_id: submission.submission_id,
        status: decision,
        points_awarded: decision === 'approved' ? Number(points) : 0,
        feedback: feedback.trim(),
      });

      showToast(
        'success',
        `Submission ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
        `Automated evaluation email delivered to ${submission.intern_name}.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit evaluation.';
      setError(msg);
      showToast('error', 'Evaluation Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Evaluating Submission
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-[11px] font-mono tabular-nums text-slate-300">
                Max {submission.max_points} pts
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 leading-snug">{submission.task_title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Intern Info Strip */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-900">{submission.intern_name}</div>
              <div className="text-[11px] text-slate-500">
                {submission.intern_email} · {submission.intern_track || 'Full-Stack'}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 sm:text-right">
              <div>Submitted at</div>
              <div className="font-mono text-slate-700">
                {new Date(submission.submitted_at).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </div>
          </div>

          {/* Submitted Links & Notes */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-700">Submitted Artifacts</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={submission.github_repo_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/50 transition-colors text-xs text-slate-800 font-medium group"
              >
                <Github className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="truncate flex-1">Open GitHub Repo</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0" />
              </a>

              {submission.live_file_url ? (
                <a
                  href={submission.live_file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/50 transition-colors text-xs text-slate-800 font-medium group"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate flex-1">Open Live Preview / File</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0" />
                </a>
              ) : (
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-400 italic">
                  No live deployment URL provided
                </div>
              )}
            </div>

            {submission.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[11px] font-semibold text-slate-600 mb-1">Intern Implementation Notes:</div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{submission.notes}</p>
              </div>
            )}
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Evaluation Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDecision('approved');
                  if (points === 0) setPoints(submission.max_points);
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  decision === 'approved'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${decision === 'approved' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Approve & Award Points</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('rejected');
                  setPoints(0);
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  decision === 'rejected'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className={`w-4 h-4 ${decision === 'rejected' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>Reject (Request Revisions)</span>
              </button>
            </div>
          </div>

          {/* Points Awarded (if approved) */}
          {decision === 'approved' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Points Awarded</label>
                <span className="text-[11px] text-slate-500">Max: {submission.max_points} pts</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <input
                  type="number"
                  min="0"
                  max={submission.max_points}
                  required
                  value={points}
                  onChange={(e) => setPoints(Math.min(submission.max_points, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono tabular-nums font-semibold"
                />
              </div>
            </div>
          )}

          {/* Feedback Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Evaluation Feedback Comments <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 text-slate-400 pointer-events-none">
                <MessageSquare className="w-4 h-4" />
              </div>
              <textarea
                rows={3}
                required
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide constructive feedback, highlighting strong architecture patterns or specific areas for revision..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 ${
                decision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <span>Confirm Evaluation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
