import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../auth';

export const categoryRouter = Router();

// Keep this for publicRoutes import
export function formatCategoryRow(row: any) {
  return row;
}

categoryRouter.get('/', async (req: Request, res: Response) => {
  res.json([]);
});

categoryRouter.get('/:slug', async (req: Request, res: Response) => {
  res.status(404).json({ error: 'Not implemented (SQL removed)' });
});

categoryRouter.post('/', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

categoryRouter.put('/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});

categoryRouter.delete('/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (SQL removed)' });
});
