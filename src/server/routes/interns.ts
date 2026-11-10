import { Router, Response } from 'express';
import { getDb } from '../db/index.ts';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

export const internsRouter = Router();

// GET /api/interns (Admin: list all interns with metrics)
internsRouter.get('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const db = await getDb();

    let sql = "SELECT id, name, email, status, track, phone, github_profile, avatar_url, created_at FROM users WHERE role = 'intern'";
    const params: any[] = [];

    if (status && ['active', 'inactive'].includes(status as string)) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR track ILIKE $${params.length})`;
    }

    sql += " ORDER BY name ASC";

    const usersRes = await db.query(sql, params);
    const interns = usersRes.rows;

    const pointsRes = await db.query(
      "SELECT intern_id, SUM(points) as total FROM points_history GROUP BY intern_id"
    );
    const pointsMap = new Map<number, number>();
    pointsRes.rows.forEach((r) => pointsMap.set(r.intern_id, parseInt(r.total, 10)));

    const assignRes = await db.query(
      "SELECT intern_id, COUNT(*) as assigned FROM task_assignments GROUP BY intern_id"
    );
    const assignMap = new Map<number, number>();
    assignRes.rows.forEach((r) => assignMap.set(r.intern_id, parseInt(r.assigned, 10)));

    const subRes = await db.query(
      `SELECT ta.intern_id, 
              COUNT(*) as submitted,
              SUM(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END) as approved,
              SUM(CASE WHEN s.status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM submissions s
       JOIN task_assignments ta ON s.task_assignment_id = ta.id
       GROUP BY ta.intern_id`
    );
    const subMap = new Map<number, { submitted: number; approved: number; rejected: number }>();
    subRes.rows.forEach((r) =>
      subMap.set(r.intern_id, {
        submitted: parseInt(r.submitted, 10),
        approved: parseInt(r.approved, 10),
        rejected: parseInt(r.rejected, 10),
      })
    );

    const result = interns.map((intern) => {
      const totalPoints = pointsMap.get(intern.id) || 0;
      const assignedCount = assignMap.get(intern.id) || 0;
      const subInfo = subMap.get(intern.id) || { submitted: 0, approved: 0, rejected: 0 };

      return {
        ...intern,
        total_points: totalPoints,
        assigned_count: assignedCount,
        submitted_count: subInfo.submitted,
        approved_count: subInfo.approved,
        rejected_count: subInfo.rejected,
      };
    }).sort((a, b) => b.total_points - a.total_points || a.name.localeCompare(b.name));

    return res.json(result);
  } catch (error: any) {
    console.error('[Interns GET Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch interns list.' });
  }
});

// PUT /api/interns/:id/status (Admin: activate / deactivate)
internsRouter.put('/:id/status', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "active" or "inactive".' });
    }

    const db = await getDb();
    const result = await db.query(
      `UPDATE users
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = 'intern'
       RETURNING id, name, email, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Intern not found.' });
    }

    return res.json({
      message: `Intern status updated to ${status}.`,
      intern: result.rows[0],
    });
  } catch (error: any) {
    console.error('[Interns Status PUT Error]:', error);
    return res.status(500).json({ error: 'Failed to update intern status.' });
  }
});

// GET /api/interns/:id/performance (Admin: full individual intern performance)
internsRouter.get('/:id/performance', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    // User info
    const userRes = await db.query("SELECT id, name, email, status, track, phone, github_profile, avatar_url, created_at FROM users WHERE id = $1 AND role = 'intern'", [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Intern not found.' });
    }

    // Points total
    const pointsRes = await db.query('SELECT COALESCE(SUM(points), 0) as total FROM points_history WHERE intern_id = $1', [id]);
    const totalPoints = parseInt(pointsRes.rows[0]?.total || '0', 10);

    // All assignments and submissions
    const taskRes = await db.query(
      `SELECT 
        ta.id as assignment_id,
        ta.status as assignment_status,
        ta.assigned_at,
        t.title as task_title,
        t.type as task_type,
        t.max_points,
        t.deadline,
        s.github_repo_url,
        s.live_file_url,
        s.notes as submission_notes,
        s.status as submission_status,
        s.submitted_at,
        e.status as evaluation_status,
        e.points_awarded,
        e.feedback as evaluation_feedback,
        e.evaluated_at
       FROM task_assignments ta
       JOIN tasks t ON ta.task_id = t.id
       LEFT JOIN submissions s ON s.task_assignment_id = ta.id
       LEFT JOIN evaluations e ON e.submission_id = s.id
       WHERE ta.intern_id = $1
       ORDER BY ta.assigned_at DESC`,
      [id]
    );

    return res.json({
      intern: userRes.rows[0],
      total_points: totalPoints,
      tasks: taskRes.rows,
    });
  } catch (error: any) {
    console.error('[Interns Performance GET Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch intern performance.' });
  }
});
