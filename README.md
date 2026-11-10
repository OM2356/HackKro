# HackKro – Intern Task Management Portal

A full-stack, enterprise-grade task management web application engineered for the **HackKro Software Developer Intern Practical Coding Assessment**.

The portal provides an end-to-end curriculum workflow: administrators assign daily technical drills and weekly milestone projects to software interns, interns submit valid GitHub repositories and live deployments, mentors evaluate submissions with rubric scores and actionable feedback, points are automatically credited to an immutable audit ledger, and real transactional emails are triggered via the **Resend API**.

---

## 🌟 Key Features

### 1. Authentication & Security
- **Role-Based Access Control (RBAC):** Strict separation between `intern` and `admin` (Employee/Mentor) accounts.
- **JWT Authentication:** Tokens signed with secret key, 7-day expiration, Bearer token parsing in Express middleware.
- **Password Security:** Salted password hashing with `bcryptjs` (salt rounds: 10).
- **Protected Routing:** Client-side route guards redirect unauthorized users to their designated dashboard.
- **Quick Demo Switcher:** One-click pre-filled login credentials for evaluator convenience.

### 2. Intern Dashboard & Workflow
- **Personalized Workspace:** Name greeting, engineering track, and active status badge.
- **Daily Tasks Drill:** Filterable list of short-turnaround coding assignments with countdown timers and status indicators.
- **Weekly Milestones:** In-depth capstone projects with full requirements, points rubrics, and deliverable tracking.
- **Task Submission Modal:** Requires valid public GitHub repository URLs, optional live demo/deployment URLs, and technical reflection notes.
- **Points Ledger & Gamification:** Real-time points breakdown, achievement badges ("First Flight", "Century Club", "Top Tier"), and full evaluation feedback history.
- **Leaderboard:** Live ranking among cohort interns based on total points and completed tasks.

### 3. Employee / Admin Dashboard & Workflow
- **Executive KPIs:** Total registered interns, total assigned tasks, pending review queue, approved solutions, and rejected solutions.
- **Curriculum & Task Assignment:** Create daily drills or weekly capstones, set deadlines and maximum points, and assign to specific interns or the entire cohort simultaneously.
- **Code Submission Review Queue:** Inspect submitted GitHub repositories, preview live URLs, review intern notes.
- **Grading & Evaluation:** Decision toggle (Approve or Reject), adjustable points award, and required mentor feedback comments.
- **Intern Management Roster:** Search intern directory, view active/inactive status, toggle cohort activation, and inspect individual intern task history.
- **Automated Communication Audit:** Real-time inspection of Resend email delivery statuses with a built-in test dispatcher.

### 4. Automated Transactional Emails (Resend API)
- **Task Assignment:** Automatically emailed to the assigned intern with task title, description, deadline, and direct dashboard link.
- **Task Submission:** Automatically emailed to the admin/employee when an intern submits a solution.
- **Task Evaluation:** Automatically emailed to the intern with approval verdict, points awarded, and mentor feedback.
- **Audit Logging:** Every email attempt (whether live via Resend or simulated in local testing) is permanently logged in the PostgreSQL `email_logs` table.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Axios, Lucide React, Canvas Confetti |
| **Backend** | Node.js, Express.js, TypeScript, tsx, JWT (`jsonwebtoken`), bcryptjs, CORS |
| **Database** | PostgreSQL (Relational tables, foreign keys `ON DELETE CASCADE`, indexes), embedded `pg-mem` fallback |
| **Email Service** | Resend API (`resend` SDK) with responsive HTML email templates |

---

## 📁 Project Structure

```
├── .env.example                     # Environment variables template
├── index.html                       # HTML entry point with Plus Jakarta Sans & JetBrains Mono
├── package.json                     # Scripts and dependencies
├── server.ts                        # Full-stack Node.js + Express backend entry point
├── vite.config.ts                   # Vite configuration
├── tests/
│   └── e2e-api-test.ts              # Automated end-to-end API test suite (14 requirements)
└── src/
    ├── api/
    │   └── client.ts                # Axios instance with Bearer token interceptor
    ├── context/
    │   ├── AuthContext.tsx          # JWT authentication and user session state
    │   └── NotificationContext.tsx  # Toast notification system
    ├── components/
    │   ├── common/
    │   │   └── ProtectedRoute.tsx   # Role-based route protector
    │   ├── layout/
    │   │   └── AppLayout.tsx        # Responsive desktop sidebar, mobile drawer, and top bar
    │   ├── tasks/
    │   │   └── TaskSubmissionModal.tsx # Intern code submission modal
    │   └── submissions/
    │       └── SubmissionReviewModal.tsx # Admin grading and evaluation modal
    ├── pages/
    │   ├── LandingPage.tsx          # Public marketing & curriculum overview
    │   ├── ProfilePage.tsx          # User profile view and edit
    │   ├── auth/
    │   │   ├── LoginPage.tsx        # Sign-in with one-click demo credentials
    │   │   └── RegisterPage.tsx     # Account registration for Intern or Admin
    │   ├── intern/
    │   │   ├── InternDashboard.tsx  # Intern primary workspace
    │   │   ├── DailyTasksPage.tsx   # Daily assigned coding tasks
    │   │   ├── WeeklyTasksPage.tsx  # Weekly milestone capstones
    │   │   ├── PointsPerformancePage.tsx # Points history & badges
    │   │   └── MySubmissionsPage.tsx# Submission archive & verdicts
    │   └── admin/
    │       ├── AdminDashboard.tsx   # Executive analytics and pending reviews
    │       ├── TaskAssignmentPage.tsx # Create & assign curriculum tasks
    │       ├── SubmissionReviewPage.tsx # Review queue and grading
    │       ├── InternManagementPage.tsx # Intern directory and status toggle
    │       ├── AdminLeaderboardPage.tsx # Cohort ranking
    │       └── EmailLogsPage.tsx    # Resend email audit trail & tester
    └── server/
        ├── db/
        │   ├── index.ts             # Database pool connection & auto-seeder
        │   └── schema.sql           # Complete PostgreSQL DDL migrations script
        ├── middleware/
        │   └── auth.ts              # JWT token verification & role authorization
        ├── services/
        │   └── email.ts             # Resend API integration & HTML email templates
        └── routes/
            ├── auth.ts              # /api/auth routes
            ├── tasks.ts             # /api/tasks routes
            ├── assignments.ts       # /api/assignments routes
            ├── submissions.ts       # /api/submissions routes
            ├── evaluations.ts       # /api/evaluations routes
            ├── points.ts            # /api/points routes
            ├── interns.ts           # /api/interns routes
            ├── stats.ts             # /api/stats routes
            └── emailLogs.ts         # /api/email routes
```

