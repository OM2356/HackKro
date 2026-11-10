import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/index.ts';
import { requireAuth, generateToken, AuthenticatedRequest } from '../middleware/auth.ts';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'intern', track = 'Full-Stack Development', phone, github_profile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (!['intern', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "intern" or "admin".' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const db = await getDb();
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, status, track, phone, github_profile)
       VALUES ($1, $2, $3, $4, 'active', $5, $6, $7)
       RETURNING id, name, email, role, status, track, phone, github_profile, avatar_url, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, role, track, phone || null, github_profile || null]
    );

    const newUser = result.rows[0];
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser,
    });
  } catch (error: any) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({ error: 'Registration failed. Please check server logs.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = await getDb();
    const result = await db.query(
      'SELECT id, name, email, password_hash, role, status, track, phone, github_profile, avatar_url FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact your administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const { password_hash, ...safeUser } = user;

    return res.json({
      message: 'Logged in successfully',
      token,
      user: safeUser,
    });
  } catch (error: any) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({ error: 'Login failed. Please check server logs.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query(
      'SELECT id, name, email, role, status, track, phone, github_profile, avatar_url, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = result.rows[0];

    // If intern, fetch their current total points
    let points = 0;
    if (user.role === 'intern') {
      const pointsRes = await db.query(
        'SELECT COALESCE(SUM(points), 0) as total FROM points_history WHERE intern_id = $1',
        [user.id]
      );
      points = parseInt(pointsRes.rows[0]?.total || '0', 10);
    }

    return res.json({
      ...user,
      total_points: points,
    });
  } catch (error: any) {
    console.error('[Auth Me Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch current user profile.' });
  }
});

// PUT /api/auth/profile
authRouter.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone, github_profile, track, avatar_url, new_password, current_password } = req.body;
    const db = await getDb();

    // If updating password, verify current password
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      const userRow = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
      const isMatch = await bcrypt.compare(current_password, userRow.rows[0].password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password does not match.' });
      }

      const newHash = await bcrypt.hash(new_password, 10);
      await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.id]);
    }

    // Update profile fields
    const updateResult = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           github_profile = COALESCE($3, github_profile),
           track = COALESCE($4, track),
           avatar_url = COALESCE($5, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, name, email, role, status, track, phone, github_profile, avatar_url, updated_at`,
      [name, phone, github_profile, track, avatar_url, req.user!.id]
    );

    return res.json({
      message: 'Profile updated successfully',
      user: updateResult.rows[0],
    });
  } catch (error: any) {
    console.error('[Auth Profile Update Error]:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});
