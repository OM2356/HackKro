import { Router, Response } from 'express';
import { getDb } from '../db/index.ts';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';
import { sendTaskEvaluationEmail } from '../services/email.ts';

export const evaluationsRouter = Router();

// POST /api/evaluations (Admin approves or rejects submission with points and feedback)
evaluationsRouter.post('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submission_id, status, points_awarded = 0, feedback } = req.body;

    if (!submission_id || !status || feedback === undefined) {
      return res.status(400).json({ error: 'Submission ID, status (approved/rejected), and feedback are required.' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "approved" or "rejected".' });
    }

    const pointsNum = Math.max(0, parseInt(points_awarded, 10) || 0);

    const db = await getDb();

    // Fetch submission with task and intern details
    const subRes = await db.query(
      `SELECT s.*, 
              ta.id as assignment_id, 
              ta.intern_id, 
              ta.task_id,
              t.title as task_title, 
              t.max_points,
              u.name as intern_name, 
              u.email as intern_email
       FROM submissions s
       JOIN task_assignments ta ON s.task_assignment_id = ta.id
       JOIN tasks t ON ta.task_id = t.id
       JOIN users u ON ta.intern_id = u.id
       WHERE s.id = $1`,
      [submission_id]
    );

    if (subRes.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const sub = subRes.rows[0];

    // Cap points to max_points
    const finalPoints = status === 'approved' ? Math.min(pointsNum, sub.max_points) : 0;

    // Check if evaluation already exists
    const existingEval = await db.query('SELECT id FROM evaluations WHERE submission_id = $1', [submission_id]);

    let evaluation;
    if (existingEval.rows.length > 0) {
      const updateEval = await db.query(
        `UPDATE evaluations
         SET status = $1,
             points_awarded = $2,
             feedback = $3,
             evaluated_by = $4,
             evaluated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [status, finalPoints, feedback.trim(), req.user!.id, existingEval.rows[0].id]
      );
      evaluation = updateEval.rows[0];

      // Remove existing points history entry if present to avoid duplication
      await db.query('DELETE FROM points_history WHERE evaluation_id = $1', [evaluation.id]);
    } else {
      const insertEval = await db.query(
        `INSERT INTO evaluations (submission_id, evaluated_by, status, points_awarded, feedback)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [submission_id, req.user!.id, status, finalPoints, feedback.trim()]
      );
      evaluation = insertEval.rows[0];
    }

    // Update submission status
    await db.query('UPDATE submissions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      status,
      submission_id,
    ]);

    // Update task assignment status to 'evaluated'
    await db.query("UPDATE task_assignments SET status = 'evaluated' WHERE id = $1", [sub.assignment_id]);

    // Record in points_history if points were awarded
    if (finalPoints > 0 && status === 'approved') {
      await db.query(
        `INSERT INTO points_history (intern_id, task_id, evaluation_id, points, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [sub.intern_id, sub.task_id, evaluation.id, finalPoints, `Evaluation: ${sub.task_title}`]
      );
    }

    // Trigger Automated Email via Resend: Evaluation results sent to Intern
    sendTaskEvaluationEmail({
      internEmail: sub.intern_email,
      internName: sub.intern_name,
      taskTitle: sub.task_title,
      status: status as 'approved' | 'rejected',
      pointsAwarded: finalPoints,
      feedback: feedback.trim(),
      mentorName: req.user!.name,
    }).catch((err) => console.error('[Background Email Error]:', err));

    return res.status(201).json({
      message: `Evaluation submitted. Status: ${status}. Intern notified via automated email.`,
      evaluation,
      points_awarded: finalPoints,
    });
  } catch (error: any) {
    console.error('[Evaluations POST Error]:', error);
    return res.status(500).json({ error: 'Failed to record evaluation.' });
  }
});
