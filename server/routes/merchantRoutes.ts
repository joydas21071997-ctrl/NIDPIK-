import { Router, Request, Response } from 'express';
import { eq, desc, asc, count as sqlCount } from 'drizzle-orm';
import { db } from '../../src/db/index';
import * as schema from '../../src/db/schema';
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
    logoText: row.logoText ?? row.logo_text,
    logoImage: (row.logoImage ?? row.logo_image) || undefined,
    badgeColor: row.badgeColor ?? row.badge_color,
    affiliateBaseUrl: row.affiliateBaseUrl ?? row.affiliate_base_url,
    affiliateNetwork: row.affiliateNetwork ?? row.affiliate_network,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at
  };
}

merchantRouter.get('/merchants', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(schema.merchants).orderBy(asc(schema.merchants.name));
    res.json(rows.map(formatMerchantRow));
  } catch (err: any) {
    console.error('[GET MERCHANTS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch merchants' });
  }
});

merchantRouter.get('/merchants/:id', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(schema.merchants).where(eq(schema.merchants.id, req.params.id)).limit(1);
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }
    res.json(formatMerchantRow(row));
  } catch (err: any) {
    console.error('[GET MERCHANT ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch merchant' });
  }
});

merchantRouter.post('/merchants', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    if (!body.name || !body.affiliateBaseUrl) {
      res.status(400).json({ error: 'Merchant name and affiliate URL base are required' });
      return;
    }

    const id = body.id || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const now = new Date().toISOString();

    await db.insert(schema.merchants).values({
      id,
      name: body.name,
      logoText: body.logoText || body.name,
      logoImage: body.logoImage || null,
      badgeColor: body.badgeColor || '#2563EB',
      affiliateBaseUrl: body.affiliateBaseUrl,
      affiliateNetwork: body.affiliateNetwork || 'Direct Affiliate',
      status: body.status || 'active',
      notes: body.notes || '',
      createdAt: now,
      updatedAt: now
    });

    await logAudit(user.id, user.email, 'MERCHANT_CREATED', 'merchant', id, { name: body.name });
    const createdRows = await db.select().from(schema.merchants).where(eq(schema.merchants.id, id)).limit(1);
    res.status(201).json(formatMerchantRow(createdRows[0]));
  } catch (err: any) {
    console.error('[CREATE MERCHANT ERROR]', err);
    res.status(500).json({ error: 'Failed to create merchant' });
  }
});

merchantRouter.put('/merchants/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user!;

    const existingRows = await db.select().from(schema.merchants).where(eq(schema.merchants.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }

    const now = new Date().toISOString();
    await db.update(schema.merchants).set({
      name: body.name || existing.name,
      logoText: body.logoText || existing.logoText,
      logoImage: body.logoImage !== undefined ? body.logoImage : existing.logoImage,
      badgeColor: body.badgeColor || existing.badgeColor,
      affiliateBaseUrl: body.affiliateBaseUrl || existing.affiliateBaseUrl,
      affiliateNetwork: body.affiliateNetwork || existing.affiliateNetwork,
      status: body.status || existing.status,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      updatedAt: now
    }).where(eq(schema.merchants.id, id));

    await logAudit(user.id, user.email, 'MERCHANT_UPDATED', 'merchant', id, { name: body.name || existing.name });
    const updatedRows = await db.select().from(schema.merchants).where(eq(schema.merchants.id, id)).limit(1);
    res.json(formatMerchantRow(updatedRows[0]));
  } catch (err: any) {
    console.error('[UPDATE MERCHANT ERROR]', err);
    res.status(500).json({ error: 'Failed to update merchant' });
  }
});

merchantRouter.delete('/merchants/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    await db.delete(schema.merchants).where(eq(schema.merchants.id, id));
    await logAudit(user.id, user.email, 'MERCHANT_DELETED', 'merchant', id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE MERCHANT ERROR]', err);
    res.status(500).json({ error: 'Failed to delete merchant' });
  }
});

// ==========================================
// AFFILIATE LINKS
// ==========================================
merchantRouter.get('/affiliate-links', authenticate, async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: schema.affiliateLinks.id,
        productId: schema.affiliateLinks.productId,
        productName: schema.products.name,
        merchantId: schema.affiliateLinks.merchantId,
        merchantName: schema.merchants.name,
        affiliateUrl: schema.affiliateLinks.affiliateUrl,
        destinationUrl: schema.affiliateLinks.destinationUrl,
        trackingInfo: schema.affiliateLinks.trackingInfo,
        status: schema.affiliateLinks.status,
        lastCheckedAt: schema.affiliateLinks.lastCheckedAt,
        createdAt: schema.affiliateLinks.createdAt,
        updatedAt: schema.affiliateLinks.updatedAt
      })
      .from(schema.affiliateLinks)
      .leftJoin(schema.products, eq(schema.affiliateLinks.productId, schema.products.id))
      .leftJoin(schema.merchants, eq(schema.affiliateLinks.merchantId, schema.merchants.id))
      .orderBy(desc(schema.affiliateLinks.updatedAt));

    res.json(rows.map(r => ({
      id: r.id,
      productId: r.productId,
      productName: r.productName || 'Unassigned Product',
      merchantId: r.merchantId,
      merchantName: r.merchantName || 'Generic Merchant',
      affiliateUrl: r.affiliateUrl,
      destinationUrl: r.destinationUrl,
      trackingInfo: r.trackingInfo,
      status: r.status,
      lastCheckedAt: r.lastCheckedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })));
  } catch (err: any) {
    console.error('[GET AFFILIATE LINKS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch affiliate links' });
  }
});

