import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, verifyPassword, hashPassword } from './db';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR';
  status: 'active' | 'disabled';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function createSession(userId: string): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString('hex');
  // 7 days expiration
  const expiresDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiresAt = expiresDate.toISOString();
  const sessionId = 'sess_' + crypto.randomUUID();

  const insertSession = db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertSession.run(sessionId, userId, token, expiresAt, new Date().toISOString());

  return { token, expiresAt };
}

export function deleteSession(token: string) {
  const delStmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  delStmt.run(token);
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check Authorization Bearer or Cookie
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized. Authentication token is missing.' });
    return;
  }

  const sessionRow = db.prepare(`
    SELECT s.user_id, s.expires_at, u.id, u.email, u.name, u.role, u.status
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token) as any;

  if (!sessionRow) {
    res.status(401).json({ error: 'Unauthorized. Invalid or expired session token.' });
    return;
  }

  // Check expiration
  if (new Date(sessionRow.expires_at) < new Date()) {
    deleteSession(token);
    res.status(401).json({ error: 'Unauthorized. Session expired. Please log in again.' });
    return;
  }

  if (sessionRow.status === 'disabled') {
    res.status(403).json({ error: 'Account disabled. Please contact the administrator.' });
    return;
  }

  req.user = {
    id: sessionRow.id,
    email: sessionRow.email,
    name: sessionRow.name,
    role: sessionRow.role,
    status: sessionRow.status
  };

  next();
}

export function requireRole(allowedRoles: Array<'OWNER' | 'ADMIN' | 'EDITOR'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' lacks permission for this operation.`
      });
      return;
    }

    next();
  };
}

export function logAudit(
  userId: string,
  userEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, any> = {}
) {
  try {
    const id = 'audit_' + crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, userEmail, action, entityType, entityId, JSON.stringify(details), new Date().toISOString());
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
  }
}
