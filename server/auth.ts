import { Request, Response, NextFunction } from 'express';

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
  return { token: 'mock_token', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
}

export async function deleteSession(token: string): Promise<void> {}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Mock authentication - for now, allow all to let server start
  req.user = { id: 'mock_user', email: 'admin@nidpik.com', name: 'Admin', role: 'OWNER', status: 'active' };
  next();
}

export function requireRole(allowedRoles: Array<'OWNER' | 'ADMIN' | 'EDITOR'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
  console.log('[AUDIT LOG]', action, entityType, entityId);
}
