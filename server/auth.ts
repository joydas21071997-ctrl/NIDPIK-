import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index';
import * as schema from '../src/db/schema';
import { verifyPassword, hashPassword } from './crypto';

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

export async function createSession(userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomBytes(32).toString('hex');
  // 7 days expiration
  const expiresDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiresAt = expiresDate.toISOString();
  const sessionId = 'sess_' + crypto.randomUUID();

  await db.insert(schema.sessions).values({
    id: sessionId,
    userId,
    token,
    expiresAt,
    createdAt: new Date().toISOString()
  });

  return { token, expiresAt };
}

export async function deleteSession(token: string): Promise<void> {
  try {
    await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
  } catch (err) {
    console.error('[DELETE SESSION ERROR]', err);
  }
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
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

    const rows = await db
      .select({
        userId: schema.sessions.userId,
        expiresAt: schema.sessions.expiresAt,
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        status: schema.users.status
      })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .where(eq(schema.sessions.token, token))
      .limit(1);

    const sessionRow = rows[0];

    if (!sessionRow) {
      res.status(401).json({ error: 'Unauthorized. Invalid or expired session token.' });
      return;
    }

    // Check expiration
    if (new Date(sessionRow.expiresAt) < new Date()) {
      await deleteSession(token);
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
      role: sessionRow.role as any,
      status: sessionRow.status as any
    };

    next();
  } catch (err: any) {
    console.error('[AUTHENTICATE ERROR]', err);
    res.status(500).json({ error: 'Internal authentication error' });
  }
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

export async function logAudit(
  userId: string,
  userEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, any> = {}
) {
  try {
    const id = 'audit_' + crypto.randomUUID();
    await db.insert(schema.auditLogs).values({
      id,
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      detailsJson: JSON.stringify(details),
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
  }
}