merchantRouter.post('/affiliate-links', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    if (!body.productId || !body.affiliateUrl) {
      res.status(400).json({ error: 'Product ID and Affiliate URL are required' });
      return;
    }

    const id = body.id || 'aff_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    await db.insert(schema.affiliateLinks).values({
      id,
      productId: body.productId,
      merchantId: body.merchantId || 'amazon',
      affiliateUrl: body.affiliateUrl,
      destinationUrl: body.destinationUrl || null,
      trackingInfo: body.trackingInfo || 'nidpik-tag',
      status: body.status || 'active',
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now
    });

    await logAudit(user.id, user.email, 'AFFILIATE_LINK_CREATED', 'affiliate_link', id);
    res.status(201).json({ id, ...body, createdAt: now });
  } catch (err: any) {
    console.error('[CREATE AFFILIATE LINK ERROR]', err);
    res.status(500).json({ error: 'Failed to create affiliate link' });
  }
});

merchantRouter.put('/affiliate-links/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user!;
    const now = new Date().toISOString();

    await db.update(schema.affiliateLinks).set({
      productId: body.productId,
      merchantId: body.merchantId,
      affiliateUrl: body.affiliateUrl,
      destinationUrl: body.destinationUrl || null,
      trackingInfo: body.trackingInfo || null,
      status: body.status || 'active',
      lastCheckedAt: now,
      updatedAt: now
    }).where(eq(schema.affiliateLinks.id, id));

    await logAudit(user.id, user.email, 'AFFILIATE_LINK_UPDATED', 'affiliate_link', id);
    res.json({ id, ...body, updatedAt: now });
  } catch (err: any) {
    console.error('[UPDATE AFFILIATE LINK ERROR]', err);
    res.status(500).json({ error: 'Failed to update affiliate link' });
  }
});

merchantRouter.delete('/affiliate-links/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    await db.delete(schema.affiliateLinks).where(eq(schema.affiliateLinks.id, id));
    await logAudit(user.id, user.email, 'AFFILIATE_LINK_DELETED', 'affiliate_link', id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE AFFILIATE LINK ERROR]', err);
    res.status(500).json({ error: 'Failed to delete affiliate link' });
  }
});

// ==========================================
// AFFILIATE CLICK TRACKING
// ==========================================
merchantRouter.post('/analytics/clicks', async (req: Request, res: Response) => {
  try {
    const { productId, merchantId, sourcePage, ctaType } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'Product ID required' });
      return;
    }

    const id = 'click_' + crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(schema.affiliateClicks).values({
      id,
      productId: String(productId).slice(0, 100),
      merchantId: String(merchantId || 'amazon').slice(0, 50),
      sourcePage: String(sourcePage || 'direct').slice(0, 200),
      ctaType: String(ctaType || 'check_price').slice(0, 50),
      createdAt: now
    });

    res.json({ recorded: true });
  } catch (err: any) {
    console.error('[TRACK CLICK ERROR]', err);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

merchantRouter.get('/analytics/clicks', authenticate, async (req: Request, res: Response) => {
  try {
    const totalCountRes = await db.select({ count: sqlCount() }).from(schema.affiliateClicks);
    const totalClicks = Number(totalCountRes[0]?.count || 0);

    const recentClicks = await db
      .select({
        id: schema.affiliateClicks.id,
        productId: schema.affiliateClicks.productId,
        productName: schema.products.name,
        merchantId: schema.affiliateClicks.merchantId,
        sourcePage: schema.affiliateClicks.sourcePage,
        ctaType: schema.affiliateClicks.ctaType,
        createdAt: schema.affiliateClicks.createdAt
      })
      .from(schema.affiliateClicks)
      .leftJoin(schema.products, eq(schema.affiliateClicks.productId, schema.products.id))
      .orderBy(desc(schema.affiliateClicks.createdAt))
      .limit(100);

    const clicksByMerchant = await db
      .select({
        merchantId: schema.affiliateClicks.merchantId,
        count: sqlCount()
      })
      .from(schema.affiliateClicks)
      .groupBy(schema.affiliateClicks.merchantId)
      .orderBy(desc(sqlCount()));

    res.json({
      totalClicks,
      recentClicks,
      topProducts: [],
      byMerchant: clicksByMerchant.map(m => ({ merchant_id: m.merchantId, count: Number(m.count) }))
    });
  } catch (err: any) {
    console.error('[GET ANALYTICS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

