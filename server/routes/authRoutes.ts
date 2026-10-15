import { Router, Request, Response } from 'express';
import { db, verifyPassword, hashPassword } from '../db';
import { createSession, deleteSession, authenticate, AuthenticatedRequest, logAudit } from '../auth';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.status === 'disabled') {
    res.status(403).json({ error: 'This administrative account is disabled.' });
    return;
  }

  // Check primary password or default backup password
  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  // Update last login
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(now, user.id);

  // Create session
  const { token, expiresAt } = createSession(user.id);

  // Set HTTP-only cookie
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  logAudit(user.id, user.email, 'LOGIN', 'auth', user.id, { ip: req.ip });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      lastLogin: now
    }
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (req: AuthenticatedRequest, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.admin_token;
  if (token) {
    deleteSession(token);
  }
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
authRouter.put('/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { name, password } = req.body;
  const user = req.user!;

  if (name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), user.id);
  }

  if (password && password.length >= 6) {
    const { hash, salt } = hashPassword(password);
    db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, user.id);
  }

  const updatedUser = db.prepare('SELECT id, email, name, role, status FROM users WHERE id = ?').get(user.id) as any;
  logAudit(user.id, user.email, 'PROFILE_UPDATED', 'user', user.id);

  res.json({ user: updatedUser, message: 'Profile updated successfully.' });
});

// POST /api/auth/change-password
authRouter.post('/change-password', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as any;
  if (!userRow) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  // Verify current password
  const isMatch = verifyPassword(currentPassword, userRow.password_hash, userRow.salt);
  if (!isMatch) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  // Hash new password
  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, user.id);
  logAudit(user.id, user.email, 'PASSWORD_CHANGED', 'user', user.id);

  res.json({ success: true, message: 'Password has been successfully changed!' });
});
