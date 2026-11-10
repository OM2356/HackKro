import { Router, Response } from 'express';
import { getDb } from '../db/index.ts';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';
import { sendTaskAssignmentEmail } from '../services/email.ts';

export const tasksRouter = Router();

// GET /api/tasks
tasksRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, category, search } = req.query;
    const db = await getDb();

    let sql = `
      SELECT t.*, 
             u.name as creator_name,
             (SELECT COUNT(*) FROM task_assignments ta WHERE ta.task_id = t.id) as total_assigned,
             (SELECT COUNT(*) FROM task_assignments ta WHERE ta.task_id = t.id AND ta.status = 'evaluated') as total_completed
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type && (type === 'daily' || type === 'weekly')) {
      params.push(type);
      sql += ` AND t.type = $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND t.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }

    sql += ` ORDER BY t.created_at DESC`;

    const result = await db.query(sql, params);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('[Tasks GET Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// GET /api/tasks/:id
tasksRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await db.query(
      `SELECT t.*, u.name as creator_name
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Tasks GET By ID Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch task details.' });
  }
});

// POST /api/tasks (Admin only)
tasksRouter.post('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, type, category = 'General', max_points = 100, deadline, intern_ids } = req.body;

    if (!title || !description || !type || !deadline) {
      return res.status(400).json({ error: 'Title, description, type (daily/weekly), and deadline are required.' });
    }

    if (!['daily', 'weekly'].includes(type)) {
      return res.status(400).json({ error: 'Task type must be "daily" or "weekly".' });
    }

    const db = await getDb();
    const taskRes = await db.query(
      `INSERT INTO tasks (title, description, type, category, max_points, deadline, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title.trim(), description.trim(), type, category, parseInt(max_points, 10) || 100, deadline, req.user!.id]
    );

    const createdTask = taskRes.rows[0];

    // Assign to selected interns or all active interns if requested
    let targetInterns: Array<{ id: number; name: string; email: string }> = [];

    if (intern_ids === 'all') {
      const allInterns = await db.query("SELECT id, name, email FROM users WHERE role = 'intern' AND status = 'active'");
      targetInterns = allInterns.rows;
    } else if (Array.isArray(intern_ids) && intern_ids.length > 0) {
      const placeholders = intern_ids.map((_, i) => `$${i + 1}`).join(', ');
      const selectedInterns = await db.query(
        `SELECT id, name, email FROM users WHERE id IN (${placeholders}) AND role = 'intern'`,
        intern_ids
      );
      targetInterns = selectedInterns.rows;
    }

    // Process assignments & trigger automated emails
    const assignmentResults = [];
    for (const intern of targetInterns) {
      try {
        await db.query(
          `INSERT INTO task_assignments (task_id, intern_id, assigned_by, status)
           VALUES ($1, $2, $3, 'pending')
           ON CONFLICT DO NOTHING`,
          [createdTask.id, intern.id, req.user!.id]
        );

        // Automated Task Assignment Email trigger via Resend
        sendTaskAssignmentEmail({
          internEmail: intern.email,
          internName: intern.name,
          taskTitle: createdTask.title,
          taskDescription: createdTask.description,
          taskType: createdTask.type,
          deadline: createdTask.deadline,
          maxPoints: createdTask.max_points,
        }).catch((err) => console.error('[Background Email Error]:', err));

        assignmentResults.push({ intern_id: intern.id, email: intern.email, status: 'assigned' });
      } catch (err) {
        console.error(`[Assignment Error for intern ${intern.id}]:`, err);
      }
    }

    return res.status(201).json({
      message: 'Task created successfully',
      task: createdTask,
      assignments: assignmentResults,
    });
  } catch (error: any) {
    console.error('[Tasks POST Error]:', error);
    return res.status(500).json({ error: 'Failed to create task.' });
  }
});

// PUT /api/tasks/:id (Admin only)
tasksRouter.put('/:id', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type, category, max_points, deadline } = req.body;
    const db = await getDb();

    const result = await db.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           type = COALESCE($3, type),
           category = COALESCE($4, category),
           max_points = COALESCE($5, max_points),
           deadline = COALESCE($6, deadline),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [title, description, type, category, max_points ? parseInt(max_points, 10) : undefined, deadline, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.json({
      message: 'Task updated successfully',
      task: result.rows[0],
    });
  } catch (error: any) {
    console.error('[Tasks PUT Error]:', error);
    return res.status(500).json({ error: 'Failed to update task.' });
  }
});

// DELETE /api/tasks/:id (Admin only)
tasksRouter.delete('/:id', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.json({ message: 'Task deleted successfully', id: result.rows[0].id });
  } catch (error: any) {
    console.error('[Tasks DELETE Error]:', error);
    return res.status(500).json({ error: 'Failed to delete task.' });
  }
});
