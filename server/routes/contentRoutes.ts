import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../auth';

export const contentRouter = Router();

// Stubbed routes
contentRouter.get('/articles', async (req: Request, res: Response) => { res.json([]); });
contentRouter.get('/articles/:slug', async (req: Request, res: Response) => { res.status(404).json({ error: 'Not implemented' }); });
contentRouter.post('/articles', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
contentRouter.put('/articles/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
contentRouter.delete('/articles/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });

contentRouter.get('/guides', async (req: Request, res: Response) => { res.json([]); });
contentRouter.get('/guides/:slug', async (req: Request, res: Response) => { res.status(404).json({ error: 'Not implemented' }); });
contentRouter.post('/guides', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
contentRouter.put('/guides/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
contentRouter.delete('/guides/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });

contentRouter.get('/comparisons', async (req: Request, res: Response) => { res.json([]); });
contentRouter.get('/comparisons/:slug', async (req: Request, res: Response) => { res.status(404).json({ error: 'Not implemented' }); });
contentRouter.post('/comparisons', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
contentRouter.put('/comparisons/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
contentRouter.delete('/comparisons/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });

contentRouter.get('/reviews', async (req: Request, res: Response) => { res.json([]); });
contentRouter.get('/reviews/:slug', async (req: Request, res: Response) => { res.status(404).json({ error: 'Not implemented' }); });
contentRouter.post('/reviews', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
contentRouter.put('/reviews/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
contentRouter.delete('/reviews/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });

contentRouter.get('/problems', async (req: Request, res: Response) => { res.json([]); });
contentRouter.get('/problems/:slug', async (req: Request, res: Response) => { res.status(404).json({ error: 'Not implemented' }); });
contentRouter.post('/problems', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
contentRouter.put('/problems/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
contentRouter.delete('/problems/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => { res.status(501).json({ error: 'Not implemented' }); });
export function formatArticleRow(row: any) { return row; }
export function formatGuideRow(row: any) { return row; }
export function formatComparisonRow(row: any) { return row; }
export function formatReviewRow(row: any) { return row; }
export function formatProblemRow(row: any) { return row; }
