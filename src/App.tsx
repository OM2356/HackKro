import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.tsx';

// Public Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';

// Intern Pages
import { InternDashboard } from './pages/intern/InternDashboard.tsx';
import { DailyTasksPage } from './pages/intern/DailyTasksPage.tsx';
import { WeeklyTasksPage } from './pages/intern/WeeklyTasksPage.tsx';
import { PointsPerformancePage } from './pages/intern/PointsPerformancePage.tsx';
import { MySubmissionsPage } from './pages/intern/MySubmissionsPage.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { TaskAssignmentPage } from './pages/admin/TaskAssignmentPage.tsx';
import { SubmissionReviewPage } from './pages/admin/SubmissionReviewPage.tsx';
import { InternManagementPage } from './pages/admin/InternManagementPage.tsx';
import { AdminLeaderboardPage } from './pages/admin/AdminLeaderboardPage.tsx';
import { EmailLogsPage } from './pages/admin/EmailLogsPage.tsx';

// Shared Pages
import { ProfilePage } from './pages/ProfilePage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Intern Routes */}
            <Route
              path="/intern/dashboard"
              element={
                <ProtectedRoute allowedRoles={['intern']}>
                  <InternDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/intern/daily-tasks"
              element={
                <ProtectedRoute allowedRoles={['intern']}>
                  <DailyTasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/intern/weekly-tasks"
              element={
                <ProtectedRoute allowedRoles={['intern']}>
                  <WeeklyTasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/intern/points"
              element={
                <ProtectedRoute allowedRoles={['intern']}>
                  <PointsPerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/intern/submissions"
              element={
                <ProtectedRoute allowedRoles={['intern']}>
                  <MySubmissionsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tasks"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TaskAssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/submissions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SubmissionReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/interns"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <InternManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leaderboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLeaderboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/email-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EmailLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Shared Authenticated Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['intern', 'admin']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Convenient Aliases */}
            <Route path="/daily-tasks" element={<Navigate to="/intern/daily-tasks" replace />} />
            <Route path="/weekly-tasks" element={<Navigate to="/intern/weekly-tasks" replace />} />
            <Route path="/points" element={<Navigate to="/intern/points" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
