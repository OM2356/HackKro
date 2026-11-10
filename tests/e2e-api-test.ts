/**
 * HackKro Portal - End-to-End API and Requirements Test Suite
 */
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Starting HackKro Portal End-to-End Test Suite');
  console.log('========================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failedCount++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await axios.get(`${BASE_URL}/health`);
    assert(healthRes.status === 200 && healthRes.data.status === 'healthy', '1. System Health Check');

    // 2. Register new intern
    const uniqueEmail = `test.intern.${Date.now()}@example.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Kavya Singhania',
      email: uniqueEmail,
      password: 'Password@123',
      role: 'intern',
      track: 'Full-Stack Development',
    });
    assert(regRes.status === 201 && Boolean(regRes.data.token), '2. New Intern Registration & JWT Issue');
    const newInternToken = regRes.data.token;
    const newInternId = regRes.data.user.id;

    // 3. Login with credentials
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: uniqueEmail,
      password: 'Password@123',
    });
    assert(loginRes.status === 200 && loginRes.data.user.role === 'intern', '3. Intern Login & Role Verification');

    // 4. Login as Admin
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@hackkro.com',
      password: 'Admin@123456',
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.user.role === 'admin', '4. Admin Login Verification');
    const adminToken = adminLoginRes.data.token;

    // 5. Test Unauthorized Access (Intern trying to call admin-only task creation)
    try {
      await axios.post(
        `${BASE_URL}/tasks`,
        { title: 'Hacked Task', description: 'Malicious', type: 'daily', deadline: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${newInternToken}` } }
      );
      assert(false, '5. Security Role Guard', 'Intern was allowed to access admin endpoint');
    } catch (err: any) {
      assert(err.response?.status === 403, '5. Security Role Guard (Intern blocked with 403 Forbidden)');
    }

    // 6. Admin creates a new daily task and assigns to the new intern
    const taskCreateRes = await axios.post(
      `${BASE_URL}/tasks`,
      {
        title: 'Build PostgreSQL Index & Query Optimization Script',
        description: 'Write DDL index creation scripts and optimize join queries across users and submissions.',
        type: 'daily',
        category: 'Database Design',
        max_points: 50,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        intern_ids: [newInternId],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(taskCreateRes.status === 201 && Boolean(taskCreateRes.data.task.id), '6. Admin Task Creation & Assignment');
    const createdTaskId = taskCreateRes.data.task.id;

    // 7. Intern fetches their assigned tasks
    const internTasksRes = await axios.get(`${BASE_URL}/assignments/my`, {
      headers: { Authorization: `Bearer ${newInternToken}` },
    });
    const foundAssignment = internTasksRes.data.find((t: any) => t.task_id === createdTaskId);
    assert(Boolean(foundAssignment), '7. Intern Assigned Tasks Retrieval', 'Task not found in intern assignment list');
    const assignmentId = foundAssignment.assignment_id;

    // 8. Intern submits task with GitHub repo URL and live link
    const subRes = await axios.post(
      `${BASE_URL}/submissions`,
      {
        task_assignment_id: assignmentId,
        github_repo_url: 'https://github.com/kavya-singhania/hackkro-postgres-optimization',
        live_file_url: 'https://hackkro-demo.run.app',
        notes: 'Added composite b-tree index on (intern_id, status) and measured query execution time drop.',
      },
      { headers: { Authorization: `Bearer ${newInternToken}` } }
    );
    assert(subRes.status === 201 && subRes.data.submission.status === 'submitted', '8. Intern Task Submission with GitHub URL');
    const submissionId = subRes.data.submission.id;

    // 9. Admin checks submissions queue
    const adminSubsRes = await axios.get(`${BASE_URL}/submissions?status=submitted`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingSub = adminSubsRes.data.find((s: any) => s.submission_id === submissionId);
    assert(Boolean(pendingSub), '9. Admin Pending Submissions Queue Inspection');

    // 10. Admin evaluates submission: Approves, awards 50 points, gives feedback
    const evalRes = await axios.post(
      `${BASE_URL}/evaluations`,
      {
        submission_id: submissionId,
        status: 'approved',
        points_awarded: 50,
        feedback: 'Superb query execution plan analysis and clean repository README documentation.',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(evalRes.status === 201 && evalRes.data.points_awarded === 50, '10. Admin Task Evaluation & Grading');

    // 11. Check Intern Points updated automatically
    const pointsRes = await axios.get(`${BASE_URL}/points/my`, {
      headers: { Authorization: `Bearer ${newInternToken}` },
    });
    assert(pointsRes.data.total_points >= 50, '11. Automatic Points Calculation & History Record');

    // 12. Check Leaderboard includes new intern with updated points
    const lbRes = await axios.get(`${BASE_URL}/points/leaderboard`, {
      headers: { Authorization: `Bearer ${newInternToken}` },
    });
    const lbEntry = lbRes.data.find((intern: any) => intern.id === newInternId);
    assert(Boolean(lbEntry && lbEntry.total_points >= 50), '12. Live Points Leaderboard Ranking');

    // 13. Resend Email Audit Trail Verification
    const emailRes = await axios.get(`${BASE_URL}/email/logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(emailRes.data.length > 0, '13. Resend Automated Email Triggers & Audit Logs');

    // 14. Admin Statistics API
    const statsRes = await axios.get(`${BASE_URL}/stats/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(statsRes.data.total_interns >= 4 && statsRes.data.approved_submissions >= 1, '14. Executive Dashboard Statistics');

    console.log('\n========================================================');
    console.log(`📊 Test Results: ${passedCount} PASSED / ${failedCount} FAILED`);
    console.log('========================================================\n');
  } catch (error: any) {
    console.error('Test Suite encountered an unexpected error:', error.response?.data || error.message);
  }
}

runTests();
