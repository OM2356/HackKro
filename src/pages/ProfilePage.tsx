import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { apiClient } from '../api/client.ts';
import { AppLayout } from '../components/layout/AppLayout.tsx';
import { User, Mail, Shield, Phone, Github, Lock, Award, Loader2, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [track, setTrack] = useState(user?.track || 'Full-Stack Development');
  const [phone, setPhone] = useState(user?.phone || '');
  const [githubProfile, setGithubProfile] = useState(user?.github_profile || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: any = {
        name: name.trim(),
        track,
        phone: phone.trim() || undefined,
        github_profile: githubProfile.trim() || undefined,
      };

      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      await apiClient.put('/auth/profile', payload);
      await refreshProfile();
      setCurrentPassword('');
      setNewPassword('');
      showToast('success', 'Profile Updated', 'Your profile details have been saved successfully.');
    } catch (err: any) {
      showToast('error', 'Update Failed', err.response?.data?.error || 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout
      title="User Account Profile"
      subtitle="Manage your personal details, engineering track specialization, and security credentials."
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="capitalize font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {user?.role}
                </span>
                <span>·</span>
                <span>{user?.email}</span>
              </div>
            </div>
          </div>

          {user?.role === 'intern' && user?.total_points !== undefined && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl sm:text-right shrink-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Accumulated Score
              </div>
              <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 mt-0.5">
                {user.total_points} <span className="text-xs font-sans font-medium text-slate-500">pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Edit Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 mb-6 pb-3 border-b border-slate-100">
            Edit Profile Information
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Read Only)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Engineering Track</label>
                <input
                  type="text"
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Profile URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Github className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={githubProfile}
                    onChange={(e) => setGithubProfile(e.target.value)}
                    placeholder="https://github.com/your-username"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Change Password Block */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Change Account Password (Optional)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};
