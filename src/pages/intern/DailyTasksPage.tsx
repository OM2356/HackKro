import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { TaskSubmissionModal } from '../../components/tasks/TaskSubmissionModal.tsx';
import { Search, Clock, Award, CheckCircle2, AlertCircle, Send, Loader2 } from 'lucide-react';

export const DailyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'evaluated'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const fetchDailyTasks = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/assignments/my?type=daily');
      setTasks(res.data);
    } catch (err) {
      console.error('[Daily Tasks] Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.assignment_status === filter;
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase()) ||
      task.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AppLayout
      title="Daily Assigned Tasks"
      subtitle="Complete your daily technical drills on time to maintain high consistency scores."
    >
      <div className="space-y-6">
        {/* Controls: Search & Segmented Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search daily drills by keyword..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto">
            {(['all', 'pending', 'submitted', 'evaluated'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                  filter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Task Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500">Loading daily tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <p className="text-sm font-semibold text-slate-700">No daily tasks match this filter</p>
            <p className="text-xs text-slate-500">
              Try switching your status filter or clearing your search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTasks.map((task) => {
              const isPastDeadline = new Date(task.deadline).getTime() < Date.now();
              const isEvaluated = task.assignment_status === 'evaluated';
              const isSubmitted = task.assignment_status === 'submitted';

              return (
                <div
                  key={task.assignment_id}
                  className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded text-[11px]">
                        {task.category || 'Engineering'}
                      </span>

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
                          ? 'Awaiting Review'
                          : isPastDeadline
                          ? 'Overdue'
                          : 'Pending'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{task.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                  </div>

                  {/* Submission & Feedback Status Callout if already reviewed */}
                  {task.evaluation_feedback && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <div className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Mentor Feedback:</span>
                      </div>
                      <p className="text-xs text-slate-600 italic">"{task.evaluation_feedback}"</p>
                    </div>
                  )}

                  {/* Bottom bar */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-[11px]">
                        Deadline: {new Date(task.deadline).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {task.max_points} max pts
                      </span>

                      <button
                        onClick={() => setSelectedTask(task)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${
                          task.assignment_status === 'pending'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        <span>{task.assignment_status === 'pending' ? 'Submit' : 'Edit Submission'}</span>
                      </button>
                    </div>
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
          onSuccess={fetchDailyTasks}
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
