import React, { useState } from 'react';
import { apiClient } from '../../api/client.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import { X, Github, ExternalLink, FileText, Send, Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: {
    assignment_id: number;
    title: string;
    description: string;
    type: string;
    max_points: number;
    deadline: string;
    existing_github?: string;
    existing_live?: string;
    existing_notes?: string;
  };
}

export const TaskSubmissionModal: React.FC<TaskSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  task,
}) => {
  const { showToast } = useNotification();
  const [githubRepoUrl, setGithubRepoUrl] = useState(task.existing_github || '');
  const [liveFileUrl, setLiveFileUrl] = useState(task.existing_live || '');
  const [notes, setNotes] = useState(task.existing_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!githubRepoUrl.trim()) {
      setError('GitHub Repository URL is required.');
      return;
    }

    if (!githubRepoUrl.includes('github.com')) {
      setError('Please provide a valid GitHub URL containing github.com');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/submissions', {
        task_assignment_id: task.assignment_id,
        github_repo_url: githubRepoUrl.trim(),
        live_file_url: liveFileUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Confetti celebration for completing a submission
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });

      showToast(
        'success',
        'Task Submitted Successfully!',
        'Your mentor has been notified via automated email for evaluation.'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit task. Please verify your inputs.';
      setError(msg);
      showToast('error', 'Submission Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                {task.type} Task Submission
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-[11px] font-mono tabular-nums text-slate-300">
                {task.max_points} max points
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 leading-snug">{task.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* GitHub Repo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              GitHub Repository URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Github className="w-4 h-4" />
              </div>
              <input
                type="url"
                required
                value={githubRepoUrl}
                onChange={(e) => setGithubRepoUrl(e.target.value)}
                placeholder="https://github.com/your-username/hackkro-task"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Make sure the repository is public so your mentors can inspect the code commits.
            </p>
          </div>

          {/* Live / Deployment Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Completed Project / File Link (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ExternalLink className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={liveFileUrl}
                onChange={(e) => setLiveFileUrl(e.target.value)}
                placeholder="https://my-app.vercel.app or Google Drive / Figma preview"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Submission Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Implementation Notes & Reflections (Optional)
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 text-slate-400 pointer-events-none">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly explain the architecture decisions, challenges encountered, or instructions for the reviewer..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Automated Email Notice */}
          <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-lg text-[11px] text-blue-900 leading-relaxed">
            <strong>Automated Notification:</strong> Submitting this task will automatically send a real-time notification email to the HackKro evaluation committee via the Resend API.
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm Submission</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
