import { Router, Request, Response } from 'express';
import { eq, or } from 'drizzle-orm';
import { db } from '../../src/db/index';
import * as schema from '../../src/db/schema';
import { verifyPassword, hashPassword } from '../crypto';
import { createSession, deleteSession, authenticate, AuthenticatedRequest, logAudit } from '../auth';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanIdentifier = email.toLowerCase().trim();
    const ownerEnvEmail = (process.env.ADMIN_OWNER_EMAIL || 'admin@nidpik.com').trim().toLowerCase();
    const ownerPassword = process.env.ADMIN_OWNER_PASSWORD;

    // Find administrative user by email, or owner aliases ('admin', 'admin@nidpik.com', or ownerEnvEmail)
    let user: any = null;
    if (cleanIdentifier === 'admin' || cleanIdentifier === 'admin@nidpik.com' || cleanIdentifier === ownerEnvEmail) {
      const rows = await db
        .select()
        .from(schema.users)
        .where(
          or(
            eq(schema.users.id, 'user_owner'),
            eq(schema.users.email, ownerEnvEmail),
            eq(schema.users.email, 'admin@nidpik.com')
          )
        )
        .limit(1);
      user = rows[0];
    }
    if (!user) {
      const rows = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, cleanIdentifier))
        .limit(1);
      user = rows[0];
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'disabled') {
      res.status(403).json({ error: 'This administrative account is disabled.' });
      return;
    }

    // Check password hash, or environment owner password override for owner accounts
    const isHashMatch = verifyPassword(password, user.passwordHash, user.salt);
    const isOwnerEnvMatch = (password === ownerPassword) && (user.id === 'user_owner' || user.role === 'OWNER');

    if (!isHashMatch && !isOwnerEnvMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Update last login
    const now = new Date().toISOString();
    await db
      .update(schema.users)
      .set({ lastLogin: now })
      .where(eq(schema.users.id, user.id));

    // Create session
    const { token, expiresAt } = await createSession(user.id);

    // Set HTTP-only cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    await logAudit(user.id, 'admin@nidpik.com', 'LOGIN', 'auth', user.id, { ip: req.ip });

    // Sanitize user email to prevent exposing personal Gmail in client UI/bundles
    const safeDisplayEmail = (user.id === 'user_owner' || user.role === 'OWNER') ? 'admin@nidpik.com' : user.email;

    res.json({
      token,
      user: {
        id: user.id,
        email: safeDisplayEmail,
        name: 'NIDPIK Site Administrator',
        role: user.role,
        status: user.status,
        lastLogin: now
      }
    });
  } catch (err: any) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Internal error during login.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', async (req: AuthenticatedRequest, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.admin_token;
  if (token) {
    await deleteSession(token);
  }
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const safeDisplayEmail = (user.id === 'user_owner' || user.role === 'OWNER') ? 'admin@nidpik.com' : user.email;
  res.json({
    user: {
      ...user,
      email: safeDisplayEmail,
      name: 'NIDPIK Site Administrator'
    }
  });
});

// PUT /api/auth/profile
authRouter.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, password } = req.body;
    const user = req.user!;

    if (name) {
      await db
        .update(schema.users)
        .set({ name: name.trim() })
        .where(eq(schema.users.id, user.id));
    }

    if (password && password.length >= 6) {
      const { hash, salt } = hashPassword(password);
      await db
        .update(schema.users)
        .set({ passwordHash: hash, salt })
        .where(eq(schema.users.id, user.id));
    }

    const rows = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        status: schema.users.status
      })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);

    const updatedUser = rows[0];
    await logAudit(user.id, user.email, 'PROFILE_UPDATED', 'user', user.id);

    res.json({ user: updatedUser, message: 'Profile updated successfully.' });
  } catch (err: any) {
    console.error('[PROFILE UPDATE ERROR]', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/auth/change-password
authRouter.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
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

    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);

    const userRow = rows[0];
    if (!userRow) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Verify current password
    const isMatch = verifyPassword(currentPassword, userRow.passwordHash, userRow.salt);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    // Hash new password
    const { hash, salt } = hashPassword(newPassword);
    await db
      .update(schema.users)
      .set({ passwordHash: hash, salt })
      .where(eq(schema.users.id, user.id));

    await logAudit(user.id, user.email, 'PASSWORD_CHANGED', 'user', user.id);

    res.json({ success: true, message: 'Password has been successfully changed!' });
  } catch (err: any) {
    console.error('[CHANGE PASSWORD ERROR]', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

