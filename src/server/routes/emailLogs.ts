import { Router, Response } from 'express';
import { getDb } from '../db/index.ts';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';
import { sendTestEmail } from '../services/email.ts';

export const emailLogsRouter = Router();

// GET /api/email/logs (Admin or authenticated user: view email audit records)
emailLogsRouter.get('/logs', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { event_type, status } = req.query;
    const db = await getDb();

    let sql = 'SELECT * FROM email_logs WHERE 1=1';
    const params: any[] = [];

    if (event_type) {
      params.push(event_type);
      sql += ` AND event_type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const result = await db.query(sql, params);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('[Email Logs GET Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch email logs.' });
  }
});

// POST /api/email/test (Test sending a real email via Resend)
emailLogsRouter.post('/test', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recipient } = req.body;
    const targetEmail = recipient || req.user!.email;

    const result = await sendTestEmail(targetEmail);
    return res.json({
      message: result.success
        ? `Test email dispatched to ${targetEmail} (Mode: ${result.mode})`
        : `Email dispatch failed: ${result.error}`,
      result,
    });
  } catch (error: any) {
    console.error('[Email Test POST Error]:', error);
    return res.status(500).json({ error: 'Failed to execute test email.' });
  }
});