---

## 🔑 Pre-Configured Demo Accounts

For fast evaluation and grading, the database comes pre-seeded with these credentials:

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin / Employee** | Vikram Malhotra | `admin@hackkro.com` | `Admin@123456` |
| **Software Intern** | Rahul Sharma | `rahul.sharma@example.com` | `Intern@123456` |
| **Software Intern** | Priya Patel | `priya.patel@example.com` | `Intern@123456` |
| **Software Intern** | Ananya Verma | `ananya.verma@example.com` | `Intern@123456` |

*Tip: On the `/login` screen, click the "Demo Intern" or "Demo Admin" button to populate credentials in one click.*

---

## 🚀 Installation & Local Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### 1. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd hackkro-portal
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` to configure your values:
```env
PORT=3000
APP_URL="http://localhost:3000"
JWT_SECRET="hackkro_super_secret_jwt_key_production_2026"

# Resend API Key (Optional for live delivery; if omitted, deliveries are safely logged to database)
RESEND_API_KEY="re_123456789"
RESEND_FROM_EMAIL="HackKro Portal <onboarding@resend.dev>"
ADMIN_NOTIFICATION_EMAIL="admin@hackkro.com"

# External PostgreSQL Database (Optional)
# If omitted, the application automatically boots the embedded in-memory PostgreSQL engine
# DATABASE_URL="postgresql://postgres:password@localhost:5432/hackkro_db"
```

### 3. Start Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:3000` with the Express API and Vite middlewares.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🗄️ Database Architecture & PostgreSQL Schema

The schema is located at `src/server/db/schema.sql`.

### Relational Tables:
1. `users`: Stores intern and admin user profiles, hashed passwords, roles (`intern` / `admin`), and statuses (`active` / `inactive`).
2. `tasks`: Curriculum task templates with title, description, type (`daily` / `weekly`), category, max points, and deadline.
3. `task_assignments`: Junction table assigning tasks to specific interns (`status`: `pending`, `submitted`, `evaluated`).
4. `submissions`: Intern code submissions with `github_repo_url`, `live_file_url`, and reflection notes.
5. `evaluations`: Mentor verdicts (`approved` / `rejected`), points awarded, and feedback remarks.
6. `points_history`: Immutable ledger crediting points to interns upon approved evaluations.
7. `email_logs`: Transaction audit table tracking recipient, subject, Resend ID, status, and error messages.

### Deploying to External PostgreSQL:
If you have an external PostgreSQL instance (e.g. Supabase, Neon, AWS RDS, or local Postgres), simply provide `DATABASE_URL` in your environment:
```bash
psql $DATABASE_URL -f src/server/db/schema.sql
```

---

## 📧 Resend Email Configuration

1. Register for a free account at [resend.com](https://resend.com).
2. Generate an API Key under **API Keys**.
3. Add `RESEND_API_KEY="re_..."` to `.env`.
4. While developing on the free tier, Resend allows sending to your registered account email using `onboarding@resend.dev` as the sender.
5. In the portal, navigate to **Admin Console > Email Audit Logs** to send a live test email directly to your inbox to confirm real-time delivery.

---

## 🧪 Testing

The repository includes a comprehensive automated test script that executes 14 end-to-end integration tests covering all assignment requirements.

Run the test suite:
```bash
npx tsx tests/e2e-api-test.ts
```

### Verified Test Matrix:
- `1. System Health Check` — **PASS**
- `2. New Intern Registration & JWT Issue` — **PASS**
- `3. Intern Login & Role Verification` — **PASS**
- `4. Admin Login Verification` — **PASS**
- `5. Security Role Guard (403 Forbidden)` — **PASS**
- `6. Admin Task Creation & Assignment` — **PASS**
- `7. Intern Assigned Tasks Retrieval` — **PASS**
- `8. Intern Task Submission with GitHub URL` — **PASS**
- `9. Admin Pending Submissions Queue Inspection` — **PASS**
- `10. Admin Task Evaluation & Grading` — **PASS**
- `11. Automatic Points Calculation & History Record` — **PASS**
- `12. Live Points Leaderboard Ranking` — **PASS**
- `13. Resend Automated Email Triggers & Audit Logs` — **PASS**
- `14. Executive Dashboard Statistics` — **PASS**

---

## 📦 Packaging & GitHub Submission Instructions

### Push to GitHub:
```bash
# 1. Initialize git (if not already done)
git init
git add .
git commit -m "feat: complete HackKro Full-Stack Intern Task Management Portal"

# 2. Add remote repository and push
git remote add origin https://github.com/<your-username>/hackkro-portal.git
git branch -M main
git push -u origin main
```

### Create a ZIP Archive:
```bash
# Exclude node_modules and build artifacts
zip -r hackkro-portal-submission.zip . -x "node_modules/*" "dist/*" ".git/*"
```
