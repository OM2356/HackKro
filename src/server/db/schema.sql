-- ============================================================================
-- HackKro – Intern Task Management Portal
-- PostgreSQL Relational Database Schema
-- ============================================================================

-- Drop tables if needed for fresh install (ordered to satisfy foreign key constraints)
-- DROP TABLE IF EXISTS email_logs CASCADE;
-- DROP TABLE IF EXISTS points_history CASCADE;
-- DROP TABLE IF EXISTS evaluations CASCADE;
-- DROP TABLE IF EXISTS submissions CASCADE;
-- DROP TABLE IF EXISTS task_assignments CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('intern', 'admin')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    track VARCHAR(100) DEFAULT 'Full-Stack Development',
    phone VARCHAR(50),
    github_profile TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast authentication lookups and role filtering
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('daily', 'weekly')),
    category VARCHAR(100) NOT NULL DEFAULT 'Web Development',
    max_points INTEGER NOT NULL DEFAULT 100 CHECK (max_points > 0),
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);

-- 3. TASK ASSIGNMENTS TABLE (Relates tasks to specific interns)
CREATE TABLE IF NOT EXISTS task_assignments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    intern_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'evaluated')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_task_intern UNIQUE (task_id, intern_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_intern ON task_assignments(intern_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON task_assignments(status);

-- 4. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    task_assignment_id INTEGER NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
    github_repo_url TEXT NOT NULL,
    live_file_url TEXT,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(task_assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- 5. EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    evaluated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('approved', 'rejected')),
    points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
    feedback TEXT NOT NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evaluations_submission ON evaluations(submission_id);

-- 6. POINTS HISTORY TABLE
CREATE TABLE IF NOT EXISTS points_history (
    id SERIAL PRIMARY KEY,
    intern_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_points_intern ON points_history(intern_id);

-- 7. EMAIL AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    resend_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_event ON email_logs(event_type);
