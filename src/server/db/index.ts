import { Pool } from 'pg';
import { newDb } from 'pg-mem';
import bcrypt from 'bcryptjs';

export interface DbClient {
  query: (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
}

let dbInstance: DbClient | null = null;
let isInitialized = false;

export async function getDb(): Promise<DbClient> {
  if (dbInstance && isInitialized) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const pgHost = process.env.PGHOST;

  if (databaseUrl || pgHost) {
    console.log('[DB] Connecting to external PostgreSQL database...');
    const pool = new Pool(
      databaseUrl
        ? { connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }
        : {
            host: process.env.PGHOST || 'localhost',
            port: parseInt(process.env.PGPORT || '5432', 10),
            user: process.env.PGUSER || 'postgres',
            password: process.env.PGPASSWORD || 'postgres',
            database: process.env.PGDATABASE || 'hackkro_db',
          }
    );

    dbInstance = {
      query: async (text: string, params?: any[]) => {
        const res = await pool.query(text, params);
        return { rows: res.rows, rowCount: res.rowCount ?? 0 };
      },
    };
  } else {
    console.log('[DB] Initializing embedded in-memory PostgreSQL engine (pg-mem)...');
    const memDb = newDb();
    
    // Register custom Postgres functions or extensions if needed
    const pgAdapter = memDb.adapters.createPg();
    const memPool = new pgAdapter.Pool();

    dbInstance = {
      query: async (text: string, params?: any[]) => {
        const res = await memPool.query(text, params);
        return { rows: res.rows, rowCount: res.rowCount ?? 0 };
      },
    };
  }

  await initializeSchemaAndSeeds(dbInstance);
  isInitialized = true;
  return dbInstance;
}

async function initializeSchemaAndSeeds(db: DbClient) {
  try {
    // 1. Create Users
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        track VARCHAR(100) DEFAULT 'Full-Stack Development',
        phone VARCHAR(50),
        github_profile TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Tasks
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'Web Development',
        max_points INTEGER NOT NULL DEFAULT 100,
        deadline TIMESTAMP WITH TIME ZONE NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create Task Assignments
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        intern_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create Submissions
    await db.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        task_assignment_id INTEGER NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
        github_repo_url TEXT NOT NULL,
        live_file_url TEXT,
        notes TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'submitted',
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Create Evaluations
    await db.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        evaluated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL,
        points_awarded INTEGER NOT NULL DEFAULT 0,
        feedback TEXT NOT NULL,
        evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Create Points History
    await db.query(`
      CREATE TABLE IF NOT EXISTS points_history (
        id SERIAL PRIMARY KEY,
        intern_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE CASCADE,
        points INTEGER NOT NULL,
        reason TEXT NOT NULL,
        awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Create Email Logs
    await db.query(`
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
    `);

    // Check if users exist
    const { rows: existingUsers } = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(existingUsers[0]?.count || '0', 10);

    if (userCount === 0) {
      console.log('[DB] Seeding initial users, tasks, and demo records...');
      const adminHash = await bcrypt.hash('Admin@123456', 10);
      const internHash = await bcrypt.hash('Intern@123456', 10);

      // Seed Admin
      const adminResult = await db.query(
        `INSERT INTO users (name, email, password_hash, role, status, track, phone, github_profile, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          'Vikram Malhotra',
          'admin@hackkro.com',
          adminHash,
          'admin',
          'active',
          'Lead Mentor & Engineering Manager',
          '+91 98765 43210',
          'https://github.com/hackkro-admin',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        ]
      );
      const adminId = adminResult.rows[0].id;

      // Seed Interns
      const intern1Result = await db.query(
        `INSERT INTO users (name, email, password_hash, role, status, track, phone, github_profile, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          'Rahul Sharma',
          'rahul.sharma@example.com',
          internHash,
          'intern',
          'active',
          'Full-Stack Web Development',
          '+91 98111 22334',
          'https://github.com/rahul-sharma-dev',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
        ]
      );
      const intern1Id = intern1Result.rows[0].id;

      const intern2Result = await db.query(
        `INSERT INTO users (name, email, password_hash, role, status, track, phone, github_profile, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          'Priya Patel',
          'priya.patel@example.com',
          internHash,
          'intern',
          'active',
          'Frontend React & UI/UX Engineering',
          '+91 98222 33445',
          'https://github.com/priya-patel-ui',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
        ]
      );
      const intern2Id = intern2Result.rows[0].id;

      const intern3Result = await db.query(
        `INSERT INTO users (name, email, password_hash, role, status, track, phone, github_profile, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          'Ananya Verma',
          'ananya.verma@example.com',
          internHash,
          'intern',
          'active',
          'Backend Node.js & Cloud Architecture',
          '+91 98333 44556',
          'https://github.com/ananya-verma-sys',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
        ]
      );
      const intern3Id = intern3Result.rows[0].id;

      // Seed Tasks
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      // Task 1: Daily
      const task1 = await db.query(
        `INSERT INTO tasks (title, description, type, category, max_points, deadline, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          'Implement JWT Authentication Middleware & Role Guard',
          'Build Express.js JWT authentication middleware to verify Bearer tokens. Include role-based access control protecting /api/admin routes from unauthorized access. Hash passwords using bcryptjs with a salt round of 10.',
          'daily',
          'Backend Architecture',
          50,
          tomorrow,
          adminId,
        ]
      );
      const task1Id = task1.rows[0].id;

      // Task 2: Daily
      const task2 = await db.query(
        `INSERT INTO tasks (title, description, type, category, max_points, deadline, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          'Design Relational PostgreSQL Schema with Cascading Foreign Keys',
          'Create tables for users, tasks, task_assignments, submissions, evaluations, and points_history. Establish foreign keys with ON DELETE CASCADE and proper indexing for optimal query execution.',
          'daily',
          'Database Design',
          50,
          in2Days,
          adminId,
        ]
      );
      const task2Id = task2.rows[0].id;

      // Task 3: Daily
      const task3 = await db.query(
        `INSERT INTO tasks (title, description, type, category, max_points, deadline, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          'Integrate Resend API for Automated Email Notifications',
          'Set up transactional email triggers for task assignment, intern task submissions, and evaluation reviews using the Resend Node.js SDK. Include HTML templates and delivery error handling.',
          'daily',
          'API Integration',
          60,
          in3Days,
          adminId,
        ]
      );
      const task3Id = task3.rows[0].id;

      // Task 4: Weekly
      const task4 = await db.query(
        `INSERT INTO tasks (title, description, type, category, max_points, deadline, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          'Milestone 1: Complete HackKro Task Management Web Application',
          'Deliver the complete Full-Stack portal with React frontend, Express backend, PostgreSQL database, role-based dashboards, submission forms, and points calculation. Deploy to live staging environment.',
          'weekly',
          'Full-Stack Capstone',
          200,
          in7Days,
          adminId,
        ]
      );
      const task4Id = task4.rows[0].id;

      // Task 5: Weekly
      const task5 = await db.query(
        `INSERT INTO tasks (title, description, type, category, max_points, deadline, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          'Milestone 2: Containerization, Testing & Automated CI/CD Pipeline',
          'Create a production Dockerfile and Docker Compose configuration. Write unit and integration tests covering auth and task endpoints. Configure GitHub Actions workflow for linting and test runs.',
          'weekly',
          'DevOps & Testing',
          150,
          in14Days,
          adminId,
        ]
      );
      const task5Id = task5.rows[0].id;

      // Assign tasks to Intern 1 (Rahul)
      const assign1 = await db.query(
        `INSERT INTO task_assignments (task_id, intern_id, assigned_by, status)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [task1Id, intern1Id, adminId, 'evaluated']
      );
      const assign2 = await db.query(
        `INSERT INTO task_assignments (task_id, intern_id, assigned_by, status)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [task2Id, intern1Id, adminId, 'submitted']
      );
      const assign3 = await db.query(
        `INSERT INTO task_assignments (task_id, intern_id, assigned_by, status)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [task3Id, intern1Id, adminId, 'pending']
      );
      const assign4 = await db.query(
        `INSERT INTO task_assignments (task_id, intern_id, assigned_by, status)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [task4Id, intern1Id, adminId, 'pending']
      );

      // Assign to Intern 2 (Priya)
      await db.query(
        `INSERT INTO task_assignments (task_id, intern_id, assigned_by, status)
         VALUES ($1, $2, $3, $4)`,
        [task1Id, intern2Id, adminId, 'evaluated']
      );
      await db.query(
        `INSERT INTO task_assignments (task_id, intern_id, assigned_by, status)
         VALUES ($1, $2, $3, $4)`,
        [task2Id, intern2Id, adminId, 'pending']
      );

      // Assign to Intern 3 (Ananya)
      await db.query(
        `INSERT INTO task_assignments (task_id, intern_id, assigned_by, status)
         VALUES ($1, $2, $3, $4)`,
        [task1Id, intern3Id, adminId, 'pending']
      );
      await db.query(
        `INSERT INTO task_assignments (task_id, intern_id, assigned_by, status)
         VALUES ($1, $2, $3, $4)`,
        [task4Id, intern3Id, adminId, 'pending']
      );

      // Submission 1: Evaluated (Rahul Sharma Task 1)
      const sub1 = await db.query(
        `INSERT INTO submissions (task_assignment_id, github_repo_url, live_file_url, notes, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          assign1.rows[0].id,
          'https://github.com/rahul-sharma-dev/hackkro-auth-jwt',
          'https://hackkro-preview-dev.run.app',
          'Implemented Bearer token parsing, 24h JWT expiration, and robust error responses with proper HTTP 401/403 status codes.',
          'approved',
        ]
      );
      const sub1Id = sub1.rows[0].id;

      // Evaluation for Submission 1
      const eval1 = await db.query(
        `INSERT INTO evaluations (submission_id, evaluated_by, status, points_awarded, feedback)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          sub1Id,
          adminId,
          'approved',
          50,
          'Outstanding implementation! Clear separation of concerns in the auth middleware and clean error handling for token expiration.',
        ]
      );
      const eval1Id = eval1.rows[0].id;

      // Points History for Rahul
      await db.query(
        `INSERT INTO points_history (intern_id, task_id, evaluation_id, points, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          intern1Id,
          task1Id,
          eval1Id,
          50,
          'Approved: Implement JWT Authentication Middleware & Role Guard',
        ]
      );

      // Submission 2: Pending Review (Rahul Sharma Task 2)
      await db.query(
        `INSERT INTO submissions (task_assignment_id, github_repo_url, live_file_url, notes, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          assign2.rows[0].id,
          'https://github.com/rahul-sharma-dev/hackkro-postgres-schema',
          'https://dbdiagram.io/d/hackkro-schema-view',
          'PostgreSQL schema designed with DDL scripts, foreign keys ON DELETE CASCADE, and b-tree indexes on foreign keys.',
          'submitted',
        ]
      );

      // Initial sample email log
      await db.query(
        `INSERT INTO email_logs (recipient, subject, event_type, status, resend_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          'rahul.sharma@example.com',
          'New Task Assigned: Implement JWT Authentication Middleware & Role Guard',
          'TASK_ASSIGNED',
          'delivered',
          'resend_mock_init_001',
        ]
      );

      console.log('[DB] Seeding completed successfully.');
    }
  } catch (error) {
    console.error('[DB] Schema/Seed initialization error:', error);
    throw error;
  }
}
