import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../auth';

export const authRouter = Router();

// Stubbed routes to allow server start
authRouter.post('/login', async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented (Auth disabled)' });
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  res.json({ success: true });
});

authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

authRouter.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

authRouter.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});
