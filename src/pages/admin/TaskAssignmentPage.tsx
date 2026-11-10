import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import {
  PlusCircle,
  CalendarDays,
  CalendarRange,
  Users,
  Clock,
  Award,
  Trash2,
  Edit,
  Loader2,
  Mail,
  UserPlus,
  X,
  AlertCircle,
} from 'lucide-react';

export const TaskAssignmentPage: React.FC = () => {
  const { showToast } = useNotification();
  const [tasks, setTasks] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'daily' | 'weekly'>('daily');
  const [category, setCategory] = useState('Full-Stack Web');
  const [maxPoints, setMaxPoints] = useState(50);
  const [deadline, setDeadline] = useState('');
  const [assignedTarget, setAssignedTarget] = useState<'all' | 'specific'>('all');
  const [selectedInternId, setSelectedInternId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Assign Existing Task modal
  const [quickAssignTask, setQuickAssignTask] = useState<any | null>(null);
  const [quickAssignInternId, setQuickAssignInternId] = useState<string>('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, internsRes] = await Promise.all([
        apiClient.get('/tasks'),
        apiClient.get('/interns?status=active'),
      ]);
      setTasks(tasksRes.data);
      setInterns(internsRes.data);
      if (internsRes.data.length > 0 && !selectedInternId) {
        setSelectedInternId(internsRes.data[0].id.toString());
      }
    } catch (err) {
      console.error('[Task Assignment] Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Default deadline to tomorrow 23:59
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    setDeadline(tomorrow.toISOString().slice(0, 16));
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !deadline) {
      setError('Title, description, and deadline are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const internIdsParam =
        assignedTarget === 'all'
          ? 'all'
          : selectedInternId
          ? [parseInt(selectedInternId, 10)]
          : [];

      const res = await apiClient.post('/tasks', {
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        max_points: maxPoints,
        deadline,
        intern_ids: internIdsParam,
      });

      showToast(
        'success',
        'Task Created & Assigned!',
        `Assigned to ${res.data.assignments?.length || 0} intern(s). Automated email alerts dispatched via Resend.`
      );

      // Reset form
      setTitle('');
      setDescription('');
      setIsCreating(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create task.';
      setError(msg);
      showToast('error', 'Task Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: number, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${taskTitle}"? All associated assignments will also be removed.`)) {
      return;
    }

    try {
      await apiClient.delete(`/tasks/${id}`);
      showToast('info', 'Task Deleted', `Removed "${taskTitle}"`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.error || 'Could not delete task.');
    }
  };

  const handleQuickAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAssignTask) return;

    try {
      await apiClient.post('/assignments', {
        task_id: quickAssignTask.id,
        intern_id: quickAssignInternId === 'all' ? undefined : parseInt(quickAssignInternId, 10),
        intern_ids: quickAssignInternId === 'all' ? 'all' : undefined,
      });

      showToast(
        'success',
        'Assignment Created',
        `Task "${quickAssignTask.title}" assigned. Intern notified via Resend email.`
      );
      setQuickAssignTask(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Assignment Failed', err.response?.data?.error || 'Could not assign task.');
    }
  };

  return (
    <AppLayout
      title="Task Assignment & Curriculum Management"
      subtitle="Publish daily drills and weekly milestone projects to individual interns or the entire cohort."
      action={
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
        >
          {isCreating ? <X className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
          <span>{isCreating ? 'Close Creator' : 'Create & Assign Task'}</span>
        </button>
      }
    >
      <div className="space-y-8">
        {/* Task Creation Drawer / Card */}
        {isCreating && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-md p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Assignment</h3>
                <p className="text-xs text-slate-500">
                  Fill in the requirements. Assigning will automatically trigger an email notification to the intern.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-5">
              {/* Task Type & Target Intern */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Task Cadence</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setType('daily');
                        if (maxPoints === 200) setMaxPoints(50);
                      }}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        type === 'daily'
                          ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs ring-1 ring-blue-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>Daily Task</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setType('weekly');
                        if (maxPoints === 50) setMaxPoints(200);
                      }}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        type === 'weekly'
                          ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-2xs ring-1 ring-purple-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CalendarRange className="w-4 h-4" />
                      <span>Weekly Capstone</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Assignee(s)</label>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setAssignedTarget('all')}
                      className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${
                        assignedTarget === 'all'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Active Interns ({interns.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignedTarget('specific')}
                      className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${
                        assignedTarget === 'specific'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Specific Intern
                    </button>
                  </div>

                  {assignedTarget === 'specific' && (
                    <select
                      value={selectedInternId}
                      onChange={(e) => setSelectedInternId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                    >
                      {interns.map((intern) => (
                        <option key={intern.id} value={intern.id}>
                          {intern.name} ({intern.email}) · {intern.track}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement PostgreSQL Relational Schema with Foreign Key Constraints"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Description & Requirements <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed instructions, edge cases to handle, architectural rules, and expected submission format..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Category, Points & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Domain</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  >
                    <option value="Web Development">Full-Stack Development</option>
                    <option value="Database Design">Database Architecture & SQL</option>
                    <option value="API Integration">API Integration (Resend/OAuth)</option>
                    <option value="DevOps & Reliability">DevOps, Docker & CI/CD</option>
                    <option value="UI/UX Engineering">Frontend React & UI/UX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Points</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    required
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(parseInt(e.target.value, 10) || 50)}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* Automated Resend Email Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-900">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Automated Resend Trigger:</strong> When you submit this task, the assigned intern(s) will automatically receive an official HackKro task assignment email with deadlines and portal links.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing & Dispatching Emails...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Publish & Send Email Alert</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Tasks Curriculum Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">All Curriculum Tasks ({tasks.length})</h3>
            <span className="text-xs text-slate-500 font-mono">PostgreSQL `tasks` table</span>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              No tasks have been created yet. Click "Create & Assign Task" above to publish your first assignment.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Cadence</th>
                      <th className="py-3 px-4">Title & Category</th>
                      <th className="py-3 px-4">Deadline</th>
                      <th className="py-3 px-4 text-center">Assigned / Done</th>
                      <th className="py-3 px-4 text-center">Max Pts</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold uppercase">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                              task.type === 'weekly'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {task.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{task.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {task.category} · By {task.creator_name || 'Admin'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {new Date(task.deadline).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono tabular-nums">
                          <span className="font-semibold text-slate-900">{task.total_completed}</span>
                          <span className="text-slate-400"> / {task.total_assigned}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                          {task.max_points}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setQuickAssignTask(task);
                                setQuickAssignInternId(interns[0]?.id?.toString() || 'all');
                              }}
                              title="Assign to another intern"
                              className="p-1.5 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              title="Delete task"
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Quick Assign Modal */}
      {quickAssignTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Assign Task to Intern</h3>
              <button
                onClick={() => setQuickAssignTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Assign <strong>"{quickAssignTask.title}"</strong> to an intern. They will be alerted via Resend email.
            </p>

            <form onSubmit={handleQuickAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Intern</label>
                <select
                  value={quickAssignInternId}
                  onChange={(e) => setQuickAssignInternId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="all">Assign to All Active Interns ({interns.length})</option>
                  {interns.map((intern) => (
                    <option key={intern.id} value={intern.id}>
                      {intern.name} ({intern.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickAssignTask(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Assign & Dispatch Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
