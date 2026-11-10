import { Router, Response } from 'express';
import { getDb } from '../db/index.ts';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';
import { sendTaskAssignmentEmail } from '../services/email.ts';

export const assignmentsRouter = Router();

// GET /api/assignments/my (Interns: fetch their own assigned tasks)
assignmentsRouter.get('/my', requireAuth, requireRole('intern'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, status } = req.query;
    const internId = req.user!.id;
    const db = await getDb();

    let sql = `
      SELECT 
        ta.id as assignment_id,
        ta.status as assignment_status,
        ta.assigned_at,
        t.id as task_id,
        t.title,
        t.description,
        t.type,
        t.category,
        t.max_points,
        t.deadline,
        s.id as submission_id,
        s.github_repo_url,
        s.live_file_url,
        s.notes as submission_notes,
        s.status as submission_status,
        s.submitted_at,
        e.id as evaluation_id,
        e.status as evaluation_status,
        e.points_awarded,
        e.feedback as evaluation_feedback,
        e.evaluated_at
      FROM task_assignments ta
      JOIN tasks t ON ta.task_id = t.id
      LEFT JOIN submissions s ON s.task_assignment_id = ta.id
      LEFT JOIN evaluations e ON e.submission_id = s.id
      WHERE ta.intern_id = $1
    `;
    const params: any[] = [internId];

    if (type && (type === 'daily' || type === 'weekly')) {
      params.push(type);
      sql += ` AND t.type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND ta.status = $${params.length}`;
    }

    sql += ` ORDER BY t.deadline ASC, ta.assigned_at DESC`;

    const result = await db.query(sql, params);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('[Assignments GET My Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch your assigned tasks.' });
  }
});

// POST /api/assignments (Admin: assign task to intern(s))
assignmentsRouter.post('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { task_id, intern_id, intern_ids } = req.body;

    if (!task_id) {
      return res.status(400).json({ error: 'Task ID is required.' });
    }

    const db = await getDb();

    // Verify task exists
    const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [task_id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    const task = taskResult.rows[0];

    // Determine target intern list
    let targets: Array<{ id: number; name: string; email: string }> = [];

    if (intern_ids === 'all') {
      const allRes = await db.query("SELECT id, name, email FROM users WHERE role = 'intern' AND status = 'active'");
      targets = allRes.rows;
    } else if (Array.isArray(intern_ids) && intern_ids.length > 0) {
      const placeholders = intern_ids.map((_, i) => `$${i + 1}`).join(', ');
      const selectRes = await db.query(
        `SELECT id, name, email FROM users WHERE id IN (${placeholders}) AND role = 'intern'`,
        intern_ids
      );
      targets = selectRes.rows;
    } else if (intern_id) {
      const singleRes = await db.query("SELECT id, name, email FROM users WHERE id = $1 AND role = 'intern'", [
        intern_id,
      ]);
      targets = singleRes.rows;
    } else {
      return res.status(400).json({ error: 'Please specify an intern_id or intern_ids to assign.' });
    }

    if (targets.length === 0) {
      return res.status(404).json({ error: 'No matching active interns found.' });
    }

    const assigned = [];
    for (const intern of targets) {
      try {
        const assignRes = await db.query(
          `INSERT INTO task_assignments (task_id, intern_id, assigned_by, status)
           VALUES ($1, $2, $3, 'pending')
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [task.id, intern.id, req.user!.id]
        );

        // Send automated email via Resend
        sendTaskAssignmentEmail({
          internEmail: intern.email,
          internName: intern.name,
          taskTitle: task.title,
          taskDescription: task.description,
          taskType: task.type,
          deadline: task.deadline,
          maxPoints: task.max_points,
        }).catch((err) => console.error('[Background Email Error]:', err));

        assigned.push({
          intern_id: intern.id,
          name: intern.name,
          email: intern.email,
          assignment_id: assignRes.rows[0]?.id || null,
        });
      } catch (err) {
        console.error(`[Assign error for ${intern.id}]:`, err);
      }
    }

    return res.status(201).json({
      message: `Task successfully assigned to ${assigned.length} intern(s)`,
      task_id: task.id,
      assigned,
    });
  } catch (error: any) {
    console.error('[Assignments POST Error]:', error);
    return res.status(500).json({ error: 'Failed to assign task.' });
  }
});

// DELETE /api/assignments/:id (Admin: unassign)
assignmentsRouter.delete('/:id', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await db.query('DELETE FROM task_assignments WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    return res.json({ message: 'Assignment removed successfully' });
  } catch (error: any) {
    console.error('[Assignments DELETE Error]:', error);
    return res.status(500).json({ error: 'Failed to remove assignment.' });
  }
});
