import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CalendarRange,
  Award,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  GitBranch,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Bar Contract (3 zones) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          {/* Zone 1: Single text wordmark */}
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              HK
            </div>
            <span>HackKro Portal</span>
          </Link>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Curriculum & Tasks
            </a>
            <a href="#evaluation" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Points & Rubric
            </a>
            <a href="#notifications" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Automated Emails
            </a>
            <a href="#architecture" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Full-Stack Architecture
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              Sign In to Portal &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Software Developer Intern Practical Coding Assessment</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight text-balance">
            The Production Portal for Intern Task Assignment, Evaluation & Points
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            A comprehensive full-stack management platform engineered with React, Express, PostgreSQL, JWT role-based access control, and real-time automated Resend email notifications.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span>Access Portal Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all"
            >
              Register New Account
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> PostgreSQL Relational DB
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resend API Notifications
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dual-Role JWT Guards
            </span>
          </div>
        </div>

        {/* Live System Preview Card */}
        <div className="mt-14 max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-400 ml-2">hackkro-portal://v2.4/system-overview</span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">PostgreSQL · JWT · Resend</div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Daily Coding Tasks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Focused technical drills with 24–48h deadlines. Interns implement specific REST endpoints, database queries, and unit tests.
              </p>
              <div className="text-[11px] font-semibold text-blue-600 pt-1">50 Max Points · Auto Reminders</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CalendarRange className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Capstones</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                In-depth milestone projects spanning containerization, CI/CD pipelines, architectural design, and live cloud deployment.
              </p>
              <div className="text-[11px] font-semibold text-emerald-600 pt-1">200 Max Points · Peer & Mentor Review</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Live Gamified Points</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Points are credited to intern accounts immediately upon mentor approval. Real-time leaderboard drives healthy competition.
              </p>
              <div className="text-[11px] font-semibold text-amber-600 pt-1">Automated Points Ledger</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section id="features" className="py-16 bg-white border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Engineered for Real Internship Workflows
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every feature satisfies the HackKro Software Developer Intern Practical Coding Assessment specifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <GitBranch className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">GitHub Link Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interns submit valid GitHub repo links along with live preview URLs and technical notes for seamless code reviews.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Resend Automated Emails</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant transactional emails on Task Assignment, Intern Submission, and Mentor Evaluation with custom HTML templates.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Role-Based Security</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict separation between Intern and Employee/Admin accounts. Protected routes prevent unauthorized access.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Audit & Points History</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every score change is immutably logged in the points history table with mentor remarks and evaluation timestamps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              HK
            </div>
            <span className="font-bold text-white text-sm">HackKro Task Management Portal</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            <span className="text-slate-600">·</span>
            <span>PostgreSQL · Express · React · Resend</span>
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            &copy; 2026 HackKro. Production Ready.
          </div>
        </div>
      </footer>
    </div>
  );
};
