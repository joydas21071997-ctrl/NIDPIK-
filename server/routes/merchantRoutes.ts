import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../auth';

export const merchantRouter = Router();

// Keep this for publicRoutes import
export function formatMerchantRow(row: any) {
  return row;
}

merchantRouter.get('/', async (req: Request, res: Response) => { res.json([]); });
merchantRouter.post('/', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
merchantRouter.put('/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
merchantRouter.delete('/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
