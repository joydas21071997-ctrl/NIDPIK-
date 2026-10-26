import { Router, Request, Response } from 'express';
import { authenticate } from '../auth';

export const aiRouter = Router();

aiRouter.post('/generate-content', authenticate, async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
