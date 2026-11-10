import { Resend } from 'resend';
import { getDb } from '../db/index.ts';

// Get API key from environment variable
const getApiKey = () => process.env.RESEND_API_KEY || '';
const getFromEmail = () => process.env.RESEND_FROM_EMAIL || 'HackKro Portal <onboarding@resend.dev>';
const getAppUrl = () => process.env.APP_URL || 'http://localhost:3000';
const getAdminEmail = () => process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@hackkro.com';

export interface EmailDispatchResult {
  success: boolean;
  recipient: string;
  subject: string;
  eventType: string;
  resendId?: string;
  mode: 'real_resend' | 'logged_fallback';
  error?: string;
}

/**
 * Validate email address format
 */
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Log email delivery attempt to PostgreSQL database
 */
async function recordEmailLog(
  recipient: string,
  subject: string,
  eventType: string,
  status: string,
  resendId?: string,
  errorMessage?: string
) {
  try {
    const db = await getDb();
    await db.query(
      `INSERT INTO email_logs (recipient, subject, event_type, status, resend_id, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [recipient, subject, eventType, status, resendId || null, errorMessage || null]
    );
  } catch (err) {
    console.error('[EmailService] Failed to record email log into database:', err);
  }
}

/**
 * Helper to dispatch an email via Resend if key exists, or record clear fallback
 */
async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  eventType: 'TASK_ASSIGNED' | 'TASK_SUBMITTED' | 'TASK_EVALUATED' | 'TEST_EMAIL';
}): Promise<EmailDispatchResult> {
  const { to, subject, html, text, eventType } = params;

  if (!isValidEmail(to)) {
    const err = `Invalid recipient email address: ${to}`;
    console.warn(`[EmailService] ${err}`);
    await recordEmailLog(to, subject, eventType, 'failed_invalid_email', undefined, err);
    return { success: false, recipient: to, subject, eventType, mode: 'logged_fallback', error: err };
  }

  const apiKey = getApiKey();

  if (!apiKey || apiKey.trim() === '') {
    const notice = `RESEND_API_KEY not configured. Simulated delivery logged for audit.`;
    console.log(`[EmailService] [SIMULATED ${eventType}] to: ${to} | subject: "${subject}"`);
    await recordEmailLog(to, subject, eventType, 'simulated_no_api_key', 'simulated_' + Date.now(), notice);
    return {
      success: true,
      recipient: to,
      subject,
      eventType,
      resendId: 'simulated_' + Date.now(),
      mode: 'logged_fallback',
      error: notice,
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[EmailService] Resend API error:', error);
      await recordEmailLog(to, subject, eventType, 'failed', undefined, error.message);
      return {
        success: false,
        recipient: to,
        subject,
        eventType,
        mode: 'real_resend',
        error: error.message,
      };
    }

    const resendId = data?.id || 'resend_ok';
    console.log(`[EmailService] Resend successfully sent email [${resendId}] to ${to}`);
    await recordEmailLog(to, subject, eventType, 'delivered', resendId);
    return {
      success: true,
      recipient: to,
      subject,
      eventType,
      resendId,
      mode: 'real_resend',
    };
  } catch (err: any) {
    const message = err?.message || 'Unknown network/API error';
    console.error('[EmailService] Exception during email delivery:', err);
    await recordEmailLog(to, subject, eventType, 'error', undefined, message);
    return {
      success: false,
      recipient: to,
      subject,
      eventType,
      mode: 'real_resend',
      error: message,
    };
  }
}

// ============================================================================
// 1. Task Assignment Email (to Intern)
// ============================================================================
export async function sendTaskAssignmentEmail(params: {
  internEmail: string;
  internName: string;
  taskTitle: string;
  taskDescription: string;
  taskType: 'daily' | 'weekly';
  deadline: string;
  maxPoints: number;
}): Promise<EmailDispatchResult> {
  const { internEmail, internName, taskTitle, taskDescription, taskType, deadline, maxPoints } = params;
  const formattedDate = new Date(deadline).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const dashboardUrl = `${getAppUrl()}/${taskType === 'daily' ? 'daily-tasks' : 'weekly-tasks'}`;

  const subject = `[HackKro] New ${taskType.toUpperCase()} Task Assigned: ${taskTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0f172a; color: #ffffff; padding: 24px 32px; }
        .badge { display: inline-block; padding: 4px 10px; background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 6px; letter-spacing: 0.5px; }
        .content { padding: 32px; }
        .h1 { font-size: 20px; font-weight: 700; margin: 12px 0 8px; color: #0f172a; }
        .p { font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }
        .card { background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .meta-item { margin-bottom: 8px; font-size: 13px; color: #334155; }
        .meta-label { font-weight: 600; color: #0f172a; }
        .btn { display: inline-block; background: #0f172a; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
        .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">HackKro Portal</span>
          <div style="font-size: 18px; font-weight: 700; margin-top: 6px;">New Task Assignment</div>
        </div>
        <div class="content">
          <p class="p">Hello <strong>${internName}</strong>,</p>
          <p class="p">You have been assigned a new <strong>${taskType}</strong> task by your HackKro mentor. Review the requirements and submit your solution before the specified deadline.</p>
          
          <div class="card">
            <div class="h1">${taskTitle}</div>
            <div class="meta-item"><span class="meta-label">Task Type:</span> ${taskType.toUpperCase()}</div>
            <div class="meta-item"><span class="meta-label">Max Points:</span> ${maxPoints} pts</div>
            <div class="meta-item"><span class="meta-label">Deadline:</span> <strong style="color: #dc2626;">${formattedDate}</strong></div>
            <div style="margin-top: 12px; font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${taskDescription}</div>
          </div>

          <a href="${dashboardUrl}" class="btn">View & Submit on Dashboard &rarr;</a>
        </div>
        <div class="footer">
          &copy; 2026 HackKro Internship Program. All rights reserved.<br>
          This automated notification was generated by the HackKro Task Management Portal.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    [HackKro] New ${taskType.toUpperCase()} Task Assigned
    Hello ${internName},
    
    You have been assigned a new task: "${taskTitle}"
    Type: ${taskType}
    Max Points: ${maxPoints}
    Deadline: ${formattedDate}

    Description:
    ${taskDescription}

    Access your dashboard to submit: ${dashboardUrl}
  `;

  return dispatchEmail({ to: internEmail, subject, html, text, eventType: 'TASK_ASSIGNED' });
}

// ============================================================================
// 2. Task Submission Email (to Admin/Employee)
// ============================================================================
export async function sendTaskSubmissionEmail(params: {
  adminEmail?: string;
  internName: string;
  internEmail: string;
  taskTitle: string;
  taskType: string;
  githubRepoUrl: string;
  liveFileUrl?: string;
  notes?: string;
}): Promise<EmailDispatchResult> {
  const { adminEmail, internName, internEmail, taskTitle, taskType, githubRepoUrl, liveFileUrl, notes } = params;
  const recipient = adminEmail || getAdminEmail();
  const reviewUrl = `${getAppUrl()}/admin/submissions`;

  const subject = `[HackKro Review] Submission from ${internName}: ${taskTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0f172a; color: #ffffff; padding: 24px 32px; }
        .badge { display: inline-block; padding: 4px 10px; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 6px; letter-spacing: 0.5px; }
        .content { padding: 32px; }
        .h1 { font-size: 20px; font-weight: 700; margin: 12px 0 8px; color: #0f172a; }
        .p { font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .meta-item { margin-bottom: 8px; font-size: 13px; color: #334155; }
        .meta-label { font-weight: 600; color: #0f172a; }
        .link { color: #2563eb; text-decoration: underline; word-break: break-all; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
        .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">Action Required</span>
          <div style="font-size: 18px; font-weight: 700; margin-top: 6px;">New Intern Task Submission</div>
        </div>
        <div class="content">
          <p class="p">An intern has submitted their work for evaluation on the HackKro Portal.</p>
          
          <div class="card">
            <div class="meta-item"><span class="meta-label">Intern:</span> ${internName} (${internEmail})</div>
            <div class="meta-item"><span class="meta-label">Task:</span> <strong>${taskTitle}</strong> (${taskType})</div>
            <div class="meta-item"><span class="meta-label">GitHub Repository:</span> <a href="${githubRepoUrl}" class="link" target="_blank">${githubRepoUrl}</a></div>
            ${liveFileUrl ? `<div class="meta-item"><span class="meta-label">Live / Preview Link:</span> <a href="${liveFileUrl}" class="link" target="_blank">${liveFileUrl}</a></div>` : ''}
            ${notes ? `<div class="meta-item" style="margin-top: 10px;"><span class="meta-label">Intern Notes:</span><br><span style="font-style: italic; color: #475569;">${notes}</span></div>` : ''}
          </div>

          <a href="${reviewUrl}" class="btn">Open Review Portal &rarr;</a>
        </div>
        <div class="footer">
          &copy; 2026 HackKro Internship Program. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    [HackKro Review] New Submission
    Intern: ${internName} (${internEmail})
    Task: ${taskTitle} (${taskType})
    GitHub Repo: ${githubRepoUrl}
    Live Link: ${liveFileUrl || 'None'}
    Notes: ${notes || 'None'}

    Review and evaluate at: ${reviewUrl}
  `;

  return dispatchEmail({ to: recipient, subject, html, text, eventType: 'TASK_SUBMITTED' });
}

// ============================================================================
// 3. Task Evaluation Email (to Intern)
// ============================================================================
export async function sendTaskEvaluationEmail(params: {
  internEmail: string;
  internName: string;
  taskTitle: string;
  status: 'approved' | 'rejected';
  pointsAwarded: number;
  feedback: string;
  mentorName: string;
}): Promise<EmailDispatchResult> {
  const { internEmail, internName, taskTitle, status, pointsAwarded, feedback, mentorName } = params;
  const isApproved = status === 'approved';
  const pointsUrl = `${getAppUrl()}/points`;

  const subject = `[HackKro Result] Task ${isApproved ? 'Approved' : 'Revision Required'}: ${taskTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0f172a; color: #ffffff; padding: 24px 32px; }
        .status-badge { display: inline-block; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #ffffff; background: ${isApproved ? '#16a34a' : '#dc2626'}; }
        .content { padding: 32px; }
        .h1 { font-size: 20px; font-weight: 700; margin: 12px 0 8px; color: #0f172a; }
        .p { font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }
        .score-box { background: ${isApproved ? '#ecfdf5' : '#fef2f2'}; border: 1px solid ${isApproved ? '#a7f3d0' : '#fecaca'}; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .score-num { font-size: 32px; font-weight: 800; color: ${isApproved ? '#047857' : '#b91c1c'}; margin-bottom: 4px; }
        .score-label { font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        .feedback-box { background: #f8fafc; border-radius: 8px; padding: 18px; border: 1px solid #e2e8f0; margin-top: 16px; font-size: 14px; line-height: 1.6; color: #334155; }
        .btn { display: inline-block; background: #0f172a; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
        .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="status-badge">${isApproved ? 'Approved' : 'Revision Required'}</span>
          <div style="font-size: 18px; font-weight: 700; margin-top: 8px;">Evaluation Completed</div>
        </div>
        <div class="content">
          <p class="p">Hello <strong>${internName}</strong>,</p>
          <p class="p">Your submission for <strong>${taskTitle}</strong> has been evaluated by <strong>${mentorName}</strong>.</p>
          
          <div class="score-box">
            <div class="score-num">+${pointsAwarded} PTS</div>
            <div class="score-label">Points Awarded</div>
          </div>

          <div style="font-weight: 600; font-size: 14px; color: #0f172a; margin-top: 20px;">Mentor Feedback:</div>
          <div class="feedback-box">
            ${feedback}
          </div>

          <a href="${pointsUrl}" class="btn">View Points & Performance &rarr;</a>
        </div>
        <div class="footer">
          &copy; 2026 HackKro Internship Program. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    [HackKro Result] Evaluation Completed
    Hello ${internName},
    
    Task: ${taskTitle}
    Status: ${status.toUpperCase()}
    Points Awarded: +${pointsAwarded} pts
    Evaluated by: ${mentorName}

    Feedback:
    ${feedback}

    Check your updated points at: ${pointsUrl}
  `;

  return dispatchEmail({ to: internEmail, subject, html, text, eventType: 'TASK_EVALUATED' });
}

// ============================================================================
// 4. Test Email Dispatcher
// ============================================================================
export async function sendTestEmail(recipient: string): Promise<EmailDispatchResult> {
  const subject = `[HackKro Test] Resend Automated Email Integration Verified`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-top: 0;">Resend Email Integration Live</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">
        This test confirms that your Resend API integration with the HackKro Intern Task Management Portal is functioning properly.
      </p>
      <div style="margin: 16px 0; padding: 12px; background: #f1f5f9; border-radius: 6px; font-size: 13px; color: #334155;">
        <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
        <strong>Status:</strong> Active & Verified
      </div>
    </div>
  `;
  const text = `HackKro Test Email: Resend API connection verified at ${new Date().toISOString()}`;
  return dispatchEmail({ to: recipient, subject, html, text, eventType: 'TEST_EMAIL' });
}
