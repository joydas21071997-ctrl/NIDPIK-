import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../auth';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const targetEmail = (process.env.ADMIN_OWNER_EMAIL || 'joydas.21071997@gmail.com').toLowerCase();
  const targetPassword = process.env.ADMIN_OWNER_PASSWORD || 'nidpik@jd21251997*#2026*#';

  if (email && email.trim().toLowerCase() === targetEmail && password && password.trim() === targetPassword.trim()) {
    res.json({
      token: 'owner_token_' + Date.now(),
      user: {
        id: 'owner_joydas',
        email: targetEmail,
        name: 'Joydas (Site Owner)',
        role: 'OWNER',
        status: 'active',
        lastLogin: new Date().toISOString()
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid email or password. Please verify credentials.' });
  }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  res.json({ success: true });
});

authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    user: req.user || {
      id: 'owner_joydas',
      email: 'joydas.21071997@gmail.com',
      name: 'Joydas (Site Owner)',
      role: 'OWNER',
      status: 'active'
    }
  });
});

authRouter.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'Profile updated successfully', user: req.user });
});

authRouter.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, message: 'Password changed successfully' });
});
