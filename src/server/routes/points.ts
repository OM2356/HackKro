import { Router, Response } from 'express';
import { getDb } from '../db/index.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

export const pointsRouter = Router();

// GET /api/points/leaderboard
pointsRouter.get('/leaderboard', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const internsRes = await db.query(
      "SELECT id, name, email, avatar_url, track, status FROM users WHERE role = 'intern' ORDER BY name ASC"
    );
    const interns = internsRes.rows;

    const pointsRes = await db.query(
      "SELECT intern_id, SUM(points) as total FROM points_history GROUP BY intern_id"
    );
    const pointsMap = new Map<number, number>();
    pointsRes.rows.forEach((r) => pointsMap.set(r.intern_id, parseInt(r.total, 10)));

    const assignRes = await db.query(
      "SELECT intern_id, COUNT(*) as assigned, SUM(CASE WHEN status = 'evaluated' THEN 1 ELSE 0 END) as completed FROM task_assignments GROUP BY intern_id"
    );
    const assignMap = new Map<number, { assigned: number; completed: number }>();
    assignRes.rows.forEach((r) =>
      assignMap.set(r.intern_id, {
        assigned: parseInt(r.assigned, 10),
        completed: parseInt(r.completed, 10),
      })
    );

    const subRes = await db.query(
      "SELECT ta.intern_id, COUNT(*) as approved FROM submissions s JOIN task_assignments ta ON s.task_assignment_id = ta.id WHERE s.status = 'approved' GROUP BY ta.intern_id"
    );
    const subMap = new Map<number, number>();
    subRes.rows.forEach((r) => subMap.set(r.intern_id, parseInt(r.approved, 10)));

    const leaderboard = interns
      .map((intern) => {
        const totalPoints = pointsMap.get(intern.id) || 0;
        const assignmentInfo = assignMap.get(intern.id) || { assigned: 0, completed: 0 };
        const approvedCount = subMap.get(intern.id) || 0;

        return {
          ...intern,
          total_points: totalPoints,
          total_assigned: assignmentInfo.assigned,
          total_completed: assignmentInfo.completed,
          approved_count: approvedCount,
        };
      })
      .sort((a, b) => b.total_points - a.total_points || b.total_completed - a.total_completed)
      .map((intern, index) => ({
        ...intern,
        rank: index + 1,
      }));

    return res.json(leaderboard);
  } catch (error: any) {
    console.error('[Points Leaderboard Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch points leaderboard.' });
  }
});

// GET /api/points/my (Intern: own points & breakdown)
pointsRouter.get('/my', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const internId = req.user!.id;

    // Get total
    const totalRes = await db.query(
      'SELECT COALESCE(SUM(points), 0) as total FROM points_history WHERE intern_id = $1',
      [internId]
    );
    const totalPoints = parseInt(totalRes.rows[0]?.total || '0', 10);

    // Get log entries
    const historyRes = await db.query(
      `SELECT ph.*, t.title as task_title, t.type as task_type, t.category as task_category, e.feedback
       FROM points_history ph
       LEFT JOIN tasks t ON ph.task_id = t.id
       LEFT JOIN evaluations e ON ph.evaluation_id = e.id
       WHERE ph.intern_id = $1
       ORDER BY ph.awarded_at DESC`,
      [internId]
    );

    return res.json({
      total_points: totalPoints,
      history: historyRes.rows,
    });
  } catch (error: any) {
    console.error('[Points My Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch your points history.' });
  }
});

// GET /api/points/intern/:id (Admin: specific intern points)
pointsRouter.get('/intern/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const totalRes = await db.query('SELECT COALESCE(SUM(points), 0) as total FROM points_history WHERE intern_id = $1', [
      id,
    ]);
    const totalPoints = parseInt(totalRes.rows[0]?.total || '0', 10);

    const historyRes = await db.query(
      `SELECT ph.*, t.title as task_title, t.type as task_type, e.feedback
       FROM points_history ph
       LEFT JOIN tasks t ON ph.task_id = t.id
       LEFT JOIN evaluations e ON ph.evaluation_id = e.id
       WHERE ph.intern_id = $1
       ORDER BY ph.awarded_at DESC`,
      [id]
    );

    return res.json({
      intern_id: parseInt(id, 10),
      total_points: totalPoints,
      history: historyRes.rows,
    });
  } catch (error: any) {
    console.error('[Points Intern ID Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch intern points.' });
  }
});
