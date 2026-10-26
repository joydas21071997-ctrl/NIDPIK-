import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../auth';

export const adminRouter = Router();

adminRouter.get('/summary', authenticate, async (req: Request, res: Response) => {
  res.json({ products: { total: 0, published: 0, draft: 0, archived: 0 }, counts: {}, recentProducts: [], recentAudits: [], popularClicked: [] });
});

adminRouter.get('/authors', async (req: Request, res: Response) => {
  res.json([]);
});

adminRouter.post('/authors', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

adminRouter.put('/authors/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

adminRouter.delete('/authors/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

adminRouter.get('/users', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  res.json([]);
});

adminRouter.post('/users', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

adminRouter.put('/users/:id/role', authenticate, requireRole(['OWNER']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

adminRouter.put('/users/:id/status', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

adminRouter.delete('/users/:id', authenticate, requireRole(['OWNER']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

adminRouter.get('/settings', async (req: Request, res: Response) => {
  res.json({});
});

adminRouter.put('/settings/:key', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

adminRouter.post('/upload-logo', authenticate, async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

adminRouter.get('/audit-logs', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  res.json([]);
});

adminRouter.get('/subscribers', authenticate, async (req: Request, res: Response) => {
  res.json({ total: 0, active: 0, subscribers: [] });
});

adminRouter.delete('/subscribers/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});
