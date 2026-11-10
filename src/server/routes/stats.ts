import { Router, Response } from 'express';
import { getDb } from '../db/index.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

export const statsRouter = Router();

// GET /api/stats/admin
statsRouter.get('/admin', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();

    const [internsCount, activeInternsCount, tasksCount, assignmentsCount, pendingSubmissions, approvedSubmissions, rejectedSubmissions, pointsDistributed] =
      await Promise.all([
        db.query("SELECT COUNT(*) as count FROM users WHERE role = 'intern'"),
        db.query("SELECT COUNT(*) as count FROM users WHERE role = 'intern' AND status = 'active'"),
        db.query('SELECT COUNT(*) as count FROM tasks'),
        db.query('SELECT COUNT(*) as count FROM task_assignments'),
        db.query("SELECT COUNT(*) as count FROM submissions WHERE status = 'submitted'"),
        db.query("SELECT COUNT(*) as count FROM submissions WHERE status = 'approved'"),
        db.query("SELECT COUNT(*) as count FROM submissions WHERE status = 'rejected'"),
        db.query('SELECT COALESCE(SUM(points), 0) as total FROM points_history'),
      ]);

    return res.json({
      total_interns: parseInt(internsCount.rows[0]?.count || '0', 10),
      active_interns: parseInt(activeInternsCount.rows[0]?.count || '0', 10),
      total_tasks: parseInt(tasksCount.rows[0]?.count || '0', 10),
      total_assigned: parseInt(assignmentsCount.rows[0]?.count || '0', 10),
      pending_submissions: parseInt(pendingSubmissions.rows[0]?.count || '0', 10),
      approved_submissions: parseInt(approvedSubmissions.rows[0]?.count || '0', 10),
      rejected_submissions: parseInt(rejectedSubmissions.rows[0]?.count || '0', 10),
      points_distributed: parseInt(pointsDistributed.rows[0]?.total || '0', 10),
    });
  } catch (error: any) {
    console.error('[Stats Admin Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
});

// GET /api/stats/intern
statsRouter.get('/intern', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const internId = req.user!.id;

    const [pointsRes, totalAssignedRes, dailyPendingRes, weeklyPendingRes, completedRes, approvedRes, leaderboardRes] =
      await Promise.all([
        db.query('SELECT COALESCE(SUM(points), 0) as total FROM points_history WHERE intern_id = $1', [internId]),
        db.query('SELECT COUNT(*) as count FROM task_assignments WHERE intern_id = $1', [internId]),
        db.query(
          `SELECT COUNT(*) as count FROM task_assignments ta 
           JOIN tasks t ON ta.task_id = t.id 
           WHERE ta.intern_id = $1 AND t.type = 'daily' AND ta.status = 'pending'`,
          [internId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM task_assignments ta 
           JOIN tasks t ON ta.task_id = t.id 
           WHERE ta.intern_id = $1 AND t.type = 'weekly' AND ta.status = 'pending'`,
          [internId]
        ),
        db.query("SELECT COUNT(*) as count FROM task_assignments WHERE intern_id = $1 AND status = 'evaluated'", [
          internId,
        ]),
        db.query(
          `SELECT COUNT(*) as count FROM submissions s 
           JOIN task_assignments ta ON s.task_assignment_id = ta.id 
           WHERE ta.intern_id = $1 AND s.status = 'approved'`,
          [internId]
        ),
        db.query(`
          SELECT u.id, COALESCE(SUM(ph.points), 0) as total 
          FROM users u 
          LEFT JOIN points_history ph ON u.id = ph.intern_id 
          WHERE u.role = 'intern' 
          GROUP BY u.id 
          ORDER BY total DESC
        `),
      ]);

    const totalPoints = parseInt(pointsRes.rows[0]?.total || '0', 10);
    const totalAssigned = parseInt(totalAssignedRes.rows[0]?.count || '0', 10);
    const dailyPending = parseInt(dailyPendingRes.rows[0]?.count || '0', 10);
    const weeklyPending = parseInt(weeklyPendingRes.rows[0]?.count || '0', 10);
    const completed = parseInt(completedRes.rows[0]?.count || '0', 10);
    const approved = parseInt(approvedRes.rows[0]?.count || '0', 10);

    // Calculate rank
    const rankIndex = leaderboardRes.rows.findIndex((r) => r.id === internId);
    const rank = rankIndex !== -1 ? rankIndex + 1 : 1;

    // Approval rate
    const approvalRate = completed > 0 ? Math.round((approved / completed) * 100) : 100;

    return res.json({
      total_points: totalPoints,
      total_assigned: totalAssigned,
      daily_pending: dailyPending,
      weekly_pending: weeklyPending,
      completed_tasks: completed,
      approved_tasks: approved,
      approval_rate: approvalRate,
      rank,
    });
  } catch (error: any) {
    console.error('[Stats Intern Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch intern stats.' });
  }
});
