import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { Mail, Send, CheckCircle2, AlertCircle, Clock, Loader2, Sparkles, Key } from 'lucide-react';

export const EmailLogsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [logs, setLogs] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/email/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('[Email Logs] Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      showToast('error', 'Email Required', 'Please enter a recipient email address.');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await apiClient.post('/email/test', { recipient: testEmail.trim() });
      showToast('success', 'Email Dispatched', res.data.message);
      fetchLogs();
    } catch (err: any) {
      showToast('error', 'Test Failed', err.response?.data?.error || 'Failed to dispatch test email.');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <AppLayout
      title="Automated Resend Email Notifications & Audit Trail"
      subtitle="Complete delivery log of transactional emails triggered on task assignment, intern submission, and mentor grading."
    >
      <div className="space-y-8">
        {/* API Configuration & Live Test Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Instructions Box */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Key className="w-4 h-4 text-blue-600" />
              <span>Resend API Integration Architecture</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              The HackKro portal integrates the official <strong>Resend Node.js SDK</strong> on the backend. When a mentor assigns a task or approves/rejects a submission, or when an intern submits work, transactional emails are automatically sent without exposing API credentials to the browser.
            </p>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-slate-800">Automated Notification Triggers:</div>
              <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                <li>
                  <strong className="text-slate-900">Task Assignment:</strong> Dispatched to intern with title, description, max score, and submission link.
                </li>
                <li>
                  <strong className="text-slate-900">Task Submission:</strong> Dispatched to employee/admin with GitHub repo link and intern notes.
                </li>
                <li>
                  <strong className="text-slate-900">Task Evaluation:</strong> Dispatched to intern with approval verdict, points awarded, and feedback.
                </li>
              </ul>
            </div>
          </div>

          {/* Test Email Dispatcher */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm border border-slate-700 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Resend Dispatch Tester</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">Send Verification Email</h3>
              <p className="text-xs text-slate-300 mt-1">
                Enter your real email address to trigger a test delivery through the Resend API pipeline.
              </p>
            </div>

            <form onSubmit={handleSendTest} className="space-y-3">
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={isSendingTest}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Test Email</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Email Transaction Ledger ({logs.length})</h3>
            <button
              onClick={fetchLogs}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Refresh Logs
            </button>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              No email transactions recorded yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 font-mono">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-700">
                          <span className="bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                            {log.event_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                          {log.subject}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{log.recipient}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              log.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700'
                                : log.status.includes('simulated')
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {log.status === 'delivered'
                              ? 'Delivered'
                              : log.status.includes('simulated')
                              ? 'Logged (Simulated)'
                              : 'Failed'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
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
    </AppLayout>
  );
};
