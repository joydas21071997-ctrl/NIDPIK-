import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthenticatedRequest, requireRole, logAudit } from '../auth';
import crypto from 'crypto';

export const merchantRouter = Router();

// ==========================================
// MERCHANTS
// ==========================================
export function formatMerchantRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    logoText: row.logo_text,
    logoImage: row.logo_image || undefined,
    badgeColor: row.badge_color,
    affiliateBaseUrl: row.affiliate_base_url,
    affiliateNetwork: row.affiliate_network,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

merchantRouter.get('/merchants', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM merchants ORDER BY name ASC').all();
  res.json(rows.map(formatMerchantRow));
});

merchantRouter.get('/merchants/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Merchant not found' });
    return;
  }
  res.json(formatMerchantRow(row));
});

merchantRouter.post('/merchants', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const user = req.user!;

  if (!body.name || !body.affiliateBaseUrl) {
    res.status(400).json({ error: 'Merchant name and affiliate URL base are required' });
    return;
  }

  const id = body.id || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO merchants (id, name, logo_text, logo_image, badge_color, affiliate_base_url, affiliate_network, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.name,
    body.logoText || body.name,
    body.logoImage || null,
    body.badgeColor || '#2563EB',
    body.affiliateBaseUrl,
    body.affiliateNetwork || 'Direct Affiliate',
    body.status || 'active',
    body.notes || '',
    now,
    now
  );

  logAudit(user.id, user.email, 'MERCHANT_CREATED', 'merchant', id, { name: body.name });
  const created = db.prepare('SELECT * FROM merchants WHERE id = ?').get(id);
  res.status(201).json(formatMerchantRow(created));
});

merchantRouter.put('/merchants/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const user = req.user!;

  const existing = db.prepare('SELECT * FROM merchants WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Merchant not found' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE merchants SET
      name = ?, logo_text = ?, logo_image = ?, badge_color = ?,
      affiliate_base_url = ?, affiliate_network = ?, status = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(
    body.name || existing.name,
    body.logoText || existing.logo_text,
    body.logoImage !== undefined ? body.logoImage : existing.logo_image,
    body.badgeColor || existing.badge_color,
    body.affiliateBaseUrl || existing.affiliate_base_url,
    body.affiliateNetwork || existing.affiliate_network,
    body.status || existing.status,
    body.notes !== undefined ? body.notes : existing.notes,
    now,
    id
  );

  logAudit(user.id, user.email, 'MERCHANT_UPDATED', 'merchant', id, { name: body.name || existing.name });
  const updated = db.prepare('SELECT * FROM merchants WHERE id = ?').get(id);
  res.json(formatMerchantRow(updated));
});

merchantRouter.delete('/merchants/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  db.prepare('DELETE FROM merchants WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'MERCHANT_DELETED', 'merchant', id);
  res.json({ success: true });
});

// ==========================================
// AFFILIATE LINKS
// ==========================================
merchantRouter.get('/affiliate-links', authenticate, (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT a.*, p.name as product_name, m.name as merchant_name
    FROM affiliate_links a
    LEFT JOIN products p ON a.product_id = p.id
    LEFT JOIN merchants m ON a.merchant_id = m.id
    ORDER BY a.updated_at DESC
  `).all() as any[];

  res.json(rows.map(r => ({
    id: r.id,
    productId: r.product_id,
    productName: r.product_name || 'Unassigned Product',
    merchantId: r.merchant_id,
    merchantName: r.merchant_name || 'Generic Merchant',
    affiliateUrl: r.affiliate_url,
    destinationUrl: r.destination_url,
    trackingInfo: r.tracking_info,
    status: r.status,
    lastCheckedAt: r.last_checked_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  })));
});

merchantRouter.post('/affiliate-links', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const user = req.user!;

  if (!body.productId || !body.affiliateUrl) {
    res.status(400).json({ error: 'Product ID and Affiliate URL are required' });
    return;
  }

  const id = body.id || 'aff_' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO affiliate_links (id, product_id, merchant_id, affiliate_url, destination_url, tracking_info, status, last_checked_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.productId,
    body.merchantId || 'amazon',
    body.affiliateUrl,
    body.destinationUrl || null,
    body.trackingInfo || 'nidpik-tag',
    body.status || 'active',
    now,
    now,
    now
  );

  logAudit(user.id, user.email, 'AFFILIATE_LINK_CREATED', 'affiliate_link', id);
  res.status(201).json({ id, ...body, createdAt: now });
});

merchantRouter.put('/affiliate-links/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const user = req.user!;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE affiliate_links SET
      product_id = ?, merchant_id = ?, affiliate_url = ?, destination_url = ?,
      tracking_info = ?, status = ?, last_checked_at = ?, updated_at = ?
    WHERE id = ?
  `).run(
    body.productId,
    body.merchantId,
    body.affiliateUrl,
    body.destinationUrl || null,
    body.trackingInfo || null,
    body.status || 'active',
    now,
    now,
    id
  );

  logAudit(user.id, user.email, 'AFFILIATE_LINK_UPDATED', 'affiliate_link', id);
  res.json({ id, ...body, updatedAt: now });
});

merchantRouter.delete('/affiliate-links/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  db.prepare('DELETE FROM affiliate_links WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'AFFILIATE_LINK_DELETED', 'affiliate_link', id);
  res.json({ success: true });
});

// ==========================================
// AFFILIATE CLICK TRACKING
// ==========================================
// Public POST to track click when user clicks "View on Amazon"
merchantRouter.post('/analytics/clicks', (req: Request, res: Response) => {
  const { productId, merchantId, sourcePage, ctaType } = req.body;

  if (!productId) {
    res.status(400).json({ error: 'Product ID required' });
    return;
  }

  const id = 'click_' + crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO affiliate_clicks (id, product_id, merchant_id, source_page, cta_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    String(productId).slice(0, 100),
    String(merchantId || 'amazon').slice(0, 50),
    String(sourcePage || 'direct').slice(0, 200),
    String(ctaType || 'check_price').slice(0, 50),
    now
  );

  res.json({ recorded: true });
});

// Protected GET analytics click logs & summaries
merchantRouter.get('/analytics/clicks', authenticate, (req: Request, res: Response) => {
  const totalClicksRow = db.prepare('SELECT COUNT(*) as count FROM affiliate_clicks').get() as any;
  const recentClicks = db.prepare(`
    SELECT c.*, p.name as product_name
    FROM affiliate_clicks c
    LEFT JOIN products p ON c.product_id = p.id
    ORDER BY c.created_at DESC
    LIMIT 100
  `).all();

  const clicksByProduct = db.prepare(`
    SELECT c.product_id, p.name as product_name, p.price, p.image, COUNT(*) as click_count
    FROM affiliate_clicks c
    LEFT JOIN products p ON c.product_id = p.id
    GROUP BY c.product_id
    ORDER BY click_count DESC
    LIMIT 10
  `).all();

  const clicksByMerchant = db.prepare(`
    SELECT merchant_id, COUNT(*) as count
    FROM affiliate_clicks
    GROUP BY merchant_id
    ORDER BY count DESC
  `).all();

  res.json({
    totalClicks: totalClicksRow.count,
    recentClicks,
    topProducts: clicksByProduct,
    byMerchant: clicksByMerchant
  });
});
