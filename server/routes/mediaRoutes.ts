import { Router, Request, Response } from 'express';
import { authenticate } from '../auth';

export const mediaRouter = Router();

mediaRouter.get('/', authenticate, async (req: Request, res: Response) => { res.json([]); });
mediaRouter.post('/', authenticate, async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
mediaRouter.delete('/:id', authenticate, async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
