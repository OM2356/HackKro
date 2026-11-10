import { Router, Response } from 'express';
import { getDb } from '../db/index.ts';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';
import { sendTaskSubmissionEmail } from '../services/email.ts';

export const submissionsRouter = Router();

// POST /api/submissions (Intern submits work)
submissionsRouter.post('/', requireAuth, requireRole('intern'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { task_assignment_id, github_repo_url, live_file_url, notes } = req.body;

    if (!task_assignment_id || !github_repo_url) {
      return res.status(400).json({ error: 'Task assignment ID and GitHub repository URL are required.' });
    }

    if (!github_repo_url.includes('github.com')) {
      return res.status(400).json({ error: 'Please enter a valid GitHub repository URL (must contain github.com).' });
    }

    const db = await getDb();

    // Verify assignment belongs to this intern
    const assignRes = await db.query(
      `SELECT ta.*, t.title as task_title, t.type as task_type, u.name as intern_name, u.email as intern_email
       FROM task_assignments ta
       JOIN tasks t ON ta.task_id = t.id
       JOIN users u ON ta.intern_id = u.id
       WHERE ta.id = $1 AND ta.intern_id = $2`,
      [task_assignment_id, req.user!.id]
    );

    if (assignRes.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or does not belong to you.' });
    }

    const assignment = assignRes.rows[0];

    // Check if submission already exists for this assignment
    const existingSub = await db.query('SELECT id FROM submissions WHERE task_assignment_id = $1', [task_assignment_id]);

    let submission;
    if (existingSub.rows.length > 0) {
      // Update existing submission
      const updateRes = await db.query(
        `UPDATE submissions
         SET github_repo_url = $1,
             live_file_url = $2,
             notes = $3,
             status = 'submitted',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [github_repo_url.trim(), live_file_url?.trim() || null, notes?.trim() || null, existingSub.rows[0].id]
      );
      submission = updateRes.rows[0];
    } else {
      // Insert new submission
      const insertRes = await db.query(
        `INSERT INTO submissions (task_assignment_id, github_repo_url, live_file_url, notes, status)
         VALUES ($1, $2, $3, $4, 'submitted')
         RETURNING *`,
        [task_assignment_id, github_repo_url.trim(), live_file_url?.trim() || null, notes?.trim() || null]
      );
      submission = insertRes.rows[0];
    }

    // Update assignment status to 'submitted'
    await db.query("UPDATE task_assignments SET status = 'submitted' WHERE id = $1", [task_assignment_id]);

    // Automated Email trigger: Send notification to Admin via Resend
    sendTaskSubmissionEmail({
      internName: assignment.intern_name,
      internEmail: assignment.intern_email,
      taskTitle: assignment.task_title,
      taskType: assignment.task_type,
      githubRepoUrl: submission.github_repo_url,
      liveFileUrl: submission.live_file_url,
      notes: submission.notes,
    }).catch((err) => console.error('[Background Email Error]:', err));

    return res.status(201).json({
      message: 'Task submitted successfully! Your mentor has been notified for review.',
      submission,
    });
  } catch (error: any) {
    console.error('[Submissions POST Error]:', error);
    return res.status(500).json({ error: 'Failed to submit task.' });
  }
});

// GET /api/submissions (Admin: review queue with filters)
submissionsRouter.get('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, type, intern_id, search } = req.query;
    const db = await getDb();

    let sql = `
      SELECT 
        s.id as submission_id,
        s.task_assignment_id,
        s.github_repo_url,
        s.live_file_url,
        s.notes,
        s.status as submission_status,
        s.submitted_at,
        s.updated_at as submission_updated_at,
        t.id as task_id,
        t.title as task_title,
        t.type as task_type,
        t.category as task_category,
        t.max_points,
        t.deadline,
        u.id as intern_id,
        u.name as intern_name,
        u.email as intern_email,
        u.avatar_url as intern_avatar,
        u.track as intern_track,
        e.id as evaluation_id,
        e.status as evaluation_status,
        e.points_awarded,
        e.feedback,
        e.evaluated_at,
        eval_user.name as evaluator_name
      FROM submissions s
      JOIN task_assignments ta ON s.task_assignment_id = ta.id
      JOIN tasks t ON ta.task_id = t.id
      JOIN users u ON ta.intern_id = u.id
      LEFT JOIN evaluations e ON e.submission_id = s.id
      LEFT JOIN users eval_user ON e.evaluated_by = eval_user.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && ['submitted', 'approved', 'rejected'].includes(status as string)) {
      params.push(status);
      sql += ` AND s.status = $${params.length}`;
    }

    if (type && ['daily', 'weekly'].includes(type as string)) {
      params.push(type);
      sql += ` AND t.type = $${params.length}`;
    }

    if (intern_id) {
      params.push(intern_id);
      sql += ` AND u.id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (t.title ILIKE $${params.length} OR u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    sql += ` ORDER BY s.submitted_at DESC`;

    const result = await db.query(sql, params);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('[Submissions GET Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
});

// GET /api/submissions/my (Intern: view submission history)
submissionsRouter.get('/my', requireAuth, requireRole('intern'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query(
      `SELECT 
        s.id as submission_id,
        s.github_repo_url,
        s.live_file_url,
        s.notes,
        s.status as submission_status,
        s.submitted_at,
        t.id as task_id,
        t.title as task_title,
        t.type as task_type,
        t.category as task_category,
        t.max_points,
        t.deadline,
        e.id as evaluation_id,
        e.status as evaluation_status,
        e.points_awarded,
        e.feedback,
        e.evaluated_at,
        eval_u.name as evaluator_name
       FROM submissions s
       JOIN task_assignments ta ON s.task_assignment_id = ta.id
       JOIN tasks t ON ta.task_id = t.id
       LEFT JOIN evaluations e ON e.submission_id = s.id
       LEFT JOIN users eval_u ON e.evaluated_by = eval_u.id
       WHERE ta.intern_id = $1
       ORDER BY s.submitted_at DESC`,
      [req.user!.id]
    );

    return res.json(result.rows);
  } catch (error: any) {
    console.error('[Submissions GET My Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch your submission history.' });
  }
});
